## 1. Fitur Utama

- **Antarmuka Web Lengkap** — Landing page, halaman Login/Daftar, Dashboard pengelolaan API Key,
  dan halaman Jelajah Destinasi, dibangun dengan HTML/CSS/JavaScript murni (tanpa framework).
- **Dua Jalur Akses Data**:
  - **User (lewat website)** — cukup daftar/login, langsung bisa menjelajahi seluruh destinasi
    wisata di halaman `/destinasi.html` tanpa perlu memasukkan API key sama sekali (otomatis
    memakai sesi login/JWT).
  - **Developer (lewat REST API)** — untuk integrasi ke aplikasi lain, wajib memakai API Key
    (`x-api-key`) yang dibuat sendiri lewat Dashboard.
- **Autentikasi akun dengan JWT** (register & login), dipakai baik untuk sesi web maupun manajemen akun.
- **Manajemen API Key** — setiap akun bisa membuat, melihat (dengan penyamaran), dan mencabut (revoke)
  API key lewat Dashboard maupun REST API.
- **Data API publik** (butuh API Key) untuk mengambil data destinasi wisata & kategori, lengkap
  dengan filter, pencarian, dan pagination.
- **Pencatatan pemakaian API** (`api_usage_logs`) sebagai dasar kuota harian per API key.
- **Minimal 74 data destinasi wisata** nyata dari berbagai provinsi di Indonesia (melebihi syarat
  minimal 50 data), dengan 10 kategori wisata.
- **Keamanan tambahan**: API key disamarkan setelah pertama dibuat, rate limit khusus percobaan
  login/registrasi (anti brute-force), dan validasi sesi otomatis di frontend.
- Siap deploy sebagai **serverless function** di **Vercel**, dengan database **PostgreSQL (Supabase)**.

## 2. Tech Stack

| Layer      | Teknologi                                |
| ---------- | ---------------------------------------- |
| Runtime    | Node.js 18+, Express.js                  |
| Frontend   | HTML, CSS, JavaScript murni (vanilla)    |
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

Diagram ERD, Use Case, dan Activity/User Flow lengkap ada di **laporan PDF**

## 4. Halaman Web

| Halaman           | Path              | Fungsi                                                                   |
| ----------------- | ----------------- | ------------------------------------------------------------------------ |
| Landing Page      | `/`               | Perkenalan produk, statistik, dokumentasi endpoint, demo untuk developer |
| Login / Daftar    | `/auth.html`      | Registrasi & login akun                                                  |
| Dashboard         | `/dashboard.html` | Kelola API key: buat, lihat (tersamar), cabut, lihat statistik           |
| Jelajah Destinasi | `/destinasi.html` | Browsing data destinasi dengan filter & pagination (pakai sesi login)    |

## 5. Endpoint Tambahan (di luar yang sudah ada sebelumnya)

| Method | Endpoint                      | Auth | Keterangan                                     |
| ------ | ----------------------------- | ---- | ---------------------------------------------- |
| GET    | `/account/me`                 | JWT  | Profil akun yang sedang login                  |
| GET    | `/app/categories`             | JWT  | Daftar kategori (versi sesi login, untuk web)  |
| GET    | `/app/destinations`           | JWT  | Daftar destinasi (versi sesi login, untuk web) |
| GET    | `/app/destinations/:idOrSlug` | JWT  | Detail destinasi (versi sesi login, untuk web) |

## 6. Lisensi

MIT — dibuat untuk keperluan tugas akademik.

## 7. POSTMAN

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

## 8. dokumentasi

![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image-3.png)
![alt text](image-4.png)
![alt text](image-5.png)
![alt text](image-8.png)
![alt text](image-9.png)
![alt text](image-23.png)
![alt text](image-24.png)

## 9. link deploy vercel

https://project-pws-0096-pxec.vercel.app/
