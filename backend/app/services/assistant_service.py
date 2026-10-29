import logging
import re
import asyncio
import time
from typing import Optional, List, Dict, Any
from backend.app.core.gemini_client import call_gemini_resilient
from backend.app.schemas.schemas import AssistantChatRequest, AssistantChatResponse
from backend.app.services.weather_service import fetch_weather

logger = logging.getLogger(__name__)

def normalize_language_name(lang_input: Optional[str]) -> str:
    if not lang_input:
        return "English"
    l = lang_input.strip()
    if l in ("मराठी", "mr", "Marathi"):
        return "Marathi"
    if l in ("हिंदी", "hi", "Hindi"):
        return "Hindi"
    return "English"

SYSTEM_PROMPTS = {
    "English": (
        "You are CottonCare AI, an authoritative, helpful agricultural voice and text assistant for cotton farmers in India. "
        "Answer concisely in clear, practical language (3-5 sentences). "
        "Use real context from the provided weather and crop data. "
        "For crop diseases or pest questions, identify probable causes and cultural/biological management steps. "
        "Never invent chemical pesticide dosages; advise following official labels and consulting local Krishi Vigyan Kendra (KVK) officers."
    ),
    "Hindi": (
        "आप कॉटनकेअर एआई (CottonCare AI) हैं, जो भारतीय कपास किसानों के लिए एक मार्गदर्शक एवं विश्वसनीय कृषि सहायक हैं। "
        "सरल, व्यावहारिक और सटीक हिंदी में 3 से 5 वाक्यों में उत्तर दें। "
        "उपलब्ध मौसम और फसल डेटा का उपयोग करें। "
        "कीट और रोग के सवालों पर जैविक और प्रबंधन के उपाय बताएं। "
        "दवाओं की मनगढ़ंत खुराक न बताएं; लेबल पढ़ने और कृषि अधिकारी से संपर्क की सलाह दें।"
    ),
    "Marathi": (
        "तुम्ही कॉटनकेअर एआय (CottonCare AI) आहात, जे महाराष्ट्रातील कापूस उत्पादक शेतकऱ्यांसाठी कृषी सल्लागार आहात. "
        "सोप्या, स्पष्ट आणि आदरयुक्त मराठीत 3 ते 5 वाक्यांत व्यावहारिक उत्तर द्या. "
        "हवामान व पिकाच्या उपलब्ध माहितीचा आधार घ्या. "
        "रोग व किडींच्या प्रश्नांवर तात्काळ व प्रतिबंधात्मक उपाय सांगा. "
        "कोणत्याही रासायनिक औषधांचे मनमानी प्रमाण सांगू नका; लेबल वाचून कृषी तज्ञांचा सल्ला घेण्यास सांगा."
    )
}

FOLLOWUPS = {
    "English": [
        "What is the best fertilizer dose during flowering?",
        "How do I prevent Pink Bollworm in cotton?",
        "What are the ideal weather conditions for pesticide spraying?",
        "What should I do if heavy rain is forecast?"
    ],
    "Hindi": [
        "फूल आने के समय कौन सा खाद डालना चाहिए?",
        "गुलाबी सुंडी (Pink Bollworm) से कैसे बचें?",
        "फसल में सिंचाई का सही समय क्या है?",
        "भारी बारिश की चेतावनी होने पर क्या करें?"
    ],
    "Marathi": [
        "माझ्या कापसाच्या पिकाला किती पाणी द्यावे?",
        "कपाशीत गुलाबी बोंड अळीचे नियंत्रण कसे करावे?",
        "मुसळधार पावसाचा अंदाज असल्यास काय करावे?",
        "कापूस उत्पादन वाढवण्यासाठी काय करावे?"
    ]
}

