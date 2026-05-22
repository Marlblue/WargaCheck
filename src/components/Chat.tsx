/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessage, sendMessageStream } from '../services/gemini';
import LogoIcon from './shared/LogoIcon';
import ChatInput from './ChatInput';
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
  onOpenScanner: () => void;
}

const STORAGE_KEY = 'wargacheck_history';
const STORAGE_VERSION = 2;
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const QUICK_REPLIES = [
  'Checklist berkas KTP',
  'Surat pindah domisili',
  'Bikin akta kelahiran',
  'Prosedur SKCK',
  'Update Kartu Keluarga',
  'Akta perkawinan',
];

export default function Chat({ initialMessage, onBack, onOpenScanner }: ChatProps) {
  const { isSupported, isListening, startListening, stopListening, isPlaying, activeMessageId, speak, stopSpeaking, error: speechError, clearError: clearSpeechError } = useSpeech();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Version check
      if (parsed && parsed.v === STORAGE_VERSION && Array.isArray(parsed.data)) {
        // TTL check
        if (parsed.ts && Date.now() - parsed.ts > STORAGE_TTL_MS) {
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
        return parsed.data;
      }
      // Legacy or invalid format — clear
      localStorage.removeItem(STORAGE_KEY);
      return [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didInit = useRef(false);
  const msgIdCounter = useRef(0);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        const toSave = { v: STORAGE_VERSION, ts: Date.now(), data: messages.slice(-100) };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        try {
          const toSave = { v: STORAGE_VERSION, ts: Date.now(), data: messages.slice(-10) };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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

    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(30);

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
      const history = messages.slice(-20).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Try real SSE streaming first
      let fullText = '';
      try {
        setIsLoading(false);
        setIsStreaming(true);

        fullText = await sendMessageStream(text, history, (accumulated) => {
          setStreamingText(accumulated);
          // Auto-scroll while streaming
          if (scrollRef.current) {
            const isAtBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 100;
            if (isAtBottom) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }
        });
      } catch {
        // Fallback to non-streaming if SSE fails
        setIsStreaming(false);
        setIsLoading(true);
        const response = await sendMessage(text, history);
        fullText = response || 'Maaf, saya sedang mengalami kendala. Bisa diulangi?';
        setIsLoading(false);
      }

      if (!fullText) fullText = 'Maaf, saya sedang mengalami kendala. Bisa diulangi?';

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

                  {/* Action buttons for AI messages */}
                  {!isUser && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <button
                        className="msg-action-btn"
                        onClick={async () => {
                          const clean = msg.text.replace(/[*#_]/g, '').replace(/-\s*\[\s*\]/g, '☐').replace(/-\s*\[x\]/g, '☑');
                          try { await navigator.clipboard.writeText(clean); } catch {
                            const t = document.createElement('textarea'); t.value = clean; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
                          }
                          const btn = document.getElementById(`copy-${msg.id}`);
                          if (btn) { btn.textContent = '✓ Tersalin'; setTimeout(() => { btn.textContent = 'Salin'; }, 1500); }
                        }}
                        aria-label="Salin jawaban"
                        title="Salin ke clipboard"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        <span id={`copy-${msg.id}`}>Salin</span>
                      </button>
                      <button
                        className="msg-action-btn"
                        onClick={() => {
                          const clean = msg.text.replace(/[*#_]/g, '').replace(/- \[ \]/g, '☐').replace(/- \[x\]/g, '☑');
                          const waText = encodeURIComponent(`📋 *WargaCheck — Checklist Dokumen*\n\n${clean}\n\n_Dibantu oleh WargaCheck AI_`);
                          window.open(`https://wa.me/?text=${waText}`, '_blank');
                        }}
                        aria-label="Bagikan ke WhatsApp"
                        title="Bagikan ke WhatsApp"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </button>
                    </div>
                  )}

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
      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSend={handleSend}
        onOpenScanner={onOpenScanner}
        isSupported={isSupported}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
      />

      {/* Disclaimer */}
      <p className="chat-disclaimer">
        Informasi bersifat umum — konfirmasi ke instansi resmi setempat untuk kepastian.
      </p>

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
