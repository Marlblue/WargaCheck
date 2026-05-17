import { useState, useCallback, useEffect, useRef } from 'react';

// Extend window object untuk webkitSpeechRecognition di TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // --- Speech to Text (Mendengarkan Suara) ---
  const startListening = useCallback((onResult: (text: string) => void) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung fitur input suara. Gunakan Google Chrome.');
      return;
    }

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
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

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
      alert('Browser Anda tidak mendukung fitur suara.');
      return;
    }

    // Stop suara sebelumnya jika ada yang sedang diputar
    stopSpeaking();

    // Hapus format markdown dasar (seperti **, -, #) agar enak didengar oleh Text-to-Speech
    const cleanText = text.replace(/[*#_]/g, '').replace(/-/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    
    // Coba pilih suara bahasa Indonesia jika tersedia (opsional)
    const voices = window.speechSynthesis.getVoices();
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
  }, [stopSpeaking]);

  // Clean up saat komponen di-unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [stopSpeaking]);

  return {
    isListening,
    startListening,
    stopListening,
    isPlaying,
    activeMessageId,
    speak,
    stopSpeaking
  };
}
