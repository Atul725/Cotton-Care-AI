import os
import sys
import time
import random
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types, errors
import httpx

load_dotenv()
logger = logging.getLogger(__name__)

PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_MODELS = [m.strip() for m in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-3.6-flash,gemini-3.5-flash").split(",") if m.strip()]

def get_farmer_friendly_error(e: Exception, lang: str = "English") -> str:
    status_code = getattr(e, "code", None)
    err_str = str(e).lower()
    
    # 1. Authentication errors (401, 403)
    if status_code in (401, 403) or "api_key" in err_str or "unauthenticated" in err_str or "permission_denied" in err_str:
        if lang == "मराठी":
            return "AI प्रमाणीकरण त्रुटी: API Key अमान्य किंवा अनुपलब्ध आहे. कृपया सिस्टीम ॲडमिनशी संपर्क साधा."
        elif lang == "हिंदी":
            return "AI प्रमाणीकरण त्रुटि: API Key अमान्य या अनुपलब्ध है। कृपया व्यवस्थापक से संपर्क करें।"
        return "AI authentication failed. Please verify that your GEMINI_API_KEY is correctly configured."

    # 2. Rate limit / Quota exceeded (429)
    if status_code == 429 or "resource_exhausted" in err_str or "quota" in err_str:
        if lang == "मराठी":
            return "AI विनंती मर्यादा गाठली आहे (Rate limit). कृपया 1-2 मिनिटे थांबा आणि पुन्हा प्रयत्न करा."
        elif lang == "हिंदी":
            return "AI अनुरोध सीमा समाप्त हो गई है (Rate limit)। कृपया 1-2 मिनट प्रतीक्षा करें और पुनः प्रयास करें।"
        return "AI request limit reached. Please wait a moment before trying again."

    # 3. High demand / Model overloaded (503)
    if status_code == 503 or "unavailable" in err_str or "overloaded" in err_str or "high demand" in err_str:
        if lang == "मराठी":
            return "कृषी AI सर्व्हर सध्या जास्त मागणीमुळे व्यस्त आहे (High demand). कृपया 1-2 मिनिटांनंतर पुन्हा प्रयत्न करा."
        elif lang == "हिंदी":
            return "कृषि AI सर्वर वर्तमान में अत्यधिक मांग के कारण व्यस्त है। कृपया 1-2 मिनट बाद पुनः प्रयास करें।"
        return "The AI model is temporarily experiencing high demand (503). Please wait 1-2 minutes and try again."

    # 4. Timeout / Network errors
    if isinstance(e, (httpx.TimeoutException, TimeoutError)) or status_code in (408, 504) or "timeout" in err_str or "timed out" in err_str:
        if lang == "मराठी":
            return "AI सर्व्हरशी संपर्क साधताना वेळ संपला (Timeout). कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा."
        elif lang == "हिंदी":
            return "AI सर्वर से संपर्क समय समाप्त (Timeout)। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।"
        return "Network timeout connecting to the AI service. Please check your internet connection and try again."

    # 5. Invalid / Discontinued model (404)
    if status_code == 404 or "not_found" in err_str or "no longer available" in err_str:
        if lang == "मराठी":
            return "कॉन्फिगर केलेले AI मॉडेल उपलब्ध नाही. कृपया मॉडेल सेटिंग्ज तपासा."
        elif lang == "हिंदी":
            return "कॉन्फ़िगर किया गया AI मॉडल उपलब्ध नहीं है। कृपया मॉडल सेटिंग्स जांचें।"
        return "The configured AI model is not available or has been discontinued."

    # 6. Generic temporary error
    if lang == "मराठी":
        return "AI सेवेत तात्पुरती तांत्रिक अडचण आली आहे. कृपया थोड्या वेळाने प्रयत्न करा."
    elif lang == "हिंदी":
        return "AI सेवा में अस्थायी तकनीकी समस्या आई है। कृपया कुछ समय बाद पुनः प्रयास करें।"
    return "The AI service encountered a temporary error. Please try again shortly."

print("Error handler defined successfully.")
