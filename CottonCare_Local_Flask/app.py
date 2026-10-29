import os
import io
import random
import sqlite3
import base64
from datetime import datetime

import requests
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from PIL import Image
from google import genai

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-this-local-development-secret")
DB_PATH = os.path.join(os.path.dirname(__file__), "cotton_care_pro.db")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

TEXTS = {
    "मराठी": {
        "title": "🌾 कॉटनकेअर AI", "version_tag": "✨ v3.0.0 Pro Max | सर्व फीचर्स ॲक्टिव्ह",
        "login_title": "🌾 कॉटनकेअर AI - प्रो डॅशबोर्ड लॉगिन",
        "login_subtitle": "तुमच्या मोबाईल नंबर किंवा Gmail आयडीने सुरक्षित प्रवेश करा:",
        "input_placeholder": "📱 मोबाईल नंबर किंवा ✉️ Gmail ID:", "send_otp": "📩 OTP पाठवा",
        "enter_otp": "🔑 मिळालेला 4-अंकी OTP टाका:", "verify_otp": "✅ लॉगिन करा (Secure Verify)",
        "logout": "🚪 बाहेर पडा (Logout)", "nav_title": "🧭 नेव्हिगेशन मेनू",
        "tabs": ["📊 डॅशबोर्ड", "📷 पिकाची तपासणी", "💬 कृषी चॅटबॉट", "🌾 उत्पादनाचा अंदाज", "💧 खत व पाणी शेड्युल", "📈 बाजारभाव", "📜 इतिहास", "👤 प्रोफाईल"],
        "greeting": "नमस्कार, ", "dash_desc": "एआय (AI) द्वारे रिअल-टाइम पिकाची पाहणी, हवामान अलर्ट्स आणि स्मार्ट कृषी सल्ले.",
        "scan_btn": "📷 स्कॅन सुरू करा", "weather_title": "🌤️ हवामान आणि रिअल-टाइम ॲडव्हायजरी",
        "temp": "🌡️ तापमान", "wind": "💨 वाऱ्याचा वेग", "advice": "💡 तज्ञांचा फवारणी सल्ला",
        "scan_header": "📸 कापसाच्या पिकाची / पानाची प्रो-लेव्हल तपासणी",
        "upload_label": "फोटो अपलोड करा किंवा थेट कॅमेरा वापरा...",
        "analyze_btn": "🔍 AI द्वारे सखोल विश्लेषण करा", "audio_label": "🔊 अहवाल ऐकण्यासाठी प्ले बटन दाबा:",
        "chatbot_header": "💬 AI कृषी चॅटबॉट - व्हॉईस असिस्टंट व कमांड्स",
        "chatbot_desc": "माईक बटन दाबून किंवा व्हॉईस कमांड देऊन थेट प्रश्न विचारू शकता.",
        "chat_placeholder": "तुमचा प्रश्न येथे टाईप किंवा बोला...", "yield_header": "🌾 कापूस उत्पादन अंदाज व AI मार्गदर्शक",
        "acres": "क्षेत्रफळ (एकर):", "soil": "मातीचा प्रकार:", "water_source": "पाण्याचा स्त्रोत:",
        "bolls": "सरासरी बोंडांची संख्या (Bolls):", "calc_yield": "📊 उत्पादन आणि सल्ला तपासा",
        "fert_header": "💧 खत आणि पाणी कॅल्क्युलेटर (Fertilizer & Irrigation)",
        "crop_days": "लागवड करून किती दिवस झाले?", "calc_fert": "🧪 खत व पाण्याचे योग्य शेड्युल पहा",
        "market_header": "📈 आजचे लाईव्ह कापूस बाजारभाव व हेल्पलाइन",
        "history_header": "📜 जुन्या स्कॅनचा इतिहास आणि रिपोर्ट",
        "profile_header": "👤 तुमची शेतकरी प्रोफाईल", "update_profile": "💾 माहिती सेव्ह करा"
    },
    "हिंदी": {
        "title": "🌾 कॉटनकेअर AI", "version_tag": "✨ v3.0.0 Pro Max | सभी फीचर्स एक्टिव",
        "login_title": "🌾 कॉटनकेअर AI - प्रो डैशबोर्ड लॉगिन",
        "login_subtitle": "अपने मोबाइल नंबर या Gmail आईडी से सुरक्षित प्रवेश करें:",
        "input_placeholder": "📱 मोबाइल नंबर या ✉️ Gmail ID:", "send_otp": "📩 OTP भेजें",
        "enter_otp": "🔑 प्राप्त 4-अंकों का OTP दर्ज करें:", "verify_otp": "✅ लॉगिन करें",
        "logout": "🚪 लॉग आउट", "nav_title": "🧭 नेविगेशन मेनू",
        "tabs": ["📊 डैशबोर्ड", "📷 फसल जाँच", "💬 कृषि चैटबॉट", "🌾 उत्पादन अनुमान", "💧 उर्वरक व सिंचाई", "📈 बाज़ार भाव", "📜 इतिहास", "👤 प्रोफाइल"],
        "greeting": "नमस्ते, ", "dash_desc": "AI द्वारा रिअल-टाइम फसल निगरानी, मौसम अलर्ट और स्मार्ट कृषि सलाह।",
        "scan_btn": "📷 स्कैन शुरू करें", "weather_title": "🌤️ मौसम और रिअल-टाइम एडवाइजरी",
        "temp": "🌡️ तापमान", "wind": "💨 हवा की गति", "advice": "💡 छिड़काव सलाह",
        "scan_header": "📸 कपास फसल / पत्ती की प्रो-लेवल जाँच",
        "upload_label": "तस्वीर अपलोड करें या सीधा कैमरा उपयोग करें...",
        "analyze_btn": "🔍 AI द्वारा विश्लेषण करें", "audio_label": "🔊 रिपोर्ट सुनने के लिए प्ले बटन दबाएँ:",
        "chatbot_header": "💬 AI कृषि चैटबॉट - वॉइस असिस्टेंट",
        "chatbot_desc": "माइक बटन दबाकर बोलकर सवाल पूछ सकते हैं।", "chat_placeholder": "अपना प्रश्न यहाँ पूछें...",
        "yield_header": "🌾 कपास उत्पादन अनुमान व AI सलाह", "acres": "क्षेत्रफल (एकड़):", "soil": "मिट्टी का प्रकार:",
        "water_source": "पानी का स्रोत:", "bolls": "औसत बोंड संख्या:", "calc_yield": "📊 उत्पादन और सलाह देखें",
        "fert_header": "💧 उर्वरक और सिंचाई शेड्यूलर (Fertilizer Calculator)",
        "crop_days": "बुवाई किए हुए कितने दिन हो गए?", "calc_fert": "🧪 सही शेड्यूल देखें",
        "market_header": "📈 आज के लाइव कपास बाजार भाव व हेल्पलाइन", "history_header": "📜 स्कैन इतिहास और रिपोर्ट्स",
        "profile_header": "👤 किसान प्रोफाइल", "update_profile": "💾 जानकारी अपडेट करें"
    },
    "English": {
    
        "login_title": "🌾 CottonCare AI - Pro Dashboard Login",
        "login_subtitle": "Securely login using your Mobile Number or Gmail ID:",
        "input_placeholder": "📱 Enter Mobile Number or ✉️ Gmail ID:", "send_otp": "📩 Send OTP",
        "enter_otp": "🔑 Enter 4-digit OTP:", "verify_otp": "✅ Secure Login", "logout": "🚪 Logout",
        "nav_title": "🧭 Navigation Menu",
        "tabs": ["📊 Dashboard", "📷 Crop Scan", "💬 Agri Chatbot", "🌾 Yield Prediction", "💧 Fert & Irrigation", "📈 Market Rates", "📜 History", "👤 Profile"],
        "greeting": "Hello, ", "dash_desc": "AI-powered real-time crop monitoring, weather alerts, and smart advisory.",
        "scan_btn": "📷 Start Scan", "weather_title": "🌤️ Live Weather & Advisory", "temp": "🌡️ Temperature",
        "wind": "💨 Wind Speed", "advice": "💡 Spray Advisory", "scan_header": "📸 Pro Cotton Crop & Leaf Analysis",
        "upload_label": "Upload photo or use live camera capture...", "analyze_btn": "🔍 Deep AI Analysis",
        "audio_label": "🔊 Listen to the report:", "chatbot_header": "💬 AI Agri Chatbot - Voice Assistant & Commands",
        "chatbot_desc": "Use mic button or voice commands to navigate and interact.",
        "chat_placeholder": "Ask your question here...", "yield_header": "🌾 Cotton Yield Prediction & AI Guide",
        "acres": "Land Area (Acres):", "soil": "Soil Type:", "water_source": "Water Source:",
        "bolls": "Average Bolls per Plant:", "calc_yield": "📊 Calculate Yield & Advice",
        "fert_header": "💧 Fertilizer & Irrigation Scheduler", "crop_days": "Days since sowing:",
        "calc_fert": "🧪 Get Exact Schedule", "market_header": "📈 Live Market Rates & Helpline",
        "history_header": "📜 Scan History & Archives", "profile_header": "👤 Farmer Profile",
        "update_profile": "💾 Save Changes"
    }
}

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, identifier TEXT UNIQUE,
            name TEXT, location TEXT, land_acres REAL)""")
        conn.execute("""CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, timestamp TEXT,
            report_text TEXT, image_data BLOB)""")

def get_or_create_user(identifier):
    with db() as conn:
        row = conn.execute("SELECT identifier, name, location, land_acres FROM users WHERE identifier=?", (identifier,)).fetchone()
        if row is None:
            conn.execute("INSERT INTO users(identifier,name,location,land_acres) VALUES(?,?,?,?)",
                         (identifier, "शेतकरी मित्र", "छत्रपती संभाजीनगर", 2.0))
            row = conn.execute("SELECT identifier, name, location, land_acres FROM users WHERE identifier=?", (identifier,)).fetchone()
        return dict(row)

def update_user_profile(identifier, name, location, acres):
    with db() as conn:
        conn.execute("UPDATE users SET name=?, location=?, land_acres=? WHERE identifier=?",
                     (name, location, acres, identifier))

def save_scan(user_id, report, image):
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="JPEG", quality=90)
    with db() as conn:
        conn.execute("INSERT INTO scan_history(user_id,timestamp,report_text,image_data) VALUES(?,?,?,?)",
                     (user_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), report, buf.getvalue()))

def get_weather_data(lang):
    url = "https://api.open-meteo.com/v1/forecast?latitude=19.8762&longitude=75.3433&current_weather=true"
    try:
        data = requests.get(url, timeout=5).json()["current_weather"]
        temp, wind = data["temperature"], data["windspeed"]
        alert, alert_msg = False, ""
        if wind > 20:
            alert, alert_msg = True, ("⚠️ हवामान चेतावनी: वाऱ्याचा वेग जास्त असल्याने फवारणी टाळावी." if lang == "मराठी" else "⚠️ Weather Alert: High wind speed, avoid spraying.")
        elif temp > 38:
            alert, alert_msg = True, ("⚠️ उष्णतेची लाट: पिकाला पाण्याचा योग्य पुरवठा ठेवा." if lang == "मराठी" else "⚠️ Heatwave Alert: Ensure proper irrigation.")
        if lang == "English":
            status, advice = "Clear / Sunny", "✅ Weather conditions are ideal for spraying."
        elif lang == "हिंदी":
            status, advice = "साफ / स्वच्छ", "✅ छिड़काव के लिए मौसम अनुकूल है।"
        else:
            status, advice = "निरभ्र / स्वच्छ", "✅ फवारणीसाठी हवामान अनुकूल आहे."
        return temp, wind, status, advice, alert, alert_msg
    except Exception:
        return "--", "--", "N/A", "Weather data unavailable.", False, ""

def ai_client():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is missing. Add it to your .env file.")
    return genai.Client(api_key=key)

def ai_text(prompt, system_instruction=None, image=None):
    client = ai_client()
    contents = [prompt]
    if image is not None:
        contents.append(image)
    config = {"system_instruction": system_instruction} if system_instruction else None
    response = client.models.generate_content(model=GEMINI_MODEL, contents=contents, config=config)
    text = getattr(response, "text", None)
    if not text:
        raise RuntimeError("The AI returned an empty response. Check the model name and API key.")
    return text.strip()

@app.context_processor
def inject_globals():
    return {"texts": TEXTS, "lang": session.get("language", "English"), "t": TEXTS.get(session.get("language", "English"), TEXTS["English"])}

@app.before_request
def set_default_language():
    session.setdefault("language", "English")

@app.route("/", methods=["GET"])
def index():
    if not session.get("logged_in"):
        return render_template("login.html")
    user = get_or_create_user(session["user_identifier"])
    tab = request.args.get("tab", "0")
    try:
        tab = max(0, min(7, int(tab)))
    except ValueError:
        tab = 0
    weather = get_weather_data(session["language"]) if tab == 0 else None
    history = []
    if tab == 6:
        with db() as conn:
            rows = conn.execute("SELECT id,timestamp,report_text,image_data FROM scan_history WHERE user_id=? ORDER BY id DESC",
                                (user["identifier"],)).fetchall()
            for row in rows:
                item = dict(row)
                item["image_b64"] = base64.b64encode(item["image_data"]).decode("ascii") if item["image_data"] else None
                history.append(item)
    chat = session.get("chat_messages", [])
    last_report = None
    if tab == 1:
        with db() as conn:
            row = conn.execute("SELECT report_text FROM scan_history WHERE user_id=? ORDER BY id DESC LIMIT 1",
                               (user["identifier"],)).fetchone()
            last_report = row["report_text"] if row else None
    return render_template("app.html", user=user, tab=tab, weather=weather, history=history, chat=chat,
                           last_report=last_report, lang=session["language"], t=TEXTS[session["language"]])

@app.route("/language", methods=["POST"])
def language():
    choice = request.form.get("language", "English")
    if choice in TEXTS:
        session["language"] = choice
    return redirect(url_for("index", tab=request.form.get("tab", "0")))

@app.route("/send-otp", methods=["POST"])
def send_otp():
    identifier = request.form.get("identifier", "").strip()
    if len(identifier) < 4:
        flash("Please enter a valid mobile number or email.", "error")
    else:
        otp = str(random.randint(1000, 9999))
        session["pending_identifier"] = identifier
        session["demo_otp"] = otp
        flash(f"Demo OTP: {otp} (This local demo does not send a real SMS/email.)", "success")
    return redirect(url_for("index"))

@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    otp = request.form.get("otp", "").strip()
    if otp and otp == session.get("demo_otp") and session.get("pending_identifier"):
        session["logged_in"] = True
        session["user_identifier"] = session.pop("pending_identifier")
        session.pop("demo_otp", None)
        session["chat_messages"] = []
        get_or_create_user(session["user_identifier"])
    else:
        flash("Incorrect OTP. Please try again.", "error")
    return redirect(url_for("index"))

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    session["language"] = "English"
    return redirect(url_for("index"))

@app.route("/scan", methods=["POST"])
def scan():
    if not session.get("logged_in"):
        return redirect(url_for("index"))
    upload = request.files.get("crop_image")
    if not upload or not upload.filename:
        flash("Please select a crop photo first.", "error")
        return redirect(url_for("index", tab=1))
    try:
        image = Image.open(upload.stream).convert("RGB")
        image.thumbnail((1600, 1600))
        lang = session["language"]
        prompt = f"Inspect this cotton crop/leaf image in {lang}. Give a structured report: visible symptoms, possible cause (if identifiable), confidence/limitations, immediate management steps, prevention, and when to consult a local agriculture officer. Do not claim certainty if the image is inconclusive. Do not invent chemical doses."
        report = ai_text(prompt, f"You are an agricultural assistant specializing in cotton crops. Write in {lang}.", image)
        save_scan(session["user_identifier"], report, image)
        flash("Analysis complete. Read the latest report below.", "success")
    except Exception as e:
        flash(f"Scan error: {e}", "error")
    return redirect(url_for("index", tab=1))

@app.route("/chat", methods=["POST"])
def chat():
    if not session.get("logged_in"):
        return jsonify({"error": "Please log in first."}), 401
    question = request.form.get("question", "").strip()
    voice_language = request.form.get("voice_language", "English")
    if not question:
        return jsonify({"error": "Please enter a question."}), 400
    instructions = {
        "English": "Answer only in English.",
        "Hindi": "केवल हिंदी में उत्तर दें।",
        "Marathi": "फक्त मराठीत उत्तर द्या।"
    }.get(voice_language, "Answer only in English.")
    system = f"""You are Cotton AI, an agricultural assistant for cotton farmers.
{instructions}
Use simple language. Keep the answer short, about 3 to 5 sentences. Answer the exact question.
For disease questions, mention likely causes and important management steps.
For fertilizer, pesticide or chemical questions, do not invent doses; advise following the product label and local agricultural guidance."""
    messages = session.get("chat_messages", [])
    history_text = "\n".join([f"{m['role']}: {m['content']}" for m in messages[-10:]])
    try:
        answer = ai_text(
            f"Previous conversation:\n{history_text}\n\nFarmer question: {question}",
            system_instruction=system
        )
        messages.extend([{"role": "user", "content": question}, {"role": "assistant", "content": answer}])
        session["chat_messages"] = messages[-20:]
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/yield-advice", methods=["POST"])
def yield_advice():
    if not session.get("logged_in"):
        return jsonify({"error": "Please log in first."}), 401
    try:
        acres = float(request.form.get("acres", 2))
        bolls = int(request.form.get("bolls", 35))
        soil = request.form.get("soil", "")
        water = request.form.get("water", "")
        base = 0.35 + (0.05 if "काळी" in soil else 0) + (0.08 if ("विहीर" in water or "ओलिताची" in water) else 0)
        total = round((bolls * base) * acres, 1)
        lang = session["language"]
        advice = "This is a rough estimate, not a validated agronomic prediction."
        try:
            advice = ai_text(f"Give short, cautious cotton farming advice in {lang}. Land: {acres} acres; soil: {soil}; water source: {water}; average bolls per plant: {bolls}. Mention that local soil tests and agriculture officer advice should guide fertilizer decisions.")
        except Exception as e:
            advice = f"AI advice unavailable: {e}"
        return jsonify({"yield": total, "advice": advice})
    except Exception:
        return jsonify({"error": "Please enter valid area and boll values."}), 400

@app.route("/fertilizer", methods=["POST"])
def fertilizer():
    if not session.get("logged_in"):
        return redirect(url_for("index"))
    try:
        days = int(request.form.get("crop_days", 45))
        acres = float(request.form.get("acres", 2))
        if days <= 30:
            stage = "वाढ व जोपासना टप्पा (Seedling / Vegetative Stage)"
            urea, dap = round(25*acres, 1), round(30*acres, 1)
            irrigation = "दर ७ ते ८ दिवसांनी हलके पाणी द्यावे."
        elif days <= 75:
            stage = "फुलोरा व बोंड भरण्याचा टप्पा (Flowering & Squaring Stage)"
            urea, dap = round(45*acres, 1), round(20*acres, 1)
            irrigation = "पाण्याचा ताण पडू देऊ नका, दर १० दिवसांनी पाणी द्या."
        else:
            stage = "बोंड पक्व होण्याचा टप्पा (Boll Development & Maturity)"
            urea, dap = round(20*acres, 1), round(10*acres, 1)
            irrigation = "पाण्याची गरज कमी असते, आवश्यकतेनुसार सिंचन करा."
        session["fert_result"] = {"stage": stage, "urea": urea, "dap": dap, "irrigation": irrigation}
    except Exception:
        flash("Please enter valid values.", "error")
    return redirect(url_for("index", tab=4))

@app.route("/profile", methods=["POST"])
def profile():
    if not session.get("logged_in"):
        return redirect(url_for("index"))
    identifier = session["user_identifier"]
    name = request.form.get("name", "").strip() or "शेतकरी मित्र"
    location = request.form.get("location", "").strip() or "छत्रपती संभाजीनगर"
    try:
        acres = max(0.5, min(100.0, float(request.form.get("land_acres", 2))))
        update_user_profile(identifier, name, location, acres)
        flash("Profile updated successfully.", "success")
    except Exception:
        flash("Please enter a valid land area.", "error")
    return redirect(url_for("index", tab=7))

@app.route("/market")
def market():
    return redirect(url_for("index", tab=5))

@app.route("/health")
def health():
    return "CottonCare Flask app is running."

init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=True)


