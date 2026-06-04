/* js/memo.js — 3패널 메모 + Supabase 연동 */
(function () {
  'use strict';

  // ── 공통 유틸 ──────────────────────────────────────
  const fmtLocalDate = window.JCal?.fmtLocalDate || function (d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  };
  const todayStr = () => fmtLocalDate(new Date());

  // ── Supabase ───────────────────────────────────────
  let _sb = null;
  let _userId = null;

  function getSb() {
    if (!_sb && window.supabase?.auth) {
      _sb = window.supabase;
      _sb.auth.onAuthStateChange((_evt, session) => {
        _userId = session?.user?.id || null;
        const page = document.getElementById('memoPage');
        if (_userId && isMemoPageVisible()) {
          syncMemoLoginNudge(page, false);
          initMemoSections();
        } else if (!_userId && isMemoPageVisible()) {
          _sections = buildGuestMemoSections();
          _memos = [];
          renderMemoPage();
        }
      });
      _sb.auth.getSession().then(({ data: { session } }) => {
        _userId = session?.user?.id || null;
      }).catch(e => console.error('[memo] auth init', e));
    }
    return _sb;
  }

  async function getUserId() {
    getSb();
    if (_userId) return _userId;
    if (!_sb) return null;
    try {
      const { data: { session } } = await _sb.auth.getSession();
      _userId = session?.user?.id || null;
      return _userId;
    } catch (e) { return null; }
  }

  function openAppLoginModal() {
    if (typeof window.openAppLoginModal === 'function') window.openAppLoginModal();
    else {
      const overlay = document.getElementById('login-modal-overlay');
      if (overlay) overlay.style.display = 'flex';
      else document.getElementById('login-btn')?.click();
    }
  }

  function syncMemoLoginNudge(pageEl, show) {
    if (typeof window.syncLoginNudgeBanner === 'function') window.syncLoginNudgeBanner(pageEl, show);
  }

  // ── 기본 섹션 3개 ──────────────────────────────────
  const DEFAULT_SECTIONS = [
    { title: 'Today\'s Work', emoji: '📝', color: '#f0fdf4', sort_order: 0 },
    { title: 'Thoughts', emoji: '💭', color: '#eff6ff', sort_order: 1 },
    { title: 'Journal', emoji: '📔', color: '#fdf4ff', sort_order: 2 },
  ];

  const MEMO_COLORS = [
    { name: 'none', bg: '#ffffff', label: '없음' },
    { name: 'rose', bg: '#ffcdd2', label: 'Rose' },
    { name: 'orange', bg: '#ffe0b2', label: 'Orange' },
    { name: 'yellow', bg: '#fff9c4', label: 'Yellow' },
    { name: 'green', bg: '#c8e6c9', label: 'Green' },
    { name: 'blue', bg: '#bbdefb', label: 'Blue' },
    { name: 'lavender', bg: '#e1bee7', label: 'Lavender' },
  ];

  function applyMemoCardColorStyle(card, color) {
    card.style.background = color || '#fff';
    card.style.border = `1px solid ${color ? color : '#f3f4f6'}`;
  }

  function memoContentPreview(text) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    return t.length <= 40 ? t : t.slice(0, 40) + '...';
  }

  function isMemoTouchUI() {
    return window.matchMedia('(hover: none)').matches;
  }

  function buildMemoColorPicker(selectedColor, onSelect) {
    const colorWrap = document.createElement('div');
    colorWrap.className = 'memo-color-picker';
    colorWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

    MEMO_COLORS.forEach(c => {
      const dot = document.createElement('button');
      dot.type = 'button';
      const isSelected = c.name === 'none' ? !selectedColor : selectedColor === c.bg;
      if (c.name === 'none') {
        dot.textContent = '×';
        dot.className = 'memo-color-clear-btn';
        if (isSelected) {
          dot.style.borderColor = '#5C8DFF';
          dot.style.transform = 'scale(1.25)';
        }
      } else {
        dot.style.cssText = `
    width:18px;height:18px;border-radius:50%;
    background:${c.bg};
    border:2px solid ${isSelected ? '#5C8DFF' : c.bg};
    cursor:pointer;padding:0;flex-shrink:0;
    transition:transform 0.1s;
    ${isSelected ? 'transform:scale(1.25);' : ''}
  `;
      }
      dot.addEventListener('mousedown', (e) => e.preventDefault());
      dot.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextColor = c.name === 'none' ? '' : c.bg;
        colorWrap.querySelectorAll('button').forEach(b => {
          b.style.transform = 'scale(1)';
          const isClear = b.classList.contains('memo-color-clear-btn');
          b.style.borderColor = isClear ? '#e5e7eb' : b.style.background;
        });
        dot.style.transform = 'scale(1.25)';
        dot.style.borderColor = '#5C8DFF';
        onSelect(nextColor);
      };
      colorWrap.appendChild(dot);
    });

    return colorWrap;
  }

  function sectionTitle(sec) {
    return (sec?.title || sec?.name || '').trim() || 'Section';
  }

  function normalizeMemoSection(row) {
    const title = (row?.title || row?.name || '').trim();
    return { ...row, title, name: title };
  }

  function bindSectionNameEdit(labelEl, sec) {
    labelEl.onclick = function () {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = sectionTitle(sec);
      input.style.cssText = 'font-weight:600;font-size:13px;flex:1;border:1px solid #5C8DFF;border-radius:4px;padding:2px 4px;width:80px;box-sizing:border-box;';
      let finished = false;

      const finishEdit = async () => {
        if (finished) return;
        finished = true;
        const prevName = sectionTitle(sec);
        const newName = (input.value || '').trim() || prevName;

        const idx = _sections.findIndex(s => String(s.id) === String(sec.id));
        if (idx > -1) {
          _sections[idx] = normalizeMemoSection({ ..._sections[idx], name: newName });
        }
        sec.name = newName;
        sec.title = newName;

        const span = document.createElement('span');
        span.className = 'sec-name-' + sec.id;
        span.style.cssText = 'font-weight:600;font-size:13px;flex:1;cursor:pointer;';
        span.title = 'Click to rename';
        span.textContent = newName;
        bindSectionNameEdit(span, sec);
        input.replaceWith(span);

        const ok = await updateSection(sec.id, { name: newName }, { skipRender: true });
        if (!ok) {
          span.textContent = prevName;
          sec.name = prevName;
          sec.title = prevName;
          if (idx > -1) _sections[idx] = normalizeMemoSection({ ..._sections[idx], name: prevName });
        }
      };

      labelEl.replaceWith(input);
      input.focus();
      input.select();

      input.addEventListener('blur', () => { void finishEdit(); });
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== 'NumpadEnter') return;
        if (e.isComposing) return;
        e.preventDefault();
        e.stopPropagation();
        void finishEdit();
      });
    };
  }

  let _sections = []; // { id, title, name, emoji, color, sort_order }
  let _memos = [];    // { id, section_id, title, content, date, emoji, color }
  let _lastDeletedMemo = null;
  let _viewMode = localStorage.getItem('memo_view_mode') || 'day'; // day | month | all
  let _searchQuery = '';
  let _initPromise = null;

  function isMemoPageVisible() {
    const page = document.getElementById('memoPage');
    if (!page || page.classList.contains('hidden')) return false;
    return window.getComputedStyle(page).display !== 'none';
  }

  // ── 섹션 로드/초기화 ───────────────────────────────
  async function initMemoSections() {
    if (_initPromise) return _initPromise;
    _initPromise = _doInitMemoSections();
    try {
      await _initPromise;
    } finally {
      _initPromise = null;
    }
  }

  function buildGuestMemoSections() {
    return DEFAULT_SECTIONS.map((s, i) => normalizeMemoSection({
      id: 'guest_memo_section_' + i,
      title: s.title,
      emoji: s.emoji,
      color: s.color,
      sort_order: s.sort_order,
    }));
  }

  async function _doInitMemoSections() {
    const userId = await getUserId();
    if (!userId) {
      _sections = buildGuestMemoSections();
      _memos = [];
      renderMemoPage();
      return;
    }
    try {
      const { data, error } = await _sb.from('memo_sections')
        .select('*').eq('user_id', userId).order('sort_order');
      if (error) throw error;

      if (data && data.length > 0) {
        _sections = data.map(normalizeMemoSection);
      } else {
        const { data: existing, error: existErr } = await _sb.from('memo_sections')
          .select('name').eq('user_id', userId);
        if (existErr) throw existErr;
        const existingNames = new Set((existing || []).map(r => (r.name || '').trim()));
        const rows = DEFAULT_SECTIONS
          .filter(s => !existingNames.has(s.title))
          .map(s => ({ name: s.title, emoji: s.emoji, color: s.color, sort_order: s.sort_order, user_id: userId }));
        if (rows.length > 0) {
          const { error: insErr } = await _sb.from('memo_sections').insert(rows);
          if (insErr) throw insErr;
        }
        const { data: all, error: allErr } = await _sb.from('memo_sections')
          .select('*').eq('user_id', userId).order('sort_order');
        if (allErr) throw allErr;
        _sections = (all || []).map(normalizeMemoSection);
      }
      await loadMemos();
    } catch (e) {
      console.error('[memo] initMemoSections', e);
      renderMemoPage();
    }
  }

  // ── 메모 로드 ──────────────────────────────────────
  async function loadMemos() {
    const userId = await getUserId();
    if (!userId) { renderMemoPage(); return; }
    try {
      const { data, error } = await _sb.from('memo')
        .select('*').eq('user_id', userId)
        .order('is_pinned', { ascending: false })
        .order('date', { ascending: false });
      if (error) throw error;
      _memos = data || [];
      renderMemoPage();
    } catch (e) {
      console.error('[memo] loadMemos', e);
      renderMemoPage();
    }
  }

  // ── 메모 저장 ──────────────────────────────────────
  async function saveMemo(sectionId, { title, content, date, emoji, color }) {
    const userId = await getUserId();
    const row = {
      user_id: userId,
      section_id: sectionId,
      title: title || '',
      content: content || '',
      date: date || todayStr(),
      emoji: emoji || '',
      color: color || '',
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await _sb.from('memo').insert(row).select().single();
      if (error) throw error;
      _memos.unshift(data);
      renderMemoPage();
    } catch (e) { console.error('[memo] saveMemo', e); }
  }

  async function toggleMemoPin(memoId, currentPinned) {
    const client = window.supabase;
    if (!client) return;
    const { error } = await client
      .from('memo')
      .update({ is_pinned: !currentPinned })
      .eq('id', memoId);
    if (error) console.error('pin toggle error:', error);
  }

  // ── 메모 수정 ──────────────────────────────────────
  async function updateMemo(id, patch, options = {}) {
    getSb();
    if (!_sb) {
      console.error('[memo] updateMemo: supabase not ready');
      return;
    }
    try {
      const { error } = await _sb.from('memo').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      const idx = _memos.findIndex(m => String(m.id) === String(id));
      if (idx > -1) _memos[idx] = { ..._memos[idx], ...patch };
      if (!options.skipRender) renderMemoPage();
    } catch (e) { console.error('[memo] updateMemo', e); }
  }

  // ── 메모 삭제 ──────────────────────────────────────
  async function deleteMemo(id) {
    try {
      const { error } = await _sb.from('memo').delete().eq('id', id);
      if (error) throw error;
      _memos = _memos.filter(m => m.id !== id);
      renderMemoPage();
    } catch (e) { console.error('[memo] deleteMemo', e); }
  }

  async function deleteMemoWithUndo(id, memoData) {
    _lastDeletedMemo = { ...memoData };
    _memos = _memos.filter(m => m.id !== id);
    renderMemoPage();
    try {
      const { error } = await _sb.from('memo').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('[memo] deleteMemoWithUndo', e);
      _memos.unshift(_lastDeletedMemo);
      _lastDeletedMemo = null;
      renderMemoPage();
    }
  }

  async function undoDeleteMemo() {
    if (!_lastDeletedMemo) return;
    const memo = { ..._lastDeletedMemo };
    _lastDeletedMemo = null;
    try {
      const { data, error } = await _sb.from('memo').insert(memo).select().single();
      if (error) throw error;
      _memos.unshift(data);
      renderMemoPage();
    } catch (e) {
      console.error('[memo] undoDeleteMemo', e);
    }
  }

  // ── 섹션명 수정 ────────────────────────────────────
  async function updateSection(id, patch, options = {}) {
    getSb();
    if (!_sb) {
      console.error('[memo] updateSection: supabase not ready');
      return false;
    }
    const dbPatch = { ...patch };
    if (dbPatch.title !== undefined) {
      dbPatch.name = dbPatch.title;
      delete dbPatch.title;
    }
    if (!('name' in dbPatch)) return false;
    try {
      const { error } = await _sb.from('memo_sections').update(dbPatch).eq('id', id);
      if (error) throw error;
      const idx = _sections.findIndex(s => String(s.id) === String(id));
      if (idx > -1) _sections[idx] = normalizeMemoSection({ ..._sections[idx], ...dbPatch });
      if (!options.skipRender) renderMemoPage();
      return true;
    } catch (e) {
      console.error('[memo] updateSection', e);
      return false;
    }
  }

  // ── 보기 필터 ──────────────────────────────────────
  function sortMemosForDisplay(list) {
    return list.slice().sort((a, b) => {
      const pinA = a.is_pinned ? 1 : 0;
      const pinB = b.is_pinned ? 1 : 0;
      if (pinB !== pinA) return pinB - pinA;
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }

  function getFilteredMemos(sectionId) {
    const base = _memos.filter(m => m.section_id === sectionId);
    let filtered = base;

    if (_searchQuery.trim()) {
      const q = _searchQuery.trim().toLowerCase();
      filtered = base.filter(m =>
        (m.content || '').toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q) ||
        (m.date || '').includes(q)
      );
    } else if (_viewMode === 'day') {
      const t = todayStr();
      filtered = base.filter(m => m.date === t);
    } else if (_viewMode === 'month') {
      const ym = todayStr().slice(0, 7);
      filtered = base.filter(m => m.date?.slice(0, 7) === ym);
    }

    return sortMemosForDisplay(filtered);
  }

  let _memoActionsBound = false;
  function bindMemoCardActions(page) {
    if (_memoActionsBound || !page) return;
    _memoActionsBound = true;

    const hideAllCardActions = () => {
      page.querySelectorAll('.memo-card.is-actions-visible').forEach(c => {
        c.classList.remove('is-actions-visible');
      });
    };

    page.addEventListener('click', (e) => {
      if (!isMemoTouchUI()) return;
      const card = e.target.closest('.memo-card');
      if (card && page.contains(card) && !e.target.closest('.memo-card-actions') && !e.target.closest('.memo-pin-btn')) {
        hideAllCardActions();
        card.classList.add('is-actions-visible');
        return;
      }
      if (!e.target.closest('.memo-card')) hideAllCardActions();
    });
  }

  let _memoPinDelegationBound = false;
  function bindMemoPinDelegation(page) {
    if (_memoPinDelegationBound || !page) return;
    _memoPinDelegationBound = true;
    page.addEventListener('click', async (e) => {
      const btn = e.target.closest('.memo-pin-btn');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();
      const id = btn.dataset.id;
      const currentPinned = btn.dataset.pinned === 'true';
      const nextPinned = !currentPinned;
      btn.classList.toggle('pinned', nextPinned);
      btn.dataset.pinned = String(nextPinned);
      const idx = _memos.findIndex(m => String(m.id) === String(id));
      if (idx > -1) _memos[idx] = { ..._memos[idx], is_pinned: nextPinned };
      await toggleMemoPin(id, currentPinned);
      renderMemoPage();
    });
  }

  // ── 렌더 ───────────────────────────────────────────
  function renderMemoPage() {
    const page = document.getElementById('memoPage');
    if (!page) return;

    bindMemoPinDelegation(page);
    bindMemoCardActions(page);

    page.innerHTML = '';
    page.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';

    // 헤더
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e5e7eb;flex-shrink:0;';
    const undoBtnHtml = _lastDeletedMemo
      ? '<button type="button" id="memoUndoBtn" style="padding:4px 10px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:12px;cursor:pointer;">↩ Undo</button>'
      : '';
    header.innerHTML = `
      <span style="font-weight:700;font-size:16px;">Memo</span>
      <div style="display:flex;gap:6px;align-items:center;">
        <input
          type="text"
          class="memo-search-input"
          placeholder="Search memos..."
          value=""
          style="padding:4px 10px;border-radius:6px;border:1px solid #e5e7eb;font-size:12px;width:160px;outline:none;"
        />
        ${undoBtnHtml}
        ${['Day', 'Month', 'All'].map((v, i) => {
          const modes = ['day', 'month', 'all'];
          const active = _viewMode === modes[i];
          return `<button data-view="${modes[i]}" style="padding:4px 10px;border-radius:6px;border:1px solid ${active ? '#5C8DFF' : '#e5e7eb'};background:${active ? '#5C8DFF' : '#fff'};color:${active ? '#fff' : '#374151'};font-size:12px;cursor:pointer;">${v}</button>`;
        }).join('')}
      </div>
    `;
    const searchInput = header.querySelector('.memo-search-input');
    if (searchInput) {
      searchInput.value = _searchQuery;
      let _isComposing = false;
      searchInput.addEventListener('compositionstart', () => {
        _isComposing = true;
      });
      searchInput.addEventListener('compositionend', (e) => {
        _isComposing = false;
        _searchQuery = e.target.value;
        renderMemoPage();
      });
      searchInput.addEventListener('input', (e) => {
        if (_isComposing) return;
        _searchQuery = e.target.value;
        renderMemoPage();
      });
    }
    const undoBtn = header.querySelector('#memoUndoBtn');
    if (undoBtn) undoBtn.onclick = () => undoDeleteMemo();
    header.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = () => {
        _viewMode = btn.dataset.view;
        localStorage.setItem('memo_view_mode', _viewMode);
        renderMemoPage();
      };
    });
    page.appendChild(header);
    syncMemoLoginNudge(page, !_userId);

    // 3패널 컨테이너
    const panels = document.createElement('div');
    panels.style.cssText = 'display:flex;flex:1;overflow:visible;';

    if (_sections.length === 0) {
      const box = document.createElement('div');
      box.style.cssText = 'padding:32px 24px;text-align:center;color:#6b7280;';
      box.innerHTML = '<p style="margin:0;font-size:14px;">섹션을 불러오지 못했습니다. 새로고침하거나 잠시 후 다시 시도해 주세요.</p>';
      panels.appendChild(box);
      page.appendChild(panels);
      return;
    }

    _sections.forEach((sec, si) => {
      const col = document.createElement('div');
      col.style.cssText = `flex:1;display:flex;flex-direction:column;border-right:${si < _sections.length - 1 ? '1px solid #e5e7eb' : 'none'};overflow:visible;background:#fff;`;

      // 섹션 헤더
      const secHeader = document.createElement('div');
      secHeader.style.cssText = 'display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #e5e7eb;flex-shrink:0;';
      secHeader.innerHTML = `
        <span style="font-size:16px;">${sec.emoji || '📝'}</span>
        <span class="sec-name-${sec.id}" style="font-weight:600;font-size:13px;flex:1;cursor:pointer;" title="Click to rename">${sectionTitle(sec)}</span>
        <button data-add="${sec.id}" style="font-size:18px;background:none;border:none;cursor:pointer;color:#5C8DFF;line-height:1;">+</button>
      `;
      const nameLabel = secHeader.querySelector('.sec-name-' + sec.id);
      if (nameLabel) bindSectionNameEdit(nameLabel, sec);
      col.appendChild(secHeader);

      // 메모 목록
      const list = document.createElement('div');
      list.style.cssText = 'flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px;';

      const filtered = getFilteredMemos(sec.id);

      // + 버튼 → 인라인 입력폼
      secHeader.querySelector('[data-add]').onclick = () => {
        const existing = list.querySelector('.memo-input-form');
        if (existing) { existing.remove(); return; }
        const form = buildInputForm(sec.id, () => {});
        list.prepend(form);
        form.querySelector('textarea')?.focus();
      };

      filtered.forEach(memo => {
        list.appendChild(buildMemoCard(memo));
      });

      col.appendChild(list);
      panels.appendChild(col);
    });

    page.appendChild(panels);
    document.querySelector('.memo-search-input')?.focus();
    if (_searchQuery.trim()) {
      requestAnimationFrame(() => {
        const firstMatch = document.querySelector('#memoPage mark');
        if (firstMatch) {
          firstMatch.closest('[data-memo-card]')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      });
    }
  }

  // ── 입력폼 ─────────────────────────────────────────
  function buildInputForm(sectionId, onDone) {
    const form = document.createElement('div');
    form.className = 'memo-input-form';
    form.style.cssText = `
    background:#fff;
    border:1.5px solid #5C8DFF;
    border-radius:12px;
    padding:14px;
    display:flex;
    flex-direction:column;
    gap:10px;
    box-shadow:0 2px 12px rgba(92,141,255,0.10);
  `;

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = todayStr();
    dateInput.style.cssText = `
    font-size:11px;
    border:1px solid #e5e7eb;
    border-radius:6px;
    padding:3px 8px;
    color:#6b7280;
    background:#f8fafc;
  `;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'memo-input-title';
    titleInput.placeholder = 'Title (optional)';

    const ta = document.createElement('textarea');
    ta.placeholder = 'Write something...';
    ta.rows = 5;
    ta.style.cssText = `
    resize:none;
    border:none;
    outline:none;
    font-size:14px;
    font-family:inherit;
    line-height:1.6;
    width:100%;
    box-sizing:border-box;
    color:#111827;
  `;

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

    let _selectedColor = '';

    const colorWrap = buildMemoColorPicker(_selectedColor, (color) => {
      _selectedColor = color;
    });

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:6px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
    background:#f3f4f6;
    color:#6b7280;
    border:none;
    border-radius:8px;
    padding:6px 14px;
    font-size:12px;
    cursor:pointer;
    font-family:inherit;
  `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = `
    background:#5C8DFF;
    color:#fff;
    border:none;
    border-radius:8px;
    padding:6px 14px;
    font-size:12px;
    font-weight:600;
    cursor:pointer;
    font-family:inherit;
  `;

    saveBtn.onclick = async () => {
      const content = ta.value.trim();
      if (!content) return;
      await saveMemo(sectionId, {
        title: titleInput.value.trim(),
        content,
        date: dateInput.value,
        color: _selectedColor,
      });
      onDone();
    };

    cancelBtn.onclick = () => { form.remove(); onDone(); };

    ta.onkeydown = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        saveBtn.onclick();
      }
      if (e.key === 'Escape') {
        form.remove();
        onDone();
      }
    };

    btns.append(cancelBtn, saveBtn);
    footer.append(colorWrap, btns);
    form.append(dateInput, titleInput, ta, footer);
    return form;
  }

  // ── 메모 카드 ──────────────────────────────────────
  function highlightText(text, query) {
    if (!query || !query.trim()) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark style="background:#FFF176;color:#111827;border-radius:2px;padding:0 1px;">$1</mark>');
  }

  function buildMemoCard(memo) {
    const card = document.createElement('div');
    card.dataset.memoCard = 'true';
    applyMemoCardColorStyle(card, memo.color);
    card.className = 'memo-card';
    card.style.height = 'auto';
    card.style.maxHeight = 'none';
    card.style.overflow = 'visible';

    const actions = document.createElement('div');
    actions.className = 'memo-card-actions';

    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'memo-card-collapse-btn';
    collapseBtn.textContent = '∧';
    collapseBtn.title = 'Collapse';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'memo-card-del-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Delete';

    const previewEl = document.createElement('div');
    previewEl.className = 'memo-card-preview';

    const syncPreview = (text) => {
      previewEl.textContent = memoContentPreview(text);
    };

    collapseBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const collapsed = card.classList.toggle('memo-card--collapsed');
      collapseBtn.textContent = collapsed ? '∨' : '∧';
      collapseBtn.title = collapsed ? 'Expand' : 'Collapse';
      if (collapsed) syncPreview(memo.content || '');
    };

    delBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      deleteMemoWithUndo(memo.id, memo);
    };

    actions.append(collapseBtn, delBtn);

    const dateEl = document.createElement('div');
    dateEl.className = 'memo-card-date';
    if (_searchQuery.trim()) {
      dateEl.innerHTML = highlightText(memo.date || '', _searchQuery);
    } else {
      dateEl.textContent = memo.date || '';
    }

    let titleEl = null;
    if ((memo.title || '').trim()) {
      titleEl = document.createElement('div');
      titleEl.className = 'memo-card-title';
      if (_searchQuery.trim()) {
        titleEl.innerHTML = highlightText(
          (memo.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
          _searchQuery
        );
      } else {
        titleEl.textContent = memo.title;
      }
    }

    const content = document.createElement('div');
    content.className = 'memo-card-content';
    if (_searchQuery.trim()) {
      content.innerHTML = highlightText(
        (memo.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        _searchQuery
      );
    } else {
      content.textContent = memo.content || '';
    }

    syncPreview(memo.content || '');

    if (_userId) {
      const pinBtn = document.createElement('button');
      pinBtn.className = `memo-pin-btn${memo.is_pinned ? ' pinned' : ''}`;
      pinBtn.dataset.id = memo.id;
      pinBtn.dataset.pinned = String(!!memo.is_pinned);
      pinBtn.title = 'Pin';
      pinBtn.innerHTML = '<i class="ti ti-pin"></i>';
      card.appendChild(pinBtn);
    }

    const refreshTitleDisplay = (titleText) => {
      const t = (titleText || '').trim();
      if (!t) {
        if (titleEl) {
          titleEl.remove();
          titleEl = null;
        }
        return;
      }
      if (!titleEl) {
        titleEl = document.createElement('div');
        titleEl.className = 'memo-card-title';
        dateEl.insertAdjacentElement('afterend', titleEl);
      }
      if (_searchQuery.trim()) {
        titleEl.innerHTML = highlightText(
          t.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
          _searchQuery
        );
      } else {
        titleEl.textContent = t;
      }
      titleEl.style.display = '';
    };

    let editColorWrap = null;
    let editTitleInput = null;
    let savingEdit = false;

    const enterMemoEdit = () => {
      if (content.isContentEditable) return;
      savingEdit = false;

      const restoreContentView = (text) => {
        content.contentEditable = 'false';
        content.classList.remove('is-editing');
        if (_searchQuery.trim()) {
          content.innerHTML = highlightText(
            (text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
            _searchQuery
          );
        } else {
          content.textContent = text || '';
        }
        syncPreview(text);
      };

      const cleanupEdit = () => {
        editColorWrap?.remove();
        editColorWrap = null;
        editTitleInput?.remove();
        editTitleInput = null;
        if (titleEl) titleEl.style.display = '';
        content.onblur = null;
        content.onkeydown = null;
        if (editTitleInput) editTitleInput.onblur = null;
      };

      if (titleEl) titleEl.style.display = 'none';
      editTitleInput = document.createElement('input');
      editTitleInput.type = 'text';
      editTitleInput.className = 'memo-card-title-input';
      editTitleInput.placeholder = 'Title (optional)';
      editTitleInput.value = memo.title || '';
      content.parentNode.insertBefore(editTitleInput, content);

      content.contentEditable = 'true';
      content.classList.add('is-editing');
      content.textContent = memo.content || '';

      editColorWrap = buildMemoColorPicker(memo.color || '', (color) => {
        memo.color = color;
        applyMemoCardColorStyle(card, color);
        updateMemo(memo.id, { color: color || '' }, { skipRender: true });
      });
      content.insertAdjacentElement('afterend', editColorWrap);

      const finishEdit = async () => {
        if (savingEdit) return;
        savingEdit = true;

        const newTitle = editTitleInput ? editTitleInput.value.trim() : (memo.title || '');
        const newVal = content.textContent.trim();
        const patch = {};
        if (newVal !== (memo.content || '')) patch.content = newVal;
        if (newTitle !== (memo.title || '')) patch.title = newTitle;

        cleanupEdit();

        if (patch.content !== undefined) {
          memo.content = patch.content;
          restoreContentView(patch.content);
        } else {
          restoreContentView(memo.content || '');
        }

        if (patch.title !== undefined) {
          memo.title = patch.title;
          refreshTitleDisplay(patch.title);
        } else {
          refreshTitleDisplay(memo.title || '');
        }

        if (Object.keys(patch).length > 0) {
          await updateMemo(memo.id, patch, { skipRender: true });
        }
        if (card.classList.contains('memo-card--collapsed')) syncPreview(memo.content || '');
      };

      content.onblur = (e) => {
        if (editColorWrap && e.relatedTarget && editColorWrap.contains(e.relatedTarget)) return;
        if (editTitleInput && e.relatedTarget === editTitleInput) return;
        void finishEdit();
      };

      editTitleInput.onblur = (e) => {
        if (e.relatedTarget === content) return;
        if (editColorWrap && e.relatedTarget && editColorWrap.contains(e.relatedTarget)) return;
        void finishEdit();
      };

      content.onkeydown = (e) => {
        if (e.key === 'Escape') {
          savingEdit = true;
          cleanupEdit();
          restoreContentView(memo.content || '');
          refreshTitleDisplay(memo.title || '');
        }
      };

      editTitleInput.focus();
    };

    const expandIfCollapsed = () => {
      if (!card.classList.contains('memo-card--collapsed')) return false;
      card.classList.remove('memo-card--collapsed');
      collapseBtn.textContent = '∧';
      collapseBtn.title = 'Collapse';
      return true;
    };

    const handleEditIntent = (e) => {
      if (e.target.closest('.memo-card-actions') || e.target.closest('.memo-pin-btn')) return;
      if (content.isContentEditable) return;
      e.stopPropagation();

      if (expandIfCollapsed()) {
        enterMemoEdit();
        return;
      }

      if (isMemoTouchUI() && !card.classList.contains('is-actions-visible')) {
        card.closest('#memoPage')?.querySelectorAll('.memo-card.is-actions-visible').forEach(c => {
          c.classList.remove('is-actions-visible');
        });
        card.classList.add('is-actions-visible');
        return;
      }

      enterMemoEdit();
    };

    content.onclick = handleEditIntent;
    previewEl.onclick = handleEditIntent;
    card.addEventListener('click', (e) => {
      if (e.target === content || e.target === previewEl) return;
      if (!card.classList.contains('memo-card--collapsed')) return;
      handleEditIntent(e);
    });

    card.append(actions, dateEl);
    if (titleEl) card.appendChild(titleEl);
    card.append(previewEl, content);
    return card;
  }

  // ── showMemoPage 진입점 ────────────────────────────
  async function showMemoPage() {
    document.getElementById('homeIntroSection')?.classList.add('hidden');
    document.getElementById('calendarPage')?.classList.add('hidden');
    document.getElementById('memoWritePage')?.classList.add('hidden');
    document.getElementById('memoPage')?.classList.remove('hidden');
    document.getElementById('routinePage')?.classList.add('hidden');
    document.getElementById('dailyPage')?.classList.add('hidden');
    document.getElementById('timerPage')?.classList.add('hidden');
    document.getElementById('logsPage')?.classList.add('hidden');
    document.querySelectorAll('.insight-page').forEach(el => el.classList.add('hidden'));
    document.querySelector('.right')?.classList.add('hidden');
    localStorage.setItem('memo2.lastPage', 'memo');

    getSb();
    const page = document.getElementById('memoPage');
    if (page) {
      page.innerHTML = '<div style="padding:24px;color:#9ca3af;font-size:14px;">불러오는 중…</div>';
      page.classList.remove('hidden');
    }
    await initMemoSections();
  }

  // ── 전역 등록 ──────────────────────────────────────
  window.showMemoPage = showMemoPage;
  window.JCal = window.JCal || {};
  window.JCal.showMemoPage = showMemoPage;

})();
