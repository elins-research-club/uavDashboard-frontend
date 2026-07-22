# UAV DaaS Platform — Frontend

Frontend aplikasi web untuk **UAV DaaS (Data-as-a-Service) Platform**, yaitu platform pemetaan lahan pertanian presisi berbasis drone dengan sistem subscription.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (.tsx) |
| Styling | CSS Modules / TailwindCSS (campur, butuh standarisasi) |
| Map Library | React-Leaflet (`leaflet`) |
| Icons | Lucide React |

## Struktur Folder & Rute

```
uavDashboard-frontend/
├── app/
│   ├── page.tsx                    # Landing Page Publik (/, Marketing)
│   ├── login/page.tsx              # Form Login
│   ├── register/page.tsx           # Form Register
│   └── dashboard/                  # Area Terproteksi (Butuh Login)
│       ├── page.tsx                # Dashboard Home (Ringkasan)
│       ├── maps/page.tsx           # Peta Interaktif (Leaflet)
│       ├── upload/page.tsx         # Upload Peta (TIFF/PNG/JPG)
│       └── subscription/page.tsx   # Tier/Pricing Plans
├── components/
│   ├── DashboardLayout.tsx         # Layout Utama & Auth Guard
│   ├── Sidebar.tsx                 # Navigasi Kiri
│   ├── MapDisplay.tsx              # Map Wrapper (Dynamic Import SSR: false)
│   └── ActualMap.tsx               # Komponen Leaflet Core
├── context/
│   └── UserRoleContext.tsx         # Global State untuk User Auth (Dummy saat ini)
└── public/
    └── ...                         # Asset Statis (Gambar, Icon)
```

## Kondisi Saat Ini (MVP Phase 1)

1. **Autentikasi masih Dummy:** Login, Register, dan state user saat ini dikelola menggunakan `localStorage` via `UserRoleContext.tsx`. Belum terhubung ke backend API.
2. **TypeScript:** Proyek ini baru saja dimigrasi dari JavaScript murni ke TypeScript. Konfigurasi `tsconfig.json` sudah dibuat.
3. **Peta (Leaflet):** Menggunakan `react-leaflet`. Harus di-*import* secara dinamis (`next/dynamic` dengan `ssr: false`) karena Leaflet bergantung pada objek `window` browser.
4. **Data Peta:** Komponen peta saat ini menampilkan *dummy markers* / *polygons*. Belum me-render file TIFF dari backend.

## Roadmap Integrasi Backend (Tugas AI Agent Selanjutnya)

1. **Ganti Axios/Fetch:** Ubah fungsi dummy di `login` dan `register` agar memanggil API backend (`POST http://localhost:8000/api/auth/login`).
2. **Ganti Auth Context:** Ubah `UserRoleContext` agar membaca token JWT dan menyimpannya (baik di `localStorage` atau HTTP-only cookies), lalu mengambil data profil via `GET /api/users/me`.
3. **Upload Peta:** Hubungkan form di `app/dashboard/upload/page.tsx` ke endpoint `POST /api/maps` menggunakan `multipart/form-data`.
4. **Fetch Daftar Peta:** Ambil data dari `GET /api/maps` dan tampilkan di list `app/dashboard/maps/page.tsx`.

## Setup & Menjalankan

```bash
cd uavDashboard-frontend
npm install
npm run dev
```

Aplikasi berjalan di **http://localhost:3000**
