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
        if (_userId) initMemoSections();
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

  // ── 기본 섹션 3개 ──────────────────────────────────
  const DEFAULT_SECTIONS = [
    { name: '오늘작업', emoji: '📝', color: '#f0fdf4', sort_order: 0 },
    { name: '생각들',   emoji: '💭', color: '#eff6ff', sort_order: 1 },
    { name: '일기',     emoji: '📔', color: '#fdf4ff', sort_order: 2 },
  ];

  let _sections = []; // { id, name, emoji, color, sort_order }
  let _memos = [];    // { id, section_id, title, content, date, emoji, color }
  let _viewMode = localStorage.getItem('memo_view_mode') || 'day'; // day | month | all

  // ── 섹션 로드/초기화 ───────────────────────────────
  async function initMemoSections() {
    const userId = await getUserId();
    if (!userId) { renderMemoPage(); return; }
    try {
      const { data, error } = await _sb.from('memo_sections')
        .select('*').eq('user_id', userId).order('sort_order');
      if (error) throw error;
      if (data && data.length > 0) {
        _sections = data;
      } else {
        // 최초 접속 — 기본 섹션 3개 생성
        const rows = DEFAULT_SECTIONS.map(s => ({ ...s, user_id: userId }));
        const { data: created, error: e2 } = await _sb.from('memo_sections').insert(rows).select();
        if (e2) throw e2;
        _sections = created;
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
        .select('*').eq('user_id', userId).order('date', { ascending: false }).order('created_at', { ascending: false });
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

  // ── 메모 수정 ──────────────────────────────────────
  async function updateMemo(id, patch) {
    try {
      const { error } = await _sb.from('memo').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      const idx = _memos.findIndex(m => m.id === id);
      if (idx > -1) _memos[idx] = { ..._memos[idx], ...patch };
      renderMemoPage();
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

  // ── 섹션명 수정 ────────────────────────────────────
  async function updateSection(id, patch) {
    try {
      const { error } = await _sb.from('memo_sections').update(patch).eq('id', id);
      if (error) throw error;
      const idx = _sections.findIndex(s => s.id === id);
      if (idx > -1) _sections[idx] = { ..._sections[idx], ...patch };
      renderMemoPage();
    } catch (e) { console.error('[memo] updateSection', e); }
  }

  // ── 보기 필터 ──────────────────────────────────────
  function getFilteredMemos(sectionId) {
    const base = _memos.filter(m => m.section_id === sectionId);
    if (_viewMode === 'day') {
      const t = todayStr();
      return base.filter(m => m.date === t);
    }
    if (_viewMode === 'month') {
      const ym = todayStr().slice(0, 7);
      return base.filter(m => m.date?.slice(0, 7) === ym);
    }
    return base; // all
  }

  // ── 렌더 ───────────────────────────────────────────
  function renderMemoPage() {
    const page = document.getElementById('memoPage');
    if (!page) return;

    page.innerHTML = '';
    page.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';

    // 헤더
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e5e7eb;flex-shrink:0;';
    header.innerHTML = `
      <span style="font-weight:700;font-size:16px;">Memo</span>
      <div style="display:flex;gap:6px;">
        ${['일', '월', '전체'].map((v, i) => {
          const modes = ['day', 'month', 'all'];
          const active = _viewMode === modes[i];
          return `<button data-view="${modes[i]}" style="padding:4px 10px;border-radius:6px;border:1px solid ${active ? '#5C8DFF' : '#e5e7eb'};background:${active ? '#5C8DFF' : '#fff'};color:${active ? '#fff' : '#374151'};font-size:12px;cursor:pointer;">${v}</button>`;
        }).join('')}
      </div>
    `;
    header.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = () => {
        _viewMode = btn.dataset.view;
        localStorage.setItem('memo_view_mode', _viewMode);
        renderMemoPage();
      };
    });
    page.appendChild(header);

    // 3패널 컨테이너
    const panels = document.createElement('div');
    panels.style.cssText = 'display:flex;flex:1;overflow:hidden;';

    if (_sections.length === 0) {
      panels.innerHTML = '<div style="padding:24px;color:#9ca3af;">로그인 후 사용 가능합니다.</div>';
      page.appendChild(panels);
      return;
    }

    _sections.forEach((sec, si) => {
      const col = document.createElement('div');
      col.style.cssText = `flex:1;display:flex;flex-direction:column;border-right:${si < _sections.length - 1 ? '1px solid #e5e7eb' : 'none'};overflow:hidden;background:${sec.color || '#fff'};`;

      // 섹션 헤더
      const secHeader = document.createElement('div');
      secHeader.style.cssText = 'display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #e5e7eb;flex-shrink:0;';
      secHeader.innerHTML = `
        <span style="font-size:16px;">${sec.emoji || '📝'}</span>
        <span class="sec-name-${sec.id}" style="font-weight:600;font-size:13px;flex:1;cursor:pointer;" title="클릭해서 이름 변경">${sec.name}</span>
        <button data-add="${sec.id}" style="font-size:18px;background:none;border:none;cursor:pointer;color:#5C8DFF;line-height:1;">+</button>
      `;
      // 섹션명 클릭 → 인라인 편집
      secHeader.querySelector('.sec-name-' + sec.id).onclick = function () {
        const input = document.createElement('input');
        input.value = sec.name;
        input.style.cssText = 'font-weight:600;font-size:13px;flex:1;border:1px solid #5C8DFF;border-radius:4px;padding:2px 4px;width:80px;';
        this.replaceWith(input);
        input.focus();
        input.select();
        const done = () => {
          const newName = input.value.trim() || sec.name;
          updateSection(sec.id, { name: newName });
        };
        input.onblur = done;
        input.onkeydown = e => { if (e.key === 'Enter') done(); };
      };
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

      if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#d1d5db;font-size:12px;text-align:center;padding:24px 0;';
        empty.textContent = '메모 없음';
        list.appendChild(empty);
      } else {
        filtered.forEach(memo => {
          list.appendChild(buildMemoCard(memo));
        });
      }

      col.appendChild(list);
      panels.appendChild(col);
    });

    page.appendChild(panels);
  }

  // ── 입력폼 ─────────────────────────────────────────
  function buildInputForm(sectionId, onDone) {
    const form = document.createElement('div');
    form.className = 'memo-input-form';
    form.style.cssText = 'background:#fff;border:1px solid #5C8DFF;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;';

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = todayStr();
    dateInput.style.cssText = 'font-size:11px;border:1px solid #e5e7eb;border-radius:4px;padding:2px 6px;';

    const ta = document.createElement('textarea');
    ta.placeholder = '내용을 입력하세요...';
    ta.rows = 4;
    ta.style.cssText = 'resize:none;border:none;outline:none;font-size:13px;width:100%;box-sizing:border-box;';

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = 'background:#5C8DFF;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'background:#f3f4f6;color:#374151;border:none;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;';

    saveBtn.onclick = async () => {
      const content = ta.value.trim();
      if (!content) return;
      await saveMemo(sectionId, { content, date: dateInput.value });
      onDone();
    };
    cancelBtn.onclick = () => { form.remove(); onDone(); };

    btns.append(cancelBtn, saveBtn);
    form.append(dateInput, ta, btns);
    return form;
  }

  // ── 메모 카드 ──────────────────────────────────────
  function buildMemoCard(memo) {
    const card = document.createElement('div');
    card.style.cssText = `background:#fff;border-radius:8px;padding:10px;border:1px solid #f3f4f6;font-size:13px;position:relative;`;

    const dateEl = document.createElement('div');
    dateEl.style.cssText = 'font-size:11px;color:#9ca3af;margin-bottom:4px;';
    dateEl.textContent = memo.date || '';

    const content = document.createElement('div');
    content.style.cssText = 'white-space:pre-wrap;word-break:break-word;line-height:1.6;';
    content.textContent = memo.content || '';

    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.style.cssText = 'position:absolute;top:6px;right:8px;background:none;border:none;color:#d1d5db;font-size:16px;cursor:pointer;line-height:1;';
    delBtn.onclick = () => { if (confirm('삭제할까요?')) deleteMemo(memo.id); };

    // 카드 클릭 → 인라인 편집
    content.ondblclick = () => {
      const ta = document.createElement('textarea');
      ta.value = memo.content || '';
      ta.rows = 4;
      ta.style.cssText = 'resize:none;border:1px solid #5C8DFF;border-radius:4px;outline:none;font-size:13px;width:100%;box-sizing:border-box;';
      content.replaceWith(ta);
      ta.focus();
      ta.onblur = async () => {
        const newVal = ta.value.trim();
        if (newVal !== memo.content) await updateMemo(memo.id, { content: newVal });
        else renderMemoPage();
      };
    };

    card.append(dateEl, content, delBtn);
    return card;
  }

  // ── showMemoPage 진입점 ────────────────────────────
  function showMemoPage() {
    document.getElementById('memoPage')?.classList.remove('hidden');
    document.getElementById('routinePage')?.classList.add('hidden');
    document.getElementById('dailyPage')?.classList.add('hidden');
    document.getElementById('timerPage')?.classList.add('hidden');
    document.getElementById('logsPage')?.classList.add('hidden');
    document.querySelectorAll('.insight-page').forEach(el => el.classList.add('hidden'));
    document.querySelector('.right')?.classList.add('hidden');
    localStorage.setItem('memo2.lastPage', 'memo');

    getSb();
    if (_sections.length > 0) {
      renderMemoPage();
    } else {
      initMemoSections();
    }
  }

  // ── 전역 등록 ──────────────────────────────────────
  window.showMemoPage = showMemoPage;
  window.JCal = window.JCal || {};
  window.JCal.showMemoPage = showMemoPage;

})();
