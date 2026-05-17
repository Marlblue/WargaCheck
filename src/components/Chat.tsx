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
  const { isListening, startListening, stopListening, isPlaying, activeMessageId, speak, stopSpeaking } = useSpeech();
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
      maxWidth: 720, width: '100%', margin: '0 auto',
      height: 'calc(100dvh - 52px)',
      background: '#fff',
      position: 'relative',
    }}>

      {/* ── Chat Header ── */}
      {hasHistory && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(10px, 2.2vw, 12px) clamp(16px, 4vw, 20px)',
          borderBottom: '1px solid #F0F0F0',
          background: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC0000', opacity: 0.6 }} />
            <span style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: 600, color: '#6B6B6B', letterSpacing: '-0.01em' }}>
              {messages.length} pesan
            </span>
          </div>
          <button
            onClick={clearHistory}
            style={{
              fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: 500, color: '#999',
              background: '#fff', border: '1px solid #E8E8E8',
              borderRadius: 6, padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
              minHeight: 32,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#999'; }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M11.5 3.5l-.7 7.3a1 1 0 0 1-1 .9H4.2a1 1 0 0 1-1-.9L2.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Hapus riwayat
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 20px) clamp(8px, 2vw, 12px)',
          background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        {/* Empty state */}
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 'clamp(24px, 5vw, 32px)' }}
          >
            {/* Hero empty state */}
            <div style={{
              marginBottom: 'clamp(24px, 5vw, 32px)',
            }}>
              <h2 style={{
                fontSize: 'clamp(24px, 5.5vw, 28px)', fontWeight: 700,
                color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 clamp(8px, 2vw, 12px)',
              }}>
                Hai, ada yang bisa<br />
                <span style={{ color: '#CC0000' }}>dibantu?</span>
              </h2>
              <p style={{ fontSize: 'clamp(13px, 3vw, 14px)', color: '#6B6B6B', margin: 0, lineHeight: 1.6 }}>
                Tanya prosedur, syarat, atau checklist berkas dokumen kependudukan apa saja.
              </p>
            </div>

            <p style={{ fontSize: 'clamp(10px, 2.2vw, 11px)', color: '#CC0000', marginBottom: 'clamp(10px, 2vw, 12px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Pertanyaan Populer
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {QUICK_REPLIES.map((q, i) => (
                <button key={q} onClick={() => handleSend(q)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 2px',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #F0F0F0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s',
                  fontSize: 'clamp(13.5px, 3vw, 14.5px)', fontWeight: 400,
                  color: '#444',
                  letterSpacing: '-0.01em',
                  minHeight: 48,
                }}
                  onMouseEnter={e => { e.currentTarget.style.paddingLeft = '8px'; e.currentTarget.style.color = '#CC0000'; }}
                  onMouseLeave={e => { e.currentTarget.style.paddingLeft = '2px'; e.currentTarget.style.color = '#444'; }}
                >
                  <span style={{ fontSize: 'clamp(10px, 2vw, 11px)', fontWeight: 700, color: '#CC0000', opacity: 0.3, fontVariantNumeric: 'tabular-nums', width: 20 }}>
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: 'clamp(14px, 3vw, 16px)',
                }}
              >
                {/* AI avatar */}
                {!isUser && (
                  <div style={{ width: 'clamp(24px, 5vw, 28px)', flexShrink: 0, marginRight: 'clamp(8px, 2vw, 10px)', paddingTop: 'clamp(16px, 3.5vw, 18px)', display: 'flex', justifyContent: 'center' }}>
                    <FlagIcon width={22} />
                  </div>
                )}

                <div style={{ maxWidth: isUser ? '85%' : '80%' }}>
                  {/* Role label & Audio Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isUser ? 'flex-end' : 'space-between',
                    marginBottom: 'clamp(3px, 1vw, 4px)',
                  }}>
                    <div style={{
                      fontSize: 'clamp(10px, 2.2vw, 11px)', fontWeight: 600, color: '#999',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
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
                          color: (isPlaying && activeMessageId === msg.id) ? '#CC0000' : '#aaa',
                          transition: 'color 0.2s',
                        }}
                        title={(isPlaying && activeMessageId === msg.id) ? "Hentikan Suara" : "Dengarkan"}
                      >
                        {(isPlaying && activeMessageId === msg.id) ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12" />
                          </svg>
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
                  <div style={{
                    padding: isUser ? 'clamp(10px, 2.2vw, 12px) clamp(12px, 2.8vw, 14px)' : 'clamp(12px, 2.8vw, 14px) clamp(14px, 3.2vw, 16px)',
                    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: isUser ? 'linear-gradient(135deg, #CC0000 0%, #A30000 100%)' : '#fff',
                    color: isUser ? '#fff' : '#111',
                    fontSize: 'clamp(13px, 3vw, 14.5px)',
                    lineHeight: 1.65,
                    wordBreak: 'break-word',
                    boxShadow: isUser ? '0 2px 8px rgba(204, 0, 0, 0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
                    border: isUser ? 'none' : '1px solid #F0F0F0',
                  }}>
                    {isUser ? (
                      <span>{msg.text}</span>
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
                        gap: 'clamp(6px, 1.5vw, 8px)',
                        marginTop: 'clamp(8px, 2vw, 10px)',
                      }}
                    >
                      {msg.suggestions.map((suggestion, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSend(suggestion)}
                          disabled={isLoading}
                          style={{
                            fontSize: 'clamp(11px, 2.5vw, 12px)',
                            fontWeight: 500,
                            color: '#CC0000',
                            background: '#fff',
                            border: '1px solid #CC0000',
                            borderRadius: 9999,
                            padding: 'clamp(7px, 1.8vw, 8px) clamp(11px, 2.5vw, 12px)',
                            cursor: isLoading ? 'default' : 'pointer',
                            transition: 'all 0.15s',
                            opacity: isLoading ? 0.5 : 1,
                            minHeight: 32,
                          }}
                          onMouseEnter={e => {
                            if (!isLoading) {
                              e.currentTarget.style.background = '#CC0000';
                              e.currentTarget.style.color = '#fff';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isLoading) {
                              e.currentTarget.style.background = '#fff';
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
              style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16, gap: 10 }}
            >
              <div style={{ width: 28, flexShrink: 0, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                <FlagIcon />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  WargaCheck
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '4px 12px 12px 12px',
                  background: '#F7F7F7', display: 'inline-flex', alignItems: 'center', gap: 5,
                  width: 'fit-content',
                }}>
                  <span className="dot-1" style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', display: 'inline-block' }} />
                  <span className="dot-2" style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', display: 'inline-block' }} />
                  <span className="dot-3" style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', display: 'inline-block' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Streaming response */}
          {isStreaming && streamingText && (
            <motion.div key="streaming"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16, gap: 10 }}
            >
              <div style={{ width: 28, flexShrink: 0, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                <FlagIcon width={22} />
              </div>
              <div style={{ maxWidth: '80%' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  WargaCheck · sedang mengetik...
                </div>
                <div style={{
                  padding: '14px 16px', borderRadius: '4px 16px 16px 16px',
                  background: '#fff', color: '#111', fontSize: 'clamp(13.5px, 3vw, 14.5px)', lineHeight: 1.65,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #F0F0F0',
                }}>
                  <div className="md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                  </div>
                  <span style={{
                    display: 'inline-block',
                    width: 2,
                    height: 16,
                    background: '#CC0000',
                    marginLeft: 2,
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
        borderTop: '1px solid #E8E8E8',
        padding: 'clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 10px)',
      }}>
        {/* Document Scanner Button */}
        <button
          onClick={() => setShowScanner(true)}
          disabled={isLoading}
          title="Scan dokumen dengan AI"
          style={{
            flexShrink: 0,
            background: '#F7F7F7',
            border: 'none',
            borderRadius: 8,
            padding: 'clamp(10px, 2.2vw, 12px)',
            cursor: isLoading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
            opacity: isLoading ? 0.5 : 1,
            minWidth: 44,
            minHeight: 44,
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#E8E8E8'; }}
          onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#F7F7F7'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {/* Voice Input Button */}
        <button
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              startListening((text) => {
                setInput(prev => prev ? prev + ' ' + text : text);
              });
            }
          }}
          disabled={isLoading}
          title={isListening ? "Sedang mendengarkan..." : "Gunakan suara"}
          style={{
            flexShrink: 0,
            background: isListening ? '#FFEAEA' : '#F7F7F7',
            border: 'none',
            borderRadius: 8,
            padding: 'clamp(10px, 2.2vw, 12px)',
            cursor: isLoading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: isLoading ? 0.5 : 1,
            minWidth: 44,
            minHeight: 44,
            position: 'relative',
          }}
        >
          {isListening && (
            <span style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 24, height: 24, borderRadius: '50%', background: '#CC0000', opacity: 0.2,
              animation: 'micPulse 1.5s infinite',
            }} />
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isListening ? "#CC0000" : "none"} stroke={isListening ? "#CC0000" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ zIndex: 1 }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
          placeholder="Tanya prosedur, syarat, atau checklist berkas..."
          disabled={isLoading}
          style={{
            flex: 1, fontSize: 'clamp(13px, 3vw, 14px)', fontFamily: 'Inter, sans-serif',
            padding: 'clamp(11px, 2.5vw, 13px) clamp(12px, 2.8vw, 14px)',
            border: '1.5px solid #E8E8E8', borderRadius: 8,
            outline: 'none', background: '#fff', color: '#111',
            transition: 'border-color 0.15s',
            minHeight: 44,
          }}
          onFocus={e => e.target.style.borderColor = '#CC0000'}
          onBlur={e => e.target.style.borderColor = '#E8E8E8'}
        />

        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          style={{
            flexShrink: 0,
            background: input.trim() && !isLoading ? '#CC0000' : '#E8E8E8',
            border: 'none', borderRadius: 8,
            padding: 'clamp(10px, 2.2vw, 12px) clamp(14px, 3.2vw, 16px)',
            cursor: input.trim() && !isLoading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
            minWidth: 44,
            minHeight: 44,
          }}
          onMouseEnter={e => { if (input.trim() && !isLoading) e.currentTarget.style.background = '#A30000'; }}
          onMouseLeave={e => { if (input.trim() && !isLoading) e.currentTarget.style.background = '#CC0000'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !isLoading ? '#fff' : '#bbb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: 'clamp(10px, 2.2vw, 11px)', color: '#ccc', padding: 'clamp(6px, 1.5vw, 8px) clamp(20px, 5vw, 24px) clamp(12px, 3vw, 14px)', margin: 0 }}>
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
