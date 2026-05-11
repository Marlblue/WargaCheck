/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, Children } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { checkBerkas } from '../services/gemini';

/* ── Option data (no emojis — clean text only) ── */
const JENIS_LAYANAN = [
  'KTP Elektronik',
  'Kartu Keluarga (KK)',
  'Akta Kelahiran',
  'Akta Kematian',
  'Akta Perkawinan',
  'Akta Perceraian',
  'Surat Pindah Domisili',
  'SKCK',
  'Paspor',
  'Surat Keterangan Domisili',
];

const KEPERLUAN = [
  'Pertama kali / Baru',
  'Perpanjang',
  'Hilang / Rusak',
  'Perubahan Data',
];

const STATUS_NIKAH = ['Belum menikah', 'Sudah menikah', 'Cerai hidup', 'Cerai mati'];
const KEWARGANEGARAAN = ['WNI', 'WNA'];

interface BerkasCheckerProps {
  onBack: () => void;
}

/* ── Radio-style selector button ── */
function OptionButton({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid #F0F0F0',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {/* Radio circle */}
      <div style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
        border: selected ? '5px solid #CC0000' : '2px solid #D4D4D4',
        background: '#fff',
        transition: 'all 0.12s',
      }} />
      <span style={{
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        color: selected ? '#111' : '#555',
        letterSpacing: '-0.01em',
      }}>
        {label}
      </span>
    </button>
  );
}

