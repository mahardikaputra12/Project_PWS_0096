// ==========================================================================
// WisataData API — Login / Register Logic
// ==========================================================================

Session.redirectIfAuthed();

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authStatus = document.getElementById('authStatus');

function showLogin() {
  loginForm.hidden = false;
  registerForm.hidden = true;
  tabLogin.classList.add('is-active');
  tabRegister.classList.remove('is-active');
  tabLogin.setAttribute('aria-selected', 'true');
  tabRegister.setAttribute('aria-selected', 'false');
  setStatus('');
}

function showRegister() {
  loginForm.hidden = true;
  registerForm.hidden = false;
  tabRegister.classList.add('is-active');
  tabLogin.classList.remove('is-active');
  tabRegister.setAttribute('aria-selected', 'true');
  tabLogin.setAttribute('aria-selected', 'false');
  setStatus('');
}

function setStatus(message, state) {
  authStatus.textContent = message;
  authStatus.dataset.state = state || '';
}

tabLogin.addEventListener('click', showLogin);
tabRegister.addEventListener('click', showRegister);
document.getElementById('goRegister').addEventListener('click', showRegister);
document.getElementById('goLogin').addEventListener('click', showLogin);

// -------------------- Login --------------------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  setStatus('Memproses…');
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setStatus(json.message || 'Login gagal.', 'error');
      return;
    }

    Session.setToken(json.data.token);
    setStatus('Berhasil masuk, mengarahkan…', 'ok');
    window.location.href = '/dashboard.html';
  } catch (err) {
    setStatus('Gagal menghubungi server: ' + err.message, 'error');
  }
});

// -------------------- Register --------------------
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const passwordConfirm = document.getElementById('regPasswordConfirm').value;

  if (password.length < 6) {
    setStatus('Password minimal 6 karakter.', 'error');
    return;
  }
  if (password !== passwordConfirm) {
    setStatus('Konfirmasi password tidak cocok.', 'error');
    return;
  }

  setStatus('Memproses…');
  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setStatus(json.message || 'Registrasi gagal.', 'error');
      return;
    }

    Session.setToken(json.data.token);
    setStatus('Akun berhasil dibuat, mengarahkan…', 'ok');
    window.location.href = '/dashboard.html';
  } catch (err) {
    setStatus('Gagal menghubungi server: ' + err.message, 'error');
  }
});
