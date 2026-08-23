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

## 4. Struktur Folder

```
.
├── api/
│   └── index.js          # entry point serverless untuk Vercel
├── src/
│   ├── app.js             # konfigurasi Express app (dipakai lokal & Vercel)
│   ├── server.js          # entry point untuk development lokal
│   ├── config/db.js       # koneksi PostgreSQL (pg Pool)
│   ├── middleware/
│   │   ├── authJwt.js      # proteksi endpoint akun dengan JWT
│   │   └── authApiKey.js   # proteksi endpoint data dengan API Key
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── apiKeys.routes.js
│   │   ├── destinations.routes.js
│   │   └── categories.routes.js
│   └── db/
│       ├── schema.sql      # DDL seluruh tabel
│       ├── migrate.js      # runner migrasi (npm run migrate)
│       ├── seed.js         # runner seeding data (npm run seed)
│       └── data/           # data mentah kategori & destinasi
├── vercel.json
├── package.json
└── .env.example
```

## 5. Menjalankan Secara Lokal

### 5.1 Prasyarat

- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis) atau PostgreSQL lokal

### 5.2 Setup Database di Supabase

1. Buat project baru di Supabase.
2. Buka **Project Settings > Database > Connection string**, salin URI (gunakan mode
   _Session pooler_ atau _Direct connection_).
3. Salin `.env.example` menjadi `.env`, isi `DATABASE_URL` dengan connection string tadi, dan isi
   `JWT_SECRET` dengan string acak yang panjang.

### 5.3 Install, Migrasi, dan Seed

```bash
npm install
npm run migrate   # membuat seluruh tabel dari src/db/schema.sql
npm run seed       # mengisi kategori, 74 destinasi, dan akun demo
```

Output `npm run seed` akan menampilkan **akun demo** dan **API Key demo** yang bisa langsung
dipakai untuk mencoba API tanpa perlu register ulang:

```
Akun demo   : demo@wisatadata.id / Demo1234!
API Key demo: wd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5.4 Menjalankan Server

```bash
npm run dev     # dengan nodemon, auto-reload
# atau
npm start
```

Server berjalan di `http://localhost:3000`.

## 6. Deploy ke Vercel

1. Push project ini ke repository GitHub.
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repo GitHub tersebut.
3. Pada bagian **Environment Variables**, tambahkan:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (opsional, default `1d`)
   - `NODE_ENV=production`
4. Klik **Deploy**. Vercel otomatis mendeteksi `vercel.json` dan menjalankan `api/index.js`
   sebagai serverless function untuk seluruh route.
5. Setelah deploy sukses, jalankan migrasi & seed **satu kali** dari komputer lokal (menunjuk ke
   `DATABASE_URL` Supabase yang sama), karena migrasi/seed tidak dijalankan otomatis oleh Vercel:
   ```bash
   npm run migrate
   npm run seed
   ```

## 7. Dokumentasi Endpoint API

### 7.1 Autentikasi (JWT) — publik

| Method | Endpoint         | Body                        | Keterangan                                   |
| ------ | ---------------- | --------------------------- | -------------------------------------------- |
| POST   | `/auth/register` | `{ name, email, password }` | Membuat akun baru + langsung dapat token JWT |
| POST   | `/auth/login`    | `{ email, password }`       | Login, mendapat token JWT                    |

Contoh:

```bash
curl -X POST https://<domain-vercel-anda>/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@wisatadata.id","password":"Demo1234!"}'
```

### 7.2 Manajemen API Key — butuh JWT (`Authorization: Bearer <token>`)

| Method | Endpoint                       | Keterangan                      |
| ------ | ------------------------------ | ------------------------------- |
| GET    | `/account/api-keys`            | Daftar API key milik akun login |
| POST   | `/account/api-keys`            | Buat API key baru `{ label }`   |
| PATCH  | `/account/api-keys/:id/revoke` | Nonaktifkan API key             |
| GET    | `/account/api-keys/:id/usage`  | Statistik pemakaian API key     |

Contoh:

```bash
curl -X POST https://<domain-vercel-anda>/account/api-keys \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"label":"Key untuk aplikasi mobile"}'
```

### 7.3 Data API (produk utama) — butuh API Key (`x-api-key: <api_key>`)

| Method | Endpoint                         | Keterangan                                    |
| ------ | -------------------------------- | --------------------------------------------- |
| GET    | `/api/v1/categories`             | Daftar kategori wisata                        |
| GET    | `/api/v1/destinations`           | Daftar destinasi (filter, search, pagination) |
| GET    | `/api/v1/destinations/:idOrSlug` | Detail satu destinasi (by id atau slug)       |

Query parameter untuk `GET /api/v1/destinations`:

- `page`, `limit` — pagination (default `page=1`, `limit=10`, maks `50`)
- `province` — filter provinsi, contoh `?province=Bali`
- `category` — filter slug kategori, contoh `?category=pantai`
- `search` — cari di nama/deskripsi, contoh `?search=kelingking`
- `min_rating` — rating minimum, contoh `?min_rating=4.5`
- `featured` — `true` untuk destinasi unggulan saja

Contoh:

```bash
curl "https://<domain-vercel-anda>/api/v1/destinations?province=Bali&min_rating=4.5" \
  -H "x-api-key: wd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Contoh response:

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Pantai Kelingking",
      "slug": "pantai-kelingking",
      "category": "Pantai",
      "category_slug": "pantai",
      "province": "Bali",
      "city": "Nusa Penida",
      "ticket_price": 10000,
      "rating": "4.8",
      "facilities": ["Parkir", "Toilet", "Warung", "Spot Foto"],
      "is_featured": true
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 5, "total_pages": 1 }
}
```

## 8. Akun & API Key Demo

Setelah `npm run seed` dijalankan, gunakan kredensial berikut untuk uji coba cepat:

- **Email**: `demo@wisatadata.id`
- **Password**: `Demo1234!`
- **API Key**: ditampilkan di terminal setelah seeding (juga bisa dilihat lagi lewat
  `GET /account/api-keys` setelah login).

## 9. Lisensi

MIT — dibuat untuk keperluan tugas akademik.

## 10. POSTMAN

![alt text](image.png)

## 11. dokumentasi

![alt text](image-1.png)
![alt text](image-2.png)
