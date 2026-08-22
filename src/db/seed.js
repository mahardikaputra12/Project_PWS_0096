/**
 * Mengisi database dengan data awal: categories + destinations (>= 50 baris)
 * serta 1 akun demo (email: demo@wisatadata.id / password: Demo1234!)
 * Jalankan: npm run seed
 */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const categories = require('./data/categories');
const destinations = require('./data/destinations');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateApiKey() {
  return 'wd_' + crypto.randomBytes(24).toString('hex');
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding categories...');
    const categoryIdBySlug = {};
    for (const cat of categories) {
      const res = await client.query(
        `INSERT INTO categories (name, slug, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [cat.name, cat.slug, cat.description]
      );
      categoryIdBySlug[res.rows[0].slug] = res.rows[0].id;
    }
    console.log(`  -> ${categories.length} kategori siap.`);

    console.log('Seeding destinations...');
    let count = 0;
    for (const d of destinations) {
      const categoryId = categoryIdBySlug[d.category];
      if (!categoryId) {
        console.warn(`  !! kategori "${d.category}" tidak ditemukan, lewati: ${d.name}`);
        continue;
      }
      const slug = slugify(d.name);
      await client.query(
        `INSERT INTO destinations
          (name, slug, category_id, province, city, address, description,
           latitude, longitude, ticket_price, rating, opening_hours,
           facilities, is_featured, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (slug) DO NOTHING`,
        [
          d.name, slug, categoryId, d.province, d.city, d.address, d.description,
          d.latitude, d.longitude, d.ticket_price, d.rating, d.opening_hours,
          d.facilities, !!d.is_featured, `https://picsum.photos/seed/${slug}/800/600`,
        ]
      );
      count++;
    }
    console.log(`  -> ${count} destinasi diproses.`);

    console.log('Seeding demo user & API key...');
    const passwordHash = await bcrypt.hash('Demo1234!', 10);
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'developer')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Demo Developer', 'demo@wisatadata.id', passwordHash]
    );
    const userId = userRes.rows[0].id;

    const existingKey = await client.query(
      `SELECT id, api_key FROM api_keys WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    let apiKey;
    if (existingKey.rows.length > 0) {
      apiKey = existingKey.rows[0].api_key;
    } else {
      apiKey = generateApiKey();
      await client.query(
        `INSERT INTO api_keys (user_id, label, api_key) VALUES ($1, 'Demo Key', $2)`,
        [userId, apiKey]
      );
    }

    console.log('\nSeeding selesai!');
    console.log('==========================================');
    console.log('Akun demo   : demo@wisatadata.id / Demo1234!');
    console.log('API Key demo:', apiKey);
    console.log('==========================================');
  } catch (err) {
    console.error('Seeding gagal:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
