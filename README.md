# WargaCheck — Asisten AI Dokumen Kependudukan Indonesia

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

### 1. 💬 AI Konsultasi (Real-Time Streaming)
Chat langsung dengan AI yang memahami seluruh prosedur dokumen kependudukan Indonesia. **Response di-stream secara real-time** (SSE) — teks muncul langsung saat AI berpikir, seperti ChatGPT. Dilengkapi **voice input/output**, **smart follow-up suggestions**, dan tombol **salin/bagikan ke WhatsApp**.

### 2. 📋 Smart Berkas Checker
Pilih jenis dokumen, keperluan, status pernikahan, dan kewarganegaraan — AI buatkan checklist interaktif yang bisa dicentang satu per satu. Progress bar menunjukkan kesiapan berkas secara real-time. **Confetti celebration** saat semua berkas siap. **Bagikan checklist ke WhatsApp** dengan satu klik.

### 3. 📸 AI Document Scanner (Gemini Vision)
Upload foto dokumen yang sudah dimiliki — AI menganalisis jenis dokumen, memeriksa keterbacaan, dan memberikan rekomendasi dokumen lain yang mungkin diperlukan. Powered by Google Gemini Vision.

### 4. 📱 Progressive Web App (PWA)
Install WargaCheck ke home screen HP — akses cepat tanpa buka browser. Static assets di-cache untuk performa optimal.

### 5. 🌙 Dark Mode
Toggle dark/light mode dengan transisi halus. Mendukung preferensi sistem dan disimpan di localStorage.

### 6. 🎨 Bento Grid Landing Page
Landing page modern dengan layout bento grid — card-card interaktif dengan warna pastel, animasi reveal, **auto-typing AI demo**, dan preview fitur langsung di halaman utama.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | CSS Custom Properties + Tailwind CSS v4 |
| Animation | Motion (motion/react) |
| AI Model | Google Gemini 2.5 Flash |
| AI Vision | Google Gemini 2.5 Flash (Multimodal) |
| Backend | Express 4 + Node.js |
| Font | Plus Jakarta Sans (Google Fonts) |
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
git clone https://github.com/Marlblue/WargaCheck.git
cd WargaCheck

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
WargaCheck/
├── server.js                 # Express API server (proxy to Gemini)
├── index.html                # HTML entry + fonts + favicon
├── vite.config.ts            # Vite + Tailwind + code splitting
├── Dockerfile                # Multi-stage Docker build
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # App shell + floating navbar + dark mode
│   ├── index.css             # Design system (CSS tokens + bento grid)
│   ├── hooks/
│   │   ├── useTheme.ts       # Dark/light mode hook
│   │   └── useSpeech.ts      # Voice input/output hook
│   ├── services/
│   │   └── gemini.ts         # API client (chat, berkas, scan)
│   └── components/
│       ├── WelcomeContent.tsx # Bento grid landing page
│       ├── Chat.tsx           # AI chat interface
│       ├── BerkasChecker.tsx  # Document checklist generator
│       ├── DocumentScanner.tsx # AI document scanner (Vision)
│       ├── ErrorBoundary.tsx  # Error handling
│       └── shared/
│           └── LogoIcon.tsx   # WargaCheck brand logo
```

---

## 🎨 Design System

- **Bento Grid Layout** — Asymmetric card grid with pastel-colored cards
- **Warm Palette** — Primary red `#E63946`, warm cream background `#FAF8F5`
- **Pastel Card Colors** — Rose, blue, mint, amber, purple, sky
- **Plus Jakarta Sans** — Modern, warm typography
- **Ultra-Rounded Corners** — 24-32px border radius
- **Dark Mode** — Full dark theme with CSS custom properties
- **Floating Pill Navbar** — Centered, glassmorphism navigation
- **Micro-animations** — Framer Motion reveals, hover lifts, smooth transitions
- **Mobile-first Responsive** — 4-column → 2-column → 1-column grid

---

## 📄 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | AI consultation chat (JSON) |
| `POST` | `/api/chat/stream` | AI consultation chat (SSE real-time streaming) |
| `POST` | `/api/check-berkas` | Generate document checklist |
| `POST` | `/api/scan` | Analyze document photo (Vision) |

---

## 🏆 #JuaraVibeCoding 2026

Built with ❤️ for the JuaraVibeCoding 2026 competition.

**WargaCheck** — Supaya tidak perlu bolak-balik ke kantor.