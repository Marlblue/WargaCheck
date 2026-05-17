/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';

interface WelcomeContentProps {
  onQuickTopic: (topic: string) => void;
  onOpenBerkasChecker: () => void;
}

const GLOBAL_STYLE = `
  :root {
    --px: clamp(20px, 5vw, 80px);
    --section-py: clamp(56px, 8vw, 104px);
  }
  * { box-sizing: border-box; }
  @media (max-width: 640px) {
    .hero-stats { gap: 24px !important; }
    .persona-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
    .how-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .links-grid { grid-template-columns: 1fr !important; }
    .link-item { border-right: none !important; padding-left: 0 !important; border-bottom: 1px solid #E8E8E8 !important; padding-bottom: 20px !important; }
    .topic-tag { display: none !important; }
    .footer-inner { flex-direction: column !important; align-items: flex-start !important; }
    .footer-disclaimer { text-align: left !important; }
  }
`;

const topics = [
  { label: 'KTP Elektronik', tag: 'Identitas', prompt: 'Saya mau urus KTP elektronik. Tolong buatkan checklist lengkap dokumen yang dibutuhkan dan jelaskan langkah-langkahnya.' },
  { label: 'Kartu Keluarga', tag: 'Keluarga', prompt: 'Saya mau tambah anggota keluarga di Kartu Keluarga. Apa saja syaratnya dan prosedurnya bagaimana?' },
  { label: 'Akta Kelahiran', tag: 'Catatan Sipil', prompt: 'Saya mau buat akta kelahiran untuk anak baru lahir. Apa saja dokumen yang perlu disiapkan dan ke mana harus datang?' },
  { label: 'Surat Pindah', tag: 'Domisili', prompt: 'Saya baru pindah domisili ke kota lain. Jelaskan prosedur surat pindah dari awal sampai selesai.' },
  { label: 'SKCK', tag: 'Kepolisian', prompt: 'Saya perlu membuat SKCK untuk keperluan lamaran kerja. Apa syaratnya, berapa biayanya, dan bagaimana prosedurnya?' },
  { label: 'Akta Perkawinan', tag: 'Catatan Sipil', prompt: 'Saya baru menikah dan perlu mengurus akta perkawinan di Dukcapil. Apa saja dokumen yang diperlukan?' },
];

const personas = [
  { label: 'Mahasiswa Rantau', detail: 'KTP, KK, surat pindah untuk kuliah di kota lain', prompt: 'Saya mahasiswa yang baru pindah ke kota lain untuk kuliah. Dokumen apa saja yang perlu saya urus?', num: '01' },
  { label: 'Pekerja Profesional', detail: 'SKCK, akta nikah, dokumen untuk melamar kerja', prompt: 'Saya perlu membuat SKCK dan dokumen lain untuk melamar kerja. Apa saja yang harus disiapkan?', num: '02' },
  { label: 'Ibu Rumah Tangga', detail: 'Akta lahir anak, KK, dokumen keluarga', prompt: 'Saya baru melahirkan dan perlu mengurus akta kelahiran anak. Bagaimana prosedurnya?', num: '03' },
];

const officialLinks = [
  { label: 'Dukcapil Kemendagri', desc: 'Portal resmi Dirjen Kependudukan dan Pencatatan Sipil', url: 'https://www.dukcapil.kemendagri.go.id/' },
  { label: 'Layanan Online Dukcapil', desc: 'Akses layanan dokumen secara online tanpa antre', url: 'https://layanandukcapil.kemendagri.go.id/' },
  { label: 'SAPA Dukcapil', desc: 'Pengaduan dan konsultasi informasi kependudukan', url: 'https://sapa.dukcapil.kemendagri.go.id/' },
];

// Unsplash photos — civic / urban Indonesia feel
// 1. Government building / civic hall
// 2. People walking in city
// 3. Document / paperwork
const HERO_IMAGE = 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=1800&q=85&auto=format&fit=crop';
// fallback: wide shot of Indonesian city street
const HERO_IMAGE_ALT = 'https://images.unsplash.com/photo-1581579186913-45ac9e9a4d53?w=1800&q=85&auto=format&fit=crop';

