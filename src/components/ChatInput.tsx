import { forwardRef } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string | ((prev: string) => string)) => void;
  isLoading: boolean;
  onSend: (text: string) => void;
  onOpenScanner: () => void;
  isSupported: boolean;
  isListening: boolean;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({
  input, setInput, isLoading, onSend, onOpenScanner,
  isSupported, isListening, startListening, stopListening
}, ref) => {
  const handleSend = () => {
    onSend(input);
    if (ref && 'current' in ref && ref.current) {
      ref.current.style.height = 'auto';
    }
  };

  return (
    <div className="chat-input-bar" role="form" aria-label="Kirim pertanyaan">
      {/* Doc Scanner */}
      <button className="chat-icon-btn" onClick={onOpenScanner} disabled={isLoading} aria-label="Scan dokumen dengan kamera" title="Scan dokumen" style={{ opacity: isLoading ? 0.5 : 1 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {/* Voice */}
      {isSupported && (
        <button
          className="chat-icon-btn"
          onClick={() => {
            if (isListening) { stopListening(); }
            else {
              startListening((text) => {
                setInput(prev => prev ? prev + ' ' + text : text);
                // Flash the input to indicate voice text was added
                if (ref && 'current' in ref && ref.current) {
                  ref.current.style.borderColor = '#22c55e';
                  setTimeout(() => {
                    if (ref && 'current' in ref && ref.current) ref.current.style.borderColor = '';
                  }, 1000);
                }
              });
            }
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
      )}

      <textarea
        ref={ref}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Tanya prosedur"
        disabled={isLoading}
        className="chat-input"
        aria-label="Ketik pertanyaan tentang dokumen kependudukan"
        rows={1}
        style={{ resize: 'none', overflow: 'hidden' }}
        onInput={e => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = Math.min(target.scrollHeight, 120) + 'px';
        }}
      />

      <button
        className="chat-send-btn"
        onClick={handleSend}
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
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
