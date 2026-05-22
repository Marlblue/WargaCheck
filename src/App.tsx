/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from './hooks/useTheme';
import WelcomeContent from './components/WelcomeContent';
import LogoIcon from './components/shared/LogoIcon';

// Lazy load heavy components for better initial load performance
const Chat = lazy(() => import('./components/Chat'));
const BerkasChecker = lazy(() => import('./components/BerkasChecker'));
const DocumentScanner = lazy(() => import('./components/DocumentScanner'));

type View = 'welcome' | 'chat' | 'berkas';

/** Skeleton fallback for lazy-loaded components */
function LoadingFallback() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      maxWidth: 760, width: '100%', margin: '0 auto', padding: '24px 16px',
    }}>
      {/* Skeleton header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          <div className="skeleton skeleton-text" style={{ width: '25%', height: 10 }} />
        </div>
      </div>
      {/* Skeleton messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ alignSelf: 'flex-end', width: '60%' }}>
          <div className="skeleton" style={{ height: 44, borderRadius: 'var(--r-lg)' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, width: '75%' }}>
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const [showScanner, setShowScanner] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startChat = useCallback((prompt?: string) => {
    setInitialPrompt(prompt || undefined);
    setView('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goHome = useCallback(() => {
    setView('welcome');
    setInitialPrompt(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openBerkasChecker = useCallback(() => {
    setView('berkas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openScanner = useCallback(() => {
    setShowScanner(true);
  }, []);

  const handleScanComplete = useCallback((result: string) => {
    setShowScanner(false);
    // Small delay for modal close animation to complete
    setTimeout(() => {
      setInitialPrompt(`Saya sudah scan dokumen. Hasil scan:\n\n${result}\n\nTolong bantu saya lanjutkan prosesnya.`);
      setView('chat');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      fontFamily: 'var(--font)',
      transition: 'background 0.3s ease',
    }}>

      {/* Skip to content for accessibility */}
      <a href="#main-content" className="skip-link">Langsung ke konten utama</a>

      {/* ── Floating Pill Navbar ── */}
      <nav className="navbar" role="navigation" aria-label="Navigasi utama" style={{ marginBottom: view === 'welcome' ? 0 : 8 }}>
        <motion.div
          className="navbar-inner"
          initial={{ width: 120, opacity: 0 }}
          animate={{
            width: '100%',
            opacity: 1,
            transitionEnd: { overflow: 'unset' }
          }}
          transition={{
            width: { type: 'spring', stiffness: 90, damping: 16, delay: 0.15 },
            opacity: { duration: 0.35, delay: 0.15 }
          }}
          style={{ overflow: 'hidden', display: 'flex' }}
        >
          {/* Logo */}
          <motion.button
            className="nav-logo"
            onClick={goHome}
            aria-label="Kembali ke beranda WargaCheck"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.25 }}
          >
            <LogoIcon size={24} />
            <span>WargaCheck</span>
          </motion.button>

          {/* Actions */}
          <motion.div
            className="nav-actions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.25 }}
          >
            {/* Status dot */}
            <span className={`status-dot ${isOffline ? 'offline' : ''}`} style={{ marginRight: 4 }} aria-label={isOffline ? "Status: offline" : "Status: online"} role="status" />

            {/* Theme toggle */}
            <button
              className="nav-btn-icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <AnimatePresence mode="wait">
              {view !== 'welcome' ? (
                <motion.button
                  key="home-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="nav-btn nav-btn-ghost"
                  onClick={goHome}
                  aria-label="Kembali ke beranda"
                >
                  ← Beranda
                </motion.button>
              ) : (
                <motion.button
                  key="consult-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="nav-btn nav-btn-primary"
                  onClick={() => startChat()}
                  aria-label="Mulai konsultasi AI"
                >
                  Konsultasi
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </nav>

      {/* ── Main Content ── */}
      <main id="main-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }} role="main">
        <AnimatePresence mode="wait">
          {view === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <WelcomeContent
                onQuickTopic={startChat}
                onOpenBerkasChecker={openBerkasChecker}
                onOpenScanner={openScanner}
              />
            </motion.div>
          ) : view === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Chat initialMessage={initialPrompt} onBack={goHome} onOpenScanner={openScanner} />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="berkas"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <BerkasChecker onBack={goHome} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── App-level Document Scanner Modal ── */}
      <AnimatePresence>
        {showScanner && (
          <Suspense fallback={null}>
            <DocumentScanner
              onClose={() => setShowScanner(false)}
              onScanComplete={handleScanComplete}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ── Offline Banner ── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
              background: '#EF4444', color: 'white', padding: '12px 24px',
              borderRadius: '9999px', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', zIndex: 9999,
              maxWidth: '90vw', textAlign: 'center'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            Koneksi Terputus. AI tidak dapat memproses saat ini.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