export default function BerkasChecker({ onBack }: BerkasCheckerProps) {
  const [step, setStep] = useState(0); // 0=form, 1=loading, 2=result
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
    setStep(0);
    setJenisLayanan('');
    setKeperluan('');
    setStatusNikah('');
    setKewarganegaraan('WNI');
    setResult('');
    setCheckedItems(new Set<string>());
    setTotalCheckboxes(0);
  };

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const progress = totalCheckboxes > 0 ? (checkedItems.size / totalCheckboxes) * 100 : 0;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      maxWidth: 720, width: '100%', margin: '0 auto',
      height: 'calc(100dvh - 52px)',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        <AnimatePresence mode="wait">
          {/* ── STEP 0: Form ── */}
          {step === 0 && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{
                  fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700,
                  color: '#111', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 8px',
                }}>
                  Cek kelengkapan berkas<br />
                  <span style={{ color: '#CC0000' }}>sebelum ke kantor.</span>
                </h2>
                <p style={{ fontSize: 14, color: '#6B6B6B', margin: 0, lineHeight: 1.6 }}>
                  Pilih jenis dokumen dan situasi, AI buatkan checklist yang bisa kamu centang satu per satu.
                </p>
              </div>

              {/* ── 1. Jenis Dokumen ── */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  fontSize: 11, fontWeight: 600, color: '#999',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  display: 'block', marginBottom: 8, paddingLeft: 2,
                }}>
                  1. Jenis Dokumen
                </label>
                <div style={{ border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
                  {JENIS_LAYANAN.map((j, i) => (
                    <div key={j} style={{ borderBottom: i < JENIS_LAYANAN.length - 1 ? 'none' : 'none' }}>
                      <OptionButton
                        selected={jenisLayanan === j}
                        label={j}
                        onClick={() => setJenisLayanan(j)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 2. Keperluan ── */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  fontSize: 11, fontWeight: 600, color: '#999',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  display: 'block', marginBottom: 8, paddingLeft: 2,
                }}>
                  2. Keperluan
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {KEPERLUAN.map(k => {
                    const sel = keperluan === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setKeperluan(k)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          border: sel ? '1.5px solid #CC0000' : '1.5px solid #E8E8E8',
                          background: sel ? '#CC0000' : '#fff',
                          cursor: 'pointer',
                          fontSize: 13, fontWeight: sel ? 600 : 400,
                          color: sel ? '#fff' : '#555',
                          transition: 'all 0.12s',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 3 & 4 side by side ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                <div>
                  <label style={{
                    fontSize: 11, fontWeight: 600, color: '#999',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    display: 'block', marginBottom: 8, paddingLeft: 2,
                  }}>
                    3. Status
                  </label>
                  <div style={{ border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
                    {STATUS_NIKAH.map(s => (
                      <OptionButton
                        key={s}
                        selected={statusNikah === s}
                        label={s}
                        onClick={() => setStatusNikah(s)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: 11, fontWeight: 600, color: '#999',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    display: 'block', marginBottom: 8, paddingLeft: 2,
                  }}>
                    4. Kewarganegaraan
                  </label>
                  <div style={{ border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
                    {KEWARGANEGARAAN.map(k => (
                      <OptionButton
                        key={k}
                        selected={kewarganegaraan === k}
                        label={k}
                        onClick={() => setKewarganegaraan(k)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  padding: '13px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: canSubmit ? '#CC0000' : '#E8E8E8',
                  color: canSubmit ? '#fff' : '#bbb',
                  fontSize: 15, fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'default',
                  letterSpacing: '-0.01em',
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#A30000'; }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#CC0000'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                Cek Kelengkapan Berkas
              </button>
            </motion.div>
          )}

          {/* ── STEP 1: Loading ── */}
          {step === 1 && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', paddingTop: 80, gap: 20,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '2.5px solid #E8E8E8', borderTopColor: '#CC0000',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: '0 0 4px', textAlign: 'center' }}>
                  Menganalisis kebutuhan berkas...
                </p>
                <p style={{ fontSize: 13, color: '#999', margin: 0, textAlign: 'center' }}>
                  {jenisLayanan} — {keperluan}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Result ── */}
          {step === 2 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              ref={resultRef}
            >
              {/* Result Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    Checklist Berkas
                  </h3>
                  <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>
                    {jenisLayanan} — {keperluan} — {statusNikah}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  style={{
                    fontSize: 13, fontWeight: 500, color: '#6B6B6B',
                    background: 'none', border: '1px solid #E8E8E8',
                    borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#6B6B6B'; }}
                >
                  Cek lagi
                </button>
              </div>

              {/* Progress bar */}
              {totalCheckboxes > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      Kesiapan berkas
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      color: progress === 100 ? '#22c55e' : '#CC0000',
                    }}>
                      {checkedItems.size}/{totalCheckboxes}
                    </span>
                  </div>
                  <div style={{
                    width: '100%', height: 4, borderRadius: 2,
                    background: '#F0F0F0', overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: 2,
                        background: progress === 100 ? '#22c55e' : '#CC0000',
                        transition: 'background 0.3s',
                      }}
                    />
                  </div>
                  {progress === 100 && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontSize: 13, color: '#22c55e', fontWeight: 600,
                        margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                      </svg>
                      Semua berkas siap. Kamu bisa datang ke kantor.
                    </motion.p>
                  )}
                </div>
              )}

              {/* Result content */}
              <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: 16 }}>
                <div className="md berkas-result">
                  <BerkasMarkdown
                    content={result}
                    checkedItems={checkedItems}
                    onToggle={toggleCheck}
                  />
                </div>
              </div>

              {/* Hint */}
              <p style={{
                fontSize: 12, color: '#bbb', textAlign: 'center',
                padding: '20px 0 8px', margin: 0,
              }}>
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
function BerkasMarkdown({
  content,
  checkedItems,
  onToggle,
}: {
  content: string;
  checkedItems: Set<string>;
  onToggle: (key: string) => void;
}) {
  // Use a ref-like counter scoped to this render pass
  let checkboxCounter = 0;

  /**
   * Generate a stable key from the checkbox text content.
   * Falls back to index-based key if text is empty.
   */
  function getCheckboxKey(childrenText: string): string {
    const cleaned = childrenText.replace(/\[[ x]\]\s*/g, '').trim();
    if (cleaned.length > 0) return cleaned.slice(0, 80);
    return `cb-${checkboxCounter}`;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        li: ({ children, node, ...props }) => {
          const text = String(children);
          const isCheckbox = text.includes('[ ]') || text.includes('[x]');

          if (isCheckbox) {
            checkboxCounter++;
            const key = getCheckboxKey(text);
            const isChecked = checkedItems.has(key);

            return (
              <li
                {...props}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 0', marginBottom: 0,
                  borderBottom: '1px solid #F5F5F5',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  listStyle: 'none',
                }}
                onClick={() => onToggle(key)}
              >
                {/* Checkbox square */}
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: isChecked ? '2px solid #22c55e' : '2px solid #D4D4D4',
                  background: isChecked ? '#22c55e' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s', marginTop: 2,
                }}>
                  {isChecked && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: 14, lineHeight: 1.5,
                  color: isChecked ? '#999' : '#111',
                  textDecoration: isChecked ? 'line-through' : 'none',
                  flex: 1,
                }}>
                  {Children.map(children, child => {
                    if (typeof child === 'string') {
                      return child.replace(/\[[ x]\]\s*/g, '');
                    }
                    return child;
                  })}
                </span>
              </li>
            );
          }

          return <li {...props}>{children}</li>;
        },
        input: () => null,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
