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

  function makeChevronSvg(direction) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('fill', '#4B5563');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', direction === 'up'
      ? 'M12 8L5 15h14z'
      : 'M12 16L5 9h14z'
    );
    svg.appendChild(path);
    return svg;
  }

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

  const MEMO_TITLE_COLORS = [
    { name: 'none', color: '#111827', label: 'Default' },
    { name: 'red', color: '#dc2626', label: 'Red' },
    { name: 'orange', color: '#ea580c', label: 'Orange' },
    { name: 'yellow', color: '#ca8a04', label: 'Yellow' },
    { name: 'green', color: '#16a34a', label: 'Green' },
    { name: 'blue', color: '#2563eb', label: 'Blue' },
    { name: 'purple', color: '#7c3aed', label: 'Purple' },
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
  };

  let _memoFloatingPop = null;
  let _memoTitlePopup = null;
  let _memoTitlePopupOutsideHandler = null;

  function closeMemoTitlePopup() {
    if (_memoTitlePopupOutsideHandler) {
      document.removeEventListener('mousedown', _memoTitlePopupOutsideHandler);
      _memoTitlePopupOutsideHandler = null;
    }
    if (_memoTitlePopup) {
      _memoTitlePopup.remove();
      _memoTitlePopup = null;
    }
    document.querySelectorAll('.memo-card.has-title-popup').forEach(c => {
      c.classList.remove('has-title-popup');
    });
  }

  function closeMemoFloatingPop() {
    if (_memoFloatingPop) {
      _memoFloatingPop.remove();
      _memoFloatingPop = null;
    }
    closeMemoTitlePopup();
  }

  const TITLE_POP_ICON = {
    color: 'M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
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
    svg.setAttribute('height', '18px');
    svg.setAttribute('width', '18px');
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
      console.info(
        '[memo] Supabase SQL Editor에서 실행 필요 — memo 테이블에 title 스타일 컬럼이 없습니다:\n' +
        MEMO_TITLE_STYLE_SQL
      );
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

  const TOOLBAR_FORE_COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed'];
  const TOOLBAR_HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#f5d0fe'];

  function htmlToPlainText(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || '').replace(/\u00a0/g, ' ');
  }

  function looksLikeMemoHtml(str) {
    return /<[a-z][\s\S]*>/i.test(String(str || ''));
  }

  function escapeMemoHtmlText(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function plainTextToMemoHtml(text) {
    return escapeMemoHtmlText(text).replace(/\n/g, '<br>');
  }

  function memoContentToDisplayHtml(content) {
    const s = String(content || '');
    if (!s.trim()) return '';
    if (looksLikeMemoHtml(s)) return s;
    return plainTextToMemoHtml(s);
  }

  function isEmptyMemoHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    const text = (div.textContent || '').replace(/\u00a0/g, ' ').trim();
    if (text) return false;
    return !div.querySelector('img, video, iframe, table, ul, ol, h1, h2, h3, blockquote, a');
  }

  function getMemoEditorHtml(el) {
    const html = (el.innerHTML || '').trim();
    return isEmptyMemoHtml(html) ? '' : html;
  }

  function renderMemoContentHtml(content) {
    if (_searchQuery.trim()) {
      const plain = htmlToPlainText(content);
      return highlightText(escapeMemoHtmlText(plain), _searchQuery);
    }
    return memoContentToDisplayHtml(content);
  }

  function growMemoEditor(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function buildCharMap(editorEl) {
    const map = [];
    const pushChar = (node, offset, ch, meta) => {
      map.push({ node, offset, ch, ...meta });
    };

    function walkInline(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (let i = 0; i < node.textContent.length; i++) {
          pushChar(node, i, node.textContent[i]);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') pushChar(node, 0, '\n', { isBr: true });
        else Array.from(node.childNodes).forEach(walkInline);
      }
    }

    const children = Array.from(editorEl.childNodes);
    children.forEach((child, idx) => {
      if (idx > 0) pushChar(child, 0, '\n', { lineBreak: true });
      if (child.nodeType === Node.TEXT_NODE || child.tagName === 'BR') walkInline(child);
      else if (child.tagName === 'DIV' || child.tagName === 'P') walkInline(child);
      else walkInline(child);
    });
    return map;
  }

  function plainFromCharMap(map) {
    return map.map(pt => pt.ch).join('');
  }

  function getCaretCharIndex(editorEl, range) {
    const map = buildCharMap(editorEl);
    for (let i = 0; i < map.length; i++) {
      const probe = document.createRange();
      probe.setStart(map[i].node, map[i].offset);
      probe.collapse(true);
      const cmp = range.compareBoundaryPoints(Range.START_TO_START, probe);
      if (cmp <= 0) return i;
    }
    return map.length;
  }

  function getLineContext(editorEl) {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!editorEl.contains(range.commonAncestorContainer)) return null;

    const map = buildCharMap(editorEl);
    const plain = plainFromCharMap(map);
    const caret = getCaretCharIndex(editorEl, range);
    const lineStart = plain.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
    const nextBreak = plain.indexOf('\n', caret);
    const lineEnd = nextBreak === -1 ? plain.length : nextBreak;
    const lineText = plain.slice(lineStart, lineEnd);
    const lineBeforeCaret = plain.slice(lineStart, caret);

    return { map, plain, lineText, lineStart, lineEnd, caret, lineBeforeCaret };
  }

  function rangeFromMapSlice(editorEl, map, start, end) {
    const range = document.createRange();
    if (!map.length) {
      range.selectNodeContents(editorEl);
      return range;
    }
    const startPt = map[Math.min(start, map.length - 1)];
    range.setStart(startPt.node, startPt.offset);
    if (end >= map.length) {
      range.setEnd(editorEl, editorEl.childNodes.length);
    } else {
      const endPt = map[end];
      range.setEnd(endPt.node, endPt.offset);
    }
    return range;
  }

  function collapseRangeAtChar(editorEl, map, pos) {
    const range = document.createRange();
    if (!map.length || pos <= 0) {
      range.setStart(editorEl, 0);
      range.collapse(true);
      return range;
    }
    if (pos >= map.length) {
      range.selectNodeContents(editorEl);
      range.collapse(false);
      return range;
    }
    const pt = map[pos];
    range.setStart(pt.node, pt.offset);
    range.collapse(true);
    return range;
  }

  function setSelectionRange(range) {
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretAtChar(editorEl, map, pos) {
    setSelectionRange(collapseRangeAtChar(editorEl, map, pos));
  }

  function insertLineBreakWithPrefix(editorEl, atChar, prefix) {
    const map = buildCharMap(editorEl);
    const range = collapseRangeAtChar(editorEl, map, atChar);
    const br = document.createElement('br');
    range.insertNode(br);
    const text = document.createTextNode(prefix);
    range.setStartAfter(br);
    range.collapse(true);
    range.insertNode(text);
    const caret = document.createRange();
    caret.setStart(text, prefix.length);
    caret.collapse(true);
    setSelectionRange(caret);
  }

  function replaceLineWithEmptyBreak(editorEl, lineStart, lineEnd) {
    const map = buildCharMap(editorEl);
    const lineRange = rangeFromMapSlice(editorEl, map, lineStart, lineEnd);
    lineRange.deleteContents();
    const br = document.createElement('br');
    lineRange.insertNode(br);
    const caret = document.createRange();
    caret.setStartAfter(br);
    caret.collapse(true);
    setSelectionRange(caret);
  }

  function replaceLineText(editorEl, lineStart, lineEnd, newText) {
    const map = buildCharMap(editorEl);
    const lineRange = rangeFromMapSlice(editorEl, map, lineStart, lineEnd);
    lineRange.deleteContents();
    const text = document.createTextNode(newText);
    lineRange.insertNode(text);
    const caret = document.createRange();
    caret.setStart(text, newText.length);
    caret.collapse(true);
    setSelectionRange(caret);
  }

  function handleMemoAutoListSpace(e, editorEl) {
    const ctx = getLineContext(editorEl);
    if (!ctx) return false;

    const { lineText, lineStart, lineEnd, lineBeforeCaret } = ctx;

    if (lineBeforeCaret === '-' || lineBeforeCaret === '*') {
      e.preventDefault();
      replaceLineText(editorEl, lineStart, lineEnd, '• ');
      growMemoEditor(editorEl);
      return true;
    }

    const numDot = lineBeforeCaret.match(/^(\d+)\.$/);
    if (numDot) {
      e.preventDefault();
      replaceLineText(editorEl, lineStart, lineEnd, `${numDot[1]}. `);
      growMemoEditor(editorEl);
      return true;
    }

    return false;
  }

  function handleMemoAutoListEnter(e, editorEl) {
    const ctx = getLineContext(editorEl);
    if (!ctx) return false;

    const { lineText, lineStart, lineEnd } = ctx;
    const numberedEmpty = lineText.match(/^(\d+)\.\s*$/);
    const numberedFull = lineText.match(/^(\d+)\.\s(.+)$/);
    const bulletEmpty = lineText.match(/^•\s*$/);
    const bulletFull = lineText.match(/^•\s(.+)$/);

    if (!numberedEmpty && !numberedFull && !bulletEmpty && !bulletFull) return false;

    e.preventDefault();

    if (numberedEmpty || bulletEmpty) {
      replaceLineWithEmptyBreak(editorEl, lineStart, lineEnd);
      growMemoEditor(editorEl);
      return true;
    }

    if (numberedFull) {
      const nextPrefix = `${parseInt(numberedFull[1], 10) + 1}. `;
      insertLineBreakWithPrefix(editorEl, lineEnd, nextPrefix);
      growMemoEditor(editorEl);
      return true;
    }

    if (bulletFull) {
      insertLineBreakWithPrefix(editorEl, lineEnd, '• ');
      growMemoEditor(editorEl);
      return true;
    }

    return false;
  }

  function onMemoAutoListKeydown(e) {
    const editorEl = e.currentTarget;
    if (editorEl.getAttribute('contenteditable') !== 'true') return;

    if (e.key === ' ') {
      handleMemoAutoListSpace(e, editorEl);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      handleMemoAutoListEnter(e, editorEl);
    }
  }

  function bindMemoAutoListKeydown(editorEl) {
    if (!editorEl || editorEl.dataset.autoListBound === '1') return;
    editorEl.dataset.autoListBound = '1';
    editorEl.addEventListener('keydown', onMemoAutoListKeydown);
  }

  function buildMemoMiniToolbar(editorEl) {
    const bar = document.createElement('div');
    bar.className = 'memo-mini-toolbar';
    bar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.memo-toolbar-color-pop')) return;
      e.preventDefault();
    });

    const focusExec = (fn) => {
      editorEl.focus();
      fn();
    };

    const exec = (cmd, val) => {
      focusExec(() => document.execCommand(cmd, false, val ?? null));
    };

    const wrapHeading = (tag) => {
      focusExec(() => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (range.collapsed || !editorEl.contains(range.commonAncestorContainer)) return;
        const el = document.createElement(tag);
        try {
          range.surroundContents(el);
        } catch {
          el.appendChild(range.extractContents());
          range.insertNode(el);
        }
        sel.removeAllRanges();
        const nr = document.createRange();
        nr.selectNodeContents(el);
        nr.collapse(false);
        sel.addRange(nr);
      });
    };

    const showColorPop = (anchorBtn, colors, command) => {
      anchorBtn.querySelector('.memo-toolbar-color-pop')?.remove();
      const pop = document.createElement('div');
      pop.className = 'memo-toolbar-color-pop';
      colors.forEach(color => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.title = color;
        dot.style.background = color;
        dot.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          exec(command, color);
          pop.remove();
        };
        pop.appendChild(dot);
      });
      anchorBtn.classList.add('has-color-pop');
      anchorBtn.appendChild(pop);
    };

    const addBtn = (label, title, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'memo-toolbar-btn';
      btn.textContent = label;
      btn.title = title;
      btn.onclick = (e) => {
        e.preventDefault();
        onClick(btn);
      };
      return btn;
    };

    const addDivider = () => {
      const d = document.createElement('span');
      d.className = 'memo-toolbar-divider';
      return d;
    };

    bar.append(
      addBtn('B', 'Bold', () => exec('bold')),
      addBtn('I', 'Italic', () => exec('italic')),
      addBtn('U', 'Underline', () => exec('underline')),
      addBtn('S', 'Strikethrough', () => exec('strikeThrough')),
      addDivider(),
      addBtn('H1', 'Heading 1', () => wrapHeading('h1')),
      addBtn('H2', 'Heading 2', () => wrapHeading('h2')),
      addDivider(),
      addBtn('A', 'Text color', (btn) => showColorPop(btn, TOOLBAR_FORE_COLORS, 'foreColor')),
      addBtn('HL', 'Highlight', (btn) => showColorPop(btn, TOOLBAR_HIGHLIGHT_COLORS, 'hiliteColor')),
      addDivider(),
      addBtn('🔗', 'Link', () => {
        const url = window.prompt('URL', 'https://');
        if (url) exec('createLink', url.trim());
      }),
      addBtn('😊', 'Emoji', (btn) => {
        showSectionEmojiPicker(btn, (emoji) => {
          if (!emoji) return;
          editorEl.focus();
          document.execCommand('insertText', false, emoji);
        });
      })
    );

    return bar;
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

  function isMemoTitleColorSelected(c, selectedColor) {
    if (c.name === 'none') {
      return !selectedColor || selectedColor === '#111827';
    }
    return selectedColor === c.color;
  }

  function buildMemoTitleColorPicker(selectedColor, onSelect) {
    const colorWrap = document.createElement('div');
    colorWrap.className = 'memo-title-color-picker';
    colorWrap.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';

    MEMO_TITLE_COLORS.forEach(c => {
      const dot = document.createElement('button');
      dot.type = 'button';
      const isSelected = isMemoTitleColorSelected(c, selectedColor);
      dot.style.cssText = `
    width:18px;height:18px;border-radius:50%;
    background:${c.color};
    border:2px solid ${isSelected ? '#5C8DFF' : c.color};
    cursor:pointer;padding:0;flex-shrink:0;
    transition:transform 0.1s;
    ${isSelected ? 'transform:scale(1.25);' : ''}
  `;
      dot.title = c.label;
      dot.addEventListener('mousedown', (e) => e.preventDefault());
      dot.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextColor = c.name === 'none' ? '' : c.color;
        colorWrap.querySelectorAll('button').forEach(b => {
          b.style.transform = 'scale(1)';
          b.style.borderColor = b.style.background;
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
        htmlToPlainText(m.content || '').toLowerCase().includes(q) ||
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

      const secCopyBtn = document.createElement('button');
      secCopyBtn.type = 'button';
      secCopyBtn.className = 'memo-sec-icon-btn memo-sec-copy-btn';
      secCopyBtn.title = '섹션 전체 복사';

      const mountSecCopySvg = () => {
        secCopyBtn.textContent = '';
        const copySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        copySvg.setAttribute('viewBox', '0 0 24 24');
        copySvg.setAttribute('width', '16');
        copySvg.setAttribute('height', '16');
        copySvg.setAttribute('fill', 'none');
        copySvg.setAttribute('stroke', '#4B5563');
        copySvg.setAttribute('stroke-width', '2');
        copySvg.setAttribute('stroke-linecap', 'round');
        copySvg.setAttribute('stroke-linejoin', 'round');
        copySvg.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
        secCopyBtn.appendChild(copySvg);
      };

      mountSecCopySvg();

      secCopyBtn.onclick = async (e) => {
        e.stopPropagation();
        const blocks = getFilteredMemos(sec.id).map((m) => {
          const bodyText = htmlToPlainText(m.content || '').trim();
          const titleText = (m.title || '').trim();
          if (titleText) return `[${titleText}]\n${bodyText}`;
          return bodyText;
        }).filter(Boolean);
        try {
          await navigator.clipboard.writeText(blocks.join('\n---\n'));
          secCopyBtn.textContent = '✓';
          setTimeout(() => { mountSecCopySvg(); }, 800);
        } catch (_err) { /* clipboard unavailable */ }
      };

      hoverActions.append(secEmojiBtn, secCopyBtn);

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
        const form = buildNewMemoCard(sec.id, () => {});
        list.prepend(form);
        form.querySelector('.memo-card-content.is-editing')?.focus();
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

  // ── 통합 편집 UI ───────────────────────────────────
  const MEMO_CARD_VIEW_SEL = ':scope > .memo-card-actions, :scope > .memo-card-date, :scope > .memo-card-preview, :scope > .memo-card-content, :scope > .memo-card-title-row, :scope > .memo-pin-btn';

  function setMemoCardViewVisible(card, visible) {
    card.querySelectorAll(MEMO_CARD_VIEW_SEL).forEach(el => {
      el.hidden = !visible;
    });
  }

  function setupMemoEditDatePicker(card, dateEl, config) {
    const { isNew, memo, getDate, setDate } = config;
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let calendarPop = null;
    let outsideHandler = null;
    let viewYear = 0;
    let viewMonth = 0;

    dateEl.style.cssText = 'font-size:11px;color:#9ca3af;cursor:pointer;display:inline-block;position:relative;';
    dateEl.textContent = getDate();
    dateEl.onmouseenter = () => { dateEl.style.textDecoration = 'underline'; };
    dateEl.onmouseleave = () => {
      if (!calendarPop) dateEl.style.textDecoration = 'none';
    };

    const closeCalendar = () => {
      if (outsideHandler) {
        document.removeEventListener('mousedown', outsideHandler);
        outsideHandler = null;
      }
      calendarPop?.remove();
      calendarPop = null;
      dateEl.style.textDecoration = 'none';
    };

    const paintCalendar = () => {
      if (!calendarPop) return;
      calendarPop.innerHTML = '';

      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';

      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.textContent = '‹';
      prevBtn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:16px;padding:4px 8px;color:#374151;line-height:1;';

      const monthLabel = document.createElement('span');
      monthLabel.style.cssText = 'font-size:13px;font-weight:600;color:#111827;';
      monthLabel.textContent = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.textContent = '›';
      nextBtn.style.cssText = prevBtn.style.cssText;

      prevBtn.onclick = (e) => {
        e.stopPropagation();
        viewMonth -= 1;
        if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
        paintCalendar();
      };
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        viewMonth += 1;
        if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
        paintCalendar();
      };

      header.append(prevBtn, monthLabel, nextBtn);
      calendarPop.appendChild(header);

      const weekRow = document.createElement('div');
      weekRow.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;';
      WEEKDAYS.forEach((label) => {
        const cell = document.createElement('div');
        cell.textContent = label;
        cell.style.cssText = 'text-align:center;font-size:10px;color:#9ca3af;padding:2px 0;';
        weekRow.appendChild(cell);
      });
      calendarPop.appendChild(weekRow);

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:2px;';

      const selectedStr = getDate();
      const today = todayStr();
      const firstDay = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (let i = 0; i < firstDay; i += 1) {
        grid.appendChild(document.createElement('div'));
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const dateStr = fmtLocalDate(new Date(viewYear, viewMonth, day));
        const dayBtn = document.createElement('button');
        dayBtn.type = 'button';
        dayBtn.textContent = String(day);
        dayBtn.style.cssText = 'border:none;background:transparent;cursor:pointer;font-size:12px;width:28px;height:28px;border-radius:50%;padding:0;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#374151;font-family:inherit;';

        if (dateStr === today) {
          dayBtn.style.border = '1.5px solid #5C8DFF';
          dayBtn.style.color = '#5C8DFF';
        }
        if (dateStr === selectedStr) {
          dayBtn.style.background = '#5C8DFF';
          dayBtn.style.color = '#fff';
          dayBtn.style.border = 'none';
        }

        dayBtn.onclick = (e) => {
          e.stopPropagation();
          setDate(dateStr);
          dateEl.textContent = dateStr;
          if (!isNew && memo) {
            memo.date = dateStr;
            const viewDateEl = card.querySelector(':scope > .memo-card-date');
            if (viewDateEl) viewDateEl.textContent = dateStr;
            void updateMemo(memo.id, { date: dateStr }, { skipRender: true });
          }
          closeCalendar();
        };

        grid.appendChild(dayBtn);
      }

      calendarPop.appendChild(grid);
    };

    dateEl.onclick = (e) => {
      e.stopPropagation();
      closeCalendar();
      const parts = getDate().split('-').map(Number);
      viewYear = parts[0];
      viewMonth = parts[1] - 1;

      calendarPop = document.createElement('div');
      calendarPop.style.cssText = 'position:absolute;top:calc(100% + 4px);left:0;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);z-index:20;padding:8px;min-width:220px;box-sizing:border-box;';
      calendarPop.onmousedown = (ev) => ev.stopPropagation();
      calendarPop.onclick = (ev) => ev.stopPropagation();
      paintCalendar();
      dateEl.appendChild(calendarPop);

      outsideHandler = (ev) => {
        if (dateEl.contains(ev.target)) return;
        closeCalendar();
      };
      setTimeout(() => document.addEventListener('mousedown', outsideHandler), 10);
    };

    return { closeCalendar };
  }

  function buildMemoCardEditUI(card, options) {
    const {
      isNew = false,
      sectionId = null,
      memo = null,
      onDone = () => {},
      onRestoreView = null,
      onSyncPreview = null,
      onMountTitleRow = null,
      onCollapseToggle = null,
    } = options;

    if (card.dataset.memoEditing === '1') return null;
    if (card.querySelector('.memo-input-title')) return null;
    card.dataset.memoEditing = '1';
    card.classList.add('memo-card--editing', 'is-editing');
    closeMemoFloatingPop();

    if (!isNew) {
      card.querySelectorAll('.memo-card-title, .memo-card-title-row, [data-memo-title]').forEach(el => el.remove());
      setMemoCardViewVisible(card, false);
    }

    let selectedColor = isNew ? '' : (memo.color || '');
    if (isNew) applyMemoCardColorStyle(card, '');
    else applyMemoCardColorStyle(card, selectedColor);

    const shell = document.createElement('div');
    shell.className = 'memo-card-edit-shell';

    const dateEl = document.createElement('div');
    dateEl.className = 'memo-card-date';
    let selectedDate = isNew ? todayStr() : (memo.date || todayStr());
    const datePicker = setupMemoEditDatePicker(card, dateEl, {
      isNew,
      memo,
      getDate: () => selectedDate,
      setDate: (str) => { selectedDate = str; },
    });

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'memo-input-title';
    titleInput.placeholder = 'Title (optional)';
    if (!isNew) titleInput.value = memo.title || '';

    const body = document.createElement('div');
    body.className = 'memo-card-content is-editing memo-input-body';
    body.contentEditable = 'true';
    body.dataset.placeholder = 'Write something...';
    bindMemoAutoListKeydown(body);

    if (!isNew) body.innerHTML = memoContentToDisplayHtml(memo.content || '');

    const toolbar = buildMemoMiniToolbar(body);

    const footer = document.createElement('div');
    footer.className = 'memo-card-edit-footer';
    footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:8px;';

    const footerLeft = document.createElement('div');
    footerLeft.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';

    const colorWrap = buildMemoColorPicker(selectedColor, (color) => {
      selectedColor = color;
      applyMemoCardColorStyle(card, color);
      if (!isNew) {
        memo.color = color;
        updateMemo(memo.id, { color: color || '' }, { skipRender: true });
      }
    });

    footerLeft.appendChild(colorWrap);

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:6px;margin-left:auto;';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'background:#f3f4f6;color:#6b7280;border:none;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:inherit;';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = 'background:#5C8DFF;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;';

    btns.append(cancelBtn, saveBtn);
    footer.append(footerLeft, btns);

    shell.append(dateEl, titleInput, toolbar, body, footer);
    card.appendChild(shell);

    let editContentInputHandler = null;
    let savingEdit = false;

    const cleanupEdit = () => {
      datePicker.closeCalendar();
      if (editContentInputHandler) {
        body.removeEventListener('input', editContentInputHandler);
        editContentInputHandler = null;
      }
      body.style.height = '';
      body.onblur = null;
      body.onkeydown = null;
      shell.remove();
      card.classList.remove('memo-card--editing', 'is-editing');
      delete card.dataset.memoEditing;
      if (!isNew) {
        setMemoCardViewVisible(card, true);
        onMountTitleRow?.();
      }
    };

    const cancelEdit = () => {
      savingEdit = true;
      cleanupEdit();
      if (isNew) {
        card.remove();
        onDone();
      } else if (onRestoreView) {
        onRestoreView(memo.content || '');
      }
    };

    const finishEdit = async () => {
      if (savingEdit) return;
      savingEdit = true;

      const newHtml = getMemoEditorHtml(body);
      const newTitle = titleInput.value.trim();

      if (isNew) {
        if (!newHtml) {
          savingEdit = false;
          return;
        }
        cleanupEdit();
        await saveMemo(sectionId, {
          title: newTitle,
          content: newHtml,
          date: selectedDate,
          color: selectedColor,
        });
        onDone();
        return;
      }

      const prevHtml = memo.content || '';
      const patch = {};
      if (newHtml !== prevHtml) patch.content = newHtml;
      if (newTitle !== (memo.title || '')) patch.title = newTitle;

      cleanupEdit();

      if (patch.content !== undefined) {
        memo.content = patch.content;
        if (onRestoreView) onRestoreView(patch.content);
      } else if (onRestoreView) {
        onRestoreView(prevHtml);
      }

      if (patch.title !== undefined) {
        memo.title = patch.title;
      }

      if (Object.keys(patch).length > 0) {
        await updateMemo(memo.id, patch, { skipRender: true });
      }
      if (card.classList.contains('memo-card--collapsed') && onSyncPreview) {
        onSyncPreview(memo.content || '');
      }
      onMountTitleRow?.();
    };

    editContentInputHandler = function onContentInput() {
      growMemoEditor(body);
    };
    body.addEventListener('input', editContentInputHandler);
    growMemoEditor(body);

    if (!isNew) {
      body.onblur = (e) => {
        if (toolbar.contains(e.relatedTarget)) return;
        if (footer.contains(e.relatedTarget)) return;
        void finishEdit();
      };
    }

    body.onkeydown = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void finishEdit();
      }
      if (e.key === 'Escape') cancelEdit();
    };

    cancelBtn.onmousedown = (e) => {
      e.preventDefault();
      savingEdit = true;
    };
    cancelBtn.onclick = (e) => {
      e.stopPropagation();
      savingEdit = false;
      cancelEdit();
    };
    saveBtn.onclick = (e) => {
      e.stopPropagation();
      void finishEdit();
    };

    footer.addEventListener('mousedown', (e) => e.preventDefault());

    body.focus();
    return { cleanupEdit, finishEdit, body, titleInput };
  }

  function buildNewMemoCard(sectionId, onDone) {
    const card = document.createElement('div');
    card.className = 'memo-card memo-input-form';
    card.dataset.memoCard = 'true';
    card.style.height = 'auto';
    card.style.maxHeight = 'none';
    card.style.overflow = 'visible';
    buildMemoCardEditUI(card, { isNew: true, sectionId, onDone });
    return card;
  }

  function showMemoTitleStylePopup(card, anchor, memo, applyTitleDom) {
    closeMemoFloatingPop();
    const pop = document.createElement('div');
    pop.className = 'memo-title-popup';

    const draft = {
      title_color: memo.title_color || '',
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

    const applyTitleColor = async (color) => {
      draft.title_color = color || '';
      memo.title_color = draft.title_color;
      applyTitleDom();
      await updateMemo(memo.id, { title_color: draft.title_color }, { skipRender: true });
    };

    const colorRow = addRow(TITLE_POP_ICON.color, 'Change Color');
    const colorExpand = document.createElement('div');
    colorExpand.className = 'memo-title-popup-color-expand';
    colorExpand.hidden = true;
    const colorPicker = buildMemoTitleColorPicker(draft.title_color || '', (color) => {
      void applyTitleColor(color);
    });
    colorPicker.classList.add('memo-title-popup-color-picker');
    colorExpand.appendChild(colorPicker);
    colorRow.onclick = (e) => {
      e.stopPropagation();
      colorRow.classList.toggle('is-color-open');
      colorExpand.hidden = !colorRow.classList.contains('is-color-open');
    };

    const emojiRow = addRow(TITLE_POP_ICON.emoji, 'Change Emoji');
    emojiRow.onclick = (e) => {
      e.stopPropagation();
      showSectionEmojiPicker(emojiRow, (emo) => {
        draft.title_emoji = emo || '';
      });
    };

    const sizeBtnWrap = document.createElement('div');
    sizeBtnWrap.className = 'memo-title-size-btns';
    const sizeNormalBtn = document.createElement('button');
    sizeNormalBtn.type = 'button';
    sizeNormalBtn.className = 'memo-title-size-btn';
    sizeNormalBtn.textContent = '보통';
    const sizeLargeBtn = document.createElement('button');
    sizeLargeBtn.type = 'button';
    sizeLargeBtn.className = 'memo-title-size-btn';
    sizeLargeBtn.textContent = '크게';
    const syncSizeBtns = () => {
      const isLarge = draft.title_size === '20px' || draft.title_size === '24px';
      sizeNormalBtn.classList.toggle('is-active', !isLarge);
      sizeLargeBtn.classList.toggle('is-active', isLarge);
    };
    syncSizeBtns();
    sizeNormalBtn.onclick = (e) => {
      e.stopPropagation();
      draft.title_size = '14px';
      memo.title_size = '14px';
      syncSizeBtns();
      applyTitleDom();
    };
    sizeLargeBtn.onclick = (e) => {
      e.stopPropagation();
      draft.title_size = '20px';
      memo.title_size = '20px';
      syncSizeBtns();
      applyTitleDom();
    };
    sizeBtnWrap.append(sizeNormalBtn, sizeLargeBtn);
    const sizeRow = addRow(TITLE_POP_ICON.size, 'Text Size', sizeBtnWrap);

    const boldToggle = document.createElement('button');
    boldToggle.type = 'button';
    boldToggle.className = 'memo-title-popup-bold-toggle';
    boldToggle.textContent = 'B';
    const syncBoldToggle = () => {
      boldToggle.classList.toggle('is-active', draft.title_bold);
    };
    syncBoldToggle();
    const boldRow = addRow(TITLE_POP_ICON.bold, 'Bold', boldToggle);
    boldToggle.onclick = (e) => {
      e.stopPropagation();
      draft.title_bold = !draft.title_bold;
      syncBoldToggle();
    };

    const divider = document.createElement('div');
    divider.className = 'memo-title-popup-divider';

    const footer = document.createElement('div');
    footer.className = 'memo-title-popup-footer';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'memo-title-popup-btn memo-title-popup-btn--ghost';
    closeBtn.textContent = 'Cancel';
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMemoTitlePopup();
    };
    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'memo-title-popup-btn memo-title-popup-btn--apply';
    applyBtn.textContent = 'Apply';
    applyBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const patch = {
        title_color: draft.title_color,
        title_size: draft.title_size,
        title_bold: draft.title_bold,
        title_emoji: draft.title_emoji,
      };
      const ok = await updateMemo(memo.id, patch, { skipRender: true });
      if (ok) {
        Object.assign(memo, patch);
        applyTitleDom();
        closeMemoTitlePopup();
      }
    };
    footer.append(closeBtn, applyBtn);

    pop.append(colorRow, colorExpand, emojiRow, sizeRow, boldRow, divider, footer);
    card.appendChild(pop);
    card.classList.add('has-title-popup');
    _memoTitlePopup = pop;

    _memoTitlePopupOutsideHandler = function onOut(e) {
      if (pop.contains(e.target) || anchor.contains(e.target)) return;
      closeMemoTitlePopup();
    };
    setTimeout(() => {
      document.addEventListener('mousedown', _memoTitlePopupOutsideHandler);
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
    collapseBtn.appendChild(makeChevronSvg('up'));
    collapseBtn.title = 'Collapse';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'memo-card-del-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Delete';

    const previewEl = document.createElement('div');
    previewEl.className = 'memo-card-preview';

    const syncPreview = (contentVal) => {
      previewEl.textContent = memoContentPreview(htmlToPlainText(contentVal));
    };

    collapseBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const collapsed = card.classList.toggle('memo-card--collapsed');
      collapseBtn.innerHTML = '';
      collapseBtn.appendChild(makeChevronSvg(collapsed ? 'down' : 'up'));
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

        titleRow.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        titleMenuBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
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
    content.innerHTML = renderMemoContentHtml(memo.content || '');
    bindMemoAutoListKeydown(content);

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

    const restoreContentView = (html) => {
      content.contentEditable = 'false';
      content.classList.remove('is-editing');
      content.innerHTML = renderMemoContentHtml(html || '');
      syncPreview(html || '');
    };

    const enterMemoEdit = () => {
      if (card.dataset.memoEditing === '1') return;
      closeMemoFloatingPop();

      buildMemoCardEditUI(card, {
        isNew: false,
        memo,
        onRestoreView: restoreContentView,
        onSyncPreview: syncPreview,
        onMountTitleRow: mountTitleRow,
        onCollapseToggle: (e, btn) => {
          collapseBtn.onclick(e);
          btn.innerHTML = '';
          btn.appendChild(makeChevronSvg(card.classList.contains('memo-card--collapsed') ? 'down' : 'up'));
          btn.title = collapseBtn.title;
        },
      });
    };

    const expandIfCollapsed = () => {
      if (!card.classList.contains('memo-card--collapsed')) return false;
      card.classList.remove('memo-card--collapsed');
      collapseBtn.innerHTML = '';
      collapseBtn.appendChild(makeChevronSvg('up'));
      collapseBtn.title = 'Collapse';
      return true;
    };

    const handleEditIntent = (e) => {
      if (e.target.closest('.memo-card-actions') || e.target.closest('.memo-pin-btn')) return;
      if (
        e.target.closest('.memo-card-title-row')
        || e.target.closest('.memo-title-popup')
        || e.target.closest('.memo-card-title-text')
        || e.target.closest('.memo-card-title-menu')
      ) return;
      if (e.target.closest('.memo-mini-toolbar') || e.target.closest('.memo-card-edit-shell')) return;
      if (card.dataset.memoEditing === '1') return;
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
