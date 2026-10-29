import io
import asyncio
import base64
import logging
import re
from pathlib import Path
from typing import Optional, List, Tuple
from PIL import Image
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.gemini_client import call_gemini_resilient
from backend.app.models.disease import ScanHistoryRecord
from backend.app.schemas.schemas import DiseasePredictResponse

logger = logging.getLogger(__name__)

OFFLINE_MODEL_PATH = settings.MODEL_DIR / "cotton_disease_model.keras"

def check_offline_model_available() -> bool:
    return OFFLINE_MODEL_PATH.exists()

def parse_bullet_points(section_text: str, default_items: List[str]) -> List[str]:
    """Extract clean bullet points from a markdown/plain text block."""
    items = []
    for line in section_text.splitlines():
        line = line.strip()
        if not line:
            continue
        cleaned = re.sub(r"^[-*•\d.)\]]+\s*", "", line).strip()
        if cleaned and len(cleaned) > 5 and not cleaned.lower().startswith(("immediate", "preventive")):
            items.append(cleaned)
    return items if len(items) >= 2 else default_items

def parse_gemini_disease_response(raw_text: str) -> dict:
    """
    Parses the structured two-stage validation and pathology output from Gemini.
    """
    res = {
        "is_valid": True,
        "validation_message": None,
        "detected_subject": "Cotton Leaf",
        "condition": "Cotton Health Analysis",
        "severity": "Moderate",
        "confidence": 0.88,
        "observations": "",
        "immediate_actions": [],
        "preventive_measures": [],
    }

    # 1. Validation check
    is_valid_match = re.search(r"VALID_COTTON_LEAF\s*:\s*(YES|NO|TRUE|FALSE)", raw_text, re.IGNORECASE)
    if is_valid_match:
        val = is_valid_match.group(1).upper()
        res["is_valid"] = val in ("YES", "TRUE")
    else:
        # Fallback check for explicit invalid mentions
        lower_raw = raw_text.lower()
        if any(k in lower_raw for k in [
            "not a cotton leaf", "not a cotton plant", "is a flower", "rose flower", 
            "human face", "unrelated image", "please upload a clear image of a cotton leaf"
        ]):
            res["is_valid"] = False

    subject_match = re.search(r"DETECTED_SUBJECT\s*:\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    if subject_match:
        res["detected_subject"] = subject_match.group(1).strip()

    msg_match = re.search(r"MESSAGE\s*:\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    if msg_match:
        res["validation_message"] = msg_match.group(1).strip()
    elif not res["is_valid"]:
        res["validation_message"] = "Please upload a clear image of a cotton leaf for disease detection."

    # If rejected, return early
    if not res["is_valid"]:
        res["condition"] = f"Invalid Sample: {res['detected_subject']}"
        res["confidence"] = 0.0
        res["severity"] = "None"
        res["observations"] = (
            f"The uploaded photo appears to be {res['detected_subject']} rather than a cotton crop leaf. "
            "CottonCare AI requires a clear image of cotton foliage to accurately inspect for foliar diseases."
        )
        res["immediate_actions"] = [
            "Please upload a clear, focused photograph of a cotton plant leaf.",
            "Ensure the leaf is well-lit and clearly visible without heavy blur or glare.",
            "Avoid uploading flower-only photos, background landscapes, or non-crop objects."
        ]
        res["preventive_measures"] = [
            "Capture the upper and lower surfaces of leaves exhibiting spots or curling.",
            "Consult local agricultural extension officers for general crop identification."
        ]
        return res

    # 2. Extract Condition
    cond_match = re.search(r"CONDITION\s*:\s*([^\n\r]+)", raw_text, re.IGNORECASE)
    if cond_match:
        res["condition"] = cond_match.group(1).strip()

    # 3. Extract Severity
    sev_match = re.search(r"SEVERITY\s*:\s*(Low|Moderate|High|Severe)", raw_text, re.IGNORECASE)
    if sev_match:
        res["severity"] = sev_match.group(1).capitalize()

    # 4. Extract Confidence
    conf_match = re.search(r"CONFIDENCE\s*:\s*([0-9.]+)", raw_text, re.IGNORECASE)
    if conf_match:
        try:
            val = float(conf_match.group(1))
            res["confidence"] = val / 100.0 if val > 1.0 else val
            res["confidence"] = max(0.50, min(0.99, res["confidence"]))
        except ValueError:
            res["confidence"] = 0.88

    # 5. Extract Observations
    obs_match = re.search(r"OBSERVATIONS\s*:\s*(.*?)(?=IMMEDIATE_ACTIONS|$)", raw_text, re.IGNORECASE | re.DOTALL)
    if obs_match:
        res["observations"] = obs_match.group(1).strip()

    # 6. Extract Immediate Actions
    imm_match = re.search(r"IMMEDIATE_ACTIONS\s*:\s*(.*?)(?=PREVENTIVE_MEASURES|$)", raw_text, re.IGNORECASE | re.DOTALL)
    if imm_match:
        res["immediate_actions"] = parse_bullet_points(imm_match.group(1), [
            "Isolate heavily infected leaves to mitigate disease spread across the plot.",
            "Inspect the underside of foliage for sucking pests (whiteflies, thrips, jassids).",
            "Avoid overhead irrigation in humid conditions to prevent fungal spore dispersal."
        ])

    # 7. Extract Preventive Measures
    prev_match = re.search(r"PREVENTIVE_MEASURES\s*:\s*(.*?)$", raw_text, re.IGNORECASE | re.DOTALL)
    if prev_match:
        res["preventive_measures"] = parse_bullet_points(prev_match.group(1), [
            "Practice balanced nitrogen fertilization to avoid excessive soft vegetative growth.",
            "Adopt crop rotation and use certified disease-resistant cotton varieties.",
            "Consult your local Krishi Vigyan Kendra (KVK) officer for approved IPM schedules."
        ])

    return res


async def analyze_cotton_crop_image(file: UploadFile, db: Session, user_identifier: str = "guest_farmer") -> DiseasePredictResponse:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPEG, PNG, WEBP).")

    contents = await file.read()
    if len(contents) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 12MB.")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image.thumbnail((1600, 1600))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or corrupt image file.")

    # Save data URL for history display
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=85)
    b64_encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    data_url = f"data:image/jpeg;base64,{b64_encoded}"

    engine_name = "Gemini Multimodal Vision (Cloud Pathology)"

    prompt = (
        "You are an expert plant pathologist and agronomist specializing in Indian cotton crops (Gossypium hirsutum).\n"
        "Carefully inspect this image in two mandatory stages:\n\n"
        "STAGE 1: INPUT VALIDATION (Is this a cotton leaf or cotton crop part?)\n"
        "- Determine whether this image clearly shows a cotton leaf, cotton foliage, or cotton canopy suitable for foliar disease diagnosis.\n"
        "- If the image depicts:\n"
        "  * A flower-only image (e.g. rose, hibiscus, marigold, cotton flower with no leaf foliage)\n"
        "  * A human face, hands, selfie, animal, insect-only, pet\n"
        "  * A document, text, screenshot, receipt, barcode, icon, drawing\n"
        "  * A fruit, vegetable, household object, product, vehicle, landscape\n"
        "  * Completely blurry, pitch black, overexposed, or unidentifiable photo\n"
        "  Then it is NOT a valid cotton leaf for disease diagnosis!\n"
        "  Output:\n"
        "  VALID_COTTON_LEAF: NO\n"
        "  DETECTED_SUBJECT: <brief description of what is actually in the image, e.g. Rose Flower / Human Face / Blurry Image>\n"
        "  MESSAGE: Please upload a clear image of a cotton leaf for disease detection.\n\n"
        "STAGE 2: PATHOLOGY DIAGNOSIS (Only if VALID_COTTON_LEAF: YES)\n"
        "  VALID_COTTON_LEAF: YES\n"
        "  CONDITION: <Specific condition, e.g. Healthy Cotton Leaf, Bacterial Blight (Xanthomonas), Cotton Leaf Curl Virus (CLCuV), Alternaria Leaf Spot, Cercospora Leaf Spot, Gray Mildew (Ramularia), Whitefly Infestation, or Bollworm Damage>\n"
        "  SEVERITY: <Low | Moderate | High | Severe>\n"
        "  CONFIDENCE: <Decimal score between 0.60 and 0.99, e.g. 0.94>\n"
        "  OBSERVATIONS: <2-3 sentences explaining the visible foliar symptoms on this specific leaf>\n"
        "  IMMEDIATE_ACTIONS:\n"
        "  - <Specific cultural/biological management step 1 for this condition>\n"
        "  - <Specific practical step 2>\n"
        "  - <Specific practical step 3>\n"
        "  PREVENTIVE_MEASURES:\n"
        "  - <Specific preventative step 1>\n"
        "  - <Specific preventative step 2>\n"
        "  - <Specific preventative step 3>\n\n"
        "STRICT RULE: Format your response clearly using the EXACT keys above. Never invent chemical pesticide dosages; advise farmers to follow official CIBRC label guidelines and consult local Krishi Vigyan Kendra (KVK) officers."
    )

    try:
        report_text = await asyncio.to_thread(
            call_gemini_resilient,
            prompt=prompt,
            system_instruction="You are an expert plant pathologist and agronomist. Verify whether the image is a cotton leaf before diagnosing.",
            image=image,
            lang="English"
        )
        parsed = parse_gemini_disease_response(report_text)
    except Exception as e:
        logger.warning("AI crop inspection failed (%s). Serving offline advisory notice.", e)
        engine_name = "Offline Advisory Mode (Cloud AI Offline)"
        parsed = {
            "is_valid": True,
            "validation_message": None,
            "detected_subject": "Cotton Foliage (Offline)",
            "condition": "Cloud Visual AI Inspection Unavailable",
            "severity": "Unassessed",
            "confidence": 0.0,
            "observations": (
                "Unable to connect to the cloud vision diagnostic service. "
                "Automated disease identification requires an active connection. "
                "Please check your internet connection or consult your local Agriculture Extension Officer (KVK) for physical leaf examination."
            ),
            "immediate_actions": [
                "Ensure internet connectivity is available to run visual AI crop diagnosis.",
                "Inspect the leaf underside manually for active pests (whiteflies, thrips, or aphids).",
                "Isolate severely wilted or spotted plants if fungal infection is suspected."
            ],
            "preventive_measures": [
                "Take a clear, well-lit close-up photo of the leaf in daylight and retry.",
                "Consult your local Krishi Vigyan Kendra (KVK) for laboratory confirmation."
            ]
        }
        report_text = parsed["observations"]

    # If invalid image, do not record a disease diagnosis in history
    if not parsed["is_valid"]:
        return DiseasePredictResponse(
            is_valid_cotton_leaf=False,
            validation_message=parsed["validation_message"] or "Please upload a clear image of a cotton leaf for disease detection.",
            condition_detected=parsed["condition"],
            confidence_score=0.0,
            severity_level="None",
            diagnostic_report=parsed["observations"],
            immediate_actions=parsed["immediate_actions"],
            preventive_measures=parsed["preventive_measures"],
            detection_engine=engine_name,
            disclaimer="कृपया रोग निदानासाठी कापसाच्या पानाचा स्पष्ट फोटो अपलोड करा (Please upload a clear image of a cotton leaf for disease detection)."
        )

    # Save verified diagnosis to scan history database
    db_record = ScanHistoryRecord(
        user_identifier=user_identifier,
        image_filename=file.filename or "crop_sample.jpg",
        image_data_url=data_url,
        condition_detected=parsed["condition"],
        confidence_score=round(float(parsed["confidence"]), 2),
        severity_level=parsed["severity"],
        diagnostic_report=parsed["observations"] or report_text,
        immediate_actions="\n".join(parsed["immediate_actions"]),
        preventive_measures="\n".join(parsed["preventive_measures"]),
        detection_engine=engine_name
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    return DiseasePredictResponse(
        is_valid_cotton_leaf=True,
        validation_message=None,
        condition_detected=parsed["condition"],
        confidence_score=round(float(parsed["confidence"]), 2),
        severity_level=parsed["severity"],
        diagnostic_report=parsed["observations"] or report_text,
        immediate_actions=parsed["immediate_actions"],
        preventive_measures=parsed["preventive_measures"],
        detection_engine=engine_name,
        disclaimer="हे निदान संगणकीय कृत्रिम बुद्धिमत्ता (AI) द्वारे करण्यात आले आहे. प्रत्यक्ष व्यवस्थापनापूर्वी स्थानिक कृषी तज्ञांचा (KVK) सल्ला घ्यावा."
    )
