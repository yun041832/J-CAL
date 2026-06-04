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

  const MEMO_TITLE_STYLE_SQL = [
    "ALTER TABLE memo ADD COLUMN IF NOT EXISTS title_color text DEFAULT '';",
    "ALTER TABLE memo ADD COLUMN IF NOT EXISTS title_size text DEFAULT '14px';",
    'ALTER TABLE memo ADD COLUMN IF NOT EXISTS title_bold boolean DEFAULT false;',
    "ALTER TABLE memo ADD COLUMN IF NOT EXISTS title_emoji text DEFAULT '';",
  ].join('\n');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SEC_ICON_PATH = {
    color: 'M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
    emoji: 'M324.5-404.5Q310-419 310-440t14.5-35.5Q339-490 360-490t35.5 14.5Q410-461 410-440t-14.5 35.5Q381-390 360-390t-35.5-14.5Zm240 0Q550-419 550-440t14.5-35.5Q579-490 600-490t35.5 14.5Q650-461 650-440t-14.5 35.5Q621-390 600-390t-35.5-14.5ZM480-160q134 0 227-93t93-227q0-24-3-46.5T786-570q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-708q-32 78-91.5 135.5T160-486v6q0 134 93 227t227 93Zm0 80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-54-715q42 70 114 112.5T700-640q14 0 27-1.5t27-3.5q-42-70-114-112.5T480-800q-14 0-27 1.5t-27 3.5ZM177-581q51-29 89-75t57-103q-51 29-89 75t-57 103Zm249-214Zm-103 36Z',
    delete: 'M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z',
  };

  let _memoFloatingPop = null;

  function closeMemoFloatingPop() {
    if (_memoFloatingPop) {
      _memoFloatingPop.remove();
      _memoFloatingPop = null;
    }
  }

  const TITLE_POP_ICON = {
    emoji: 'M324.5-404.5Q310-419 310-440t14.5-35.5Q339-490 360-490t35.5 14.5Q410-461 410-440t-14.5 35.5Q381-390 360-390t-35.5-14.5Zm240 0Q550-419 550-440t14.5-35.5Q579-490 600-490t35.5 14.5Q650-461 650-440t-14.5 35.5Q621-390 600-390t-35.5-14.5ZM480-160q134 0 227-93t93-227q0-24-3-46.5T786-570q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-708q-32 78-91.5 135.5T160-486v6q0 134 93 227t227 93Zm0 80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-54-715q42 70 114 112.5T700-640q14 0 27-1.5t27-3.5q-42-70-114-112.5T480-800q-14 0-27 1.5t-27 3.5ZM177-581q51-29 89-75t57-103q-51 29-89 75t-57 103Zm249-214Zm-103 36Z',
    size: 'M80-160v-160h160v-480h-80v-160h320v160h-80v480h80v160H80Zm400 0v-160h80v-120H560v-160h200v-40h-80v-160h320v160h-80v40H760v160h-40v120h80v160H480Z',
    bold: 'M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-490q25 11 55.5 41t30.5 90q0 89-65 124t-133 35H272Zm121-321h83q48 0 78-23.5t30-61.5q0-37-27-61t-83-24h-81v170Zm0 239h84q72 0 102-28.5t30-73.5q0-39-34.5-64.5T484-474h-91v192Z',
  };

  function createTitlePopSvg(pathD) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('height', '18px');
    svg.setAttribute('width', '18px');
    svg.setAttribute('viewBox', '0 -960 960 960');
    svg.setAttribute('fill', '#888780');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', '#888780');
    svg.appendChild(path);
    return svg;
  }

  function createSecIconBtn(pathD, fill, className) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'memo-sec-icon-btn' + (className ? ' ' + className : '');
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('height', '15px');
    svg.setAttribute('width', '15px');
    svg.setAttribute('viewBox', '0 -960 960 960');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', fill);
    svg.appendChild(path);
    btn.appendChild(svg);
    return btn;
  }

  function positionFloatingPop(pop, anchor) {
    const rect = anchor.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.left = Math.min(rect.left, window.innerWidth - pop.offsetWidth - 8) + 'px';
    pop.style.top = rect.bottom + 4 + 'px';
    pop.style.zIndex = '10050';
  }

  function showSectionColorPicker(anchor, currentColor, onPick) {
    closeMemoFloatingPop();
    const pop = document.createElement('div');
    pop.className = 'memo-sec-color-pop';
    const picker = buildMemoColorPicker(currentColor || '', (color) => {
      closeMemoFloatingPop();
      onPick(color);
    });
    pop.appendChild(picker);
    document.body.appendChild(pop);
    _memoFloatingPop = pop;
    positionFloatingPop(pop, anchor);
    setTimeout(() => {
      document.addEventListener('mousedown', function close(e) {
        if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) {
          closeMemoFloatingPop();
          document.removeEventListener('mousedown', close);
        }
      });
    }, 10);
  }

  function showSectionEmojiPicker(anchor, onPick) {
    if (typeof window.showEmojiPicker === 'function') {
      window.showEmojiPicker(anchor, (emoji) => onPick(emoji || ''));
      return;
    }
    const emoji = window.prompt('이모지 입력', '📝');
    if (emoji != null) onPick(emoji.trim() || '📝');
  }

  function applyMemoTitleStyles(textEl, emojiEl, memo) {
    if (emojiEl) {
      emojiEl.textContent = memo.title_emoji || '';
      emojiEl.style.display = memo.title_emoji ? '' : 'none';
    }
    if (!textEl) return;
    textEl.style.color = memo.title_color || '#111827';
    textEl.style.fontSize = memo.title_size || '14px';
    textEl.style.fontWeight = memo.title_bold ? '700' : '400';
  }

  function logMemoTitleStyleSqlHint(err) {
    if (err?.code === 'PGRST204' || /column/i.test(String(err?.message || ''))) {
      console.info('[memo] title 스타일 컬럼이 없습니다. Supabase SQL Editor에서 실행:\n' + MEMO_TITLE_STYLE_SQL);
    }
  }

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
      return false;
    }
    try {
      const { error } = await _sb.from('memo').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      const idx = _memos.findIndex(m => String(m.id) === String(id));
      if (idx > -1) _memos[idx] = { ..._memos[idx], ...patch };
      if (!options.skipRender) renderMemoPage();
      return true;
    } catch (e) {
      console.error('[memo] updateMemo', e);
      logMemoTitleStyleSqlHint(e);
      return false;
    }
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
    if (!Object.keys(dbPatch).length) return false;
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

  async function deleteSection(id) {
    if (String(id).startsWith('guest_memo_section_')) return false;
    if (_sections.length <= 1) {
      console.warn('[memo] 최소 1개 섹션은 유지해야 합니다.');
      return false;
    }
    getSb();
    if (!_sb) return false;
    try {
      await _sb.from('memo').delete().eq('section_id', id);
      const { error } = await _sb.from('memo_sections').delete().eq('id', id);
      if (error) throw error;
      _sections = _sections.filter(s => String(s.id) !== String(id));
      _memos = _memos.filter(m => String(m.section_id) !== String(id));
      renderMemoPage();
      return true;
    } catch (e) {
      console.error('[memo] deleteSection', e);
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

  let _secHeaderActionsBound = false;
  function bindMemoSectionHeaderActions(page) {
    if (_secHeaderActionsBound || !page) return;
    _secHeaderActionsBound = true;
    page.addEventListener('click', (e) => {
      if (!isMemoTouchUI()) return;
      if (e.target.closest('.memo-sec-header-hover-actions') || e.target.closest('.memo-sec-add-btn')) return;
      const header = e.target.closest('.memo-sec-header');
      if (header && page.contains(header)) {
        page.querySelectorAll('.memo-sec-header.is-actions-visible').forEach(h => {
          if (h !== header) h.classList.remove('is-actions-visible');
        });
        header.classList.toggle('is-actions-visible');
        return;
      }
      if (!e.target.closest('.memo-sec-header')) {
        page.querySelectorAll('.memo-sec-header.is-actions-visible').forEach(h => {
          h.classList.remove('is-actions-visible');
        });
      }
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
    bindMemoSectionHeaderActions(page);

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
      secHeader.className = 'memo-sec-header';

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'memo-sec-emoji';
      emojiSpan.textContent = sec.emoji || '📝';

      const nameLabel = document.createElement('span');
      nameLabel.className = 'sec-name-' + sec.id;
      nameLabel.title = 'Click to rename';
      nameLabel.textContent = sectionTitle(sec);
      bindSectionNameEdit(nameLabel, sec);

      const hoverActions = document.createElement('div');
      hoverActions.className = 'memo-sec-header-hover-actions';

      const secColorBtn = createSecIconBtn(SEC_ICON_PATH.color, sec.color || '#888780');
      secColorBtn.title = 'Change Color';
      secColorBtn.onclick = (e) => {
        e.stopPropagation();
        showSectionColorPicker(secColorBtn, sec.color || '', async (color) => {
          sec.color = color || '';
          secColorBtn.querySelector('path')?.setAttribute('fill', sec.color || '#888780');
          await updateSection(sec.id, { color: sec.color }, { skipRender: true });
        });
      };

      const secEmojiBtn = createSecIconBtn(SEC_ICON_PATH.emoji, '#888780');
      secEmojiBtn.title = 'Change Emoji';
      secEmojiBtn.onclick = (e) => {
        e.stopPropagation();
        showSectionEmojiPicker(secEmojiBtn, async (emoji) => {
          sec.emoji = emoji || '📝';
          emojiSpan.textContent = sec.emoji;
          await updateSection(sec.id, { emoji: sec.emoji }, { skipRender: true });
        });
      };

      const secDelBtn = createSecIconBtn(SEC_ICON_PATH.delete, '#888780', 'memo-sec-del-btn');
      secDelBtn.title = 'Delete section';
      secDelBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.confirm('이 섹션과 포함된 메모를 모두 삭제할까요?')) {
          void deleteSection(sec.id);
        }
      };

      hoverActions.append(secColorBtn, secEmojiBtn, secDelBtn);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'memo-sec-add-btn';
      addBtn.dataset.add = sec.id;
      addBtn.textContent = '+';

      secHeader.append(emojiSpan, nameLabel, hoverActions, addBtn);
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
    ta.rows = 2;
    const resizeTa = () => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    };
    ta.addEventListener('input', resizeTa);

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
    resizeTa();
    return form;
  }

  function showMemoTitleStylePopup(card, anchor, memo, applyTitleDom) {
    closeMemoFloatingPop();
    const pop = document.createElement('div');
    pop.className = 'memo-title-popup';

    const draft = {
      title_size: memo.title_size || '14px',
      title_bold: !!memo.title_bold,
      title_emoji: memo.title_emoji || '',
    };

    const addRow = (pathD, labelText, trailing) => {
      const row = document.createElement('div');
      row.className = 'memo-title-popup-row';
      const iconWrap = document.createElement('span');
      iconWrap.className = 'memo-title-popup-icon';
      iconWrap.appendChild(createTitlePopSvg(pathD));
      const label = document.createElement('span');
      label.className = 'memo-title-popup-label';
      label.textContent = labelText;
      row.append(iconWrap, label);
      if (trailing) row.appendChild(trailing);
      return row;
    };

    const emojiRow = addRow(TITLE_POP_ICON.emoji, 'Change Emoji');
    emojiRow.onclick = (e) => {
      e.stopPropagation();
      showSectionEmojiPicker(emojiRow, (emo) => {
        draft.title_emoji = emo || '';
      });
    };

    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'memo-title-popup-select';
    ['14px', '16px', '20px', '24px'].forEach(sz => {
      const opt = document.createElement('option');
      opt.value = sz;
      opt.textContent = sz;
      if (draft.title_size === sz) opt.selected = true;
      sizeSelect.appendChild(opt);
    });
    sizeSelect.onchange = () => { draft.title_size = sizeSelect.value; };
    sizeSelect.onclick = (e) => e.stopPropagation();
    const sizeRow = addRow(TITLE_POP_ICON.size, 'Text Size', sizeSelect);

    const boldVal = document.createElement('span');
    boldVal.className = 'memo-title-popup-val';
    boldVal.textContent = draft.title_bold ? '굵게' : '보통';
    const boldRow = addRow(TITLE_POP_ICON.bold, 'Bold', boldVal);
    boldRow.onclick = (e) => {
      e.stopPropagation();
      draft.title_bold = !draft.title_bold;
      boldVal.textContent = draft.title_bold ? '굵게' : '보통';
    };

    const divider = document.createElement('div');
    divider.className = 'memo-title-popup-divider';

    const footer = document.createElement('div');
    footer.className = 'memo-title-popup-footer';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'memo-title-popup-btn memo-title-popup-btn--ghost';
    closeBtn.textContent = '닫기';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeMemoFloatingPop();
    };
    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'memo-title-popup-btn memo-title-popup-btn--apply';
    applyBtn.textContent = '적용';
    applyBtn.onclick = async (e) => {
      e.stopPropagation();
      const patch = {
        title_size: draft.title_size,
        title_bold: draft.title_bold,
        title_emoji: draft.title_emoji,
      };
      const ok = await updateMemo(memo.id, patch, { skipRender: true });
      if (ok) {
        Object.assign(memo, patch);
        applyTitleDom();
        closeMemoFloatingPop();
      }
    };
    footer.append(closeBtn, applyBtn);

    pop.append(emojiRow, sizeRow, boldRow, divider, footer);
    card.appendChild(pop);

    setTimeout(() => {
      document.addEventListener('mousedown', function onOut(e) {
        if (!pop.contains(e.target) && !anchor.contains(e.target)) {
          closeMemoFloatingPop();
          document.removeEventListener('mousedown', onOut);
        }
      });
    }, 10);
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

    let titleRow = null;
    let titleEmojiEl = null;
    let titleTextEl = null;
    let titleMenuBtn = null;

    const paintTitleRow = () => {
      const t = (memo.title || '').trim();
      if (!t || !titleRow || !titleTextEl) return;
      if (_searchQuery.trim()) {
        titleTextEl.innerHTML = highlightText(
          t.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
          _searchQuery
        );
      } else {
        titleTextEl.textContent = t;
      }
      applyMemoTitleStyles(titleTextEl, titleEmojiEl, memo);
    };

    const mountTitleRow = () => {
      const t = (memo.title || '').trim();
      if (!t) {
        titleRow?.remove();
        titleRow = null;
        titleEmojiEl = null;
        titleTextEl = null;
        titleMenuBtn = null;
        return;
      }
      if (!titleRow) {
        titleRow = document.createElement('div');
        titleRow.className = 'memo-card-title-row';
        titleEmojiEl = document.createElement('span');
        titleEmojiEl.className = 'memo-card-title-emoji';
        titleTextEl = document.createElement('span');
        titleTextEl.className = 'memo-card-title-text';
        titleMenuBtn = document.createElement('button');
        titleMenuBtn.type = 'button';
        titleMenuBtn.className = 'memo-card-title-menu';
        titleMenuBtn.textContent = '···';
        titleMenuBtn.title = 'Title options';
        titleRow.append(titleEmojiEl, titleTextEl, titleMenuBtn);
        dateEl.insertAdjacentElement('afterend', titleRow);

        titleMenuBtn.onclick = (e) => {
          e.stopPropagation();
          showMemoTitleStylePopup(card, titleMenuBtn, memo, paintTitleRow);
        };

        const bindTitleTextClick = () => {
          titleTextEl.onclick = (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'memo-card-title-input';
            input.value = memo.title || '';
            const finishTitle = async () => {
              const newTitle = input.value.trim();
              if (newTitle !== (memo.title || '')) {
                memo.title = newTitle;
                await updateMemo(memo.id, { title: newTitle }, { skipRender: true });
              }
              if (!newTitle) {
                titleRow.remove();
                titleRow = null;
                titleTextEl = null;
                titleEmojiEl = null;
                titleMenuBtn = null;
                return;
              }
              const span = document.createElement('span');
              span.className = 'memo-card-title-text';
              titleTextEl = span;
              titleRow.replaceChild(span, input);
              bindTitleTextClick();
              paintTitleRow();
            };
            titleTextEl.replaceWith(input);
            input.focus();
            input.select();
            input.onblur = () => { void finishTitle(); };
            input.onkeydown = (ev) => {
              if (ev.key === 'Enter' || ev.key === 'NumpadEnter') {
                ev.preventDefault();
                void finishTitle();
              }
              if (ev.key === 'Escape') {
                const span = document.createElement('span');
                span.className = 'memo-card-title-text';
                titleTextEl = span;
                titleRow.replaceChild(span, input);
                bindTitleTextClick();
                paintTitleRow();
              }
            };
          };
        };
        bindTitleTextClick();
      }
      paintTitleRow();
    };

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

    let editColorWrap = null;
    let editContentInputHandler = null;
    let savingEdit = false;

    const enterMemoEdit = () => {
      if (content.isContentEditable) return;
      savingEdit = false;
      closeMemoFloatingPop();

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
        if (editContentInputHandler) {
          content.removeEventListener('input', editContentInputHandler);
          editContentInputHandler = null;
        }
        content.style.height = '';
        content.onblur = null;
        content.onkeydown = null;
      };

      content.contentEditable = 'true';
      content.classList.add('is-editing');
      content.textContent = memo.content || '';

      editContentInputHandler = function onContentInput() {
        content.style.height = 'auto';
        content.style.height = content.scrollHeight + 'px';
      };
      content.addEventListener('input', editContentInputHandler);
      editContentInputHandler();

      editColorWrap = buildMemoColorPicker(memo.color || '', (color) => {
        memo.color = color;
        applyMemoCardColorStyle(card, color);
        updateMemo(memo.id, { color: color || '' }, { skipRender: true });
      });
      content.insertAdjacentElement('afterend', editColorWrap);

      const finishEdit = async () => {
        if (savingEdit) return;
        savingEdit = true;

        const newVal = content.textContent.trim();
        const patch = {};
        if (newVal !== (memo.content || '')) patch.content = newVal;

        cleanupEdit();

        if (patch.content !== undefined) {
          memo.content = patch.content;
          restoreContentView(patch.content);
        } else {
          restoreContentView(memo.content || '');
        }

        if (Object.keys(patch).length > 0) {
          await updateMemo(memo.id, patch, { skipRender: true });
        }
        if (card.classList.contains('memo-card--collapsed')) syncPreview(memo.content || '');
      };

      content.onblur = (e) => {
        if (editColorWrap && e.relatedTarget && editColorWrap.contains(e.relatedTarget)) return;
        void finishEdit();
      };

      content.onkeydown = (e) => {
        if (e.key === 'Escape') {
          savingEdit = true;
          cleanupEdit();
          restoreContentView(memo.content || '');
        }
      };

      content.focus();
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
      if (e.target.closest('.memo-card-title-row') || e.target.closest('.memo-title-popup')) return;
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

    card.append(actions, dateEl, previewEl, content);
    if ((memo.title || '').trim()) mountTitleRow();
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
