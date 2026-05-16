/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import WelcomeContent from './components/WelcomeContent';
import Chat from './components/Chat';
import BerkasChecker from './components/BerkasChecker';
import FlagIcon from './components/shared/FlagIcon';

type View = 'welcome' | 'chat' | 'berkas';

export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const startChat = useCallback((prompt?: string) => {
    setInitialPrompt(prompt);
    setView('chat');
    // Scroll to top on view change
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
      background: view === 'welcome' ? 'transparent' : '#fff', 
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── Navbar ── */}
      <motion.header
        initial={false}
        animate={{
          boxShadow: isScrolled ? '0 2px 8px rgba(0,0,0,0.06)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'sticky', 
          top: 0, 
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid #E8E8E8',
          padding: '0 clamp(16px, 4vw, 24px)',
          height: 'clamp(48px, 10vw, 52px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <motion.button 
          onClick={goHome}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'clamp(8px, 2vw, 10px)', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: 0, 
            minHeight: 44,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <FlagIcon width={26} />
          <span style={{ fontWeight: 700, fontSize: 'clamp(14px, 3.2vw, 15px)', letterSpacing: '-0.03em', color: '#111' }}>
            WargaCheck
          </span>
        </motion.button>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)' }}>
          {/* Status */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#999', fontWeight: 500 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e', display: 'inline-block',
            }} />
            <span className="status-text" style={{ display: 'none' }}>Online</span>
          </span>

          <AnimatePresence mode="wait">
            {view !== 'welcome' ? (
              <motion.button
                key="home-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={goHome}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontSize: 'clamp(11px, 2.5vw, 12px)', 
                  fontWeight: 500, 
                  color: '#6B6B6B',
                  background: 'none', 
                  border: '1px solid #E8E8E8', 
                  borderRadius: 6,
                  padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)', 
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  minHeight: 36,
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.borderColor = '#CC0000'; 
                  e.currentTarget.style.color = '#CC0000'; 
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.borderColor = '#E8E8E8'; 
                  e.currentTarget.style.color = '#6B6B6B'; 
                }}
              >
                Beranda
              </motion.button>
            ) : (
              <motion.button
                key="consult-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={() => startChat()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontSize: 'clamp(12px, 2.8vw, 13px)', 
                  fontWeight: 600, 
                  color: '#fff',
                  background: '#CC0000',
                  border: 'none', 
                  borderRadius: 6,
                  padding: 'clamp(7px, 1.8vw, 9px) clamp(14px, 3.2vw, 16px)', 
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  minHeight: 36,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#A30000'}
                onMouseLeave={e => e.currentTarget.style.background = '#CC0000'}
              >
                Konsultasi
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* ── Main ── */}
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
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
              }}
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
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
              }}
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
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
              }}
            >
              <BerkasChecker onBack={goHome} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
