import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechHookReturn {
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentSpeakingId: string | null;
  transcript: string;
  speechSupported: boolean;
  recognitionSupported: boolean;
  errorMessage: string | null;
  autoSpeakEnabled: boolean;
  setAutoSpeakEnabled: (val: boolean) => void;
  startListening: (langCode?: string) => Promise<void>;
  stopListening: () => void;
  speak: (text: string, language?: string, id?: string) => void;
  pause: () => void;
  resume: () => void;
  stopSpeaking: () => void;
  clearTranscript: () => void;
  clearError: () => void;
}

const AUTO_SPEAK_STORAGE_KEY = 'cottoncare_auto_speak_pref';

function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[*#_`~>]/g, ' ')               // remove markdown formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links keeping anchor text
    .replace(/https?:\/\/\S+/g, '')         // remove URLs
    .replace(/[•●▪■]/g, ', ')               // convert bullets to brief pauses
    .replace(/\s+/g, ' ')                   // collapse extra whitespaces
    .trim();
}

function getRecognitionLang(lang: string = 'en'): string {
  const l = lang.toLowerCase();
  if (l === 'mr' || l === 'marathi' || l === 'मराठी') return 'mr-IN';
  if (l === 'hi' || l === 'hindi' || l === 'हिंदी') return 'hi-IN';
  return 'en-IN';
}

function getSynthesisLang(lang: string = 'en'): string {
  const l = lang.toLowerCase();
  if (l === 'mr' || l === 'marathi' || l === 'मराठी') return 'mr-IN';
  if (l === 'hi' || l === 'hindi' || l === 'हिंदी') return 'hi-IN';
  return 'en-IN';
}

function selectBestVoice(voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const target = targetLang.toLowerCase();

  // 1. Exact match (e.g. 'mr-in', 'hi-in', 'en-in')
  let match = voices.find(v => v.lang.toLowerCase() === target);
  if (match) return match;

  // 2. Language prefix match (e.g. 'mr', 'hi', 'en')
  const prefix = target.split('-')[0];
  match = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (match) return match;

  // 3. Fallback for Indian regional voice if specific dialect is missing
  if (prefix === 'mr' || prefix === 'hi') {
    match = voices.find(v => v.lang.toLowerCase().includes('in'));
    if (match) return match;
  }

  // 4. Default voice
  return voices.find(v => v.default) || voices[0] || null;
}

export function useSpeech(): SpeechHookReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  
  const [autoSpeakEnabled, setAutoSpeakEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SPEAK_STORAGE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const setAutoSpeakEnabled = useCallback((val: boolean) => {
    setAutoSpeakEnabledState(val);
    try {
      localStorage.setItem(AUTO_SPEAK_STORAGE_KEY, String(val));
    } catch {
      // ignore storage error
    }
  }, []);

  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('speechSynthesis' in window)) {
      setSpeechSupported(false);
    } else {
      const updateVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
    }
  }, []);

  const startListening = useCallback(async (langInput: string = 'en') => {
    setErrorMessage(null);
    setTranscript('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      setErrorMessage(
        'Speech recognition is not available in this browser. Please use Google Chrome, Microsoft Edge, or Android Chrome.'
      );
      return;
    }

    // Stop ongoing speech before listening
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSpeakingId(null);
    }

    // Explicitly check / prompt for microphone permission where supported
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close test stream immediately
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        setIsListening(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions in your browser address bar to use voice input.'
          );
        } else {
          setErrorMessage(`Microphone setup error: ${err.message || 'Device unavailable'}`);
        }
        return;
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getRecognitionLang(langInput);
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const result = event.results?.[0]?.[0]?.transcript;
        if (result && result.trim()) {
          setTranscript(result.trim());
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const err = event.error;
        switch (err) {
          case 'network':
            setErrorMessage(
              'Network Error: Speech-to-text requires an active internet connection to contact speech recognition services. Please check your network or type your query.'
            );
            break;
          case 'not-allowed':
          case 'service-not-allowed':
            setErrorMessage(
              'Microphone Permission Denied: Please click the lock or camera icon in your browser address bar and enable Microphone.'
            );
            break;
          case 'no-speech':
            setErrorMessage(
              'No speech detected. Please speak clearly into your microphone and try again.'
            );
            break;
          case 'audio-capture':
            setErrorMessage(
              'No microphone detected. Please connect an audio input device.'
            );
            break;
          case 'aborted':
            // Manual cancellation, no error banner needed
            break;
          default:
            setErrorMessage(`Speech recognition error (${err}). You can continue by typing.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setIsListening(false);
      setErrorMessage(`Failed to start voice recognition: ${e.message || String(e)}`);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string, languageInput: string = 'en', messageId?: string) => {
    if (!('speechSynthesis' in window)) {
      setErrorMessage('Audio speech playback is not supported by your browser.');
      return;
    }

    try {
      // Stop any existing utterance
      window.speechSynthesis.cancel();
      setIsPaused(false);

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const targetLang = getSynthesisLang(languageInput);
      utterance.lang = targetLang;
      utterance.rate = 0.95; // Clear, comfortable conversational rate for farmers
      utterance.pitch = 1.0;

      const bestVoice = selectBestVoice(voicesRef.current, targetLang);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentSpeakingId(messageId || 'active');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentSpeakingId(null);
      };

      utterance.onerror = (e) => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentSpeakingId(null);
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          setErrorMessage('Speech playback encountered an audio issue: ' + e.error);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e: any) {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSpeakingId(null);
      setErrorMessage('Could not generate speech output: ' + (e.message || String(e)));
    }
  }, []);

  const pause = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSpeakingId(null);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
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
  };
}
