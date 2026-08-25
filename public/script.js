// ==========================================================================
// WisataData API — Landing Page Interactivity
// ==========================================================================

document.getElementById('githubLink')?.setAttribute('href', 'https://github.com/');

// -------------------- Toggle nav: Masuk vs Dashboard --------------------
const authNavLink = document.getElementById('authNavLink');
if (authNavLink && typeof Session !== 'undefined' && Session.isLoggedIn()) {
  authNavLink.textContent = 'Dashboard';
  authNavLink.href = '/dashboard.html';
}

// -------------------- Animated stat counters --------------------
function animateCount(el, target, duration = 900) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      animateCount(el, parseInt(el.dataset.count, 10));
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.stamp__num').forEach((el) => statObserver.observe(el));

// -------------------- Rotating "passport stamp" --------------------
const SAMPLE_PLACES = [
  { name: 'Pantai Kuta', coord: '-8.7183°, 115.1686°', region: 'BALI' },
  { name: 'Danau Toba', coord: '2.6845°, 98.8756°', region: 'SUMATRA UTARA' },
  { name: 'Candi Borobudur', coord: '-7.6079°, 110.2038°', region: 'JAWA TENGAH' },
  { name: 'Taman Nasional Komodo', coord: '-8.5455°, 119.4890°', region: 'NUSA TENGGARA TIMUR' },
  { name: 'Kepulauan Raja Ampat', coord: '-0.5000°, 130.5000°', region: 'PAPUA BARAT' },
  { name: 'Gunung Bromo', coord: '-7.9425°, 112.9530°', region: 'JAWA TIMUR' },
  { name: 'Pulau Padar', coord: '-8.6144°, 119.5722°', region: 'NUSA TENGGARA TIMUR' },
];

let placeIndex = 0;
const stampEl = document.getElementById('coordStamp');
const placeEl = document.getElementById('coordPlace');
const coordEl = document.getElementById('coordValue');
const line2El = document.querySelector('.passport__line2');

function rotatePlace() {
  if (!stampEl) return;
  stampEl.style.opacity = '0';
  stampEl.style.transform = 'rotate(-8deg) scale(0.96)';
  setTimeout(() => {
    placeIndex = (placeIndex + 1) % SAMPLE_PLACES.length;
    const place = SAMPLE_PLACES[placeIndex];
    placeEl.textContent = place.name;
    coordEl.textContent = place.coord;
    line2El.textContent = `${place.region} · WISATADATA API`;
    stampEl.style.opacity = '1';
    stampEl.style.transform = 'rotate(-8deg) scale(1)';
  }, 380);
}

if (stampEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setInterval(rotatePlace, 3200);
}

// -------------------- Live "Try it" panel --------------------
const apiKeyInput = document.getElementById('apiKeyInput');
const provinceSelect = document.getElementById('provinceSelect');
const categorySelect = document.getElementById('categorySelect');
const limitInput = document.getElementById('limitInput');
const btnCategories = document.getElementById('btnCategories');
const btnDestinations = document.getElementById('btnDestinations');
const tryStatus = document.getElementById('tryStatus');
const tryResults = document.getElementById('tryResults');

const KNOWN_PROVINCES = [
  'Bali', 'DI Yogyakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
  'Sumatra Utara', 'Sumatra Barat', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Timur', 'Kalimantan Selatan', 'Kalimantan Barat', 'Sulawesi Utara',
  'Sulawesi Selatan', 'Sulawesi Tenggara', 'Papua', 'Papua Barat', 'Maluku',
  'Aceh', 'Lampung', 'Banten', 'DKI Jakarta', 'Kepulauan Bangka Belitung',
];
KNOWN_PROVINCES.sort().forEach((p) => {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = p;
  provinceSelect.appendChild(opt);
});

function setStatus(message, state) {
  tryStatus.textContent = message;
  tryStatus.dataset.state = state || '';
}

function formatCurrency(n) {
  if (!n) return 'Gratis';
  return 'Rp' + Number(n).toLocaleString('id-ID');
}

function renderResults(items) {
  tryResults.innerHTML = '';
  if (!items || items.length === 0) {
    tryResults.innerHTML = '<p class="result-empty">Tidak ada data yang cocok dengan filter ini.</p>';
    return;
  }
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    if (item.category) {
      // destination card
      card.innerHTML = `
        <p class="result-card__cat">${escapeHtml(item.category)} · ${escapeHtml(item.province)}</p>
        <h3 class="result-card__name">${escapeHtml(item.name)}</h3>
        <p class="result-card__meta">${escapeHtml((item.description || '').slice(0, 90))}${(item.description || '').length > 90 ? '…' : ''}</p>
        <div class="result-card__foot">
          <span>⭐ ${item.rating}</span>
          <strong>${formatCurrency(item.ticket_price)}</strong>
        </div>
      `;
    } else {
      // category card
      card.innerHTML = `
        <p class="result-card__cat">Kategori</p>
        <h3 class="result-card__name">${escapeHtml(item.name)}</h3>
        <p class="result-card__meta">${escapeHtml(item.description || '')}</p>
        <div class="result-card__foot">
          <span>Slug: ${escapeHtml(item.slug)}</span>
          <strong>${item.total_destinations} destinasi</strong>
        </div>
      `;
    }
    tryResults.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

async function callApi(path) {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setStatus('Isi API key dulu di kolom atas ya.', 'error');
    apiKeyInput.focus();
    return;
  }

  setStatus('Memanggil ' + path + ' …');
  tryResults.innerHTML = '';

  try {
    const res = await fetch(path, {
      headers: { 'x-api-key': apiKey },
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setStatus(`Gagal (${res.status}): ${json.message || 'Terjadi kesalahan.'}`, 'error');
      return;
    }

    const total = json.pagination ? json.pagination.total : json.data.length;
    setStatus(`Berhasil — menampilkan ${json.data.length} dari total ${total} data.`, 'ok');
    renderResults(json.data);

    if (path.includes('/categories')) {
      categorySelect.innerHTML = '<option value="">Semua kategori</option>';
      json.data.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat.slug;
        opt.textContent = `${cat.name} (${cat.total_destinations})`;
        categorySelect.appendChild(opt);
      });
    }
  } catch (err) {
    setStatus('Gagal menghubungi server: ' + err.message, 'error');
  }
}

btnCategories.addEventListener('click', () => {
  callApi('/api/v1/categories');
});

btnDestinations.addEventListener('click', () => {
  const params = new URLSearchParams();
  params.set('limit', limitInput.value || '6');
  if (provinceSelect.value) params.set('province', provinceSelect.value);
  if (categorySelect.value) params.set('category', categorySelect.value);
  callApi('/api/v1/destinations?' + params.toString());
});

apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnDestinations.click();
});
