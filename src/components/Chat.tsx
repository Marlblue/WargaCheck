/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessage } from '../services/gemini';
import FlagIcon from './shared/FlagIcon';
import DocumentScanner from './DocumentScanner';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didInit = useRef(false);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        const toSave = messages.slice(-100);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        // localStorage full — try saving fewer messages
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

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date().toISOString() };

    // Add user message immediately
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(false); // Ensure we show typing indicator (dots) first
    setStreamingText('');

    // Force scroll to bottom after user message is added
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 10);

    try {
      // Build history from prior messages only (not including current message)
      // Server adds the current message separately from the 'message' field
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await sendMessage(text, history);
      const fullText = response || 'Maaf, saya sedang mengalami kendala. Bisa diulangi?';

      // Stop "loading" (dots) and start "streaming" (typing text)
      setIsLoading(false);
      setIsStreaming(true);

      // Streaming effect - type out character by character
      // We use word-based streaming for natural feel
      const words = fullText.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingText(currentText);

        // Dynamic delay based on word length for more natural feel
        const delay = Math.min(60, 20 + words[i].length * 2);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Auto-scroll during streaming
        if (scrollRef.current) {
          const isAtBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 100;
          if (isAtBottom) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }
      }

      // Generate smart suggestions based on response
      const suggestions = generateSuggestions(fullText, text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
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
        id: (Date.now() + 1).toString(),
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

  // Generate smart follow-up suggestions
  const generateSuggestions = (response: string, userQuestion: string): string[] => {
    const suggestions: string[] = [];

    // Check what's in the response to generate relevant suggestions
    if (response.toLowerCase().includes('biaya') || response.toLowerCase().includes('gratis')) {
      suggestions.push('Berapa lama prosesnya?');
    } else {
      suggestions.push('Berapa biayanya?');
    }

    if (response.toLowerCase().includes('hari') || response.toLowerCase().includes('minggu')) {
      suggestions.push('Bisa dipercepat?');
    } else {
      suggestions.push('Berapa lama prosesnya?');
    }

    if (response.toLowerCase().includes('dokumen') || response.toLowerCase().includes('berkas')) {
      suggestions.push('Buatkan checklist lengkapnya');
    } else {
      suggestions.push('Dokumen apa saja yang perlu disiapkan?');
    }

    // Always add a generic helpful suggestion
    if (!response.toLowerCase().includes('online')) {
      suggestions.push('Bisa diurus online?');
    }

    // Return max 3 unique suggestions
    return [...new Set(suggestions)].slice(0, 3);
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
  };

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const showQuickReplies = messages.length === 0 && !isLoading;
  const hasHistory = messages.length > 0;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      maxWidth: 800, width: '100%', margin: '0 auto',
      height: 'calc(100dvh - 80px)',
      background: '#fff',
      position: 'relative',
    }}>

      {/* ── Chat Header ── */}
      {hasHistory && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #F0F0F0',
          background: '#FFFFFF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC0000' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {messages.length} Pesan
            </span>
          </div>
          <button
            onClick={clearHistory}
            style={{
              fontSize: 11, fontWeight: 700, color: '#999',
              background: 'none', border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#CC0000'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#999'; }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M11.5 3.5l-.7 7.3a1 1 0 0 1-1 .9H4.2a1 1 0 0 1-1-.9L2.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Hapus Riwayat
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        {/* Empty state */}
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 40 }}
          >
            {/* Hero empty state */}
            <div style={{
              marginBottom: 48,
            }}>
              <h2 style={{
                fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 900,
                color: '#1A1A1A', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 16px',
              }}>
                Ada yang bisa<br />
                <span style={{ color: '#CC0000' }}>kami bantu?</span>
              </h2>
              <p style={{ fontSize: 16, color: '#666', margin: 0, lineHeight: 1.6, maxWidth: 440 }}>
                Tanyakan prosedur, syarat, atau checklist dokumen kependudukan Indonesia dengan asisten AI kami.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <span style={{ fontSize: 10, color: '#CC0000', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800, whiteSpace: 'nowrap' }}>
                Pertanyaan Populer
              </span>
              <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {QUICK_REPLIES.map((q, i) => (
                <button key={q} onClick={() => handleSend(q)} style={{
                  display: 'flex', alignItems: 'center', gap: 24,
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #F0F0F0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  fontSize: 18, fontWeight: 700,
                  color: '#1A1A1A',
                  letterSpacing: '-0.02em',
                }}
                  onMouseEnter={e => { e.currentTarget.style.paddingLeft = '16px'; e.currentTarget.style.color = '#CC0000'; }}
                  onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0px'; e.currentTarget.style.color = '#1A1A1A'; }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#CC0000', opacity: 0.3, fontVariantNumeric: 'tabular-nums', width: 24 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: 24,
                }}
              >
                {/* AI avatar */}
                {!isUser && (
                  <div style={{ width: 32, flexShrink: 0, marginRight: 16, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                    <FlagIcon width={24} />
                  </div>
                )}

                <div style={{ maxWidth: isUser ? '85%' : '80%' }}>
                  {/* Role label */}
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: '#BBB',
                    marginBottom: 6,
                    textAlign: isUser ? 'right' : 'left',
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                  }}>
                    {isUser ? 'Anda' : 'WargaCheck'} · {fmt(msg.timestamp)}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    padding: isUser ? '14px 20px' : '20px 24px',
                    borderRadius: isUser ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                    background: isUser ? '#CC0000' : '#FFFFFF',
                    color: isUser ? '#FFFFFF' : '#1A1A1A',
                    fontSize: 15,
                    lineHeight: 1.7,
                    wordBreak: 'break-word',
                    boxShadow: isUser ? '0 8px 24px rgba(204, 0, 0, 0.15)' : '0 4px 12px rgba(0,0,0,0.03)',
                    border: isUser ? 'none' : '1px solid #F0F0F0',
                  }}>
                    {isUser ? (
                      <span style={{ fontWeight: 500 }}>{msg.text}</span>
                    ) : (
                      <div className="md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Smart suggestion chips */}
                  {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      {msg.suggestions.map((suggestion, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSend(suggestion)}
                          disabled={isLoading}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#CC0000',
                            background: '#FFFFFF',
                            border: '1px solid #CC0000',
                            borderRadius: 6,
                            padding: '8px 16px',
                            cursor: isLoading ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: isLoading ? 0.5 : 1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                          onMouseEnter={e => {
                            if (!isLoading) {
                              e.currentTarget.style.background = '#CC0000';
                              e.currentTarget.style.color = '#FFFFFF';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isLoading) {
                              e.currentTarget.style.background = '#FFFFFF';
                              e.currentTarget.style.color = '#CC0000';
                            }
                          }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && !isStreaming && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}
            >
              <div style={{ width: 32, flexShrink: 0, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                <FlagIcon width={24} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#BBB', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  WargaCheck
                </div>
                <div style={{
                  padding: '16px 20px', borderRadius: '4px 16px 16px 16px',
                  background: '#F9F9F9', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span className="dot-1" style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC0000' }} />
                  <span className="dot-2" style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC0000' }} />
                  <span className="dot-3" style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC0000' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Streaming response */}
          {isStreaming && streamingText && (
            <motion.div key="streaming"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}
            >
              <div style={{ width: 32, flexShrink: 0, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                <FlagIcon width={24} />
              </div>
              <div style={{ maxWidth: '80%' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#BBB', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  WargaCheck · sedang mengetik...
                </div>
                <div style={{
                  padding: '20px 24px', borderRadius: '4px 20px 20px 20px',
                  background: '#FFFFFF', color: '#1A1A1A', fontSize: 15, lineHeight: 1.7,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  border: '1px solid #F0F0F0',
                }}>
                  <div className="md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                  </div>
                  <span style={{
                    display: 'inline-block',
                    width: 3,
                    height: 18,
                    background: '#CC0000',
                    marginLeft: 4,
                    animation: 'blink 1s infinite',
                    verticalAlign: 'middle',
                  }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input bar ── */}
      <div style={{
        padding: '24px',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Document Scanner Button */}
        <button
          onClick={() => setShowScanner(true)}
          disabled={isLoading}
          title="Scan dokumen dengan AI"
          style={{
            flexShrink: 0,
            background: '#F9F9F9',
            border: '1px solid #F0F0F0',
            borderRadius: 8,
            width: 48,
            height: 48,
            cursor: isLoading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: isLoading ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.borderColor = '#CC0000'; }}
          onMouseLeave={e => { if (!isLoading) e.currentTarget.style.borderColor = '#F0F0F0'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
            placeholder="Tulis pertanyaan Anda di sini..."
            disabled={isLoading}
            style={{
              width: '100%', fontSize: 15, fontFamily: 'inherit',
              padding: '14px 18px',
              border: '2px solid #F0F0F0', borderRadius: 8,
              outline: 'none', background: '#FFFFFF', color: '#1A1A1A',
              transition: 'all 0.2s',
              height: 48,
              fontWeight: 500,
            }}
            onFocus={e => e.target.style.borderColor = '#CC0000'}
            onBlur={e => e.target.style.borderColor = '#F0F0F0'}
          />
        </div>

        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          style={{
            flexShrink: 0,
            background: input.trim() && !isLoading ? '#CC0000' : '#EEE',
            border: 'none', borderRadius: 8,
            width: 48,
            height: 48,
            cursor: input.trim() && !isLoading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !isLoading ? '#fff' : '#bbb'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#BBB', paddingBottom: 24, margin: 0, fontWeight: 500 }}>
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
    </div>

  );
}
