/* Logs — markdown posts from logs/posts/ via logs/index.json */
(function () {
  let allPosts = [];
  let currentFilter = 'all';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderLogsList() {
    const container = document.getElementById('logs-list');
    if (!container) return;

    const filtered =
      currentFilter === 'all'
        ? allPosts
        : allPosts.filter((p) => p.category === currentFilter);

    if (!filtered.length) {
      container.innerHTML =
        '<p class="logs-empty">No posts in this category yet.</p>';
      return;
    }

    container.innerHTML = filtered
      .map(
        (post) => `
    <div class="log-item" data-file="${escapeHtml(post.file)}" role="button" tabindex="0">
      <span class="log-title">${escapeHtml(post.title)}</span>
      <span class="log-date">${escapeHtml(post.date)}</span>
    </div>
  `
      )
      .join('');

    container.querySelectorAll('.log-item').forEach((row) => {
      const open = () => loadLogDetail(row.dataset.file);
      row.addEventListener('click', open);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  async function loadLogs() {
    const container = document.getElementById('logs-list');
    if (!container) return;

    try {
      const res = await fetch('logs/index.json');
      if (!res.ok) throw new Error('index.json not found');
      allPosts = await res.json();
      allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderLogsList();
    } catch (err) {
      console.error('loadLogs', err);
      container.innerHTML =
        '<p class="logs-empty">Could not load posts. Check logs/index.json.</p>';
    }
  }

  async function loadLogDetail(file) {
    if (!file || !/^[a-zA-Z0-9._-]+\.md$/.test(file)) return;

    const listEl = document.getElementById('logs-list');
    const detailEl = document.getElementById('logs-detail');
    if (!listEl || !detailEl) return;

    try {
      const res = await fetch('logs/posts/' + encodeURIComponent(file));
      if (!res.ok) throw new Error('post not found');
      const raw = await res.text();
      const content = raw.replace(/^---[\s\S]*?---\n?/, '');
      const html =
        typeof marked !== 'undefined'
          ? marked.parse(content)
          : '<pre>' + escapeHtml(content) + '</pre>';

      const post = allPosts.find((p) => p.file === file);
      const titleHtml = post
        ? `<h1 class="log-detail-title">${escapeHtml(post.title)}</h1><p class="log-detail-meta">${escapeHtml(post.date)}</p>`
        : '';

      listEl.style.display = 'none';
      detailEl.innerHTML = `
    <button type="button" class="log-back-btn">← Back</button>
    ${titleHtml}
    <div class="log-content">${html}</div>
  `;
      detailEl.style.display = 'block';
      detailEl.querySelector('.log-back-btn')?.addEventListener('click', showLogsList);
    } catch (err) {
      console.error('loadLogDetail', err);
      detailEl.innerHTML =
        '<button type="button" class="log-back-btn">← Back</button><p class="logs-empty">Could not load this post.</p>';
      detailEl.style.display = 'block';
      listEl.style.display = 'none';
      detailEl.querySelector('.log-back-btn')?.addEventListener('click', showLogsList);
    }
  }

  function showLogsList() {
    const listEl = document.getElementById('logs-list');
    const detailEl = document.getElementById('logs-detail');
    if (detailEl) {
      detailEl.style.display = 'none';
      detailEl.innerHTML = '';
    }
    if (listEl) listEl.style.display = 'block';
    renderLogsList();
  }

  function filterLogs(category) {
    currentFilter = category;
    document.querySelectorAll('#logsPage .logs-filter .filter-btn').forEach((btn) => {
      const match = btn.getAttribute('data-filter') === category;
      btn.classList.toggle('active', match);
    });
    showLogsList();
  }

  function initLogsFilters() {
    document.querySelectorAll('#logsPage .logs-filter .filter-btn').forEach((btn) => {
      if (btn.dataset.logsFilterBound) return;
      btn.dataset.logsFilterBound = '1';
      btn.addEventListener('click', () => {
        filterLogs(btn.getAttribute('data-filter') || 'all');
      });
    });
  }

  window.loadLogs = loadLogs;
  window.loadLogDetail = loadLogDetail;
  window.showLogsList = showLogsList;
  window.filterLogs = filterLogs;

  document.addEventListener('DOMContentLoaded', initLogsFilters);
})();