def detect_intent(text: str) -> str:
    t = text.lower()
    # 1. Rain / Weather
    if any(k in t for k in ["rain", "weather", "forecast", "precipitation", "पाऊस", "हवामान", "पावसाची", "बारिश", "मौसम", "वर्षा"]):
        return "weather_rain"
    # 2. Water / Irrigation
    if any(k in t for k in ["water", "irrigation", "drip", "पाणी", "सिंचन", "पानी", "सिंचाई", "ओलावा", "नमी"]):
        return "irrigation"
    # 3. Yield Improvement / Prediction
    if any(k in t for k in ["yield", "improve", "increase", "उत्पादन", "वाढ", "पैदावार", "फायदा", "predict", "अंदाज"]):
        return "yield"
    # 4. Heavy rain / Flood
    if any(k in t for k in ["heavy rain", "flood", "मुसळधार", "अतिवृष्टी", "पूर", "भारी बारिश", "जलभराव"]):
        return "heavy_rain"
    # 5. Pink bollworm / Pest
    if any(k in t for k in ["bollworm", "pest", "worm", "बोंड अळी", "गुलाबी", "कीड", "सुंडी", "मावा", "तुडतुडे", "थ्रिप्स"]):
        return "pest"
    # 6. Fertilizer
    if any(k in t for k in ["fertilizer", "urea", "dap", "npk", "खत", "युरिया", "खाद", "पोषक"]):
        return "fertilizer"
    return "general"

async def get_live_weather_snippet(lat: float = 19.8762, lon: float = 75.3433) -> Dict[str, Any]:
    t0 = time.time()
    try:
        # Strict 2.0s timeout to guarantee weather never blocks the voice assistant
        w = await asyncio.wait_for(fetch_weather(lat, lon), timeout=2.0)
        current = w.get("current", {})
        daily = w.get("daily_forecast", [])
        today = daily[0] if daily else {}
        logger.info("[Timing] Live weather snippet fetched in %.2fs", time.time() - t0)
        return {
            "temp": current.get("temperature", 26.0),
            "condition": current.get("condition", "Clear"),
            "rain_prob": today.get("precipitation_probability_max", 0),
            "rain_mm": today.get("precipitation_sum_mm", 0.0),
            "wind": current.get("windspeed", 10.0),
            "available": True
        }
    except Exception as e:
        logger.info("[Timing] Weather snippet bypassed after %.2fs: %s", time.time() - t0, str(e)[:60])
        return {"available": False}

