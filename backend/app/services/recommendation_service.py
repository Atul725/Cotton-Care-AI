from typing import Dict, Any, List
from backend.app.schemas.schemas import RecommendationsRequest, RecommendationsResponse

def generate_recommendations(req: RecommendationsRequest) -> RecommendationsResponse:
    days = req.crop_days
    acres = req.land_acres
    soil = req.soil_type
    water = req.water_source

    if days <= 30:
        stage = "वाढ व जोपासना टप्पा (Seedling & Early Vegetative)"
        stage_desc = "पिकाची मुळे जमिनीत रुजण्याचा व प्राथमिक पाने फुटण्याचा कालावधी (1 ते 30 दिवस)."
        urea_kg = round(25.0 * acres, 1)
        dap_kg = round(35.0 * acres, 1)
        potash_kg = round(15.0 * acres, 1)
        irrigation_days = "दर 6 ते 8 दिवसांनी हलके पाणी द्यावे."
        irrigation_vol = "मध्यम ते हलके सिंचन"
        watch_list = [
            {"pest": "मावा व तुडतुडे (Aphids & Jassids)", "action": "पिवळे चिकट सापळे लावावेत (एकर 5 ते 8)."},
            {"pest": "खोडकिडा व मूळकुज (Collar Rot)", "action": "पाण्याचा निचरा चांगला ठेवा; जमिनीत ट्रायकोडर्मा वापरावे."}
        ]
    elif days <= 75:
        stage = "फुलोरा व बोंड भरण्याचा टप्पा (Squaring & Flowering Stage)"
        stage_desc = "पात्या व फुले लागण्याचा अत्यंत संवेदनशील टप्पा (31 ते 75 दिवस). अन्नद्रव्ये व पाण्याची कमतरता भासू नये."
        urea_kg = round(45.0 * acres, 1)
        dap_kg = round(20.0 * acres, 1)
        potash_kg = round(30.0 * acres, 1)
        irrigation_days = "दर 8 ते 10 दिवसांनी नियमित पाणी द्या (पाण्याचा ताण पडू देऊ नका)."
        irrigation_vol = "भरपूर व समप्रमाणात सिंचन"
        watch_list = [
            {"pest": "गुलाबी बोंड अळी (Pink Bollworm)", "action": "कामगंध सापळे (Pheromone Traps) प्रति एकरी 4 ते 6 लावावेत."},
            {"pest": "पांढरी माशी व फुलकिडे (Whiteflies & Thrips)", "action": "निंबोळी अर्क (5% Neem Oil) फवारावे; पानांच्या मागील बाजूस लक्ष ठेवा."}
        ]
    elif days <= 125:
        stage = "बोंड विकास व पक्वता टप्पा (Boll Development & Maturation)"
        stage_desc = "बोंडांची वाढ व वजन वाढण्याचा टप्पा (76 ते 125 दिवस). पालाश (Potash) व सूक्ष्म अन्नद्रव्यांची आवश्यकता असते."
        urea_kg = round(20.0 * acres, 1)
        dap_kg = round(10.0 * acres, 1)
        potash_kg = round(25.0 * acres, 1)
        irrigation_days = "दर 12 ते 14 दिवसांनी आवश्यकतेनुसार पाणी द्यावे."
        irrigation_vol = "नियंत्रित सिंचन"
        watch_list = [
            {"pest": "बोंड सड (Boll Rot)", "action": "अतिपाणी टाळावे; हवेचे वहन होण्यासाठी खालची पिवळी पाने काढावीत."},
            {"pest": "गुलाबी बोंड अळी प्रादुर्भाव", "action": "फुले व बोंडांचे निरीक्षण करा; नुकसान 5% च्या वर असल्यास कृषी तज्ञांचा सल्ला घ्या."}
        ]
    else:
        stage = "वेचणी व काढणी टप्पा (Boll Opening & Harvesting)"
        stage_desc = "बोंडे फुटून पांढरा कापूस बाहेर येण्याचा कालावधी (126 ते 180 दिवस)."
        urea_kg = 0.0
        dap_kg = 0.0
        potash_kg = 0.0
        irrigation_days = "कापूस वेचणीपूर्वी पाणी देणे थांबवावे जेणेकरून धाग्याची प्रत चांगली राहील."
        irrigation_vol = "सिंचन बंद ठेवावे"
        watch_list = [
            {"pest": "कवडी रोग व डाग", "action": "कापूस कोरड्या वातावरणात वेचावा; स्वच्छ ठिकाणी साठवणूक करावी."}
        ]

    # Adjust for soil type
    soil_note = "काळी जमीन असल्याने ओलावा जास्त काळ टिकतो." if "काळी" in soil else "हलकी जमीन असल्याने सिंचनाचे अंतर कमी ठेवावे."

    precautions = [
        "खते देताना जमिनीमध्ये पुरेसा ओलावा असणे आवश्यक आहे.",
        "युरिया एकाच वेळी न देता 2 ते 3 हप्त्यांमध्ये विभागून द्यावा.",
        "सकाळी लवकर किंवा संध्याकाळी 4 नंतरच औषधांची फवारणी करावी.",
        "स्थानिक माती परीक्षण (Soil Health Card) नुसार खतांचे प्रमाण तपासावे."
    ]

    # Weather-adaptive adjustments if recent_weather is provided
    weather = req.recent_weather or {}
    if weather:
        rain_prob = weather.get("rain_6h_probability_pct", 0)
        rain_24h = weather.get("rain_24h_mm", 0.0)
        rain_7d = weather.get("rain_7d_mm", 0.0)
        temp_c = weather.get("temperature_c")
        humidity = weather.get("humidity_pct")
        wind_kmh = weather.get("wind_kmh", 0)

        # 1. Rain and Spraying Precaution
        if rain_prob >= 50 or rain_24h >= 5.0:
            precautions.insert(0, f"⚠️ पाऊस इशारा (शक्यता {rain_prob}%): पुढील २४ तासांत पाऊस संभवतो. कीटकनाशक किंवा विद्राव्य खतांची फवारणी त्वरित पुढे ढकलावी.")
            irrigation_vol = "सिंचन तात्पुरते स्थगित ठेवा (पाऊस अपेक्षित)"
        elif wind_kmh and wind_kmh >= 20.0:
            precautions.insert(0, f"⚠️ जोरदार वारा ({wind_kmh:.0f} किमी/तास): औषध हवेने उडून जाण्याचा धोका असल्याने फवारणी टाळावी.")

        # 2. Heavy Rain & Waterlogging
        if rain_24h >= 15.0:
            precautions.insert(0, f"🌧️ मुसळधार पाऊस ({rain_24h:.1f} मिमी): शेतातील चर व पाण्याचा निचरा मोकळा ठेवा. कपाशीच्या मुळांजवळ पाणी साचू देऊ नका.")
            irrigation_days = "पाऊस संपून जमिनीतील वापसा येईपर्यंत सिंचन बंद ठेवावे."

        # 3. Heat Stress / Dry conditions
        if temp_c and temp_c >= 37.0:
            precautions.append(f"☀️ उष्णतेची लाट ({temp_c:.1f}°C): दुपारी तीव्र उन्हात फवारणी किंवा काम टाळावे; पाण्याचे बाष्पीभवन रोखण्यासाठी संध्याकाळी हलके पाणी द्यावे.")
            if rain_7d < 5.0 and days <= 125:
                irrigation_days = "उष्णतेमुळे बाष्पीभवन वाढल्याने दर ४ ते ६ दिवसांनी नियमित हलके पाणी द्या."

        # 4. High humidity disease risk
        if humidity and humidity >= 75:
            watch_list.insert(0, {
                "pest": "बुरशीजन्य करपा व दहिया रोग (Fungal Blight & Grey Mildew)",
                "action": f"हवेत उच्च आर्द्रता ({humidity:.0f}%) असल्याने बुरशीचा प्रसार वाढू शकतो. पानांवर तपकिरी डाग आढळल्यास कॉपर ऑक्सीक्लोराईड किंवा जैविक बुरशीनाशकाचा वापर करावा."
            })

    # Agricultural disclaimer
    precautions.append("⚠️ कृषी सूचना: या शिफारसी संगणकीय निर्णय-साहाय्य मॉडेलवर आधारित आहेत. कोणत्याही रासायनिक उपायांची अंमलबजावणी स्थानिक कृषी विज्ञान केंद्र (KVK) च्या मार्गदर्शनानुसारच करावी. हे मॉडेल उत्पादनाची कोणतीही हमी देत नाही.")

    return RecommendationsResponse(
        growth_stage=stage,
        stage_description=stage_desc,
        fertilizer_schedule={
            "urea_kg": urea_kg,
            "dap_kg": dap_kg,
            "potash_mop_kg": potash_kg,
            "micronutrients": "झिंक (Zinc) 5 kg आणि बोरॉन (Boron) 1 kg प्रति एकर फवारणीतून द्यावे.",
            "application_method": "खते झाडाच्या मुळाजवळ रिंग पद्धतीने देऊन मातीने झाकावीत."
        },
        irrigation_schedule={
            "frequency": irrigation_days,
            "volume_level": irrigation_vol,
            "soil_adaptation": soil_note,
            "method": "ठिबक सिंचन (Drip Irrigation) सर्वोत्तम, ज्यामुळे 40% पाण्याची बचत होते."
        },
        pest_disease_watch=watch_list,
        expert_precautions=precautions
    )
