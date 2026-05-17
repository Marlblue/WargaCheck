/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';

interface WelcomeContentProps {
  onQuickTopic: (topic: string) => void;
  onOpenBerkasChecker: () => void;
}

const topics = [
  { label: 'KTP Elektronik', color: 'var(--card-rose)', prompt: 'Saya mau urus KTP elektronik. Tolong buatkan checklist lengkap dokumen yang dibutuhkan dan jelaskan langkah-langkahnya.' },
  { label: 'Kartu Keluarga', color: 'var(--card-blue)', prompt: 'Saya mau tambah anggota keluarga di Kartu Keluarga. Apa saja syaratnya dan prosedurnya bagaimana?' },
  { label: 'Akta Kelahiran', color: 'var(--card-mint)', prompt: 'Saya mau buat akta kelahiran untuk anak baru lahir. Apa saja dokumen yang perlu disiapkan dan ke mana harus datang?' },
  { label: 'Surat Pindah', color: 'var(--card-amber)', prompt: 'Saya baru pindah domisili ke kota lain. Jelaskan prosedur surat pindah dari awal sampai selesai.' },
  { label: 'SKCK', color: 'var(--card-purple)', prompt: 'Saya perlu membuat SKCK untuk keperluan lamaran kerja. Apa syaratnya, berapa biayanya, dan bagaimana prosedurnya?' },
  { label: 'Akta Perkawinan', color: 'var(--card-orange)', prompt: 'Saya baru menikah dan perlu mengurus akta perkawinan di Dukcapil. Apa saja dokumen yang diperlukan?' },
];

const officialLinks = [
  { label: 'Dukcapil Kemendagri', desc: 'Portal resmi Dirjen Kependudukan', url: 'https://www.dukcapil.kemendagri.go.id/' },
  { label: 'Layanan Online', desc: 'Akses layanan tanpa antre', url: 'https://layanandukcapil.kemendagri.go.id/' },
  { label: 'SAPA Dukcapil', desc: 'Pengaduan & konsultasi', url: 'https://sapa.dukcapil.kemendagri.go.id/' },
];

