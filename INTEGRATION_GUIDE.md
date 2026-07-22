# Panduan Integrasi Frontend ↔ Backend (REST API)

Dokumen ini adalah panduan praktis untuk melakukan integrasi antara Frontend (Next.js) dan Backend (FastAPI).

## 1. Setup Axios & Interceptor (Langkah Pertama)

Buat file `lib/api.ts` (atau `utils/api.ts`) di frontend untuk mengkonfigurasi *instance* Axios.
Ini akan memastikan token JWT otomatis disisipkan di setiap request.

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Request Interceptor: Tambahkan Token JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor: Handle Unauthorized (Token Expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 2. Autentikasi (Login / Register)

Ubah logika di form Login & Register untuk menembak API, lalu simpan token-nya.

**Contoh Login:**
```typescript
import api from '@/lib/api';
import { useUserRole } from '@/context/UserRoleContext';
import { useRouter } from 'next/navigation';

// Di dalam komponen Login:
const { loginAs } = useUserRole();
const router = useRouter();

const handleLogin = async (email, password) => {
  try {
    // 1. Tembak API Login
    const response = await api.post('/auth/login', { email, password });
    
    const { access_token, user } = response.data;

    // 2. Simpan token (bisa di localStorage atau di context)
    localStorage.setItem('token', access_token);
    
    // 3. Update Global Context
    // Sesuaikan context kamu agar bisa menerima data user dari DB
    loginAs(user.role, user.username, user.tier);
    
    // 4. Redirect ke Dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error("Login gagal:", error.response?.data?.detail);
    // Tampilkan pesan error cantik di UI
  }
};
```

## 3. Upload File Geospasial (TIFF)

Upload file wajib menggunakan `FormData` agar bisa mengirim objek file (binary) bersamaan dengan data teks (metadata).

**Contoh Upload Map:**
```typescript
import api from '@/lib/api';

const handleUploadMap = async (file: File, title: string, location: string, date: string, type: string) => {
  const formData = new FormData();
  
  // Wajib sesuai dengan nama field di backend
  formData.append('file', file);
  formData.append('title', title);
  formData.append('location', location);
  formData.append('survey_date', date); // format: YYYY-MM-DD
  formData.append('map_type', type);    // NDVI / Soil Analysis / dsb.

  try {
    const response = await api.post('/maps', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Axios akan otomatis set ini, tapi baiknya ditulis eksplisit
      },
    });
    console.log("Upload Sukses:", response.data);
  } catch (error) {
    console.error("Upload Gagal:", error);
  }
};
```

## 4. Mengambil Daftar Peta (List)

```typescript
import api from '@/lib/api';
import { useEffect, useState } from 'react';

const fetchMaps = async () => {
  try {
    const response = await api.get('/maps?limit=20&skip=0');
    // response.data berisi: { maps: [...], total: 10 }
    return response.data.maps;
  } catch (error) {
    console.error("Gagal fetch peta:", error);
  }
};
```

## Checklist Integrasi
- [ ] Install Axios di frontend (`npm install axios`)
- [ ] Buat instance `api.ts` dengan interceptor
- [ ] Integrasi halaman `app/login/page.tsx`
- [ ] Integrasi halaman `app/register/page.tsx`
- [ ] Perbarui `UserRoleContext` untuk nge-fetch data dari `/api/users/me` saat baru me-load aplikasi.
- [ ] Integrasi form upload di `app/dashboard/upload/page.tsx`
- [ ] Render data peta asli di `app/dashboard/maps/page.tsx`
