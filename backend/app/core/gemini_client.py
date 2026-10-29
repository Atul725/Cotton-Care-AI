import os
import time
import random
import logging
from typing import Optional, List, Any
from PIL import Image
from google import genai
from google.genai import types, errors
import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

PRIMARY_MODEL = settings.GEMINI_MODEL or "gemini-3.5-flash"
FALLBACK_MODELS = [
    m.strip() for m in settings.GEMINI_FALLBACK_MODELS.split(",") if m.strip() and m.strip() != PRIMARY_MODEL
]
ALL_CANDIDATE_MODELS = [PRIMARY_MODEL] + FALLBACK_MODELS

def get_farmer_friendly_error(e: Exception, lang: str = "English") -> str:
    status_code = getattr(e, "code", None)
    err_str = str(e).lower()
    
    # 1. Authentication errors (401, 403)
    if status_code in (401, 403) or "api_key" in err_str or "unauthenticated" in err_str or "permission_denied" in err_str:
        if lang in ("मराठी", "Marathi", "mr"):
            return "AI प्रमाणीकरण त्रुटी: API Key अमान्य किंवा अनुपलब्ध आहे. कृपया सिस्टीम ॲडमिनशी संपर्क साधा."
        elif lang in ("हिंदी", "Hindi", "hi"):
            return "AI प्रमाणीकरण त्रुटि: API Key अमान्य या अनुपलब्ध है। कृपया व्यवस्थापक से संपर्क करें।"
        return "AI authentication failed. Please verify that your GEMINI_API_KEY is correctly configured."

    # 2. Rate limit / Quota exceeded (429)
    if status_code == 429 or "resource_exhausted" in err_str or "quota" in err_str:
        if lang in ("मराठी", "Marathi", "mr"):
            return "AI विनंती मर्यादा गाठली आहे (Rate limit). कृपया 1-2 मिनिटे थांबा आणि पुन्हा प्रयत्न करा."
        elif lang in ("हिंदी", "Hindi", "hi"):
            return "AI अनुरोध सीमा समाप्त हो गई है (Rate limit)। कृपया 1-2 मिनट प्रतीक्षा करें और पुनः प्रयास करें।"
        return "AI request limit reached. Please wait a moment before trying again."

    # 3. High demand / Model overloaded (503)
    if status_code == 503 or "unavailable" in err_str or "overloaded" in err_str or "high demand" in err_str:
        if lang in ("मराठी", "Marathi", "mr"):
            return "कृषी AI सर्व्हर सध्या जास्त मागणीमुळे व्यस्त आहे (High demand). कृपया 1-2 मिनिटांनंतर पुन्हा प्रयत्न करा."
        elif lang in ("हिंदी", "Hindi", "hi"):
            return "कृषि AI सर्वर वर्तमान में अत्यधिक मांग के कारण व्यस्त है। कृपया 1-2 मिनट बाद पुनः प्रयास करें।"
        return "The agricultural AI model is temporarily experiencing high demand (503). Please wait a moment."

    # 4. Timeout / Network errors
    if isinstance(e, (httpx.TimeoutException, TimeoutError)) or status_code in (408, 504) or "timeout" in err_str or "timed out" in err_str:
        if lang in ("मराठी", "Marathi", "mr"):
            return "AI सर्व्हरशी संपर्क साधताना वेळ संपला (Timeout). स्थानिक तज्ञ सल्ला उपलब्ध केला आहे."
        elif lang in ("हिंदी", "Hindi", "hi"):
            return "AI सर्वर से संपर्क समय समाप्त (Timeout)। स्थानीय विशेषज्ञ सलाह प्रस्तुत की गई है।"
        return "Network timeout connecting to cloud AI. Serving local grounded advisory."

    # 5. Generic temporary error
    if lang in ("मराठी", "Marathi", "mr"):
        return "AI सेवेत तात्पुरती अडचण आली आहे. स्थानिक कृषी सल्लागार प्रणाली सुरू केली आहे."
    elif lang in ("हिंदी", "Hindi", "hi"):
        return "AI सेवा में अस्थायी समस्या आई है। स्थानीय कृषि सलाहकार प्रणाली सक्रिय की गई है।"
    return "Cloud AI encountered a temporary issue. Serving local grounded agronomic advice."

def is_retryable_error(e: Exception) -> bool:
    status_code = getattr(e, "code", None)
    err_str = str(e).lower()
    if status_code in (408, 429, 500, 502, 503, 504):
        return True
    if isinstance(e, (httpx.TimeoutException, httpx.NetworkError, TimeoutError)):
        return True
    if any(k in err_str for k in ["unavailable", "overloaded", "high demand", "timed out", "timeout", "resource_exhausted"]):
        return True
    return False

# Persistent HTTPX client with fast connect & read timeouts to ensure responsive user experience
_httpx_client: Optional[httpx.Client] = None

def get_httpx_client() -> httpx.Client:
    global _httpx_client
    if _httpx_client is None or _httpx_client.is_closed:
        _httpx_client = httpx.Client(
            timeout=httpx.Timeout(connect=5.0, read=8.0, write=5.0, pool=5.0),
            transport=httpx.HTTPTransport(retries=0),
            follow_redirects=True
        )
    return _httpx_client

def get_candidate_models() -> List[str]:
    primary = settings.GEMINI_MODEL or "gemini-3.5-flash"
    # To prevent cascading 5-minute timeouts, attempt only the primary model.
    # If the network or SSL handshake times out, instantly fall back to the Grounded Expert Engine.
    return [primary]

def get_genai_client():
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in environment.")
    
    http_opts = types.HttpOptions(
        httpx_client=get_httpx_client()
    )
    return genai.Client(api_key=api_key, http_options=http_opts)

def call_gemini_resilient(
    prompt: str,
    system_instruction: Optional[str] = None,
    image: Optional[Image.Image] = None,
    lang: str = "English"
) -> str:
    """
    Executes a prompt against Gemini with:
    - Tight 6s/12s timeouts for instant response responsiveness
    - Single candidate failover if primary model times out
    - Farmer-friendly localized exception handling
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(get_farmer_friendly_error(ValueError("api_key missing"), lang))

    client = get_genai_client()
    contents = [prompt]
    if image is not None:
        contents.append(image)

    config = {"system_instruction": system_instruction} if system_instruction else None
    
    candidate_models = get_candidate_models()
    last_exception = None
    
    for model_name in candidate_models:
        t_start = time.time()
        try:
            logger.info("[Timing] Initiating Gemini cloud call (%s)...", model_name)
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
            elapsed = time.time() - t_start
            text = getattr(response, "text", None)
            if text and text.strip():
                logger.info("[Timing] Gemini (%s) succeeded in %.2fs", model_name, elapsed)
                return text.strip()
            raise RuntimeError("The model returned an empty text response.")
        except Exception as e:
            elapsed = time.time() - t_start
            last_exception = e
            logger.warning("[Timing] Gemini (%s) failed/timed out after %.2fs (%s).", model_name, elapsed, str(e)[:100])
            break

    logger.info("[Timing] Gemini cloud unavailable. Instantly reverting to CottonCare Grounded Expert Engine.")
    raise RuntimeError(get_farmer_friendly_error(last_exception or Exception("Unknown"), lang))
