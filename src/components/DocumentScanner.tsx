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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      setScanError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }

    // Validate file size (max 7MB)
    if (file.size > 7 * 1024 * 1024) {
      setScanError('Ukuran file terlalu besar (maks 7MB).');
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setScanError(null);
    setIsScanning(true);
    setScanResult(null);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      
      // Call real Gemini Vision API
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
      reader.onload = () => {
        const result = reader.result as string;
        // Return with data URL prefix (server will strip it)
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUseScanResult = () => {
    if (scanResult) {
      onScanComplete(scanResult);
      onClose();
    }
  };

  const handleRetry = () => {
    setScanResult(null);
    setScanError(null);
    setPreviewUrl(null);
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'clamp(16px, 4vw, 20px)',
          maxWidth: 520,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: 'clamp(16px, 4vw, 20px) clamp(20px, 5vw, 24px)',
          borderBottom: '1px solid #E8E8E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(12px, 3vw, 16px)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: 'clamp(16px, 3.8vw, 18px)',
              fontWeight: 700,
              color: '#111',
              margin: '0 0 clamp(3px, 1vw, 4px)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Scan Dokumen AI
            </h3>
            <p style={{
              fontSize: 'clamp(12px, 2.8vw, 13px)',
              color: '#6B6B6B',
              margin: 0,
            }}>
              Upload foto dokumen untuk analisis otomatis dengan AI
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 'clamp(32px, 7vw, 36px)',
              height: 'clamp(32px, 7vw, 36px)',
              borderRadius: '50%',
              background: '#F7F7F7',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E8E8E8'}
            onMouseLeave={e => e.currentTarget.style.background = '#F7F7F7'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: 'clamp(20px, 5vw, 24px)',
          flex: 1,
          overflowY: 'auto',
        }}>
          <AnimatePresence mode="wait">
            {/* Upload state */}
            {!isScanning && !scanResult && !scanError && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #CC0000',
                    borderRadius: 'clamp(12px, 3vw, 16px)',
                    padding: 'clamp(36px, 8vw, 48px)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#FFF0F0',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FFE5E5';
                    e.currentTarget.style.borderColor = '#A30000';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFF0F0';
                    e.currentTarget.style.borderColor = '#CC0000';
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 600, color: '#CC0000', margin: '0 0 clamp(6px, 1.5vw, 8px)' }}>
                    Upload Foto Dokumen
                  </p>
                  <p style={{ fontSize: 'clamp(12px, 2.8vw, 13px)', color: '#6B6B6B', margin: 0 }}>
                    KTP, KK, Akta, SKCK, atau dokumen lainnya
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {/* Features list */}
                <div style={{ marginTop: 'clamp(20px, 4vw, 24px)' }}>
                  <p style={{ fontSize: 'clamp(10px, 2.2vw, 11px)', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'clamp(10px, 2.5vw, 12px)' }}>
                    Powered by Gemini AI
                  </p>
                  {[
                    { icon: '🔍', text: 'Identifikasi jenis dokumen otomatis' },
                    { icon: '✅', text: 'Cek kelengkapan dan keterbacaan' },
                    { icon: '📋', text: 'Rekomendasi langkah selanjutnya' },
                  ].map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 12px)', padding: 'clamp(7px, 1.8vw, 8px) 0', fontSize: 'clamp(13px, 3vw, 14px)', color: '#333' }}>
                      <span style={{ fontSize: 'clamp(16px, 3.5vw, 18px)' }}>{feature.icon}</span>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Scanning state */}
            {isScanning && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                {/* Image preview */}
                {previewUrl && (
                  <div style={{
                    width: '100%', maxHeight: 180, borderRadius: 12, overflow: 'hidden',
                    marginBottom: 24, border: '1px solid #E8E8E8',
                  }}>
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 56, height: 56, margin: '0 auto 20px',
                    borderRadius: '50%', border: '3px solid #F0F0F0', borderTopColor: '#CC0000',
                  }}
                />
                <h4 style={{ fontSize: 'clamp(15px, 3.5vw, 17px)', fontWeight: 600, color: '#111', margin: '0 0 6px' }}>
                  AI sedang menganalisis dokumen...
                </h4>
                <p style={{ fontSize: 'clamp(12px, 2.8vw, 13px)', color: '#6B6B6B', margin: 0 }}>
                  Mendeteksi jenis, kelengkapan, dan kondisi dokumen
                </p>
              </motion.div>
            )}

            {/* Error state */}
            {scanError && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#FFF0F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p style={{ fontSize: 'clamp(14px, 3.2vw, 15px)', fontWeight: 600, color: '#111', margin: '0 0 6px' }}>
                  Gagal menganalisis
                </p>
                <p style={{ fontSize: 'clamp(12px, 2.8vw, 13px)', color: '#6B6B6B', margin: '0 0 20px', lineHeight: 1.5 }}>
                  {scanError}
                </p>
                <button
                  onClick={handleRetry}
                  style={{
                    fontSize: 'clamp(13px, 3vw, 14px)', fontWeight: 600, color: '#CC0000',
                    background: '#FFF0F0', border: '1px solid #CC0000', borderRadius: 8,
                    padding: '10px 20px', cursor: 'pointer', minHeight: 44,
                  }}
                >
                  Coba Lagi
                </button>
              </motion.div>
            )}

            {/* Result state */}
            {scanResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Image preview thumbnail */}
                {previewUrl && (
                  <div style={{
                    width: '100%', height: 120, borderRadius: 10, overflow: 'hidden',
                    marginBottom: 16, border: '1px solid #E8E8E8',
                  }}>
                    <img src={previewUrl} alt="Scanned document" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}

                <div style={{
                  background: '#F7F7F7', borderRadius: 12,
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  marginBottom: 'clamp(14px, 3.5vw, 16px)',
                  fontSize: 'clamp(13px, 3vw, 14px)', lineHeight: 1.6, color: '#111',
                  maxHeight: 300, overflowY: 'auto',
                }}>
                  <div className="md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{scanResult}</ReactMarkdown>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleRetry}
                    style={{
                      flex: 1, fontSize: 'clamp(13px, 3vw, 14px)', fontWeight: 500, color: '#6B6B6B',
                      background: '#F7F7F7', border: '1px solid #E8E8E8', borderRadius: 10,
                      padding: '12px', cursor: 'pointer', minHeight: 48, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#6B6B6B'; }}
                  >
                    Scan Lagi
                  </button>
                  <button
                    onClick={handleUseScanResult}
                    style={{
                      flex: 2, fontSize: 'clamp(13px, 3vw, 14px)', fontWeight: 600, color: '#fff',
                      background: '#CC0000', border: 'none', borderRadius: 10,
                      padding: '12px', cursor: 'pointer', minHeight: 48, transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#A30000'}
                    onMouseLeave={e => e.currentTarget.style.background = '#CC0000'}
                  >
                    Lanjutkan ke Chat
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