def generate_grounded_answer(intent: str, lang: str, weather_data: Dict[str, Any]) -> str:
    """Generates an accurate, expert-backed agricultural response based on intent and real data."""
    is_mr = lang == "Marathi"
    is_hi = lang == "Hindi"

    # Intent 1: Weather & Rain
    if intent == "weather_rain":
        if weather_data.get("available"):
            t = weather_data["temp"]
            cond = weather_data["condition"]
            prob = weather_data["rain_prob"]
            mm = weather_data["rain_mm"]
            wind = weather_data["wind"]
            if is_mr:
                advice = "पावसाची शक्यता जास्त असल्याने कीटकनाशक फवारणी पुढे ढकलावी." if prob >= 50 else "हवामान स्वच्छ असल्याने शेतीची कामे व आवश्यक फवारणी करण्यास हरकत नाही."
                return f"छत्रपती संभाजीनगर व मराठवाडा भागात सध्याचे तापमान {t}°C असून हवामान '{cond}' आहे. पुढील २४ तासांत पावसाची शक्यता {prob}% (अंदाजे {mm} मिमी पाऊस) आहे. वाऱ्याचा वेग {wind} किमी/तास आहे. {advice}"
            elif is_hi:
                advice = "बारिश की संभावना अधिक होने के कारण कीटनाशक छिड़काव टाल दें।" if prob >= 50 else "मौसम अनुकूल है, आवश्यक कृषि कार्य और छिड़काव किए जा सकते हैं।"
                return f"वर्तमान तापमान {t}°C है और मौसम '{cond}' है। अगले 24 घंटों में बारिश की संभावना {prob}% (अनुमानित {mm} मिमी) है। हवा की गति {wind} किमी/घंटा है। {advice}"
            else:
                advice = "Due to elevated rain probability, postpone chemical spraying." if prob >= 50 else "Weather conditions are favorable for spraying and field operations."
                return f"Current regional temperature is {t}°C with '{cond}' conditions. Precipitation probability for the next 24 hours is {prob}% (expected {mm} mm) with {wind} km/h winds. {advice}"
        else:
            if is_mr:
                return "सध्या हवामान सर्व्हरशी संपर्क होत नाही. तरीही पावसाळी दिवसांत कीटकनाशक फवारणीपूर्वी स्थानिक ढगाळ स्थिती व पावसाचा अंदाज अवश्य तपासावा."
            elif is_hi:
                return "वर्तमान में मौसम सर्वर अनुपलब्ध है। फिर भी बारिश के दिनों में कीटनाशक छिड़काव से पहले स्थानीय मौसम की स्थिति अवश्य जांचें।"
            return "Weather forecast data is temporarily unavailable. Please verify local cloud cover and wind speed before scheduling any foliar spraying."

    # Intent 2: Irrigation & Water
    elif intent == "irrigation":
        if is_mr:
            return (
                "कापूस पिकाला संपूर्ण हंगामात सुमारे ५५० ते ६५० मिमी पाण्याची गरज असते. "
                "पाते लागवड, फुलोरा व बोंड भरण्याच्या अवस्थेत (५० ते ९० दिवस) पाण्याचा ताण पडून देऊ नये. "
                "काळ्या भारी जमिनीत ८ ते १० दिवसांनी अथवा ठिबक सिंचनाने दररोज २ ते ३ तास पाणी द्यावे. "
                "शेतात ओलावा असल्यास किंवा पाऊस असल्यास सिंचन त्वरित थांबवावे जेणेकरून मुळकुजव्या रोग टाळता येईल."
            )
        elif is_hi:
            return (
                "कपास की फसल को पूरे जीवनकाल में लगभग 550-650 मिमी पानी की आवश्यकता होती है। "
                "फूल आने और गूलर (Boll) बनते समय (50 से 90 दिन) पानी की कमी बिल्कुल न होने दें। "
                "काली भारी मिट्टी में 8-10 दिनों के अंतराल पर या ड्रिप द्वारा 2-3 घंटे हल्की सिंचाई करें। "
                "यदि बारिश का अनुमान हो तो सिंचाई रोक दें ताकि जलभराव से जड़ गलन न हो।"
            )
        else:
            return (
                "Cotton requires 550 to 650 mm of water throughout its cycle. "
                "The critical moisture periods are squaring, peak flowering, and boll formation (50–90 days). "
                "In black soil, irrigate every 8–10 days or run drip irrigation for 2–3 hours. "
                "Always suspend irrigation if rainfall is forecast or soil moisture exceeds 65% to avoid root rot."
            )

    # Intent 3: Yield Improvement / Prediction
    elif intent == "yield":
        if is_mr:
            return (
                "कॉटनकेअर AI च्या Random Forest मॉडेलनुसार कापूस उत्पादन (लक्ष्य: एकरी १२-१५ क्विंटल) वाढवण्यासाठी हे घटक अत्यंत महत्त्वाचे आहेत:\n"
                "१. जमिनीत ६०-७०% संतुलित ओलावा ठेवावा; पाण्याचा ताण (Drought Days) २० दिवसांपेक्षा जास्त नसावा.\n"
                "२. नत्र खतांचे हप्ते विभागून द्या (२०% पेरणीवेळी, ४०% पाते लागवडीस, ४०% फुलोऱ्यात).\n"
                "३. बोंड वाढीच्या अवस्थेत ००:५२:३४ किंवा १३:००:४५ ची १% फवारणी करावी.\n"
                "४. पहिल्या ६० दिवसांत शेत तणमुक्त ठेवावे व ७५-८० दिवसांनी झाडांचे शेंडे खुडावेत (Detopping)."
            )
        elif is_hi:
            return (
                "कॉटनकेअर AI मॉडल के अनुसार कपास की पैदावार (लक्ष्य: 12-15 क्विंटल प्रति एकड़) बढ़ाने के मुख्य उपाय:\n"
                "1. मिट्टी में 60-70% नमी बनाए रखें और लंबे सूखे के दिनों से बचाएं।\n"
                "2. नाइट्रोजन खाद तीन किस्तों में दें (20% बुवाई पर, 40% फूल आने पर, 40% गूलर बनते समय)।\n"
                "3. गूलर विकास के समय 0:52:34 या 13:0:45 का 1% पर्णीय छिड़काव करें।\n"
                "4. पहले 60 दिन खेत को खरपतवार मुक्त रखें और 75-80 दिनों पर नोक काटें (Detopping)।"
            )
        else:
            return (
                "To optimize cotton yield (target: 12–15 quintals/acre) based on CottonCare AI ML insights:\n"
                "1. Maintain 60–70% soil moisture; avoid dry spells exceeding 20 days.\n"
                "2. Split Nitrogen fertilizer: 20% basal, 40% at squaring, and 40% at peak flowering.\n"
                "3. Foliar spray of water-soluble 0:52:34 (1%) or 13:0:45 during boll expansion.\n"
                "4. Keep fields weed-free for the first 60 days and perform detopping/nipping at 75–80 days to direct energy to bolls."
            )

    # Intent 4: Heavy Rain
    elif intent == "heavy_rain":
        if is_mr:
            return (
                "मुसळधार पावसाचा अंदाज असल्यास तातडीने पुढील उपाययोजना करा:\n"
                "१. शेतातील पाण्याचा निचरा करण्यासाठी तात्काळ चर काढा; २४ तासांपेक्षा जास्त पाणी साचू देऊ नका.\n"
                "२. सर्व रासायनिक फवारण्या व खते देणे ताबडतोब थांबवा.\n"
                "३. पाऊस थांबल्यानंतर मुळकुजव्या व मर रोगापासून संरक्षणासाठी कॉपर ऑक्सिक्लोराईड (२.५ ग्रॅम/लिटर) ची आळवणी करा.\n"
                "४. पिकाला पुन्हा उभारी देण्यासाठी १९:१९:१९ (१०० ग्रॅम/पंप) ची फवारणी करा."
            )
        elif is_hi:
            return (
                "भारी बारिश की चेतावनी होने पर ये कदम उठाएं:\n"
                "1. खेत में जलभराव रोकने के लिए तुरंत निकास नालियां साफ करें; 24 घंटे से ज्यादा पानी न ठहरने दें।\n"
                "2. कीटनाशक छिड़काव और यूरिया का छिड़काव तुरंत रोकें।\n"
                "3. बारिश रुकने के बाद कॉपर ऑक्सीक्लोराइड (2.5 ग्राम/लीटर) की ड्रेंचिंग करें ताकि उकठा/जड़ गलन न हो।\n"
                "4. फसल को संबल देने के लिए 19:19:19 घुलनशील खाद का हल्का छिड़काव करें।"
            )
        else:
            return (
                "Action plan for heavy rain forecast:\n"
                "1. Clear field drainage channels immediately; standing water beyond 24 hours causes root asphyxiation and wilting.\n"
                "2. Suspend all pesticide sprays and fertilizer applications.\n"
                "3. Once rain subsides, drench Copper Oxychloride (2.5 g/L) near root zones to prevent fungal wilt.\n"
                "4. Spray water-soluble 19:19:19 (100 g/pump) to restore root activity."
            )

    # Intent 5: Pest / Bollworm
    elif intent == "pest":
        if is_mr:
            return (
                "गुलाबी बोंड अळी व रसशोषक किडींच्या नियंत्रणासाठी:\n"
                "१. पेरणीनंतर ४५ दिवसांनी एकरी ५ फेरोमोन ट्रॅप लावा; सलग ३ दिवस ८ पेक्षा जास्त पतंग आढळल्यास आर्थिक नुकसानीची पातळी (ETL) गाठली असे समजावे.\n"
                "२. डोमकळ्या तोडून नष्ट करा.\n"
                "३. कीड नियंत्रणासाठी इमामेक्टिन बेन्झोएट ५% एसजी (५ ग्रॅम/१५ लिटर) किंवा प्रोफेनोफॉस ५०% ईसी (३० मि.ली./१५ लिटर) फवारावे.\n"
                "४. रासायनिक औषधांचे लेबल काळजीपूर्वक वाचावे."
            )
        elif is_hi:
            return (
                "गुलाबी सुंडी (Pink Bollworm) व रस चूसक कीट प्रबंधन:\n"
                "1. बुवाई के 45 दिनों बाद प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं; लगातार 3 दिन 8 से अधिक पतंगे मिलने पर दवा का प्रयोग करें।\n"
                "2. खराब फूलों (डोमकली) को तोड़कर नष्ट करें।\n"
                "3. इमामेक्टिन बेंजोएट 5% एसजी (5 ग्राम) या प्रोफेनोफॉस 50% ईसी (30 मिली प्रति 15 लीटर) का छिड़काव करें।\n"
                "4. हमेशा कीटनाशक का लेबल अवश्य पढ़ें।"
            )
        else:
            return (
                "For Pink Bollworm and sucking pest management in cotton:\n"
                "1. Install 5 pheromone traps per acre at 45 days after sowing (ETL: 8 moths/trap/night for 3 consecutive days).\n"
                "2. Hand-pick and destroy rosette flowers to break the larval life cycle.\n"
                "3. Apply Emamectin Benzoate 5% SG @ 5g/15L or Profenofos 50% EC @ 30ml/15L.\n"
                "4. Always follow official label directions and safety protocols."
            )

    # General / Other
    if is_mr:
        return (
            "आपला प्रश्न कापूस शेतीशी संबंधित आहे. कापूस पिकाचे उत्तम व्यवस्थापन करण्यासाठी जमिनीचा प्रकार, "
            "वाढीची अवस्था आणि हवामानाचा अंदाज लक्षात घेऊन निर्णय घ्यावा. अधिक विशिष्ट माहितीसाठी सिंचन, खत, बोंड अळी किंवा पावसाचा अंदाज याबद्दल विचारा."
        )
    elif is_hi:
        return (
            "आपका प्रश्न कपास की खेती से संबंधित है। बेहतर उपज के लिए मिट्टी के प्रकार, फसल अवस्था और मौसम को ध्यान में रखकर प्रबंधन करें। "
            "अधिक जानकारी के लिए सिंचाई, खाद, गुलाबी सुंडी या मौसम पूर्वानुमान के बारे में पूछें।"
        )
    else:
        return (
            "For optimal cotton crop management, decisions should be aligned with your soil type, growth stage, and prevailing weather forecast. "
            "Feel free to ask specifically about irrigation schedules, fertilizer doses, Pink Bollworm control, or current rain forecasts."
        )

