/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { scanDocument } from '../services/gemini';

interface DocumentScannerProps {
  onClose: () => void;
  onScanComplete: (result: string) => void;
}

export default function DocumentScanner({ onClose, onScanComplete }: DocumentScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      setScanError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setScanError('Ukuran file terlalu besar (maks 7MB).');
      return;
    }
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setScanError(null);
    setIsScanning(true);
    setScanResult(null);
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const result = await scanDocument(base64, mimeType);
      setScanResult(result);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menganalisis dokumen. Coba lagi.';
      setScanError(errorMsg);
    } finally {
      setIsScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUseScanResult = () => { if (scanResult) { onScanComplete(scanResult); onClose(); } };
  const handleRetry = () => { setScanResult(null); setScanError(null); setPreviewUrl(null); setIsScanning(false); if (fileInputRef.current) fileInputRef.current.value = ''; };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Scan Dokumen AI"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
          maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
          border: '1px solid var(--border-soft)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
              Scan Dokumen AI
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Upload foto dokumen untuk analisis otomatis</p>
          </div>
          <button onClick={onClose} className="nav-btn-icon" style={{ flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            {/* Upload */}
            {!isScanning && !scanResult && !scanError && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div onClick={() => fileInputRef.current?.click()} style={{
                  border: '2px dashed var(--primary)', borderRadius: 'var(--r-lg)',
                  padding: 'clamp(36px, 8vw, 48px)', textAlign: 'center', cursor: 'pointer',
                  background: 'var(--primary-soft)', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)', margin: '0 0 8px' }}>Upload Foto Dokumen</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>KTP, KK, Akta, SKCK, atau dokumen lainnya</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: 'none' }} aria-label="Pilih foto dokumen untuk di-scan" />
                <div style={{ marginTop: 24 }}>
                  <p className="section-label">Powered by Gemini AI</p>
                  {['Identifikasi jenis dokumen otomatis', 'Cek kelengkapan dan keterbacaan', 'Rekomendasi langkah selanjutnya'].map((f, i) => (
                    <div key={i} style={{ padding: '8px 0', fontSize: 14, color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--primary)', marginRight: 8 }}>•</span><span>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Scanning */}
            {isScanning && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                {previewUrl && (
                  <div style={{ width: '100%', maxHeight: 180, borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 24, border: '1px solid var(--border)' }}>
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
                <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>AI sedang menganalisis...</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Mendeteksi jenis, kelengkapan, dan kondisi</p>
              </motion.div>
            )}

            {/* Error */}
            {scanError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>Gagal menganalisis</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>{scanError}</p>
                <button onClick={handleRetry} className="btn btn-outline" style={{ borderRadius: 'var(--r-md)' }}>Coba Lagi</button>
              </motion.div>
            )}

            {/* Result */}
            {scanResult && (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {previewUrl && (
                  <div style={{ width: '100%', height: 120, borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border)' }}>
                    <img src={previewUrl} alt="Scanned" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ background: 'var(--border-soft)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 16, fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', maxHeight: 300, overflowY: 'auto' }}>
                  <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{scanResult}</ReactMarkdown></div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleRetry} className="btn btn-outline" style={{ flex: 1, borderRadius: 'var(--r-md)' }}>Scan Lagi</button>
                  <button onClick={handleUseScanResult} className="btn btn-primary" style={{ flex: 2, borderRadius: 'var(--r-md)' }}>Lanjutkan ke Chat</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
