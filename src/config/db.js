const { Pool } = require('pg');
require('dotenv').config();

// Supabase/PostgreSQL butuh SSL saat terkoneksi dari luar (Vercel -> Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5, // batasi koneksi karena environment serverless (Vercel)
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
