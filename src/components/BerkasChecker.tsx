/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { checkBerkas } from '../services/gemini';

const JENIS_LAYANAN = [
  'KTP Elektronik', 'Kartu Keluarga (KK)', 'Akta Kelahiran', 'Akta Kematian',
  'Akta Perkawinan', 'Akta Perceraian', 'Surat Pindah Domisili', 'SKCK',
  'Paspor', 'Surat Keterangan Domisili',
];
const KEPERLUAN = ['Pertama kali / Baru', 'Perpanjang', 'Hilang / Rusak', 'Perubahan Data'];
const STATUS_NIKAH = ['Belum menikah', 'Sudah menikah', 'Cerai hidup', 'Cerai mati'];
const KEWARGANEGARAAN = ['WNI', 'WNA'];

interface BerkasCheckerProps { onBack: () => void; }

function OptionButton({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: 'none', border: 'none',
      borderBottom: '1px solid var(--border-soft)', cursor: 'pointer',
      textAlign: 'left', width: '100%', transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--border-soft)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
        border: selected ? '5px solid var(--primary)' : '2px solid var(--border)',
        background: 'var(--bg-card)', transition: 'all 0.12s',
      }} />
      <span style={{
        fontSize: 14, fontWeight: selected ? 600 : 400,
        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
        letterSpacing: '-0.01em',
      }}>{label}</span>
    </button>
  );
}

