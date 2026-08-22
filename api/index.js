// Entry point serverless untuk Vercel.
// Vercel akan menjalankan setiap request lewat file ini,
// sementara logika utama tetap berada di src/app.js (Express app biasa).
const app = require('../src/app');

module.exports = app;
