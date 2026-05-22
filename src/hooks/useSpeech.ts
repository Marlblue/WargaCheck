import { useState, useCallback, useEffect, useRef } from 'react';

// Extend window object untuk webkitSpeechRecognition di TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechReturn {
  isSupported: boolean;
  isListening: boolean;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
  isPlaying: boolean;
  activeMessageId: string | null;
  speak: (text: string, messageId: string) => void;
  stopSpeaking: () => void;
  /** Non-blocking error message (replaces native alert). */
  error: string | null;
  clearError: () => void;
}

export function useSpeech(): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const [isSupported] = useState(() => 
    typeof window !== 'undefined' && 
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)
  );

  const clearError = useCallback(() => setError(null), []);

  /** Show an error that auto-clears after 4 seconds. */
  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
  }, []);

  // --- Speech to Text (Mendengarkan Suara) ---
  const startListening = useCallback((onResult: (text: string) => void) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showError('Browser Anda tidak mendukung fitur input suara. Gunakan Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; // Bahasa Indonesia
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          showError('Izin mikrofon ditolak. Aktifkan di pengaturan browser.');
        } else if (event.error === 'no-speech') {
          showError('Tidak ada suara terdeteksi. Coba lagi.');
        } else {
          showError(`Terjadi kesalahan pada fitur suara (${event.error}).`);
        }
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start SpeechRecognition:', err);
      showError('Browser ini tidak mendukung fitur suara secara penuh.');
      setIsListening(false);
    }
  }, [showError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // --- Text to Speech (Membaca Teks) ---
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setActiveMessageId(null);
  }, []);

  const speak = useCallback((text: string, messageId: string) => {
    if (!window.speechSynthesis) {
      showError('Browser Anda tidak mendukung fitur suara.');
      return;
    }

    // Stop suara sebelumnya jika ada yang sedang diputar
    stopSpeaking();

    // Hapus format markdown dasar (seperti **, -, #) agar enak didengar oleh Text-to-Speech
    const cleanText = text.replace(/[*#_]/g, '').replace(/-/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    
    // Coba pilih suara bahasa Indonesia jika tersedia (opsional)
    // Use the cached voices from state
    const idVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID');
    if (idVoice) utterance.voice = idVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setActiveMessageId(messageId);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setActiveMessageId(null);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      setActiveMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking, showError, voices]);

  // Clean up saat komponen di-unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [stopSpeaking]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
    isPlaying,
    activeMessageId,
    speak,
    stopSpeaking,
    error,
    clearError,
  };
}
