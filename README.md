# 🇮🇩 WargaCheck — Asisten AI Dokumen Kependudukan Indonesia

> **Tahu dokumen apa saja yang perlu dibawa, sebelum berangkat.**

WargaCheck adalah asisten berbasis AI yang membantu warga Indonesia mengurus dokumen administrasi kependudukan — mulai dari KTP, KK, Akta Lahir, SKCK, hingga Surat Pindah. Tidak perlu lagi bolak-balik ke kantor karena dokumen kurang.

🔗 **Live Demo:** _Coming soon_

---

## ✨ Fitur Utama

### 💬 Konsultasi AI
Tanya prosedur, syarat, dan langkah-langkah pengurusan dokumen kependudukan dalam bahasa yang mudah dipahami. AI memberikan jawaban terstruktur lengkap dengan checklist dokumen, estimasi waktu, dan biaya.

### ✅ Cek Kelengkapan Berkas
Pilih jenis dokumen dan situasi kamu, AI akan generate checklist personal yang bisa dicentang satu per satu. Lengkap dengan progress bar supaya kamu tahu berkas mana yang masih kurang.

### 💾 Riwayat Chat
Percakapan tersimpan otomatis di browser. Kamu bisa lanjutkan kapan saja tanpa kehilangan konteks.

---

## 🖼️ Screenshot

| Landing Page | Konsultasi AI | Cek Berkas |
|:---:|:---:|:---:|
| Hero dengan pain points | Chat terstruktur | Checklist interaktif |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Backend** | Express.js (API proxy) |
| **AI** | Google Gemini 2.5 Flash |
| **Animation** | Motion (Framer Motion) |
| **Markdown** | react-markdown + remark-gfm |
| **Security** | Helmet, CORS, rate limiting, input validation |
| **Deploy** | Docker + Cloud Run ready |

---

## 🏗️ Arsitektur

```
Browser (React SPA)
    │
    ├── /api/chat          → Konsultasi AI
    └── /api/check-berkas  → Cek Kelengkapan Berkas
          │
    Express.js (proxy server)
          │
    Google Gemini API
```

**API key tidak pernah terekspos ke browser.** Semua panggilan ke Gemini melewati Express server yang menyimpan key secara server-side.

---

## 🔒 Keamanan

- ✅ API key server-side only (tidak pernah dikirim ke browser)
- ✅ Helmet security headers
- ✅ CORS protection (origin lock di production)
- ✅ Rate limiting (20 req/menit per IP)
- ✅ Input validation & sanitasi (maks 2000 karakter)
- ✅ History validation (maks 20 pesan, role whitelist)
- ✅ Request timeout 30 detik ke Gemini API
- ✅ Prompt injection guardrails di system prompt

---

## 🚀 Quick Start

### Prasyarat

- Node.js 20+
- [Google Gemini API Key](https://aistudio.google.com/apikey)

### Setup

```bash
# 1. Clone repo
git clone https://github.com/Marlblue/WargaCheck.git
cd WargaCheck

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env → isi GEMINI_API_KEY dengan key kamu

# 4. Jalankan development server
npm run dev:server   # Terminal 1: Express API (port 3001)
npm run dev          # Terminal 2: Vite frontend (port 3000)
```

Buka **http://localhost:3000** di browser.

### Atau jalankan keduanya sekaligus:

```bash
npm run dev:all
```

---

## 🐳 Docker

```bash
# Build image
docker build -t wargacheck .

# Run container
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key_here \
  -e NODE_ENV=production \
  wargacheck
```

---

## ☁️ Deploy ke Cloud Run

```bash
gcloud run deploy wargacheck \
  --source . \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here
```

> ⚠️ Jangan commit `.env` ke Git. Set API key lewat `--set-env-vars` saat deploy.

---

## 📁 Struktur Project

```
WargaCheck/
├── src/
│   ├── App.tsx                    # Routing welcome/chat/berkas
│   ├── index.css                  # Design system (Inter, merah-putih)
│   ├── main.tsx                   # Entry point + ErrorBoundary
│   ├── components/
│   │   ├── WelcomeContent.tsx     # Landing page + topic list
│   │   ├── HeroSlider.tsx         # Rotating pain points hero
│   │   ├── Chat.tsx               # Interface chat utama
│   │   ├── BerkasChecker.tsx      # Mode cek berkas interaktif
│   │   ├── ErrorBoundary.tsx      # Global error handler
│   │   └── shared/
│   │       └── FlagIcon.tsx       # Indonesian flag icon
│   ├── services/
│   │   └── gemini.ts             # API client (fetch + timeout)
│   └── lib/
│       └── utils.ts              # Utility functions
├── server.js                      # Express API proxy (Gemini)
├── index.html                     # HTML entry + SEO meta tags
├── Dockerfile                     # Production Docker image
├── nginx.conf                     # Nginx config (optional)
├── .env.example                   # Template environment variables
├── vite.config.ts                 # Vite + Tailwind config
└── tsconfig.json                  # TypeScript config
```

---

## 📄 Environment Variables

| Variable | Required | Default | Keterangan |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | API key dari Google AI Studio |
| `PORT` | ❌ | `3001` | Port Express server |
| `NODE_ENV` | ❌ | — | Set `production` saat deploy |
| `ALLOWED_ORIGINS` | ❌ | `localhost` | Comma-separated allowed CORS origins |

---

## 🎯 Dibuat Untuk

**#JuaraVibeCoding 2026** — Kompetisi vibe coding nasional oleh Google Developer Indonesia.

**Problem:** 270 juta warga Indonesia punya dokumen kependudukan yang perlu diurus, tapi prosedurnya sering bikin bingung dan berakhir bolak-balik ke kantor.

**Solution:** AI assistant yang kasih jawaban terstruktur + checklist personal yang bisa dicentang, supaya datang ke kantor langsung lengkap.

---

## 📝 Lisensi

Apache-2.0 — Lihat [LICENSE](LICENSE) untuk detail.

---

<p align="center">
  <sub>Dibuat dengan ❤️ untuk warga Indonesia</sub>
</p>
