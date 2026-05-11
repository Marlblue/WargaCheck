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

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
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
  }, [messages, isLoading]);

  const handleSend = useCallback(async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessage(text, history);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response || 'Maaf, saya sedang mengalami kendala. Bisa diulangi?',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Sepertinya ada masalah koneksi. Coba lagi sebentar.';
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

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
    }}>

      {/* ── Chat Header ── */}
      {hasHistory && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: '1px solid #F0F0F0',
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#999', letterSpacing: '-0.01em' }}>
            {messages.length} pesan
          </span>
          <button
            onClick={clearHistory}
            style={{
              fontSize: 12, fontWeight: 500, color: '#999',
              background: 'none', border: '1px solid #E8E8E8',
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#999'; }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M11.5 3.5l-.7 7.3a1 1 0 0 1-1 .9H4.2a1 1 0 0 1-1-.9L2.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Hapus riwayat
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>

        {/* Empty state */}
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: 32 }}
          >
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Ada yang bisa dibantu?
              </h3>
              <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.5 }}>
                Tanya prosedur, syarat, atau checklist berkas apa saja.
              </p>
            </div>

            <p style={{ fontSize: 11, color: '#bbb', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pertanyaan populer
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => handleSend(q)} style={{
                  fontSize: 14, fontWeight: 400,
                  padding: '11px 0',
                  background: 'none', border: 'none',
                  borderBottom: '1px solid #F0F0F0',
                  color: '#333', cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color 0.12s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#CC0000'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#333'; }}
                >
                  {q}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'inherit', opacity: 0.5 }}>
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
                  marginBottom: 16,
                }}
              >
                {/* AI avatar */}
                {!isUser && (
                  <div style={{ width: 28, flexShrink: 0, marginRight: 10, paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                    <FlagIcon />
                  </div>
                )}

                <div style={{ maxWidth: '78%' }}>
                  {/* Role label */}
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: '#999',
                    marginBottom: 4,
                    textAlign: isUser ? 'right' : 'left',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {isUser ? 'Anda' : 'WargaCheck'} · {fmt(msg.timestamp)}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    padding: isUser ? '10px 14px' : '14px 16px',
                    borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    background: isUser ? '#CC0000' : '#F7F7F7',
                    color: isUser ? '#fff' : '#111',
                    fontSize: 14,
                    lineHeight: 1.65,
                    wordBreak: 'break-word',
                  }}>
                    {isUser ? (
                      <span>{msg.text}</span>
                    ) : (
                      <div className="md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
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
                  background: '#F7F7F7', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span className="dot-1" style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', display: 'inline-block' }} />
                  <span className="dot-2" style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', display: 'inline-block' }} />
                  <span className="dot-3" style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', display: 'inline-block' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input bar ── */}
      <div style={{
        borderTop: '1px solid #E8E8E8',
        padding: '14px 20px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
          placeholder="Tanya prosedur, syarat, atau checklist berkas..."
          disabled={isLoading}
          style={{
            flex: 1, fontSize: 14, fontFamily: 'Inter, sans-serif',
            padding: '10px 14px',
            border: '1.5px solid #E8E8E8', borderRadius: 8,
            outline: 'none', background: '#fff', color: '#111',
            transition: 'border-color 0.15s',
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
            padding: '10px 16px',
            cursor: input.trim() && !isLoading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (input.trim() && !isLoading) e.currentTarget.style.background = '#A30000'; }}
          onMouseLeave={e => { if (input.trim() && !isLoading) e.currentTarget.style.background = '#CC0000'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !isLoading ? '#fff' : '#bbb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', padding: '6px 24px 14px', margin: 0 }}>
        Informasi bersifat umum — konfirmasi ke instansi resmi setempat untuk kepastian.
      </p>
    </div>
  );
}
