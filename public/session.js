// ==========================================================================
// WisataData API — Session Helper (dipakai di index.html, auth.html, dashboard.html)
//
// Catatan keamanan: token JWT disimpan di localStorage demi kesederhanaan
// (proyek tugas, tanpa server-side session/cookie). Ini rentan terhadap XSS,
// makanya Content-Security-Policy di backend (helmet) membatasi script hanya
// boleh dari domain sendiri ('self') untuk memperkecil risiko itu. Token juga
// otomatis kedaluwarsa (default 1 hari) sesuai JWT_EXPIRES_IN di backend.
// ==========================================================================

const Session = (() => {
  const TOKEN_KEY = 'wisatadata_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  // Decode payload JWT tanpa verifikasi tanda tangan — HANYA untuk keperluan
  // tampilan (misal sapa nama user). Verifikasi asli tetap dilakukan di server
  // setiap request lewat middleware authJwt.
  function decodePayload() {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const json = decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // Panggil di halaman yang WAJIB login (dashboard). Kalau tidak ada token,
  // langsung redirect ke halaman login.
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/auth.html';
    }
  }

  // Panggil di halaman auth.html — kalau user sudah login, tidak perlu lihat
  // form login lagi, langsung lempar ke dashboard.
  function redirectIfAuthed() {
    if (isLoggedIn()) {
      window.location.href = '/dashboard.html';
    }
  }

  function logout() {
    clearToken();
    window.location.href = '/auth.html';
  }

  // Wrapper fetch yang otomatis menyertakan header Authorization Bearer.
  // Kalau server balas 401 (token invalid/expired), otomatis logout supaya
  // user tidak stuck di halaman yang datanya sudah tidak valid.
  async function authFetch(path, options = {}) {
    const token = getToken();
    const headers = Object.assign({}, options.headers, {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    const res = await fetch(path, { ...options, headers });
    if (res.status === 401) {
      clearToken();
      window.location.href = '/auth.html';
      throw new Error('Sesi berakhir, silakan masuk kembali.');
    }
    return res;
  }

  return { getToken, setToken, clearToken, isLoggedIn, decodePayload, requireAuth, redirectIfAuthed, logout, authFetch };
})();
