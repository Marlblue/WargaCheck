import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const slides = [
  {
    image: '/images/pain-dokumen-kurang.png',
    caption: 'Dokumen kurang satu saat di loket',
    sub: 'Sudah antre lama, ternyata ada berkas yang ketinggalan.',
  },
  {
    image: '/images/pain-antre-lama.png',
    caption: 'Antre berjam-jam tanpa kepastian',
    sub: 'Waktu terbuang karena harus balik lagi ke kantor lain.',
  },
  {
    image: '/images/pain-bingung-mulai.png',
    caption: 'Bingung harus mulai dari mana',
    sub: 'Informasi simpang siur, tidak tahu persyaratan lengkapnya.',
  },
];

const DURATION = 5000;
const SWIPE_THRESHOLD = 50;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(Date.now());

  // Touch tracking
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const goToSlide = useCallback((index: number, dir?: number) => {
    setDirection(dir ?? (index > current ? 1 : -1));
    setCurrent(index);
    setProgress(0);
    startRef.current = Date.now();
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(c => (c + 1) % slides.length);
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(c => (c - 1 + slides.length) % slides.length);
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

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = true;
    setPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swipe left → next
        next();
      } else {
        // Swipe right → prev
        prev();
      }
    }
    setPaused(false);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-30%' : '30%',
      opacity: 0,
    }),
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ userSelect: 'none', position: 'relative' }}
    >
      {/* Image container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          aspectRatio: '4/3',
          background: '#f7f7f7',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.img
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            src={slides[current].image}
            alt={slides[current].caption}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            draggable={false}
          />
        </AnimatePresence>

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '55%',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
          pointerEvents: 'none',
        }} />

        {/* Caption overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '20px',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`caption-${current}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <p style={{
                color: '#fff',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: 700,
                margin: '0 0 3px',
                letterSpacing: '-0.02em',
                textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}>
                {slides[current].caption}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 'clamp(12px, 2vw, 13px)',
                fontWeight: 400,
                margin: 0,
                lineHeight: 1.5,
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}>
                {slides[current].sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide counter */}
        <div style={{
          position: 'absolute',
          top: 14, right: 14,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {current + 1}/{slides.length}
        </div>

        {/* Desktop nav arrows */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            opacity: 0.7, transition: 'opacity 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          className="slider-arrow"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            opacity: 0.7, transition: 'opacity 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          className="slider-arrow"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Progress bars */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 12,
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              flex: 1,
              height: 3,
              background: '#E8E8E8',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
              background: '#CC0000',
              borderRadius: 2,
              transition: i === current ? 'none' : 'width 0.3s ease',
            }} />
          </button>
        ))}
      </div>

      {/* Swipe hint (mobile only) */}
      <p className="swipe-hint" style={{
        textAlign: 'center',
        fontSize: 11,
        color: '#bbb',
        margin: '8px 0 0',
        display: 'none',
      }}>
        ← Geser untuk slide lainnya →
      </p>
    </div>
  );
}