const sectionPad: React.CSSProperties = {
  paddingTop: 'var(--section-py)',
  paddingBottom: 'var(--section-py)',
  paddingLeft: 'var(--px)',
  paddingRight: 'var(--px)',
};

export default function WelcomeContent({ onQuickTopic, onOpenBerkasChecker }: WelcomeContentProps) {
  const [hoveredTopic, setHoveredTopic] = useState<number | null>(null);
  const [hoveredPersona, setHoveredPersona] = useState<number | null>(null);
  const [imgSrc, setImgSrc] = useState(HERO_IMAGE);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);

  return (
    <div style={{ background: '#FAFAFA', color: '#111', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <style>{GLOBAL_STYLE}</style>

      {/* ─── HERO — full viewport with parallax photo ─── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          height: '85svh',
          minHeight: 500,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* ── Red vertical accent line ── */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: 'clamp(20px, 3.5vw, 48px)',
            top: '15%', bottom: '12%', width: 1,
            background: '#CC0000',
            transformOrigin: 'top', zIndex: 3,
          }}
        />

        {/* ── Inline nav — clean ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            padding: 'clamp(20px, 3vw, 28px) var(--px)',
            paddingLeft: 'clamp(44px, 6.5vw, 88px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent',
          }}
        >

        </motion.div>

        {/* ── Hero text content ── */}
        <motion.div
          className="hero-content"
          style={{
            opacity: heroOpacity, y: heroY,
            position: 'relative', zIndex: 5,
            paddingLeft: 'clamp(44px, 6.5vw, 88px)',
            paddingRight: 'var(--px)',
            paddingBottom: 'clamp(44px, 6vw, 72px)',
          }}
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif', color: '#CC0000',
              margin: '0 0 clamp(14px, 2.5vw, 24px)', fontWeight: 600,
            }}
          >

          </motion.p>

          {/* Headline — 3-line mask reveal */}
          {(['Tahu dokumen', 'apa yang dibawa,', 'sebelum berangkat.'] as const).map((line, i) => (
            <div key={line} style={{
              overflow: 'hidden',
              fontSize: 'clamp(36px, 7.5vw, 90px)',
              paddingBottom: '0.2em',
              marginBottom: i < 2 ? '-0.2em' : 'clamp(28px, 4.5vw, 48px)'
            }}>
              <motion.h1
                initial={{ y: '120%' }}
                animate={{ y: 0 }}
                transition={{ delay: 0.8 + i * 0.11, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: 'inherit',
                  fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', margin: 0,
                  color: i === 2 ? '#CC0000' : '#111',
                  fontStyle: i === 1 ? 'italic' : 'normal',
                }}
              >
                {line}
              </motion.h1>
            </div>
          ))}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.6 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 'clamp(28px, 4vw, 44px)' }}
          >
            <button
              onClick={() => onQuickTopic('')}
              style={{
                background: '#CC0000', color: '#fff', border: 'none',
                padding: 'clamp(11px, 1.8vw, 15px) clamp(20px, 3vw, 36px)',
                borderRadius: 2, cursor: 'pointer',
                fontSize: 'clamp(12px, 1.3vw, 14px)', letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif', fontWeight: 700,
                transition: 'background 0.18s, transform 0.18s',
                boxShadow: '0 4px 24px rgba(200,0,0,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#A80000'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#CC0000'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Mulai Konsultasi
            </button>
            <button
              onClick={onOpenBerkasChecker}
              style={{
                background: '#fff',
                color: '#111',
                border: '1px solid #E8E8E8',
                padding: 'clamp(11px, 1.8vw, 15px) clamp(20px, 3vw, 36px)',
                borderRadius: 2, cursor: 'pointer',
                fontSize: 'clamp(12px, 1.3vw, 14px)', letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              Cek Kelengkapan Berkas
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.45, duration: 0.7 }}
            style={{ display: 'flex', gap: 'clamp(24px, 5vw, 52px)', flexWrap: 'wrap' }}
          >
            {[
              { v: '10+', l: 'Jenis dokumen' },
              { v: 'AI', l: 'Powered by Gemini' },
              { v: '24/7', l: 'Selalu tersedia' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 'clamp(20px, 2.8vw, 26px)', fontWeight: 400, color: '#111', letterSpacing: '-0.025em', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── TOPICS ─── */}
      <section style={{ ...sectionPad, background: '#fff', color: '#1A1A1A', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'clamp(24px, 4vw, 44px)' }}>
            <span style={{ fontSize: 10, color: '#CC0000', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Pilih Topik
            </span>
            <div style={{ flex: 1, height: '0.5px', background: '#E8E8E8' }} />
          </div>

          {topics.map((t, i) => (
            <motion.button
              key={t.label}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.055, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onQuickTopic(t.prompt)}
              onMouseEnter={() => setHoveredTopic(i)}
              onMouseLeave={() => setHoveredTopic(null)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: 'clamp(14px, 2.2vw, 20px) 0',
                background: 'none', border: 'none', borderBottom: '1px solid #F0F0F0',
                cursor: 'pointer', textAlign: 'left',
                transition: 'padding-left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                paddingLeft: hoveredTopic === i ? 10 : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(8px, 2vw, 20px)', minWidth: 0 }}>
                <span
                  className="topic-tag"
                  style={{
                    fontSize: 10, color: hoveredTopic === i ? '#CC0000' : 'rgba(0,0,0,0.3)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontFamily: 'Inter, sans-serif', fontWeight: 700,
                    transition: 'color 0.18s', flexShrink: 0, width: 88,
                  }}
                >
                  {t.tag}
                </span>
                <span style={{
                  fontSize: 'clamp(19px, 3.2vw, 32px)',
                  fontWeight: 400, letterSpacing: '-0.025em',
                  color: hoveredTopic === i ? '#CC0000' : '#444',
                  transition: 'color 0.18s', lineHeight: 1.15,
                }}>
                  {t.label}
                </span>
              </div>
              <motion.svg
                width="17" height="17" viewBox="0 0 20 20" fill="none"
                animate={{ x: hoveredTopic === i ? 5 : 0, opacity: hoveredTopic === i ? 1 : 0.22 }}
                transition={{ duration: 0.18 }}
                style={{ color: '#CC0000', flexShrink: 0, marginLeft: 12 }}
              >
                <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── PERSONAS ─── */}
      <section style={{ ...sectionPad, background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'clamp(24px, 4vw, 52px)' }}>
            <span style={{ fontSize: 10, color: '#CC0000', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Situasi Kamu
            </span>
            <div style={{ flex: 1, height: '0.5px', background: '#E8E8E8' }} />
          </div>

          <div
            className="persona-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', borderRadius: 2, overflow: 'hidden' }}
          >
            {personas.map((p, i) => (
              <motion.button
                key={p.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onQuickTopic(p.prompt)}
                onMouseEnter={() => setHoveredPersona(i)}
                onMouseLeave={() => setHoveredPersona(null)}
                style={{
                  background: hoveredPersona === i ? '#FFF5F5' : '#fff',
                  border: hoveredPersona === i ? '1px solid #CC0000' : '1px solid #E8E8E8',
                  borderRadius: '12px',
                  boxShadow: hoveredPersona === i ? '0 4px 12px rgba(204,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                  padding: 'clamp(28px, 4vw, 44px) clamp(22px, 3vw, 36px)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{
                  fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  color: hoveredPersona === i ? '#CC0000' : 'rgba(204,0,0,0.5)',
                  marginBottom: 18, transition: 'color 0.28s',
                }}>
                  {p.num}
                </div>
                <div style={{
                  fontSize: 'clamp(21px, 2.6vw, 28px)', fontWeight: 400, letterSpacing: '-0.025em',
                  color: '#111', lineHeight: 1.1, marginBottom: 10,
                }}>
                  {p.label}
                </div>
                <div style={{
                  fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif',
                  color: '#6B6B6B',
                  transition: 'color 0.28s', marginBottom: 28, flex: 1,
                }}>
                  {p.detail}
                </div>
                <div style={{
                  fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  color: '#CC0000',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'color 0.28s',
                }}>
                  Konsultasi
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ ...sectionPad, background: '#fff', color: '#1A1A1A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'clamp(24px, 4vw, 52px)' }}>
            <span style={{ fontSize: 10, color: '#CC0000', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Cara Kerja
            </span>
            <div style={{ flex: 1, height: '0.5px', background: '#E8E8E8' }} />
          </div>

          <div
            className="how-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(36px, 6vw, 88px)', alignItems: 'start' }}
          >
            <div>
              <h2 style={{
                fontSize: 'clamp(28px, 4.2vw, 50px)', fontWeight: 400, letterSpacing: '-0.03em',
                lineHeight: 1.08, margin: '0 0 18px', color: '#111',
              }}>
                Tiga langkah,<br />
                <em>satu kali datang.</em>
              </h2>
              <p style={{
                fontSize: 15, color: '#6B6B6B', lineHeight: 1.7,
                fontFamily: 'Inter, sans-serif', margin: 0, maxWidth: 320,
              }}>
                AI analisis situasi kamu secara personal dan buatkan checklist yang sesuai — supaya tidak perlu bolak-balik ke kantor.
              </p>
            </div>

            <div>
              {[
                { n: '01', t: 'Pilih dokumen atau ketik pertanyaan', d: 'Ceritakan situasimu — AI kami akan memahami konteksnya.' },
                { n: '02', t: 'AI analisis dan buat checklist', d: 'Checklist personal lengkap dengan estimasi waktu dan biaya.' },
                { n: '03', t: 'Centang dan berangkat', d: 'Datang ke kantor dengan berkas lengkap, langsung selesai.' },
              ].map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  style={{
                    display: 'flex', gap: 18, padding: 'clamp(16px, 2.5vw, 26px) 0',
                    borderBottom: i < 2 ? '1px solid #F0F0F0' : 'none',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#CC0000', fontWeight: 700, letterSpacing: '0.07em', fontFamily: 'Inter, sans-serif', paddingTop: 4, minWidth: 20, flexShrink: 0 }}>
                    {s.n}
                  </span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 400, color: '#111', margin: '0 0 4px', lineHeight: 1.3 }}>{s.t}</p>
                    <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>{s.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LINKS + FOOTER ─── */}
      <section style={{ ...sectionPad, background: '#FAFAFA', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'clamp(20px, 3.5vw, 36px)' }}>
            <span style={{ fontSize: 10, color: '#CC0000', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Tautan Resmi
            </span>
            <div style={{ flex: 1, height: '0.5px', background: '#E8E8E8' }} />
          </div>

          <div
            className="links-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}
          >
            {officialLinks.map((link, i) => (
              <motion.a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-item"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.4 }}
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  padding: 'clamp(14px, 2.2vw, 22px)',
                  paddingLeft: i === 0 ? 0 : 'clamp(14px, 2.2vw, 22px)',
                  borderRight: i < 2 ? '1px solid #E8E8E8' : 'none',
                  textDecoration: 'none', transition: 'opacity 0.18s',
                  gap: 16, minHeight: 88,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 400, color: '#111', margin: '0 0 5px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{link.label}</p>
                  <p style={{ fontSize: 12, color: '#6B6B6B', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>{link.desc}</p>
                </div>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: '#CC0000' }}>
                  <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.a>
            ))}
          </div>

          <div
            className="footer-inner"
            style={{
              marginTop: 'clamp(32px, 5vw, 60px)', paddingTop: 22,
              borderTop: '1px solid #E8E8E8',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: '#999', fontFamily: 'Inter, sans-serif' }}>
              © 2026 WargaCheck — <strong style={{ color: '#6B6B6B', fontWeight: 400 }}>#JuaraVibeCoding</strong>
            </span>
            <span
              className="footer-disclaimer"
              style={{ fontSize: 12, color: '#999', fontFamily: 'Inter, sans-serif', maxWidth: 380, textAlign: 'right', lineHeight: 1.55 }}
            >
              Informasi bersifat umum. Selalu konfirmasi ke instansi resmi setempat.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}