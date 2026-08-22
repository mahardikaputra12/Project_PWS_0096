/**
 * Menjalankan schema.sql ke database yang ditunjuk DATABASE_URL.
 * Jalankan: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('Menjalankan migrasi schema.sql ...');
    await client.query(sql);
    console.log('Migrasi selesai. Tabel siap digunakan.');
  } catch (err) {
    console.error('Migrasi gagal:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
