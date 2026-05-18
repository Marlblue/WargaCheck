/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessage } from '../services/gemini';
import LogoIcon from './shared/LogoIcon';
import DocumentScanner from './DocumentScanner';
import { useSpeech } from '../hooks/useSpeech';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

interface ChatProps {
  initialMessage?: string;
  onBack: () => void;
}

const STORAGE_KEY = 'wargacheck_history';

const QUICK_REPLIES = [
  'Checklist berkas KTP',
  'Surat pindah domisili',
  'Bikin akta kelahiran',
  'Prosedur SKCK',
  'Update Kartu Keluarga',
  'Akta perkawinan',
];

export default function Chat({ initialMessage, onBack }: ChatProps) {
  const { isListening, startListening, stopListening, isPlaying, activeMessageId, speak, stopSpeaking, error: speechError, clearError: clearSpeechError } = useSpeech();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didInit = useRef(false);
  const msgIdCounter = useRef(0);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        const toSave = messages.slice(-100);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
        } catch { /* give up */ }
      }
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamingText]);

  const handleSend = useCallback(async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: `u-${Date.now()}-${++msgIdCounter.current}`, role: 'user', text, timestamp: new Date().toISOString() };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(false);
    setStreamingText('');

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 10);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await sendMessage(text, history);
      const fullText = response || 'Maaf, saya sedang mengalami kendala. Bisa diulangi?';

      setIsLoading(false);
      setIsStreaming(true);

      const words = fullText.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingText(currentText);

        const delay = Math.min(60, 20 + words[i].length * 2);
        await new Promise(resolve => setTimeout(resolve, delay));

        if (scrollRef.current) {
          const isAtBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 100;
          if (isAtBottom) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }
      }

      const suggestions = generateSuggestions(fullText, text);

      const botMsg: Message = {
        id: `m-${Date.now()}-${++msgIdCounter.current}`,
        role: 'model',
        text: fullText,
        timestamp: new Date().toISOString(),
        suggestions,
      };

      setMessages(prev => [...prev, botMsg]);
      setStreamingText('');
      setIsStreaming(false);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Sepertinya ada masalah koneksi. Coba lagi sebentar.';
      const errMsg: Message = {
        id: `e-${Date.now()}-${++msgIdCounter.current}`,
        role: 'model',
        text: errorText,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      setStreamingText('');
      setIsStreaming(false);
      setIsLoading(false);
    } finally {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  const generateSuggestions = (response: string, _userQuestion: string): string[] => {
    const lower = response.toLowerCase();
    const pool: string[] = [];
    // Cost-related
    if (lower.includes('biaya') || lower.includes('gratis')) {
      pool.push('Berapa lama prosesnya?');
    } else {
      pool.push('Berapa biayanya?');
    }
    // Time-related
    if (lower.includes('hari') || lower.includes('minggu')) {
      pool.push('Bisa dipercepat?');
    }
    // Document-related
    if (lower.includes('dokumen') || lower.includes('berkas')) {
      pool.push('Buatkan checklist lengkapnya');
    } else {
      pool.push('Dokumen apa saja yang perlu disiapkan?');
    }
    // Online option
    if (!lower.includes('online')) {
      pool.push('Bisa diurus online?');
    }
    // Location
    if (!lower.includes('alamat') && !lower.includes('lokasi')) {
      pool.push('Di mana kantor terdekat?');
    }
    return [...new Set(pool)].slice(0, 3);
  };

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  useEffect(() => {
    if (initialMessage && !didInit.current) {
      didInit.current = true;
      handleSendRef.current(initialMessage);
    }
  }, [initialMessage]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    didInit.current = false;
    setShowConfirmClear(false);
  };

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const showQuickReplies = messages.length === 0 && !isLoading;
  const hasHistory = messages.length > 0;

  return (
    <div className="chat-container" style={{ height: 'calc(100dvh - 72px)', paddingTop: 8 }}>

      {/* ── Chat Header ── */}
      {hasHistory && (
        <motion.div
          className="chat-header"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 8px var(--primary-glow)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
              {messages.length} pesan
            </span>
          </div>
          <button
            className="chat-clear-btn"
            onClick={() => setShowConfirmClear(true)}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M11.5 3.5l-.7 7.3a1 1 0 0 1-1 .9H4.2a1 1 0 0 1-1-.9L2.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Hapus riwayat
          </button>
        </motion.div>
      )}

      {/* ── Messages ── */}
      <div ref={scrollRef} className="chat-messages">

        {/* Empty state */}
        {showQuickReplies && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 24 }}>
            {/* Decorative blob */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: -30, right: -20, width: 100, height: 100,
                borderRadius: '50%', background: 'var(--primary)', opacity: 0.04,
                filter: 'blur(30px)', pointerEvents: 'none',
              }} />
              <div style={{ marginBottom: 28 }}>
                <h2 style={{
                  fontSize: 'clamp(24px, 5.5vw, 28px)', fontWeight: 800,
                  color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 10px',
                }}>
                  Hai, ada yang bisa<br />
                  <span className="text-gradient">dibantu?</span>
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Tanya prosedur, syarat, atau checklist berkas dokumen kependudukan apa saja.
                </p>
              </div>
            </div>

            <p className="section-label">Pertanyaan Populer</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_REPLIES.map((q, i) => (
                <motion.button
                  key={q}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.97 }}
                  className="chat-quick-item"
                  onClick={() => handleSend(q)}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 'var(--r-sm)',
                    background: 'var(--primary-soft)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{q}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 'auto', color: 'var(--primary)', opacity: 0.4, flexShrink: 0 }}>
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}
              >
                {/* AI avatar */}
                {!isUser && (
                  <div style={{ width: 28, flexShrink: 0, marginRight: 10, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                    <LogoIcon size={22} />
                  </div>
                )}

                <div style={{ maxWidth: isUser ? '85%' : '80%' }}>
                  {/* Role label & Audio */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isUser ? 'flex-end' : 'space-between', marginBottom: 4 }}>
                    <div className="msg-label">
                      {isUser ? 'Anda' : 'WargaCheck'} · {fmt(msg.timestamp)}
                    </div>
                    {!isUser && (
                      <button
                        onClick={() => {
                          const isCurrentlyPlayingThis = isPlaying && activeMessageId === msg.id;
                          if (isCurrentlyPlayingThis) stopSpeaking();
                          else speak(msg.text, msg.id);
                        }}
                        style={{
                          background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: (isPlaying && activeMessageId === msg.id) ? 'var(--primary)' : 'var(--text-tertiary)',
                          transition: 'color 0.2s',
                        }}
                        title={(isPlaying && activeMessageId === msg.id) ? "Hentikan Suara" : "Dengarkan"}
                      >
                        {(isPlaying && activeMessageId === msg.id) ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
                    {isUser ? (
                      <span>{msg.text}</span>
                    ) : (
                      <div className="md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Suggestion chips */}
                  {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}
                    >
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className="pill"
                          onClick={() => handleSend(suggestion)}
                          disabled={isLoading}
                          style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'default' : 'pointer', fontSize: 12 }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && !isStreaming && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16, gap: 10 }}>
              <div style={{ width: 28, flexShrink: 0, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                <LogoIcon size={22} />
              </div>
              <div>
                <div className="msg-label">WargaCheck</div>
                <div style={{
                  padding: '12px 16px', borderRadius: '6px var(--r-md) var(--r-md) var(--r-md)',
                  background: 'var(--bg-card)', display: 'inline-flex', alignItems: 'center', gap: 5,
                  width: 'fit-content', border: '1px solid var(--border-soft)',
                }}>
                  <span className="dot-1" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                  <span className="dot-2" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                  <span className="dot-3" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Streaming response */}
          {isStreaming && streamingText && (
            <motion.div key="streaming" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16, gap: 10 }}>
              <div style={{ width: 28, flexShrink: 0, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                <LogoIcon size={22} />
              </div>
              <div style={{ maxWidth: '80%' }}>
                <div className="msg-label">WargaCheck · sedang mengetik...</div>
                <div className="bubble-ai">
                  <div className="md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                  </div>
                  <span style={{
                    display: 'inline-block', width: 2, height: 16,
                    background: 'var(--primary)', marginLeft: 2,
                    animation: 'blink 1s infinite', verticalAlign: 'middle',
                  }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Speech Error Toast ── */}
      <AnimatePresence>
        {speechError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            role="alert"
            aria-live="polite"
            style={{
              position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)',
              padding: '10px 18px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 500,
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10, zIndex: 50, maxWidth: '90%',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span>{speechError}</span>
            <button onClick={clearSpeechError} aria-label="Tutup pesan error" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--text-tertiary)' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <div className="chat-input-bar" role="form" aria-label="Kirim pertanyaan">
        {/* Doc Scanner */}
        <button className="chat-icon-btn" onClick={() => setShowScanner(true)} disabled={isLoading} aria-label="Scan dokumen dengan kamera" title="Scan dokumen" style={{ opacity: isLoading ? 0.5 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {/* Voice */}
        <button
          className="chat-icon-btn"
          onClick={() => {
            if (isListening) { stopListening(); }
            else { startListening((text) => { setInput(prev => prev ? prev + ' ' + text : text); }); }
          }}
          disabled={isLoading}
          aria-label={isListening ? "Hentikan mendengarkan suara" : "Mulai input suara"}
          title={isListening ? "Sedang mendengarkan..." : "Gunakan suara"}
          aria-pressed={isListening}
          style={{
            opacity: isLoading ? 0.5 : 1,
            background: isListening ? 'var(--primary-soft)' : undefined,
            position: 'relative',
          }}
        >
          {isListening && (
            <span style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', opacity: 0.2,
              animation: 'micPulse 1.5s infinite',
            }} aria-hidden="true" />
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isListening ? "var(--primary)" : "none"} stroke={isListening ? "var(--primary)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ zIndex: 1 }} aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
          placeholder="Tanya prosedur, syarat, atau checklist..."
          disabled={isLoading}
          className="chat-input"
          aria-label="Ketik pertanyaan tentang dokumen kependudukan"
        />

        <button
          className="chat-send-btn"
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          aria-label="Kirim pesan"
          style={{
            background: input.trim() && !isLoading ? 'var(--primary)' : 'var(--border)',
            cursor: input.trim() && !isLoading ? 'pointer' : 'default',
          }}
          onMouseEnter={e => { if (input.trim() && !isLoading) e.currentTarget.style.background = 'var(--primary-hover)'; }}
          onMouseLeave={e => { if (input.trim() && !isLoading) e.currentTarget.style.background = 'var(--primary)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !isLoading ? '#fff' : 'var(--text-tertiary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Disclaimer */}
      <p className="chat-disclaimer">
        Informasi bersifat umum — konfirmasi ke instansi resmi setempat untuk kepastian.
      </p>

      {/* Document Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <DocumentScanner
            onClose={() => setShowScanner(false)}
            onScanComplete={(result) => {
              handleSend(`Saya sudah scan dokumen. Hasil scan:\n\n${result}\n\nTolong bantu saya lanjutkan prosesnya.`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmClear(false)}
          >
            <motion.div
              className="confirm-dialog"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Hapus Riwayat Chat?</h3>
              <p>Semua {messages.length} pesan akan dihapus permanen dan tidak bisa dikembalikan.</p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setShowConfirmClear(false)}>Batal</button>
                <button className="btn btn-primary" onClick={clearHistory}>Ya, Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