/* ── Reusable animation wrapper ── */
function Reveal({ children, delay = 0, className, style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default function WelcomeContent({ onQuickTopic, onOpenBerkasChecker }: WelcomeContentProps) {
  const [hoveredTopic, setHoveredTopic] = useState<number | null>(null);

  return (
    <div style={{ paddingTop: 8, paddingBottom: 60 }}>

      {/* ═══════════════════════════════════════
          BENTO GRID
          ═══════════════════════════════════════ */}
      <div className="bento-grid">

        {/* ── 1. HERO CARD (large) ── */}
        <Reveal className="bento-card col-2 row-2 card-rose" delay={0.1} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Decorative corner accent */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', opacity: 0.07 }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', opacity: 0.05 }} />

          <div>
            <p className="section-label">Asisten Dokumen AI</p>
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              margin: '0 0 16px',
            }}>
              Tahu dokumen<br />
              <span style={{ fontStyle: 'italic', fontWeight: 600 }}>apa yang dibawa,</span><br />
              <span className="text-gradient">sebelum berangkat.</span>
            </h1>
            <p className="card-desc" style={{ maxWidth: 340, marginBottom: 24 }}>
              AI analisis situasi kamu dan buatkan checklist personal — supaya tidak perlu bolak-balik ke kantor.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => onQuickTopic('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Mulai Konsultasi
            </button>
            <button className="btn btn-outline" onClick={onOpenBerkasChecker}>
              Cek Berkas
            </button>
          </div>
        </Reveal>

        {/* ── 2. CHAT PREVIEW CARD ── */}
        <Reveal className="bento-card col-2 card-blue clickable" delay={0.2} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
          <div onClick={() => onQuickTopic('')} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p className="section-label">Konsultasi AI</p>
            <p style={{ fontSize: 'clamp(15px, 2.5vw, 17px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Tanya apa saja tentang dokumen kependudukan
            </p>

            {/* Mini chat preview */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
              <motion.div className="mini-bubble mini-bubble-user" style={{ animationDelay: '0.4s' }}>
                KTP saya hilang, harus bagaimana?
              </motion.div>
              <motion.div className="mini-bubble mini-bubble-ai" style={{ animationDelay: '0.8s' }}>
                Untuk penggantian KTP hilang, kamu perlu menyiapkan surat kehilangan dari kepolisian, KK asli, dan...
              </motion.div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span className="dot-1" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                <span className="dot-2" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                <span className="dot-3" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── 3. STATS CARDS (3x small) ── */}
        <Reveal className="bento-card col-1 card-mint" delay={0.25}>
          <div style={{ fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
            10+
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 8, letterSpacing: '0.02em' }}>
            Jenis dokumen didukung
          </p>
        </Reveal>

        <Reveal className="bento-card col-1 card-amber" delay={0.3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
              24/7
            </div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 8, letterSpacing: '0.02em' }}>
            Selalu tersedia kapan saja
          </p>
        </Reveal>

        {/* ── 4. BERKAS CHECKER CARD ── */}
        <Reveal className="bento-card col-2 card-purple clickable" delay={0.15} style={{ display: 'flex', flexDirection: 'column' }}>
          <div onClick={onOpenBerkasChecker} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p className="section-label">Cek Kelengkapan</p>
            <p style={{ fontSize: 'clamp(15px, 2.5vw, 17px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Checklist berkas interaktif yang bisa dicentang
            </p>

            {/* Mini checklist preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
              {['Fotokopi KTP', 'Kartu Keluarga asli', 'Surat pengantar RT/RW'].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--r-sm)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-soft)',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: i < 2 ? '2px solid #22c55e' : '2px solid var(--border)',
                    background: i < 2 ? '#22c55e' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i < 2 && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                  </div>
                  <span style={{ textDecoration: i < 2 ? 'line-through' : 'none', opacity: i < 2 ? 0.5 : 1 }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── 5. HOW IT WORKS CARD ── */}
        <Reveal className="bento-card col-2" delay={0.2} style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="section-label">Cara Kerja</p>
          <h2 style={{
            fontSize: 'clamp(20px, 3.5vw, 26px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            margin: '0 0 24px',
          }}>
            Tiga langkah,<br />
            <span style={{ fontStyle: 'italic', fontWeight: 500 }}>satu kali datang.</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
            {[
              { n: '01', t: 'Ceritakan situasimu', d: 'Pilih topik atau ketik pertanyaan bebas.' },
              { n: '02', t: 'AI buatkan checklist', d: 'Lengkap dengan estimasi biaya & waktu.' },
              { n: '03', t: 'Centang & berangkat', d: 'Datang ke kantor dengan berkas lengkap.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  display: 'flex', gap: 14, padding: '14px 0',
                  borderBottom: i < 2 ? '1px solid var(--border-soft)' : 'none',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', paddingTop: 3, minWidth: 22, flexShrink: 0 }}>
                  {s.n}
                </span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', lineHeight: 1.3 }}>{s.t}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* ── 6. TOPICS GRID ── */}
        <Reveal className="bento-card col-3" delay={0.15}>
          <p className="section-label">Pilih Topik</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
          }}>
            {topics.map((t, i) => (
              <motion.button
                key={t.label}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onQuickTopic(t.prompt)}
                onMouseEnter={() => setHoveredTopic(i)}
                onMouseLeave={() => setHoveredTopic(null)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--r-md)',
                  border: hoveredTopic === i ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                  background: hoveredTopic === i ? t.color : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.25s var(--ease-out)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 48,
                }}
              >
                <span style={{
                  fontSize: 14,
                  fontWeight: hoveredTopic === i ? 600 : 500,
                  color: hoveredTopic === i ? 'var(--primary)' : 'var(--text-primary)',
                  transition: 'color 0.2s',
                  letterSpacing: '-0.01em',
                }}>
                  {t.label}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 14 14" fill="none"
                  style={{
                    marginLeft: 'auto',
                    color: 'var(--primary)',
                    opacity: hoveredTopic === i ? 1 : 0,
                    transition: 'opacity 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            ))}
          </div>
        </Reveal>

        {/* ── 7. DOCUMENT SCANNER CARD ── */}
        <Reveal className="bento-card col-1 card-sky clickable" delay={0.25}>
          <div onClick={() => onQuickTopic('')} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--r-md)',
              background: 'var(--primary-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Scan Dokumen
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
              Upload foto, AI analisis jenis & kelengkapan dokumen otomatis.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>
              Coba sekarang
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        </Reveal>

        {/* ── 8. OFFICIAL LINKS ── */}
        <Reveal className="bento-card col-4 card-slate" delay={0.1}>
          <p className="section-label">Tautan Resmi</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {officialLinks.map((link, i) => (
              <motion.a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  gap: 12,
                  minHeight: 90,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px var(--primary-glow)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{link.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{link.desc}</p>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--primary)', alignSelf: 'flex-end' }}>
                  <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.a>
            ))}
          </div>
        </Reveal>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 16px 0',
      }}>
        <div className="divider" />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '20px 0',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            © 2026 WargaCheck — <span style={{ color: 'var(--text-secondary)' }}>#JuaraVibeCoding</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 380, textAlign: 'right', lineHeight: 1.5 }}>
            Informasi bersifat umum. Selalu konfirmasi ke instansi resmi setempat.
          </span>
        </div>
      </footer>
    </div>
  );
}