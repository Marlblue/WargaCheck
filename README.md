# WargaCheck — Panduan Juara 1 JuaraVibeCoding

> README ini adalah **otak project**. Baca dari atas ke bawah sebelum mulai eksekusi.

---

## Kondisi Sekarang vs Target Juara 1

| Aspek | Sekarang | Target Juara 1 |
|---|---|---|
| UI/UX | Bersih, Inter, merah-putih | + Hero yang cerita masalah, mobile-first |
| Fitur | Chat dasar | + Mode Cek Berkas, riwayat sesi |
| AI Quality | System prompt standar | + Prompt yang paksa AI beri jawaban terstruktur |
| Wow Factor | Belum ada | + Satu fitur yang tidak bisa dibuat tanpa AI |
| Deploy | Belum | Live URL di Cloud Run |
| Demo Video | Belum | 2–3 menit, narasi problem → solusi → live |

Skor juri sekarang estimasi ~65/100. Target: 90+.

---

## Roadmap Eksekusi (Urutan Prioritas)

### FASE 1 — Perkuat AI Response Quality (1–2 jam)
**File: `src/services/gemini.ts`**

Masalah sekarang: AI bisa jawab sembarangan, format tidak konsisten, tidak ada struktur yang dipaksa.

Ganti `SYSTEM_PROMPT` dengan versi ini yang memaksa format terstruktur dan persona yang lebih tajam:

```
Kamu adalah WargaCheck, asisten resmi berbasis AI yang membantu warga Indonesia
mengurus dokumen administrasi kependudukan. Kamu bukan chatbot umum — kamu spesialis
satu topik ini saja dan sangat ahli di dalamnya.

ATURAN JAWABAN (WAJIB DIIKUTI):
1. Selalu mulai dengan 1 kalimat ringkasan apa yang akan kamu jelaskan
2. Untuk SETIAP prosedur, gunakan format:
   **Dokumen yang dibutuhkan:**
   - [ ] item 1
   - [ ] item 2
   
   **Langkah-langkah:**
   1. Langkah pertama
   2. Langkah kedua
   
   **Ke mana datang:** nama instansi + jam operasional umum
   **Estimasi waktu:** X hari kerja
   **Biaya:** Gratis / Rp X (sesuai Permendagri)

3. Jika user cerita situasi personal (misal: "KTP saya hilang waktu banjir"),
   WAJIB akui situasinya dulu dengan 1 kalimat empati sebelum kasih prosedur
4. Akhiri setiap jawaban dengan 1 pertanyaan lanjutan yang relevan untuk membantu lebih

KEPRIBADIAN:
- Lugas, hangat, tidak menggurui
- Tidak pernah bilang "Sebagai AI..." atau "Saya adalah asisten AI..."
- Jika ditanya di luar topik kependudukan, tolak dengan sopan dan arahkan kembali

BATASAN KERAS:
- Tidak membantu dokumen palsu atau pemalsuan identitas
- Selalu tambahkan catatan untuk konfirmasi ke kantor setempat jika prosedur
  mungkin berbeda antar daerah
```

---

### FASE 2 — Tambah Mode "Cek Kelengkapan Berkas" (2–3 jam)
**File baru: `src/components/BerkasChecker.tsx`**

Ini **wow factor** utama — fitur yang tidak bisa dibuat tanpa AI dan langsung berguna.

**Cara kerja:**
1. User pilih jenis dokumen dari dropdown (KTP / KK / Akta Lahir / SKCK / dll)
2. User pilih situasi mereka via pilihan cepat:
   - "Pertama kali" / "Perpanjang" / "Hilang/Rusak"
   - "Sudah menikah" / "Belum menikah"
   - "WNI" / "WNA"
3. AI generate checklist yang **personal** berdasarkan kombinasi jawaban
4. User bisa centang satu per satu di UI
5. Tampilkan progress bar: "3 dari 7 berkas sudah siap"

**Cara implementasi tanpa buat komponen baru dari scratch:**
Tambahkan tab/toggle di halaman welcome: `Chat` | `Cek Berkas`

Di `WelcomeContent.tsx`, tambahkan state `mode: 'chat' | 'checker'` dan render
form sederhana (dropdown + radio buttons) yang on-submit kirim prompt terstruktur
ke Gemini dan tampilkan hasilnya sebagai checklist interaktif.

**Prompt ke AI untuk mode ini:**
```
Buatkan checklist dokumen yang LENGKAP dan SPESIFIK untuk situasi berikut:
- Jenis layanan: [JENIS]
- Keperluan: [KEPERLUAN]  
- Status: [STATUS]

Format checklist WAJIB seperti ini:
**Dokumen Wajib:**
- [ ] nama dokumen — keterangan singkat jika perlu

**Dokumen Pendukung (jika ada):**
- [ ] nama dokumen — keterangan singkat

**Catatan penting:**
[maks 2 poin paling krusial]

Jangan tambahkan teks lain di luar format ini.
```

---

### FASE 3 — Perkuat Hero Landing Page (1 jam)
**File: `src/components/WelcomeContent.tsx`**

Juri buka app, 5 detik pertama harus langsung ngerasain masalahnya.

Ganti hero section saat ini dengan narasi yang lebih kuat. Hapus stats "34 Provinsi / 270M+" — itu data hampa, juri tidak peduli.

Ganti dengan **3 pain point nyata** yang ditulis singkat:

