# 🇮🇩 WargaCheck — Asisten AI Dokumen Kependudukan Indonesia

> **Tahu dokumen apa yang dibawa, sebelum berangkat.**

WargaCheck adalah asisten berbasis AI yang membantu warga Indonesia mempersiapkan dokumen administrasi kependudukan — mulai dari KTP, KK, Akta Lahir, SKCK, hingga Paspor. Tidak perlu lagi bolak-balik ke kantor karena berkas kurang.

---

## 🎯 Masalah yang Diselesaikan

Setiap tahun, **jutaan warga Indonesia** harus mengurus dokumen kependudukan di kantor Dukcapil, Kelurahan, atau Kepolisian. Masalah utama:

- **Berkas tidak lengkap** → harus pulang dan datang lagi
- **Prosedur tidak jelas** → informasi berbeda-beda di setiap sumber
- **Waktu terbuang** → antrean panjang, hanya untuk ditolak karena kurang satu dokumen

**WargaCheck menyelesaikan ini** dengan AI yang menganalisis situasi personal pengguna dan memberikan checklist berkas yang lengkap, estimasi waktu & biaya, serta panduan langkah demi langkah — sebelum pengguna berangkat ke kantor.

---

## ✨ Fitur Utama

### 1. 💬 AI Konsultasi
Chat langsung dengan AI yang memahami seluruh prosedur dokumen kependudukan Indonesia. Tanya apa saja tentang KTP, KK, Akta, SKCK, dan lainnya — jawaban terstruktur dengan checklist, estimasi biaya, dan panduan lengkap.

### 2. 📋 Smart Berkas Checker
Pilih jenis dokumen, keperluan, status pernikahan, dan kewarganegaraan — AI buatkan checklist interaktif yang bisa dicentang satu per satu. Progress bar menunjukkan kesiapan berkas secara real-time.

### 3. 📸 AI Document Scanner (Gemini Vision)
Upload foto dokumen yang sudah dimiliki — AI menganalisis jenis dokumen, memeriksa keterbacaan, dan memberikan rekomendasi dokumen lain yang mungkin diperlukan. Powered by Google Gemini Vision.

### 4. 🎯 Persona-Based Guidance
Panduan yang disesuaikan untuk berbagai profil pengguna:
- **Mahasiswa Rantau** — KTP, KK, surat pindah untuk kuliah di kota lain
- **Pekerja Profesional** — SKCK, akta nikah, dokumen untuk melamar kerja
- **Ibu Rumah Tangga** — Akta lahir anak, KK, dokumen keluarga

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Inline Styles |
| Animation | Framer Motion (motion/react) |
| AI Model | Google Gemini 2.5 Flash |
| AI Vision | Google Gemini 2.5 Flash (Multimodal) |
| Backend | Express 4 + Node.js |
| Deployment | Docker (multi-stage build) |

---

## 🔒 Arsitektur Keamanan

```
┌──────────────┐     /api/chat        ┌──────────────┐     Gemini API
│   Browser    │ ──────────────────▶  │  Express     │ ──────────────▶  Google AI
│  (React App) │     /api/scan        │  Server      │
│              │ ◀──────────────────  │  (Proxy)     │ ◀──────────────
│  No API Key  │                      │  API Key     │
└──────────────┘                      └──────────────┘
```

- API key **never** reaches the browser — all AI calls proxied through Express
- Per-endpoint rate limiting (chat: 20/min, berkas: 10/min, scan: 8/min)
- Input validation & sanitization on all endpoints
- Helmet.js security headers
- CORS protection in production
- Base64 image size validation (max 7MB)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### Setup

```bash
# Clone
git clone https://github.com/your-username/wargacheck.git
cd wargacheck

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development (2 terminals)
npm run dev:server   # Express API on :3001
npm run dev          # Vite dev on :3000
```

Open [http://localhost:3000](http://localhost:3000)

### Docker

```bash
docker build -t wargacheck .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key wargacheck
```

---

## 📁 Project Structure

```
wargacheck/
├── server.js                 # Express API server (proxy to Gemini)
├── index.html                # HTML entry point
├── vite.config.ts            # Vite + Tailwind + React config
├── Dockerfile                # Multi-stage Docker build
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Main app with routing
│   ├── index.css             # Design system & global styles
│   ├── services/
│   │   └── gemini.ts         # API client (chat, berkas, scan)
│   └── components/
│       ├── WelcomeContent.tsx # Landing page
│       ├── Chat.tsx           # AI chat interface
│       ├── BerkasChecker.tsx  # Document checklist generator
│       ├── DocumentScanner.tsx # AI document scanner (Vision)
│       ├── ErrorBoundary.tsx  # Error handling
│       └── shared/
│           └── FlagIcon.tsx   # Indonesian flag icon
```

---

## 🎨 Design

- **Editorial landing page** — Dark, cinematic hero with parallax Unsplash photography
- **Indonesian Red (#CC0000)** — Brand color matching the Indonesian flag
- **Inter font** — Clean, modern typography
- **Micro-animations** — Framer Motion for smooth transitions and reveals
- **Mobile-first** — Responsive with `clamp()` values throughout

---

## 📄 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | AI consultation chat |
| `POST` | `/api/check-berkas` | Generate document checklist |
| `POST` | `/api/scan` | Analyze document photo (Vision) |

---

## 🏆 #JuaraVibeCoding 2026

Built with ❤️ for the JuaraVibeCoding 2026 competition.

**WargaCheck** — Supaya tidak perlu bolak-balik ke kantor.