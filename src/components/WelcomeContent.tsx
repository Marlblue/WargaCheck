/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { motion } from 'motion/react';

interface WelcomeContentProps {
  onQuickTopic: (topic: string) => void;
  onOpenBerkasChecker: () => void;
}

import HeroSlider from './HeroSlider';

const topics = [
  {
    label: 'KTP Elektronik',
    desc: 'Buat baru, perpanjang, atau ganti yang hilang',
    prompt: 'Saya mau urus KTP elektronik. Tolong buatkan checklist lengkap dokumen yang dibutuhkan dan jelaskan langkah-langkahnya.',
  },
  {
    label: 'Kartu Keluarga',
    desc: 'Tambah anggota, pisah KK, atau cetak ulang',
    prompt: 'Saya mau tambah anggota keluarga di Kartu Keluarga. Apa saja syaratnya dan prosedurnya bagaimana?',
  },
  {
    label: 'Akta Kelahiran',
    desc: 'Daftarkan bayi baru atau urus akta terlambat',
    prompt: 'Saya mau buat akta kelahiran untuk anak baru lahir. Apa saja dokumen yang perlu disiapkan dan ke mana harus datang?',
  },
  {
    label: 'Surat Pindah',
    desc: 'Pindah domisili antar kelurahan atau kota',
    prompt: 'Saya baru pindah domisili ke kota lain. Jelaskan prosedur surat pindah dari awal sampai selesai.',
  },
  {
    label: 'SKCK',
    desc: 'Surat Keterangan Catatan Kepolisian',
    prompt: 'Saya perlu membuat SKCK untuk keperluan lamaran kerja. Apa syaratnya, berapa biayanya, dan bagaimana prosedurnya?',
  },
  {
    label: 'Akta Perkawinan',
    desc: 'Daftarkan pernikahan secara resmi ke negara',
    prompt: 'Saya baru menikah dan perlu mengurus akta perkawinan di Dukcapil. Apa saja dokumen yang diperlukan?',
  },
];

const steps = [
  { num: '01', title: 'Pilih dokumen', desc: 'atau ketik pertanyaan langsung' },
  { num: '02', title: 'AI analisis situasi', desc: 'checklist personal dibuat otomatis' },
  { num: '03', title: 'Siap berangkat', desc: 'centang berkas, datang ke kantor lengkap' },
];

const officialLinks = [
  {
    label: 'Dukcapil Kemendagri',
    desc: 'Portal resmi Direktorat Jenderal Kependudukan dan Pencatatan Sipil',
    url: 'https://www.dukcapil.kemendagri.go.id/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
        <path d="M9 10h1" /><path d="M14 10h1" /><path d="M9 14h1" /><path d="M14 14h1" />
      </svg>
    ),
  },
  {
    label: 'Layanan Online',
    desc: 'Akses layanan dokumen kependudukan secara online tanpa antre',
    url: 'https://layanandukcapil.kemendagri.go.id/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    label: 'SAPA Dukcapil',
    desc: 'Layanan pengaduan dan konsultasi informasi kependudukan',
    url: 'https://sapa.dukcapil.kemendagri.go.id/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
];

export default function WelcomeContent({ onQuickTopic, onOpenBerkasChecker }: WelcomeContentProps) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '48px 24px 40px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FFF0F0', color: '#CC0000',
            fontSize: 12, fontWeight: 600, padding: '5px 14px',
            borderRadius: 20, marginBottom: 24, letterSpacing: '0.02em',
          }}>
            <svg width="14" height="10" viewBox="0 0 28 20" fill="none">
              <rect width="28" height="10" rx="2" fill="#CC0000"/>
              <rect y="10" width="28" height="10" rx="2" fill="#E8E8E8"/>
            </svg>
            Asisten Dokumen Kependudukan
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontWeight: 800,
            color: '#111',
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            margin: '0 0 10px',
          }}>
            Tahu dokumen apa saja yang perlu dibawa,{' '}
            <span style={{ color: '#CC0000' }}>sebelum berangkat.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            color: '#6B6B6B',
            margin: '0 0 28px',
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            WargaCheck bantu kamu siap lengkap — biar gak perlu bolak-balik.
          </p>

          {/* Image Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            style={{ marginBottom: 28 }}
          >
            <HeroSlider />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}
          >
            <button
              onClick={() => onQuickTopic('')}
              style={{
                fontSize: 15, fontWeight: 600, color: '#fff',
                background: '#CC0000',
                border: 'none', borderRadius: 10,
                padding: '13px 26px', cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'background 0.15s, transform 0.1s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#A30000'}
              onMouseLeave={e => e.currentTarget.style.background = '#CC0000'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Mulai Konsultasi
            </button>
            <button
              onClick={onOpenBerkasChecker}
              style={{
                fontSize: 15, fontWeight: 600, color: '#CC0000',
                background: 'none',
                border: '1.5px solid #CC0000', borderRadius: 10,
                padding: '13px 26px', cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#CC0000'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#CC0000'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Cek Kelengkapan Berkas
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.35 }}
            style={{
              fontSize: 13, color: '#999', fontWeight: 400,
              margin: 0, lineHeight: 1.5,
            }}
          >
            Tersedia untuk KTP, KK, Akta Lahir, SKCK, Surat Pindah, Akta Nikah, dan 5+ dokumen lainnya.
          </motion.p>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        maxWidth: 680, margin: '0 auto', padding: '0 24px 40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Cara kerja</span>
          <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((item, i) => (
            <motion.div
              key={item.num}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + i * 0.08, duration: 0.3 } }}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 16,
                padding: '14px 0',
                borderBottom: i < steps.length - 1 ? '1px solid #F0F0F0' : 'none',
              }}
            >
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#CC0000',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                width: 24,
              }}>
                {item.num}
              </span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: 14, color: '#888', marginLeft: 6 }}>
                  — {item.desc}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Pilih topik</span>
        <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
      </div>

      {/* ── Topic list ── */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 48px' }}>
        {topics.map((t, i) => (
          <motion.button
            key={t.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25, delay: i * 0.05 } }}
            whileHover={{ x: 3, transition: { duration: 0.12 } }}
            onClick={() => onQuickTopic(t.prompt)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '16px 0',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #E8E8E8',
              cursor: 'pointer',
              textAlign: 'left',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>{t.label}</div>
              <div style={{ fontSize: 13, color: '#6B6B6B', marginTop: 2, fontWeight: 400 }}>{t.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#CC0000' }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        ))}
      </section>

      {/* ── Official links ── */}
      <section style={{
        borderTop: '1px solid #E8E8E8',
        padding: '32px 24px 48px',
        maxWidth: 680,
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Tautan resmi</span>
          <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {officialLinks.map((link, i) => (
            <motion.a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.08, duration: 0.3 } }}
              whileHover={{ x: 3, transition: { duration: 0.12 } }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '16px 0',
                background: 'none',
                borderBottom: '1px solid #E8E8E8',
                cursor: 'pointer',
                textDecoration: 'none',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>{link.label}</div>
                <div style={{ fontSize: 13, color: '#6B6B6B', marginTop: 2, fontWeight: 400 }}>{link.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: '#CC0000' }}>
                <path d="M4 10L10 4M10 4H5.5M10 4v4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '0 24px 32px', fontSize: 12, color: '#bbb' }}>
        © 2026 WargaCheck — Dibuat untuk <strong style={{ fontWeight: 600, color: '#999' }}>#JuaraVibeCoding</strong>
        <br />
        Informasi bersifat umum. Selalu konfirmasi ke instansi resmi setempat.
      </footer>
    </div>
  );
}