export default function BerkasChecker({ onBack }: BerkasCheckerProps) {
  const [step, setStep] = useState(0);
  const [jenisLayanan, setJenisLayanan] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [statusNikah, setStatusNikah] = useState('');
  const [kewarganegaraan, setKewarganegaraan] = useState('WNI');
  const [result, setResult] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [totalCheckboxes, setTotalCheckboxes] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const canSubmit = jenisLayanan && keperluan && statusNikah && kewarganegaraan;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStep(1);
    setCheckedItems(new Set());
    try {
      const res = await checkBerkas(jenisLayanan, keperluan, statusNikah, kewarganegaraan);
      setResult(res || 'Maaf, tidak bisa membuat checklist saat ini.');
      const checkboxCount = (res || '').split('\n').filter(line => line.includes('- [ ]') || line.includes('- [x]')).length;
      setTotalCheckboxes(checkboxCount);
      setStep(2);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
      setResult(errorText);
      setStep(2);
    }
  };

  const handleReset = () => {
    setStep(0); setJenisLayanan(''); setKeperluan(''); setStatusNikah('');
    setKewarganegaraan('WNI'); setResult(''); setCheckedItems(new Set<string>()); setTotalCheckboxes(0);
  };

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const progress = totalCheckboxes > 0 ? (checkedItems.size / totalCheckboxes) * 100 : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 720, width: '100%', margin: '0 auto', height: 'calc(100dvh - 72px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 20px)' }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 0: Form ── */}
          {step === 0 && (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 'clamp(24px, 5.5vw, 28px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 10px' }}>
                  Cek kelengkapan berkas<br /><span className="text-gradient">sebelum ke kantor.</span>
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Pilih jenis dokumen dan situasi, AI buatkan checklist yang bisa kamu centang satu per satu.
                </p>
              </div>

              {/* 1. Jenis Dokumen */}
              <div style={{ marginBottom: 20 }}>
                <label className="section-label" style={{ display: 'block', paddingLeft: 2, marginBottom: 8 }}>1. Jenis Dokumen</label>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {JENIS_LAYANAN.map(j => <OptionButton key={j} selected={jenisLayanan === j} label={j} onClick={() => setJenisLayanan(j)} />)}
                </div>
              </div>

              {/* 2. Keperluan */}
              <div style={{ marginBottom: 20 }}>
                <label className="section-label" style={{ display: 'block', paddingLeft: 2, marginBottom: 8 }}>2. Keperluan</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {KEPERLUAN.map(k => {
                    const sel = keperluan === k;
                    return (
                      <button key={k} onClick={() => setKeperluan(k)} style={{
                        padding: '10px 16px', borderRadius: 'var(--r-sm)',
                        border: sel ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                        background: sel ? 'var(--primary)' : 'var(--bg-card)',
                        cursor: 'pointer', fontSize: 13, fontWeight: sel ? 600 : 400,
                        color: sel ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.12s', minHeight: 44,
                      }}>{k}</button>
                    );
                  })}
                </div>
              </div>

              {/* 3 & 4 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16, marginBottom: 28 }}>
                <div>
                  <label className="section-label" style={{ display: 'block', paddingLeft: 2, marginBottom: 8 }}>3. Status</label>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {STATUS_NIKAH.map(s => <OptionButton key={s} selected={statusNikah === s} label={s} onClick={() => setStatusNikah(s)} />)}
                  </div>
                </div>
                <div>
                  <label className="section-label" style={{ display: 'block', paddingLeft: 2, marginBottom: 8 }}>4. Kewarganegaraan</label>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {KEWARGANEGARAAN.map(k => <OptionButton key={k} selected={kewarganegaraan === k} label={k} onClick={() => setKewarganegaraan(k)} />)}
                  </div>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={!canSubmit} className="btn btn-primary" style={{
                width: '100%', borderRadius: 'var(--r-md)',
                background: canSubmit ? undefined : 'var(--border)',
                color: canSubmit ? undefined : 'var(--text-tertiary)',
                cursor: canSubmit ? 'pointer' : 'default',
                boxShadow: canSubmit ? undefined : 'none',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Cek Kelengkapan Berkas
              </button>
            </motion.div>
          )}

          {/* ── STEP 1: Loading ── */}
          {step === 1 && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', textAlign: 'center' }}>Menganalisis kebutuhan berkas...</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>{jenisLayanan} — {keperluan}</p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Result ── */}
          {step === 2 && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} ref={resultRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Checklist Berkas</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jenisLayanan} — {keperluan} — {statusNikah}</p>
                </div>
                <button onClick={handleReset} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: 13, minHeight: 36 }}>Cek lagi</button>
              </div>

              {/* Progress bar */}
              {totalCheckboxes > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Kesiapan berkas</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: progress === 100 ? '#22c55e' : 'var(--primary)' }}>
                      {checkedItems.size}/{totalCheckboxes}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--border-soft)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 2, background: progress === 100 ? '#22c55e' : 'var(--primary)', transition: 'background 0.3s' }} />
                  </div>
                  {progress === 100 && (
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                      </svg>
                      Semua berkas siap. Kamu bisa datang ke kantor.
                    </motion.p>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div className="md berkas-result">
                  <BerkasMarkdown content={result} checkedItems={checkedItems} onToggle={toggleCheck} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0 8px', margin: 0 }}>
                Tip: screenshot checklist ini sebelum ke kantor.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Markdown renderer with interactive checkboxes ── */
function BerkasMarkdown({ content, checkedItems, onToggle }: { content: string; checkedItems: Set<string>; onToggle: (key: string) => void }) {
  let checkboxCounter = 0;
  function getCheckboxKey(childrenText: string): string {
    const cleaned = childrenText.replace(/\[[ x]\]\s*/g, '').trim();
    if (cleaned.length > 0) return cleaned.slice(0, 80);
    return `cb-${checkboxCounter}`;
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      li: ({ children, node, className, ...props }) => {
        const text = Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('') : String(children);
        const isCheckbox = className?.includes('task-list-item') || text.includes('[ ]') || text.includes('[x]');
        if (isCheckbox) {
          checkboxCounter++;
          const key = getCheckboxKey(text);
          const isChecked = checkedItems.has(key);
          return (
            <li {...props} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 0', borderBottom: '1px solid var(--border-soft)',
              cursor: 'pointer', listStyle: 'none', transition: 'background 0.1s',
            }} onClick={() => onToggle(key)}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: isChecked ? '2px solid #22c55e' : '2px solid var(--border)',
                background: isChecked ? '#22c55e' : 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s', marginTop: 2,
              }}>
                {isChecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>}
              </div>
              <span style={{
                fontSize: 14, lineHeight: 1.5,
                color: isChecked ? 'var(--text-tertiary)' : 'var(--text-primary)',
                textDecoration: isChecked ? 'line-through' : 'none', flex: 1,
              }}>
                {Array.isArray(children) ? children.map((child) => typeof child === 'string' ? child.replace(/\[[ x]\]\s*/g, '') : child) : typeof children === 'string' ? children.replace(/\[[ x]\]\s*/g, '') : children}
              </span>
            </li>
          );
        }
        return <li {...props}>{children}</li>;
      },
      input: () => null,
    }}>{content}</ReactMarkdown>
  );
}
