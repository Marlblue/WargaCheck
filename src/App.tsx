/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import WelcomeContent from './components/WelcomeContent';
import Chat from './components/Chat';
import BerkasChecker from './components/BerkasChecker';
import FlagIcon from './components/shared/FlagIcon';

type View = 'welcome' | 'chat' | 'berkas';

export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  const startChat = (prompt?: string) => {
    setInitialPrompt(prompt);
    setView('chat');
  };

  const goHome = () => {
    setView('welcome');
    setInitialPrompt(undefined);
  };

  const openBerkasChecker = () => {
    setView('berkas');
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff',
        borderBottom: '1px solid #E8E8E8',
        padding: '0 24px',
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <FlagIcon width={26} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em', color: '#111' }}>
            WargaCheck
          </span>
        </button>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#999', fontWeight: 500 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e', display: 'inline-block',
            }} />
            Online
          </span>

          {view !== 'welcome' && (
            <button onClick={goHome} style={{
              fontSize: 12, fontWeight: 500, color: '#6B6B6B',
              background: 'none', border: '1px solid #E8E8E8', borderRadius: 6,
              padding: '5px 12px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#6B6B6B'; }}
            >
              Beranda
            </button>
          )}

          {view === 'welcome' && (
            <button onClick={() => startChat()} style={{
              fontSize: 13, fontWeight: 600, color: '#fff',
              background: '#CC0000',
              border: 'none', borderRadius: 6,
              padding: '6px 16px', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#A30000'}
              onMouseLeave={e => e.currentTarget.style.background = '#CC0000'}
            >
              Konsultasi
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {view === 'welcome' ? (
            <motion.div key="welcome"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <WelcomeContent onQuickTopic={startChat} onOpenBerkasChecker={openBerkasChecker} />
            </motion.div>
          ) : view === 'chat' ? (
            <motion.div key="chat"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Chat initialMessage={initialPrompt} onBack={goHome} />
            </motion.div>
          ) : (
            <motion.div key="berkas"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <BerkasChecker onBack={goHome} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
