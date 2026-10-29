import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Bot,
  User,
  Globe,
  HelpCircle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { useSpeech } from '../hooks/useSpeech';
import { useLanguage } from '../i18n/LanguageContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: string;
}

interface AssistantChatProps {
  currentLanguage?: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = () => {
  const { language, setLanguage, t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isSpeaking,
    isPaused,
    currentSpeakingId,
    transcript,
    speechSupported,
    recognitionSupported,
    errorMessage,
    autoSpeakEnabled,
    setAutoSpeakEnabled,
    startListening,
    stopListening,
    speak,
    pause,
    resume,
    stopSpeaking,
    clearTranscript,
    clearError
  } = useSpeech();

  // Initialize or re-initialize welcome message based on language
  useEffect(() => {
    const welcomeText =
      language === 'mr'
        ? 'नमस्कार! मी कॉटनकेअर AI कृषी सहाय्यक आहे. आपण कापूस पिकाचे खत, पाणी, कीड व्यवस्थापन किंवा हवामानाविषयी मराठीत बोलून किंवा टाईप करून विचारू शकता.'
        : language === 'hi'
        ? 'नमस्ते! मैं कॉटनकेअर AI कृषि सहायक हूँ। आप कपास फसल की खाद, सिंचाई, कीट रोकथाम या मौसम संबंधी प्रश्न बोलकर या लिखकर पूछ सकते हैं।'
        : 'Hello! I am CottonCare AI, your smart cotton farming assistant. Ask any question about cotton irrigation, fertilizers, pest control, or weather advisories.';

    setMessages([
      {
        id: 'init-welcome',
        role: 'assistant',
        content: welcomeText,
        provider: 'CottonCare AI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [language]);

  const followups: Record<string, string[]> = {
    mr: [
      'फुलोरा अवस्थेत कोणते खत द्यावे?',
      'गुलाबी बोंड अळीचे नियंत्रण कसे करावे?',
      'मुसळधार पावसाचा अंदाज असल्यास काय करावे?',
      'ठिबक सिंचनाने पाणी कसे द्यावे?'
    ],
    hi: [
      'फूल आने के समय कौन सा खाद डालना चाहिए?',
      'गुलाबी सुंडी (Pink Bollworm) से कैसे बचें?',
      'कपास में सिंचाई का सही समय क्या है?',
      'भारी बारिश की चेतावनी होने पर क्या करें?'
    ],
    en: [
      'What is the best fertilizer dose during flowering?',
      'How to control Pink Bollworm in cotton?',
      'What should I do if heavy rain is forecast?',
      'Optimal irrigation schedule for black soil?'
    ]
  };

  const currentPills = followups[language] || followups.en;

  // When speech recognition produces text, put it into the input box so the farmer can verify it
  useEffect(() => {
    if (transcript) {
      setInputQuestion(transcript);
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || inputQuestion).trim();
    if (!textToSend || loading) return;

    // Stop ongoing speech when a new query is submitted
    stopSpeaking();

    // Abort any prior in-flight request to prevent race conditions
    if (abortController) {
      abortController.abort();
    }

    const newController = new AbortController();
    setAbortController(newController);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      // Build lightweight conversation history prioritizing the latest exchange
      const historyContext = messages
        .slice(-3)
        .map((m) => `${m.role === 'user' ? 'Farmer' : 'Cotton AI'}: ${m.content}`)
        .join('\n');

      const res = await api.chatWithAssistant(
        textToSend,
        language,
        historyContext,
        newController.signal
      );

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: res.answer,
        provider: res.provider || 'CottonCare AI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If voice response mode is enabled, speak the answer aloud automatically
      if (autoSpeakEnabled) {
        speak(res.answer, language, aiMsgId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was cancelled for a newer question
        return;
      }
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          language === 'mr'
            ? 'कृषी AI सेवेत तात्पुरती अडचण आली आहे. कृपया काही वेळाने पुन्हा प्रयत्न करा किंवा खालील प्रश्न विचारा.'
            : language === 'hi'
            ? 'कृषि AI सेवा में अस्थायी तकनीकी समस्या आई है। कृपया पुनः प्रयास करें।'
            : 'The AI assistant encountered a temporary network delay. Please try again or select a suggested inquiry below.',
        provider: 'System Notice',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(language);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            <Sparkles className="w-3.5 h-3.5" />
            {t('assistantSubtitle', 'Grounded Multilingual Conversational Companion for Cotton Farmers')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('assistantTitle', 'CottonCare AI Farming Assistant')}
          </h1>
        </div>

        {/* Controls: Voice Output Mode & Language Quick Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Voice Auto-Speak Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setAutoSpeakEnabled(!autoSpeakEnabled);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              autoSpeakEnabled
                ? 'bg-cotton-50 text-cotton-800 border-cotton-300 shadow-2xs'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Automatically speak AI answers aloud when voice mode is ON"
          >
            {autoSpeakEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cotton-600" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {autoSpeakEnabled ? t('assistantVoiceModeOn', 'Voice Output: ON') : t('assistantVoiceModeOff', 'Voice Output: OFF')}
            </span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {([
              { id: 'mr', label: 'मराठी' },
              { id: 'hi', label: 'हिंदी' },
              { id: 'en', label: 'English' }
            ] as const).map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  stopSpeaking();
                  setLanguage(l.id);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  language === l.id
                    ? 'bg-cotton-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listening Status Banner */}
      {isListening && (
        <div className="p-3.5 bg-gradient-to-r from-purple-50 via-cotton-50 to-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between text-xs font-bold text-purple-900 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span>
              {language === 'mr'
                ? 'माइक सुरू आहे... कृपया आपला कृषी प्रश्न स्पष्ट बोला'
                : language === 'hi'
                ? 'माइक सक्रिय है... कृपया अपना कृषि प्रश्न स्पष्ट बोलें'
                : 'Microphone active... Speak your cotton farming question clearly'}
            </span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 rounded-lg border border-purple-200 text-[11px] font-extrabold transition cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>{t('assistantStop', 'Stop')}</span>
          </button>
        </div>
      )}

      {/* Error / Notice Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 font-semibold shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2 cursor-pointer"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Messages Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        
        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isThisSpeaking = isSpeaking && currentSpeakingId === m.id;
            const isThisPaused = isPaused && currentSpeakingId === m.id;

            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-cotton-600 text-white shadow-md shadow-cotton-600/20'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`space-y-1.5 max-w-[85%] sm:max-w-[75%]`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-cotton-600 text-white rounded-tr-xs shadow-md shadow-cotton-600/10'
                        : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>

                    {/* Speaker & Audio Playback Controls for Assistant Responses */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        {isThisSpeaking ? (
                          <>
                            {/* Pause / Resume Button */}
                            <button
                              type="button"
                              onClick={() => (isThisPaused ? resume() : pause())}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cotton-100 text-cotton-800 hover:bg-cotton-200 transition cursor-pointer border border-cotton-200"
                              title={isThisPaused ? 'Resume Audio' : 'Pause Audio'}
                            >
                              {isThisPaused ? (
                                <Play className="w-3 h-3 fill-current" />
                              ) : (
                                <Pause className="w-3 h-3 fill-current" />
                              )}
                              <span>
                                {isThisPaused
                                  ? t('assistantResume', 'Resume')
                                  : t('assistantPause', 'Pause')}
                              </span>
                            </button>

                            {/* Stop Button */}
                            <button
                              type="button"
                              onClick={stopSpeaking}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer border border-rose-200"
                              title="Stop audio playback"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>{t('assistantStop', 'Stop')}</span>
                            </button>

                            {/* Live Soundwave Indicator */}
                            <span className="flex items-center gap-1.5 text-[10px] text-cotton-700 font-extrabold ml-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cotton-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cotton-600"></span>
                              </span>
                              <span>{t('assistantSpeaking', 'Speaking answer...')}</span>
                            </span>
                          </>
                        ) : (
                          /* Idle or Previously Spoken Message: Play / Replay button */
                          <button
                            type="button"
                            onClick={() => speak(m.content, language, m.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 hover:text-cotton-800 bg-slate-50 hover:bg-cotton-50 transition cursor-pointer border border-slate-200 hover:border-cotton-300"
                            title="Hear this response spoken aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-cotton-600" />
                            <span>{t('assistantListen', 'Listen')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{m.timestamp}</span>
                    {m.provider && !isUser && (
                      <span className="font-semibold text-cotton-700 bg-cotton-50 px-1.5 py-0.5 rounded border border-cotton-200">
                        {m.provider}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-cotton-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-cotton-600/20">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <div className="w-2 h-2 rounded-full bg-cotton-500 animate-ping" />
                <span>{t('assistantThinking', 'Consulting CottonCare AI...')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Followups */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-cotton-600" />
            {t('assistantSuggestedPrompts', 'Frequently Asked Questions')}:
          </span>
          {currentPills.map((pill, i) => (
            <button
              key={i}
              onClick={() => handleSend(pill)}
              disabled={loading}
              className="shrink-0 text-xs text-slate-700 bg-slate-100 hover:bg-cotton-50 hover:text-cotton-800 hover:border-cotton-300 px-3 py-1 rounded-full border border-slate-200 transition cursor-pointer font-medium disabled:opacity-50"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={handleMicToggle}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-md shadow-red-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
                title={isListening ? t('assistantListening', 'Listening...') : 'Voice Input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={t('assistantTypePlaceholder', 'Ask about cotton pests, fertilizer doses, rain forecasts, or irrigation...')}
              className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cotton-600 focus:outline-none transition"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="p-2.5 bg-cotton-600 hover:bg-cotton-700 text-white rounded-xl shadow-md shadow-cotton-600/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('assistantSendBtn', 'Send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
