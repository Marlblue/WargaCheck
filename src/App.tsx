/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from './hooks/useTheme';
import WelcomeContent from './components/WelcomeContent';
import Chat from './components/Chat';
import BerkasChecker from './components/BerkasChecker';
import LogoIcon from './components/shared/LogoIcon';

type View = 'welcome' | 'chat' | 'berkas';

export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const { theme, toggleTheme } = useTheme();

  const startChat = useCallback((prompt?: string) => {
    setInitialPrompt(prompt);
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

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      fontFamily: 'var(--font)',
      transition: 'background 0.3s ease',
    }}>

      {/* ── Floating Pill Navbar ── */}
      <nav className="navbar" style={{ marginBottom: view === 'welcome' ? 0 : 8 }}>
        <div className="navbar-inner">
          {/* Logo */}
          <button className="nav-logo" onClick={goHome}>
            <LogoIcon size={24} />
            <span>WargaCheck</span>
          </button>

          {/* Actions */}
          <div className="nav-actions">
            {/* Status dot */}
            <span className="status-dot" style={{ marginRight: 4 }} />

            {/* Theme toggle */}
            <button className="nav-btn-icon" onClick={toggleTheme} title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                >
                  Konsultasi
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
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
              <WelcomeContent onQuickTopic={startChat} onOpenBerkasChecker={openBerkasChecker} />
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
              <Chat initialMessage={initialPrompt} onBack={goHome} />
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
              <BerkasChecker onBack={goHome} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
