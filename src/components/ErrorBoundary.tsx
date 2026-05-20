import React from 'react';

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100dvh', padding: 32,
          fontFamily: 'var(--font)', textAlign: 'center',
          background: 'var(--bg)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--r-md)',
            background: 'var(--primary-soft)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 20,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Terjadi Kesalahan
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px', maxWidth: 360, lineHeight: 1.6 }}>
            Aplikasi mengalami error. Silakan muat ulang halaman untuk melanjutkan.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="btn btn-outline"
            >
              Coba Muat Ulang
            </button>
            <button
              onClick={() => { 
                localStorage.removeItem('wargacheck_history'); // Bersihkan state chat yang mungkin korup
                this.setState({ hasError: false }); 
                window.location.reload(); 
              }}
              className="btn btn-primary"
            >
              Reset Data & Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