async def ask_cotton_assistant(req: AssistantChatRequest) -> AssistantChatResponse:
    t_start = time.time()
    lang = normalize_language_name(req.language)
    system_instruction = SYSTEM_PROMPTS[lang]
    prompt = req.question.strip()
    
    intent = detect_intent(prompt)
    weather_data = await get_live_weather_snippet()

    # Build contextual prompt for Gemini when available
    weather_context_str = ""
    if weather_data.get("available"):
        weather_context_str = (
            f"\n[Live Weather Context: Temp {weather_data['temp']}°C, Condition {weather_data['condition']}, "
            f"Rain Probability next 24h: {weather_data['rain_prob']}%, Precipitation: {weather_data['rain_mm']}mm, Wind: {weather_data['wind']}km/h]"
        )

    full_prompt = prompt
    if req.context:
        full_prompt = f"Recent context:\n{req.context}{weather_context_str}\n\nFarmer question:\n{prompt}"
    elif weather_context_str:
        full_prompt = f"{weather_context_str}\n\nFarmer question:\n{prompt}"

    # Try Gemini Cloud AI first via non-blocking thread execution with strict timeouts
    try:
        answer = await asyncio.to_thread(
            call_gemini_resilient,
            prompt=full_prompt,
            system_instruction=system_instruction,
            lang=lang
        )
        total_time = time.time() - t_start
        logger.info("[Timing] Assistant responded via Gemini Cloud AI in %.2fs", total_time)
        return AssistantChatResponse(
            answer=answer,
            language=lang,
            provider="Gemini Cloud AI (Grounded)",
            suggested_followups=FOLLOWUPS.get(lang, FOLLOWUPS["English"]),
            error=None
        )
    except Exception as e:
        # Instant graceful fallback to rich grounded agronomic engine with actual real data
        fallback_answer = generate_grounded_answer(intent, lang, weather_data)
        total_time = time.time() - t_start
        logger.info("[Timing] Assistant responded via CottonCare Grounded Expert Engine in %.2fs (Reason: %s)", total_time, str(e)[:60])
        return AssistantChatResponse(
            answer=fallback_answer,
            language=lang,
            provider="CottonCare Grounded Expert Engine",
            suggested_followups=FOLLOWUPS.get(lang, FOLLOWUPS["English"]),
            error=None
        )
