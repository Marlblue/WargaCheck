import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ── Relatable pain points ── */
const painPoints = [
  'Pernah datang ke Dukcapil, ternyata dokumen kurang satu?',
  'Pernah antre 2 jam, ternyata harus ke kelurahan dulu?',
  'Pernah bingung harus mulai dari mana?',
  'Pernah bolak-balik kantor karena info gak jelas?',
];

const DURATION = 4000;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(Date.now());

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % painPoints.length);
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (paused) return;
    startRef.current = Date.now() - (progress / 100) * DURATION;

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) next();
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [paused, current, next]);

  const goTo = (i: number) => {
    setCurrent(i);
    setProgress(0);
    startRef.current = Date.now();
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ userSelect: 'none' }}
    >
      {/* ── Solution headline (static) ── */}
      <h1 style={{
        fontSize: 'clamp(22px, 4.5vw, 30px)',
        fontWeight: 800,
        color: '#111',
        letterSpacing: '-0.035em',
        lineHeight: 1.2,
        margin: '0 0 24px',
      }}>
        Tahu dokumen apa saja yang perlu dibawa,{' '}
        <span style={{ color: '#CC0000' }}>sebelum berangkat.</span>
      </h1>

      {/* ── Rotating pain point ── */}
      <div style={{ minHeight: 52, marginBottom: 8 }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 'clamp(15px, 2.5vw, 17px)',
              color: '#6B6B6B',
              fontWeight: 500,
              lineHeight: 1.55,
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            "{painPoints[current]}"
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Tagline ── */}
      <p style={{
        fontSize: 14,
        color: '#999',
        margin: '0 0 4px',
        lineHeight: 1.6,
      }}>
        WargaCheck bantu kamu siap lengkap — biar gak perlu bolak-balik.
      </p>

      {/* ── Progress bars ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        marginTop: 20,
      }}>
        {painPoints.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              flex: 1,
              height: 2,
              background: '#E8E8E8',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
              background: '#CC0000',
              transition: i === current ? 'none' : 'width 0.3s ease',
            }} />
          </button>
        ))}
      </div>
    </div>
  );
}
