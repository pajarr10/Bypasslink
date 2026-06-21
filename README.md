# BipaSunlok

**Website bypass shortlink modern, cepat, ringan, dan mudah digunakan.**

Dikembangkan sepenuhnya oleh **Pajar** menggunakan Node.js, Express, HTML, CSS, JavaScript, dan Vercel Serverless.

---

## Developer

- **Name:** Pajar
- **GitHub:** [Pajarr10](https://github.com/Pajarr10)
- **Instagram:** [snapshot.by.jare](https://instagram.com/snapshot.by.jare)

---

## Deskripsi

BipaSunlok adalah platform bypass shortlink dengan antarmuka premium bergaya Apple iOS. Website ini memudahkan pengguna untuk melewati berbagai shortlink dengan cepat hanya dengan memasukkan URL.

---

## Fitur

- Bypass shortlink cepat dan ringan
- Desain Apple iOS dengan Glassmorphism & Blur Background
- Dark Mode otomatis
- Responsive & Mobile First
- Loading Animation & Progress Animation
- Card Result dengan Copy, Open, Share, Clear
- Riwayat bypass menggunakan LocalStorage
- Toast Notification
- Error Handling lengkap
- Admin Dashboard dengan Analytics
- Visitor Tracking
- Request Logs
- Chart.js untuk visualisasi data
- Upstash Redis untuk penyimpanan analytics
- Siap deploy ke Vercel tanpa modifikasi kode

---

## Teknologi

**Frontend:**
- HTML
- CSS
- Vanilla JavaScript

**Backend:**
- Node.js
- Express
- ES Module

**Database:**
- Upstash Redis

**Chart:**
- Chart.js

**Deploy:**
- Vercel Serverless

---

## Struktur Project

```
bipasunlok/
├── api/
│   ├── index.js       # Entry point Vercel Serverless
│   ├── bypass.js      # Endpoint bypass shortlink
│   ├── admin.js       # Admin dashboard API
│   ├── analytics.js   # Public analytics API
│   └── visitor.js     # Visitor tracking API
├── lib/
│   ├── bypassunlock.js # Scraper bypass utama
│   └── redis.js        # Client Upstash Redis
├── public/
│   ├── index.html     # Halaman utama
│   ├── admin.html     # Dashboard admin
│   ├── style.css      # Styling halaman utama
│   ├── admin.css      # Styling dashboard admin
│   ├── script.js      # Script halaman utama
│   └── admin.js       # Script dashboard admin
├── vercel.json
├── package.json
├── .env.example
└── README.md
```

---

## Instalasi Lokal

```bash
npm install
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## Environment Variables

Buat file `.env` berdasarkan `.env.example`:

```env
ADMIN_KEY=isi_sendiri
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

---

## Deploy ke Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Login dan deploy:

```bash
vercel
```

3. Atur Environment Variables di Vercel Dashboard:

- `ADMIN_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Project siap digunakan tanpa perlu mengubah kode.

---

## API

### POST /api/bypass

Request body:

```json
{
  "url": "https://contoh.com/shortlink"
}
```

Response sukses:

```json
{
  "status": true,
  "result": "https://hasil.com"
}
```

Response gagal:

```json
{
  "status": false,
  "result": null,
  "message": "Gagal memproses link"
}
```

### POST /api/visitor

Request body:

```json
{
  "page": "/",
  "referrer": "Direct"
}
```

### GET /api/analytics

Mengembalikan data analytics lengkap.

### POST /api/admin/verify

Request body:

```json
{
  "key": "ADMIN_KEY"
}
```

### GET /api/admin/stats

Header wajib:

```
x-admin-key: ADMIN_KEY
```

---

## Admin Dashboard

Dashboard admin dapat diakses di:

```
/admin.html
```

Masukkan Admin Key untuk melihat statistik, chart, recent visitor, recent bypass, dan logs.

---

## Catatan Penting

- Scraper bypass menggunakan API dan logika yang telah ditentukan tanpa perubahan.
- Tidak menggunakan Puppeteer, Selenium, atau Browser Headless.
- Analytics memerlukan Upstash Redis agar data tetap tersimpan di Vercel Serverless.

---

## License

MIT License

---

## Copyright

© 2026 BipaSunlok

Developed by Pajar

Made with ❤️ by Pajar