```
Pernah datang ke Dukcapil, ternyata dokumen kurang satu.
Pernah antre 2 jam, ternyata harus ke kelurahan dulu.
Pernah tidak tahu harus mulai dari mana.
```

Tulis dalam style teks rata kiri, font size besar, hitam. Di bawahnya baru CTA.
Ini yang bikin juri langsung connect — mereka atau keluarga mereka pasti pernah alami ini.

Tambahkan juga **social proof ringan** di bawah CTA:
`Tersedia untuk KTP, KK, Akta, SKCK, Surat Pindah, dan 5+ dokumen lainnya`

---

### FASE 4 — Riwayat Chat Sederhana (30 menit)
**File: `src/components/Chat.tsx`**

Sekarang kalau refresh, semua hilang. Simpan ke `localStorage`:

```typescript
// Saat messages berubah, save ke localStorage
useEffect(() => {
  if (messages.length > 0) {
    localStorage.setItem('wargacheck_history', JSON.stringify(messages));
  }
}, [messages]);

// Saat load, restore dari localStorage
const [messages, setMessages] = useState<Message[]>(() => {
  try {
    const saved = localStorage.getItem('wargacheck_history');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
});
```

Tambahkan tombol "Hapus Riwayat" di header chat yang juga clear localStorage.

---

### FASE 5 — Deploy ke Cloud Run (ikuti codelab resmi)

**Link codelab:** https://codelabs.developers.google.com/deploy-ai-studio-app-cloud-run

Langkah cepat:
```bash
# 1. Build dulu
pnpm build

# 2. Buat Dockerfile di root project
```

Isi `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

Isi `nginx.conf`:
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Deploy:
```bash
gcloud run deploy wargacheck \
  --source . \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here
```

**Catatan penting:** Jangan commit `.env` ke Git. Set API key lewat `--set-env-vars` saat deploy.

---

### FASE 6 — Demo Video (rekam setelah semua fitur jalan)

**Formula video 2–3 menit yang menang:**

```
00:00–00:20  HOOK — ceritakan masalah dengan emosi
             "Siapa yang pernah datang jauh-jauh ke Dukcapil, 
              ternyata dokumen kurang satu?"

00:20–00:45  SHOW THE PAIN — tunjukkan betapa ribetnya cara lama
             (bisa pakai screenshot antrian, atau cukup ceritakan)

00:45–01:30  DEMO PRODUK — tunjukkan fitur utama secara live
             - Ketik pertanyaan → dapat jawaban terstruktur
             - Gunakan mode Cek Berkas → checklist personal muncul
             - Tunjukkan bisa diakses dari HP

01:30–02:00  IMPACT — siapa yang dibantu, seberapa besar masalahnya
             "270 juta warga Indonesia, semua punya dokumen kependudukan"

02:00–02:30  CALL TO ACTION — live URL, hashtag #JuaraVibeCoding
```

**Tips video yang sering diabaikan:**
- Rekam di siang hari, pencahayaan natural
- Gunakan mic headset, bukan mic laptop
- Tunjukkan app di HP, bukan cuma laptop — lebih relatable
- Captions/subtitle Indonesia — banyak yang nonton tanpa suara
- Post di LinkedIn, bukan hanya di-link — tulis caption yang cerita masalahnya

---

## Checklist Final Sebelum Submit

- [ ] Live URL bisa dibuka dari HP dan laptop tanpa error
- [ ] Chat berjalan dengan API key yang benar di Cloud Run
- [ ] Mode Cek Berkas menghasilkan checklist yang akurat
- [ ] Tidak ada console error saat dipakai normal
- [ ] Video sudah diupload di LinkedIn (post public)
- [ ] Caption LinkedIn pakai #JuaraVibeCoding
- [ ] Link post LinkedIn sudah dicopy
- [ ] Form submission JuaraVibeCoding sudah diisi sebelum 31 Mei 2026

---

## Kriteria Juri vs Fitur WargaCheck

| Kriteria Juri | Bobot | Fitur yang menjawab |
|---|---|---|
| **Problem** — target audiens jelas, urgensi tinggi | 30% | Hero dengan 3 pain point nyata, 270M potensi user |
| **Solution** — UX intuitif, value proposition jelas | 40% | Chat terstruktur + Mode Cek Berkas + riwayat |
| **Uniqueness** — orisinil, wow factor, pakai AI dengan elegan | 30% | Checklist personal dinamis yang tidak bisa dibuat tanpa AI |

---

## Struktur File

```
WargaCheck AI/
├── src/
│   ├── App.tsx                    — routing welcome/chat
│   ├── index.css                  — Inter, merah-putih, markdown styles
│   ├── components/
│   │   ├── WelcomeContent.tsx     — landing page + topic list
│   │   ├── Chat.tsx               — interface chat utama
│   │   └── BerkasChecker.tsx      — [BUAT BARU] mode cek berkas
│   ├── services/
│   │   └── gemini.ts              — koneksi ke Gemini API
│   └── lib/
│       └── utils.ts               — helper cn()
├── Dockerfile                     — [BUAT BARU] untuk Cloud Run
├── nginx.conf                     — [BUAT BARU] untuk serve SPA
├── index.html                     — sudah ada favicon inline SVG
├── .env                           — JANGAN di-commit ke Git
└── .env.example                   — template untuk kolaborator
```

---

*Dibuat untuk JuaraVibeCoding 2026 — deadline 31 Mei 2026*
