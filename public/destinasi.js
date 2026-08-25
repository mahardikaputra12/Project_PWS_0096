// ==========================================================================
// WisataData API — Halaman Browsing Destinasi (pakai sesi login, bukan API key)
// ==========================================================================

Session.requireAuth();

const userGreeting = document.getElementById('userGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const provinceFilter = document.getElementById('provinceFilter');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const browseStatus = document.getElementById('browseStatus');
const browseGrid = document.getElementById('browseGrid');
const browsePagination = document.getElementById('browsePagination');

logoutBtn.addEventListener('click', () => Session.logout());

let currentPage = 1;
let searchDebounce;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatCurrency(n) {
  if (!n) return 'Gratis';
  return 'Rp' + Number(n).toLocaleString('id-ID');
}

// -------------------- Load profile (sapaan) --------------------
async function loadProfile() {
  try {
    const res = await Session.authFetch('/account/me');
    const json = await res.json();
    if (json.success) userGreeting.textContent = `Halo, ${json.data.name}`;
  } catch {
    /* handled by authFetch */
  }
}

// -------------------- Load categories for filter --------------------
async function loadCategoryOptions() {
  try {
    const res = await Session.authFetch('/app/categories');
    const json = await res.json();
    if (!json.success) return;
    json.data.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.slug;
      opt.textContent = `${cat.name} (${cat.total_destinations})`;
      categoryFilter.appendChild(opt);
    });
  } catch {
    /* handled */
  }
}

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
  provinceFilter.appendChild(opt);
});

// -------------------- Load destinations --------------------
async function loadDestinations(page = 1) {
  currentPage = page;
  browseStatus.textContent = 'Memuat…';
  browseGrid.innerHTML = '';

  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', 9);
  if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
  if (provinceFilter.value) params.set('province', provinceFilter.value);
  if (categoryFilter.value) params.set('category', categoryFilter.value);
  if (sortFilter.value === 'featured') params.set('featured', 'true');

  try {
    const res = await Session.authFetch('/app/destinations?' + params.toString());
    const json = await res.json();

    if (!json.success) {
      browseStatus.textContent = json.message || 'Gagal memuat data.';
      return;
    }

    if (json.data.length === 0) {
      browseStatus.textContent = 'Tidak ada destinasi yang cocok dengan filter ini.';
      browsePagination.innerHTML = '';
      return;
    }

    browseStatus.textContent = `Menampilkan ${json.data.length} dari ${json.pagination.total} destinasi.`;
    renderGrid(json.data);
    renderPagination(json.pagination);
  } catch {
    /* handled by authFetch */
  }
}

function renderGrid(items) {
  browseGrid.innerHTML = items
    .map(
      (item) => `
    <article class="dcard">
      <div class="dcard__img" style="background-image:url('${escapeHtml(item.image_url)}')">
        ${item.is_featured ? '<span class="dcard__badge">⭐ Unggulan</span>' : ''}
      </div>
      <div class="dcard__body">
        <p class="dcard__cat">${escapeHtml(item.category)} · ${escapeHtml(item.province)}</p>
        <h3 class="dcard__name">${escapeHtml(item.name)}</h3>
        <p class="dcard__desc">${escapeHtml((item.description || '').slice(0, 90))}${(item.description || '').length > 90 ? '…' : ''}</p>
        <div class="dcard__foot">
          <span class="dcard__rating">⭐ ${item.rating}</span>
          <strong class="dcard__price">${formatCurrency(item.ticket_price)}</strong>
        </div>
      </div>
    </article>
  `
    )
    .join('');
}

function renderPagination(pagination) {
  const { page, total_pages } = pagination;
  if (total_pages <= 1) {
    browsePagination.innerHTML = '';
    return;
  }
  browsePagination.innerHTML = `
    <button class="btn btn--ghost-light" id="prevPage" ${page <= 1 ? 'disabled' : ''}>← Sebelumnya</button>
    <span class="browse__page-info">Halaman ${page} dari ${total_pages}</span>
    <button class="btn btn--ghost-light" id="nextPage" ${page >= total_pages ? 'disabled' : ''}>Selanjutnya →</button>
  `;
  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (page > 1) { loadDestinations(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (page < total_pages) { loadDestinations(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
}

// -------------------- Filter event listeners --------------------
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => loadDestinations(1), 400);
});
provinceFilter.addEventListener('change', () => loadDestinations(1));
categoryFilter.addEventListener('change', () => loadDestinations(1));
sortFilter.addEventListener('change', () => loadDestinations(1));

// -------------------- Init --------------------
loadProfile();
loadCategoryOptions();
loadDestinations(1);
