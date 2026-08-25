## 1. Fitur Utama

- **Autentikasi akun dengan JWT** (register & login).
- **Manajemen API Key** — setiap akun bisa membuat, melihat, dan mencabut (revoke) API key.
- **Data API publik** (butuh API Key) untuk mengambil data destinasi wisata & kategori, lengkap
  dengan filter, pencarian, dan pagination.
- **Pencatatan pemakaian API** (`api_usage_logs`) sebagai dasar kuota harian per API key.
- **Minimal 74 data destinasi wisata** nyata dari berbagai provinsi di Indonesia (melebihi syarat
  minimal 50 data), dengan 10 kategori wisata.
- Siap deploy sebagai **serverless function** di **Vercel**, dengan database **PostgreSQL (Supabase)**.

## 2. Tech Stack

| Layer      | Teknologi                                |
| ---------- | ---------------------------------------- |
| Runtime    | Node.js 18+, Express.js                  |
| Database   | PostgreSQL (Supabase)                    |
| Auth       | JSON Web Token (jsonwebtoken) + bcryptjs |
| Deployment | Vercel (Serverless Functions)            |
| Lainnya    | helmet, cors, morgan, express-rate-limit |

## 3. Struktur Basis Data (ringkas)

| Tabel            | Keterangan                                                    |
| ---------------- | ------------------------------------------------------------- |
| `users`          | Akun developer/konsumen API (login JWT)                       |
| `api_keys`       | API key milik user, dipakai untuk akses data API              |
| `categories`     | Kategori destinasi wisata (Pantai, Gunung, dll)               |
| `destinations`   | **Data inti** yang disediakan lewat API (≥ 50 baris)          |
| `api_usage_logs` | Log tiap request yang masuk lewat API key (analytics & kuota) |

Diagram ERD, Use Case, dan Activity/User Flow lengkap ada di **laporan PDF** (lihat folder `docs/`
atau file laporan terpisah yang dikumpulkan).

## 4. Lisensi

MIT — dibuat untuk keperluan tugas akademik.

## 5. POSTMAN

![alt text](image.png)
![alt text](image-12.png)
![alt text](image-11.png)
![alt text](image-13.png)
![alt text](image-14.png)
![alt text](image-15.png)
![alt text](image-16.png)
![alt text](image-17.png)
![alt text](image-18.png)
![alt text](image-19.png)
![alt text](image-20.png)
![alt text](image-21.png)
![alt text](image-22.png)

## 6. dokumentasi

![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image-3.png)
![alt text](image-4.png)
![alt text](image-5.png)
![alt text](image-8.png)
![alt text](image-9.png)
![alt text](image-23.png)
![alt text](image-24.png)

## 7. link deploy vercel

https://project-pws-0096-pxec.vercel.app
