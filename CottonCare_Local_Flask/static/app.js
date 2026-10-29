function speakText(text, language) {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-speech is not supported by this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = language || "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-question");
  const chatMessages = document.getElementById("chat-messages");
  const chatStatus = document.getElementById("chat-status");
  const voiceLanguage = document.getElementById("voice_language");
  const micButton = document.getElementById("mic-button");

  function addBubble(role, text) {
    const div = document.createElement("div");
    div.className = "chat-bubble " + role;
    const strong = document.createElement("strong");
    strong.textContent = role === "user" ? "You" : "Cotton AI";
    const body = document.createElement("div");
    body.textContent = text;
    div.appendChild(strong);
    div.appendChild(body);
    if (role === "assistant") {
      const listen = document.createElement("button");
      listen.className = "text-button";
      listen.type = "button";
      listen.textContent = "🔊 Listen";
      listen.onclick = () => {
        const lang = voiceLanguage.value === "Marathi" ? "mr-IN" : (voiceLanguage.value === "Hindi" ? "hi-IN" : "en-US");
        speakText(text, lang);
      };
      div.appendChild(listen);
    }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  if (chatForm) {
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = chatInput.value.trim();
      if (!question) return;
      addBubble("user", question);
      chatInput.value = "";
      chatStatus.textContent = "🌱 Cotton AI is thinking...";
      const body = new URLSearchParams();
      body.set("question", question);
      body.set("voice_language", voiceLanguage.value);
      try {
        const response = await fetch("/chat", { method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Request failed");
        addBubble("assistant", data.answer);
        const lang = voiceLanguage.value === "Marathi" ? "mr-IN" : (voiceLanguage.value === "Hindi" ? "hi-IN" : "en-US");
        speakText(data.answer, lang);
        chatStatus.textContent = "";
      } catch (err) {
        chatStatus.textContent = "❌ " + err.message;
      }
    });
  }

  if (micButton) {
    micButton.addEventListener("click", () => {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        chatStatus.textContent = "Voice recognition is not supported here. Try Google Chrome.";
        return;
      }
      const recognition = new Recognition();
      recognition.lang = voiceLanguage.value === "Marathi" ? "mr-IN" : (voiceLanguage.value === "Hindi" ? "hi-IN" : "en-IN");
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { chatStatus.textContent = "🎤 Listening... Please speak now."; micButton.disabled = true; };
      recognition.onresult = (event) => {
        chatInput.value = event.results[0][0].transcript;
        chatStatus.textContent = "Recognized: " + chatInput.value;
        chatInput.focus();
      };
      recognition.onerror = (event) => { chatStatus.textContent = "Microphone error: " + event.error; };
      recognition.onend = () => { micButton.disabled = false; };
      recognition.start();
    });
  }

  const yieldForm = document.getElementById("yield-form");
  if (yieldForm) {
    yieldForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const result = document.getElementById("yield-result");
      result.classList.remove("hidden");
      result.textContent = "Calculating estimate and preparing advice...";
      try {
        const response = await fetch("/yield-advice", {method:"POST", body:new FormData(yieldForm)});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Request failed");
        result.innerHTML = "";
        const heading = document.createElement("h3");
        heading.textContent = "🌾 Estimated yield: " + data.yield + " quintals";
        const advice = document.createElement("p");
        advice.textContent = data.advice;
        result.appendChild(heading);
        result.appendChild(advice);
      } catch (err) {
        result.textContent = "❌ " + err.message;
      }
    });
  }
});