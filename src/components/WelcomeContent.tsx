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
    --px: clamp(24px, 6vw, 120px);
    --section-py: clamp(64px, 10vw, 120px);
  }
  * { box-sizing: border-box; }
  @media (max-width: 768px) {
    .hero-stats { gap: 32px !important; }
    .persona-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .how-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
    .links-grid { grid-template-columns: 1fr !important; }
    .link-item { border-right: none !important; border-bottom: 1px solid #F0F0F0 !important; padding-bottom: 24px !important; }
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
  { label: 'Mahasiswa Rantau', detail: 'Urus KTP, KK, dan surat pindah domisili untuk keperluan perkuliahan.', prompt: 'Saya mahasiswa yang baru pindah ke kota lain untuk kuliah. Dokumen apa saja yang perlu saya urus?', num: '01' },
  { label: 'Pekerja Profesional', detail: 'Pembuatan SKCK, update data KK, dan dokumen administratif karir.', prompt: 'Saya perlu membuat SKCK dan dokumen lain untuk melamar kerja. Apa saja yang harus disiapkan?', num: '02' },
  { label: 'Ibu Rumah Tangga', detail: 'Pencatatan akta kelahiran anak dan pembaruan anggota Kartu Keluarga.', prompt: 'Saya baru melahirkan dan perlu mengurus akta kelahiran anak. Bagaimana prosedurnya?', num: '03' },
];

const officialLinks = [
  { label: 'Dukcapil Kemendagri', desc: 'Portal resmi Direktorat Jenderal Kependudukan dan Pencatatan Sipil.', url: 'https://www.dukcapil.kemendagri.go.id/' },
  { label: 'Layanan Online', desc: 'Akses pendaftaran layanan administrasi kependudukan secara digital.', url: 'https://layanandukcapil.kemendagri.go.id/' },
  { label: 'SAPA Dukcapil', desc: 'Layanan pengaduan dan bantuan informasi resmi pemerintah.', url: 'https://sapa.dukcapil.kemendagri.go.id/' },
];

const HERO_IMAGE = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1800&q=85&auto=format&fit=crop';
const HERO_IMAGE_ALT = 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=1800&q=85&auto=format&fit=crop';

export default function WelcomeContent({ onQuickTopic, onOpenBerkasChecker }: WelcomeContentProps) {
  const [hoveredTopic, setHoveredTopic] = useState<number | null>(null);
  const [imgSrc, setImgSrc] = useState(HERO_IMAGE);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div style={{ background: '#FFFFFF', color: '#1A1A1A', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>
      <style>{GLOBAL_STYLE}</style>

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          height: '100svh',
          minHeight: 680,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#FFFFFF',
        }}
      >
        {/* Parallax Image Layer */}
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            y: imgY,
            zIndex: 0,
          }}
        >
          <img
            src={imgSrc}
            onError={() => setImgSrc(HERO_IMAGE_ALT)}
            alt=""
            style={{
              width: '100%', height: '120%',
              objectFit: 'cover', objectPosition: 'center 40%',
              display: 'block',
              filter: 'grayscale(10%) contrast(105%)',
            }}
          />
        </motion.div>

        {/* Overlays */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.1) 100%)',
        }} />
        
        {/* Decorative Red Accent */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 4 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', left: 0, top: '25%', bottom: '25%',
            background: '#CC0000', zIndex: 2,
          }}
        />

        {/* Hero Content */}
        <motion.div
          style={{
            position: 'relative', zIndex: 3,
            paddingLeft: 'var(--px)',
            paddingRight: 'var(--px)',
            y: heroContentY,
            opacity: heroContentOpacity,
            maxWidth: 1400,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: 'clamp(12px, 1.5vw, 14px)',
              fontWeight: 700,
              color: '#CC0000',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: 20,
            }}
          >
            Layanan AI Kependudukan Indonesia
          </motion.p>

          <div style={{ overflow: 'hidden' }}>
            <motion.h1
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{
                fontSize: 'clamp(40px, 8vw, 100px)',
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                margin: '0 0 24px',
                color: '#1A1A1A',
              }}
            >
              Urus Dokumen,<br />
              <span style={{ color: '#CC0000' }}>Tanpa Bingung.</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: 1.5,
              color: '#555',
              maxWidth: 580,
              marginBottom: 48,
              fontWeight: 400,
            }}
          >
            Solusi cerdas berbasis AI untuk panduan berkas kependudukan, estimasi waktu, dan biaya secara transparan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}
          >
            <button
              onClick={() => onQuickTopic('')}
              style={{
                background: '#CC0000', color: '#FFFFFF', border: 'none',
                padding: '18px 40px', borderRadius: 4, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', transition: 'all 0.2s',
                boxShadow: '0 10px 30px rgba(204,0,0,0.2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#A30000'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#CC0000'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Mulai Konsultasi
            </button>
            <button
              onClick={onOpenBerkasChecker}
              style={{
                background: '#FFFFFF', color: '#1A1A1A', border: '2px solid #1A1A1A',
                padding: '16px 40px', borderRadius: 4, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Cek Berkas
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── TOPICS ─── */}
      <section style={{ padding: 'var(--section-py) var(--px)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 64 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#CC0000', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, whiteSpace: 'nowrap' }}>
              Panduan Dokumen
            </h2>
            <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topics.map((t, i) => (
              <motion.button
                key={t.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onQuickTopic(t.prompt)}
                onMouseEnter={() => setHoveredTopic(i)}
                onMouseLeave={() => setHoveredTopic(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '32px 0', background: 'none', border: 'none',
                  borderBottom: '1px solid #F0F0F0', cursor: 'pointer', textAlign: 'left',
                  transition: 'padding-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  paddingLeft: hoveredTopic === i ? 16 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                  <span style={{ 
                    fontSize: 12, fontWeight: 700, color: hoveredTopic === i ? '#CC0000' : '#BBB',
                    fontVariantNumeric: 'tabular-nums', transition: 'color 0.3s'
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 800,
                    color: hoveredTopic === i ? '#CC0000' : '#1A1A1A',
                    letterSpacing: '-0.03em', transition: 'color 0.3s',
                  }}>
                    {t.label}
                  </span>
                </div>
                <motion.svg
                  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  animate={{ x: hoveredTopic === i ? 8 : 0, opacity: hoveredTopic === i ? 1 : 0.2 }}
                  style={{ color: '#CC0000', strokeWidth: 3 }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SITUATION (PERSONAS) ─── */}
      <section style={{ padding: 'var(--section-py) var(--px)', background: '#F9F9F9' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 80 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#CC0000', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, whiteSpace: 'nowrap' }}>
              Berdasarkan Situasi
            </h2>
            <div style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
          </div>

          <div className="persona-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 64 }}>
            {personas.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                style={{ cursor: 'pointer' }}
                onClick={() => onQuickTopic(p.prompt)}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#CC0000', marginBottom: 20, letterSpacing: '0.1em' }}>
                  SITUASI {p.num}
                </div>
                <h3 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>{p.label}</h3>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: '#666', marginBottom: 32 }}>{p.detail}</p>
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  fontSize: 13, fontWeight: 700, color: '#CC0000', textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  Dapatkan Checklist
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: 'var(--section-py) var(--px)', background: '#CC0000', color: '#FFFFFF' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 120, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 32 }}>
                Satu Kali Datang,<br />Langsung Selesai.
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.8, maxWidth: 440 }}>
                WargaCheck membantu Anda mempersiapkan berkas secara presisi sebelum melangkah ke kantor layanan publik.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
              {[
                { n: '01', t: 'Identifikasi Kebutuhan', d: 'Ceritakan keperluan Anda, AI akan memetakan syarat yang sesuai.' },
                { n: '02', t: 'Verifikasi Berkas', d: 'Checklist otomatis yang disesuaikan dengan aturan terbaru Dukcapil.' },
                { n: '03', t: 'Siap Berangkat', d: 'Pastikan semua kotak tercentang, dokumen Anda siap diajukan.' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 32 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, opacity: 0.4 }}>{s.n}</span>
                  <div>
                    <h4 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{s.t}</h4>
                    <p style={{ fontSize: 16, opacity: 0.7, lineHeight: 1.5 }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LINKS & FOOTER ─── */}
      <footer style={{ padding: 'var(--section-py) var(--px)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="links-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0' }}>
            {officialLinks.map((link, i) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-item"
                style={{
                  padding: '48px 24px',
                  paddingLeft: i === 0 ? 0 : 24,
                  borderRight: i < 2 ? '1px solid #F0F0F0' : 'none',
                  textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A' }}>{link.label}</div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.5 }}>{link.desc}</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="3">
                  <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>

          <div style={{ marginTop: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 32 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 8, letterSpacing: '-0.02em' }}>WargaCheck</div>
              <div style={{ fontSize: 13, color: '#BBB', fontWeight: 600 }}>© 2026 #JuaraVibeCoding</div>
            </div>
            <div style={{ fontSize: 13, color: '#AAA', maxWidth: 400, textAlign: 'right', lineHeight: 1.6 }}>
              Layanan ini bersifat edukatif dan bantu. Selalu verifikasi data akhir pada instansi pemerintah terkait.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
masi ke instansi resmi setempat.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}