# CottonCare AI — Local Flask version

This is a Flask conversion of the Streamlit code shared by the user. It removes Streamlit and uses HTML/CSS/JavaScript in a browser, with SQLite for data storage.

## Features converted
- Demo OTP login (OTP is shown on screen; no real SMS/email is sent)
- Marathi, Hindi and English interface
- Dashboard with Open-Meteo weather
- Cotton crop photo upload and Gemini image analysis
- Cotton AI text chat
- Browser speech-to-text and text-to-speech for supported browsers
- Yield estimate and optional AI advice
- Fertilizer/irrigation stage calculator (keeps the same original heuristic)
- Market rates and helplines from the original code
- Scan history with stored image
- Farmer profile edit

## Windows setup
1. Install Python 3.11 or newer from https://www.python.org/downloads/windows/
2. Extract the ZIP and open this folder in VS Code.
3. In VS Code choose Terminal > New Terminal.
4. Run:
   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
5. Copy `.env.example` to `.env`.
6. Edit `.env` and set `GEMINI_API_KEY` to your own key. Confirm `GEMINI_MODEL` is a model enabled for your API key.
7. Run:
   ```powershell
   python app.py
   ```
8. Open http://127.0.0.1:5000

## Notes
- Stop the server with Ctrl+C in the terminal.
- This is a local development app, not production-secure authentication. The demo OTP is not a real OTP.
- AI features need internet access and a working Gemini API key/model.
- The yield estimate and fertilizer amounts are copied in spirit from the supplied code and are not agronomic validation. Confirm real recommendations with local agricultural experts and product labels.
- Browser microphone features require a supported browser and microphone permission. They use the browser Web Speech API, not a Python server microphone.
