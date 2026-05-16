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
          background: (view === 'welcome' && !isScrolled) ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.96)',
          backdropFilter: (view === 'welcome' && !isScrolled) ? 'blur(0px)' : 'blur(16px)',
          WebkitBackdropFilter: (view === 'welcome' && !isScrolled) ? 'blur(0px)' : 'blur(16px)',
          borderBottomColor: (view === 'welcome' && !isScrolled) ? 'rgba(0,0,0,0)' : '#F0F0F0',
          boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.03)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          position: 'fixed', 
          top: 0, 
          left: 0,
          right: 0,
          zIndex: 100,
          borderBottom: '1px solid transparent',
          padding: '0 var(--px, 24px)',
          height: 'clamp(64px, 8vw, 80px)',
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
            gap: 12, 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: 0, 
          }}
        >
          <FlagIcon width={30} />
          <span style={{ 
            fontWeight: 900, 
            fontSize: 'clamp(18px, 2.5vw, 22px)', 
            letterSpacing: '-0.04em', 
            color: '#1A1A1A',
            textTransform: 'lowercase'
          }}>
            wargacheck<span style={{ color: '#CC0000' }}>.</span>
          </span>
        </motion.button>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AnimatePresence mode="wait">
            {view !== 'welcome' ? (
              <motion.button
                key="home-btn"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={goHome}
                style={{
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: '#1A1A1A',
                  background: 'none', 
                  border: 'none', 
                  padding: '8px 16px', 
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                Beranda
              </motion.button>
            ) : null}
          </AnimatePresence>

          <motion.button
            onClick={() => (view === 'chat' ? goHome() : startChat())}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              fontSize: 12, 
              fontWeight: 800, 
              color: '#fff',
              background: '#CC0000',
              border: 'none', 
              borderRadius: 4,
              padding: '12px 24px', 
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              boxShadow: '0 4px 12px rgba(204,0,0,0.15)'
            }}
          >
            {view === 'chat' ? 'Tutup Chat' : 'Konsultasi'}
          </motion.button>
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
