// ==========================================================================
// WisataData API — Dashboard Logic
// ==========================================================================

Session.requireAuth();

const userGreeting = document.getElementById('userGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const createKeyForm = document.getElementById('createKeyForm');
const keyLabelInput = document.getElementById('keyLabelInput');
const createStatus = document.getElementById('createStatus');
const newKeyPanel = document.getElementById('newKeyPanel');
const newKeyValue = document.getElementById('newKeyValue');
const copyKeyBtn = document.getElementById('copyKeyBtn');
const dismissNewKey = document.getElementById('dismissNewKey');
const keysList = document.getElementById('keysList');
const usagePanel = document.getElementById('usagePanel');
const usageKeyLabel = document.getElementById('usageKeyLabel');
const usageTotal = document.getElementById('usageTotal');
const usageTableBody = document.getElementById('usageTableBody');
const closeUsage = document.getElementById('closeUsage');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

logoutBtn.addEventListener('click', () => Session.logout());

// -------------------- Load profile --------------------
async function loadProfile() {
  try {
    const res = await Session.authFetch('/account/me');
    const json = await res.json();
    if (json.success) {
      userGreeting.textContent = `Halo, ${json.data.name}`;
    }
  } catch {
    /* Session.authFetch sudah handle redirect kalau 401 */
  }
}

// -------------------- Load API keys --------------------
async function loadKeys() {
  keysList.innerHTML = '<p class="dash__loading">Memuat…</p>';
  try {
    const res = await Session.authFetch('/account/api-keys');
    const json = await res.json();

    if (!json.success) {
      keysList.innerHTML = `<p class="dash__loading">Gagal memuat: ${escapeHtml(json.message)}</p>`;
      return;
    }

    if (json.data.length === 0) {
      keysList.innerHTML = '<p class="dash__loading">Belum ada API key. Buat satu di atas.</p>';
      return;
    }

    keysList.innerHTML = '';
    json.data.forEach((key) => {
      const row = document.createElement('div');
      row.className = 'key-row' + (key.is_active ? '' : ' key-row--revoked');
      row.innerHTML = `
        <div class="key-row__main">
          <p class="key-row__label">${escapeHtml(key.label)} ${key.is_active ? '' : '<span class="badge badge--off">Nonaktif</span>'}</p>
          <code class="key-row__value">${escapeHtml(key.api_key)}</code>
          <p class="key-row__meta">Dibuat ${formatDate(key.created_at)} · Terakhir dipakai ${formatDate(key.last_used_at)}</p>
        </div>
        <div class="key-row__actions">
          <button class="link-btn" data-action="usage" data-id="${key.id}" data-label="${escapeHtml(key.label)}">Statistik</button>
          ${key.is_active ? `<button class="link-btn link-btn--danger" data-action="revoke" data-id="${key.id}">Cabut</button>` : ''}
        </div>
      `;
      keysList.appendChild(row);
    });
  } catch {
    /* handled by authFetch */
  }
}

keysList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.action === 'revoke') {
    const confirmed = confirm('Yakin ingin mencabut API key ini? Aplikasi yang memakainya akan langsung berhenti berfungsi.');
    if (!confirmed) return;
    try {
      const res = await Session.authFetch(`/account/api-keys/${id}/revoke`, { method: 'PATCH' });
      const json = await res.json();
      if (json.success) loadKeys();
      else alert(json.message || 'Gagal mencabut API key.');
    } catch {
      /* handled */
    }
  }

  if (btn.dataset.action === 'usage') {
    openUsage(id, btn.dataset.label);
  }
});

// -------------------- Create key --------------------
createKeyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const label = keyLabelInput.value.trim();
  createStatus.textContent = 'Membuat…';

  try {
    const res = await Session.authFetch('/account/api-keys', {
      method: 'POST',
      body: JSON.stringify({ label: label || undefined }),
    });
    const json = await res.json();

    if (!json.success) {
      createStatus.textContent = json.message || 'Gagal membuat API key.';
      return;
    }

    createStatus.textContent = '';
    keyLabelInput.value = '';
    newKeyValue.textContent = json.data.api_key;
    newKeyPanel.hidden = false;
    newKeyPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    loadKeys();
  } catch {
    /* handled */
  }
});

copyKeyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(newKeyValue.textContent);
    copyKeyBtn.textContent = 'Tersalin ✓';
    setTimeout(() => (copyKeyBtn.textContent = 'Salin'), 1500);
  } catch {
    alert('Gagal menyalin otomatis, silakan salin manual: ' + newKeyValue.textContent);
  }
});

dismissNewKey.addEventListener('click', () => {
  newKeyPanel.hidden = true;
  newKeyValue.textContent = '';
});

// -------------------- Usage detail --------------------
async function openUsage(id, label) {
  usagePanel.hidden = false;
  usageKeyLabel.textContent = label;
  usageTableBody.innerHTML = '<tr><td colspan="4">Memuat…</td></tr>';
  usagePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

  try {
    const res = await Session.authFetch(`/account/api-keys/${id}/usage`);
    const json = await res.json();
    if (!json.success) {
      usageTableBody.innerHTML = `<tr><td colspan="4">${escapeHtml(json.message)}</td></tr>`;
      return;
    }

    usageTotal.textContent = json.data.total_requests_today;

    if (json.data.recent_requests.length === 0) {
      usageTableBody.innerHTML = '<tr><td colspan="4">Belum ada request tercatat.</td></tr>';
      return;
    }

    usageTableBody.innerHTML = json.data.recent_requests
      .map(
        (r) => `
        <tr>
          <td>${formatDate(r.requested_at)}</td>
          <td>${escapeHtml(r.method)}</td>
          <td>${escapeHtml(r.endpoint)}</td>
          <td>${r.status_code}</td>
        </tr>`
      )
      .join('');
  } catch {
    /* handled */
  }
}

closeUsage.addEventListener('click', () => {
  usagePanel.hidden = true;
});

// -------------------- Init --------------------
loadProfile();
loadKeys();
