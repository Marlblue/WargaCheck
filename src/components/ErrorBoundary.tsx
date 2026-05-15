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
          justifyContent: 'center', minHeight: '100dvh', padding: 'clamp(24px, 6vw, 32px)',
          fontFamily: 'Inter, sans-serif', textAlign: 'center',
        }}>
          <div style={{
            width: 'clamp(44px, 10vw, 48px)', height: 'clamp(44px, 10vw, 48px)', borderRadius: 'clamp(10px, 2.5vw, 12px)',
            background: '#FFF0F0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 'clamp(16px, 4vw, 20px)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 700, color: '#111', margin: '0 0 clamp(6px, 1.5vw, 8px)', letterSpacing: '-0.02em' }}>
            Terjadi Kesalahan
          </h2>
          <p style={{ fontSize: 'clamp(13px, 3vw, 14px)', color: '#6B6B6B', margin: '0 0 clamp(20px, 5vw, 24px)', maxWidth: 360, lineHeight: 1.6 }}>
            Aplikasi mengalami error. Silakan muat ulang halaman untuk melanjutkan.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              fontSize: 'clamp(13px, 3vw, 14px)', fontWeight: 600, color: '#fff',
              background: '#CC0000', border: 'none', borderRadius: 8,
              padding: 'clamp(11px, 2.5vw, 13px) clamp(20px, 5vw, 24px)', cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
