/**
 * js/note.js — 제이캘 노트탭 (TipTap 기반)
 * - notes + note_sections 테이블 연동
 * - 3패널 레이아웃 (패널 토글 1/2/3)
 * - 검색, Day/Month/All 뷰, Undo
 * - 카드 클릭 즉시 인라인 편집
 * - 300ms debounce 자동저장
 */

import { Editor } from 'https://esm.sh/@tiptap/core@2.4.0';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.4.0';
import BulletList from 'https://esm.sh/@tiptap/extension-bullet-list@2.4.0';
import OrderedList from 'https://esm.sh/@tiptap/extension-ordered-list@2.4.0';
import ListItem from 'https://esm.sh/@tiptap/extension-list-item@2.4.0';
import Table from 'https://esm.sh/@tiptap/extension-table@2.4.0';
import TableRow from 'https://esm.sh/@tiptap/extension-table-row@2.4.0';
import TableCell from 'https://esm.sh/@tiptap/extension-table-cell@2.4.0';
import TableHeader from 'https://esm.sh/@tiptap/extension-table-header@2.4.0';
import Image from 'https://esm.sh/@tiptap/extension-image@2.4.0';
import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@2.4.0';
import Underline from 'https://esm.sh/@tiptap/extension-underline@2.4.0';
import TextStyle from 'https://esm.sh/@tiptap/extension-text-style@2.4.0';
import Color from 'https://esm.sh/@tiptap/extension-color@2.4.0';
import Highlight from 'https://esm.sh/@tiptap/extension-highlight@2.4.0';
import Link from 'https://esm.sh/@tiptap/extension-link@2.4.0';
import TaskList from 'https://esm.sh/@tiptap/extension-task-list@2.4.0';
import TaskItem from 'https://esm.sh/@tiptap/extension-task-item@2.4.0';

const SECTION_COLORS = [
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
  { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
  { bg: '#FDF4FF', border: '#E9D5FF', text: '#6B21A8' },
  { bg: '#FFF1F2', border: '#FFE4E6', text: '#9F1239' },
  { bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E' },
  { bg: '#FEFCE8', border: '#FEF08A', text: '#854D0E' },
];

const DEFAULT_SECTIONS = [
  { name: "Today's Work", emoji: '💼', color: '#EEF2FF' },
  { name: 'Thoughts', emoji: '💭', color: '#F0FDF4' },
  { name: 'Journal', emoji: '📖', color: '#FFF7ED' },
];

let _sb = null, _userId = null, _sections = [], _notes = [];
let _editors = new Map();
let _hiddenPanels = new Set();
let _searchQuery = '';
let _viewMode = 'all';
let _undoStack = [];

function getSb() { if (!_sb && window.supabase?.auth) _sb = window.supabase; return _sb; }

async function getUserId() {
  if (_userId) return _userId;
  const sb = getSb(); if (!sb) return null;
  const { data } = await sb.auth.getUser();
  _userId = data?.user?.id || null; return _userId;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function thisMonthPrefix() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

async function loadSections() {
  const sb = getSb(), userId = await getUserId();
  if (!sb || !userId) return [];
  const { data, error } = await sb.from('note_sections').select('*').eq('user_id', userId).order('sort_order');
  if (error) { console.error('[note] loadSections', error); return []; }
  if (!data || data.length === 0) {
    const rows = DEFAULT_SECTIONS.map((s, i) => ({ user_id: userId, name: s.name, emoji: s.emoji, color: s.color, sort_order: i }));
    const { data: created } = await sb.from('note_sections').insert(rows).select('*');
    return created || [];
  }
  return data;
}

async function loadNotes() {
  const sb = getSb(), userId = await getUserId();
  if (!sb || !userId) return [];
  let query = sb.from('notes').select('*').eq('user_id', userId);
  if (_viewMode === 'day') query = query.eq('note_date', todayStr());
  else if (_viewMode === 'month') query = query.like('note_date', `${thisMonthPrefix()}%`);
  const { data, error } = await query.order('note_date', { ascending: false });
  if (error) { console.error('[note] loadNotes', error); return []; }
  return data || [];
}

async function saveNoteDB({ sectionId, title, content, noteDate }) {
  const sb = getSb(), userId = await getUserId();
  if (!sb || !userId) return null;
  const { data, error } = await sb.from('notes').insert({
    user_id: userId, section_id: sectionId || null,
    title: title || '', content: content || '', note_date: noteDate || todayStr(),
  }).select('*').single();
  if (error) { console.error('[note] saveNote', error); return null; }
  return data;
}

async function updateNoteContent(noteId, html) {
  const sb = getSb(); if (!sb || !noteId) return;
  await sb.from('notes').update({ content: html, updated_at: new Date().toISOString() }).eq('id', noteId);
}

async function deleteNoteDB(noteId) {
  const sb = getSb(); if (!sb || !noteId) return;
  await sb.from('notes').delete().eq('id', noteId);
}

async function togglePinDB(noteId, current) {
  const sb = getSb(); if (!sb || !noteId) return;
  await sb.from('notes').update({ is_pinned: !current }).eq('id', noteId);
}

function sanitizePasteHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('script,style,meta,link').forEach(el => el.remove());
  return div.innerHTML;
}

function createEditor({ element, content, placeholder, onUpdate }) {
  const timer = { t: null };
  let isComposing = false;
  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ bulletList: false, orderedList: false, listItem: false }),
      ListItem, BulletList, OrderedList,
      TaskList.configure({ HTMLAttributes: { class: 'note-task-list' } }),
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
      Image, Underline,
      TextStyle.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            fontSize: {
              default: null,
              parseHTML: el => el.style.fontSize || null,
              renderHTML: attrs => attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
            },
          };
        },
      }),
      Color, Highlight.configure({ multicolor: true }), Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || '내용을 입력하세요...' }),
    ],
    content: content || '',
    editorProps: {
      attributes: { class: 'note-tiptap-editor', style: 'outline:none;min-height:80px;padding:8px 10px;font-size:14px;line-height:1.6;color:#1a1a1a;' },
      handleKeyDown(view, event) {
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const { state } = view;
          const { selection } = state;
          const { $anchor } = selection;
          // 커서 앞 노드가 HR이면 삭제
          const nodeBefore = $anchor.nodeBefore;
          if (nodeBefore && nodeBefore.type.name === 'horizontalRule') {
            const tr = state.tr.delete($anchor.pos - nodeBefore.nodeSize, $anchor.pos);
            view.dispatch(tr);
            return true;
          }
          // 커서 뒤 노드가 HR이면 삭제 (Delete키)
          const nodeAfter = $anchor.nodeAfter;
          if (event.key === 'Delete' && nodeAfter && nodeAfter.type.name === 'horizontalRule') {
            const tr = state.tr.delete($anchor.pos, $anchor.pos + nodeAfter.nodeSize);
            view.dispatch(tr);
            return true;
          }
        }
        return false;
      },
      handlePaste(_, event) {
        const html = event.clipboardData?.getData('text/html');
        if (html && html.trim().length > 20) {
          event.preventDefault();
          editor.commands.insertContent(sanitizePasteHtml(html));
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      if (isComposing) return;
      const html = editor.getHTML();
      if (timer.t) clearTimeout(timer.t);
      timer.t = setTimeout(() => onUpdate(html), 300);
    },
  });
  element.addEventListener('compositionstart', () => { isComposing = true; });
  element.addEventListener('compositionend', () => { isComposing = false; setTimeout(() => onUpdate(editor.getHTML()), 50); });
  return editor;
}

function buildToolbar(editor) {
  const tb = document.createElement('div');
  tb.style.cssText = 'display:flex;align-items:center;gap:0px;padding:4px 8px;border-bottom:1px solid #e5e7eb;background:#f8fafc;flex-wrap:wrap;min-height:32px;';

  const mkBtn = ({ label, title, action, mark, style }) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.title = title;
    btn.innerHTML = label;
    btn.style.cssText = `padding:3px 7px;border:none;border-radius:4px;background:none;cursor:pointer;font-size:13px;color:#374151;line-height:1;transition:background 0.1s;font-family:inherit;${style||''}`;
    btn.onmouseover = () => { if (!btn._active) btn.style.background = '#f3f4f6'; };
    btn.onmouseout = () => { if (!btn._active) btn.style.background = 'none'; };
    btn.onmousedown = (e) => { e.preventDefault(); action(); };
    if (mark) {
      const upd = () => {
        const a = mark === 'heading1' ? editor.isActive('heading', { level: 1 })
                : mark === 'heading2' ? editor.isActive('heading', { level: 2 })
                : editor.isActive(mark);
        btn._active = a;
        btn.style.background = a ? '#e0e7ff' : 'none';
        btn.style.color = a ? '#4f46e5' : '#374151';
      };
      editor.on('selectionUpdate', upd); editor.on('update', upd);
    }
    return btn;
  };

  const sep = () => {
    const d = document.createElement('div');
    d.style.cssText = 'width:1px;height:14px;background:#d1d5db;margin:0 3px;flex-shrink:0;';
    return d;
  };

  // 1. 체크박스
  tb.append(
    mkBtn({
      label: '☑',
      title: '체크박스',
      action: () => editor.chain().focus().toggleTaskList().run(),
      style: 'font-size:15px;',
    }),
    sep(),
  );

  // 2. H1 H2
  tb.append(
    mkBtn({ label: 'H1', title: '제목1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), mark: 'heading1', style: 'font-weight:700;font-size:12px;' }),
    mkBtn({ label: 'H2', title: '제목2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), mark: 'heading2', style: 'font-weight:600;font-size:12px;' }),
    sep(),
  );

  // 3. B I U S
  tb.append(
    mkBtn({ label: 'B', title: '굵게', action: () => editor.chain().focus().toggleBold().run(), mark: 'bold', style: 'font-weight:700;' }),
    mkBtn({ label: '<i>I</i>', title: '기울임', action: () => editor.chain().focus().toggleItalic().run(), mark: 'italic' }),
    mkBtn({ label: 'U', title: '밑줄', action: () => editor.chain().focus().toggleUnderline().run(), mark: 'underline', style: 'text-decoration:underline;' }),
    mkBtn({ label: 'S', title: '취소선', action: () => editor.chain().focus().toggleStrike().run(), mark: 'strike', style: 'text-decoration:line-through;' }),
    sep(),
  );

  // 4. A HL
  const makeFixedDropdown = (colors, onSelect, onReset) => {
    const drop = document.createElement('div');
    drop.classList.add('__fixed-toolbar-drop');
    drop.style.cssText = 'display:none;position:fixed;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:6px;z-index:9999;flex-wrap:wrap;gap:4px;width:108px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    colors.forEach(c => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.style.cssText = `width:22px;height:22px;border-radius:50%;background:${c};border:2px solid transparent;cursor:pointer;flex-shrink:0;`;
      dot.onmouseover = () => dot.style.borderColor = '#6366f1';
      dot.onmouseout = () => dot.style.borderColor = 'transparent';
      dot.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); onSelect(c); drop.style.display = 'none'; };
      drop.appendChild(dot);
    });
    if (onReset) {
      const rst = document.createElement('button');
      rst.type = 'button'; rst.title = '제거'; rst.textContent = '✕';
      rst.style.cssText = 'width:22px;height:22px;border-radius:50%;background:#f3f4f6;border:1px solid #e5e7eb;cursor:pointer;font-size:10px;flex-shrink:0;';
      rst.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); onReset(); drop.style.display = 'none'; };
      drop.appendChild(rst);
    }
    document.body.appendChild(drop);
    return drop;
  };

  const openFixedDropdown = (drop, triggerEl) => {
    document.querySelectorAll('.__fixed-toolbar-drop').forEach(d => d.style.display = 'none');
    document.querySelectorAll('[data-size-drop]').forEach(d => d.style.display = 'none');
    const rect = triggerEl.getBoundingClientRect();
    drop.style.left = rect.left + 'px';
    drop.style.top = (rect.bottom + 4) + 'px';
    drop.style.display = 'flex';
  };

  const colorPalette = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#111827'];
  const colorDrop = makeFixedDropdown(colorPalette, (c) => editor.chain().focus().setColor(c).run(), () => editor.chain().focus().unsetColor().run());
  const colorBtn = document.createElement('button');
  colorBtn.type = 'button'; colorBtn.title = '글자색'; colorBtn.textContent = 'A';
  colorBtn.style.cssText = 'padding:5px 9px;border:none;border-radius:5px;background:none;cursor:pointer;font-size:14px;font-weight:700;color:#374151;line-height:1;';
  colorBtn.onmouseover = () => colorBtn.style.background = '#f3f4f6';
  colorBtn.onmouseout = () => colorBtn.style.background = 'none';
  colorBtn.onmousedown = (e) => { e.preventDefault(); openFixedDropdown(colorDrop, colorBtn); };
  tb.appendChild(colorBtn);

  const hlPalette = ['#fef08a','#bbf7d0','#bae6fd','#fecaca','#e9d5ff','#fed7aa'];
  const hlDrop = makeFixedDropdown(hlPalette, (c) => editor.chain().focus().toggleHighlight({ color: c }).run(), () => editor.chain().focus().unsetHighlight().run());
  const hlBtn = document.createElement('button');
  hlBtn.type = 'button'; hlBtn.title = '하이라이트'; hlBtn.textContent = 'HL';
  hlBtn.style.cssText = 'padding:5px 9px;border:none;border-radius:5px;background:none;cursor:pointer;font-size:14px;color:#374151;line-height:1;';
  hlBtn.onmouseover = () => { if (!hlBtn._active) hlBtn.style.background = '#f3f4f6'; };
  hlBtn.onmouseout = () => { if (!hlBtn._active) hlBtn.style.background = 'none'; };
  const hlUpd = () => {
    const a = editor.isActive('highlight');
    hlBtn._active = a;
    hlBtn.style.background = a ? '#e0e7ff' : 'none';
    hlBtn.style.color = a ? '#4f46e5' : '#374151';
  };
  editor.on('selectionUpdate', hlUpd); editor.on('update', hlUpd);
  hlBtn.onmousedown = (e) => { e.preventDefault(); openFixedDropdown(hlDrop, hlBtn); };
  tb.appendChild(hlBtn);
  tb.appendChild(sep());

  // 5. — (구분선) + ∨ (글자크기)
  const sizeWrap = document.createElement('div');
  sizeWrap.style.cssText = 'display:flex;align-items:center;';

  const hrBtn = document.createElement('button');
  hrBtn.type = 'button'; hrBtn.title = '구분선'; hrBtn.textContent = '—';
  hrBtn.style.cssText = 'padding:5px 8px;border:none;border-right:1px solid #d1d5db;background:none;cursor:pointer;font-size:14px;color:#374151;line-height:1;';
  hrBtn.onmouseover = () => hrBtn.style.background = '#f3f4f6';
  hrBtn.onmouseout = () => hrBtn.style.background = 'none';
  hrBtn.onmousedown = (e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); };

  const sizeToggle = document.createElement('button');
  sizeToggle.type = 'button'; sizeToggle.title = '글자 크기';
  sizeToggle.style.cssText = 'padding:5px 6px;border:none;background:none;cursor:pointer;font-size:12px;color:#9ca3af;line-height:1;';
  sizeToggle.textContent = '∨';
  sizeToggle.onmouseover = () => sizeToggle.style.background = '#f3f4f6';
  sizeToggle.onmouseout = () => sizeToggle.style.background = 'none';

  const fontSizes = [8,9,10,11,12,14,18,24,36];
  const sizeDrop = document.createElement('div');
  sizeDrop.dataset.sizeDrop = '1';
  sizeDrop.style.cssText = 'display:none;position:fixed;background:#fff;border:1px solid #e5e7eb;border-radius:6px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.12);max-height:200px;overflow-y:auto;min-width:64px;';
  fontSizes.forEach(sz => {
    const item = document.createElement('button');
    item.type = 'button'; item.textContent = sz + 'px';
    item.style.cssText = 'display:block;width:100%;padding:5px 14px;border:none;background:none;cursor:pointer;font-size:12px;text-align:left;color:#374151;';
    item.onmouseover = () => item.style.background = '#f3f4f6';
    item.onmouseout = () => item.style.background = 'none';
    item.onmousedown = (e) => {
      e.preventDefault(); e.stopPropagation();
      editor.chain().focus().setMark('textStyle', { fontSize: sz + 'px' }).run();
      sizeDrop.style.display = 'none';
    };
    sizeDrop.appendChild(item);
  });
  document.body.appendChild(sizeDrop);
  sizeToggle.onmousedown = (e) => {
    e.preventDefault();
    const rect = sizeToggle.getBoundingClientRect();
    sizeDrop.style.left = rect.left + 'px';
    sizeDrop.style.top = (rect.bottom + 4) + 'px';
    sizeDrop.style.display = sizeDrop.style.display === 'none' ? 'block' : 'none';
  };

  sizeWrap.append(hrBtn, sizeToggle);
  tb.append(sizeWrap, sep());

  // 6. 링크
  tb.appendChild(mkBtn({
    label: '🔗', title: '링크',
    action: () => {
      const prev = editor.getAttributes('link').href;
      const url = prompt('링크 URL 입력', prev || 'https://');
      if (url === null) return;
      if (url === '') { editor.chain().focus().unsetLink().run(); return; }
      editor.chain().focus().setLink({ href: url }).run();
    },
    mark: 'link'
  }));

  // 7. 이모지
  const emojiList = ['😊','😂','🔥','✅','❌','💡','📌','🎯','💬','⭐'];
  const emojiDrop = document.createElement('div');
  emojiDrop.classList.add('__fixed-toolbar-drop');
  emojiDrop.style.cssText = 'display:none;position:fixed;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:6px;z-index:9999;flex-wrap:wrap;gap:3px;width:132px;box-shadow:0 4px 12px rgba(0,0,0,0.12);';
  emojiList.forEach(em => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = em;
    btn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:18px;padding:2px;border-radius:4px;';
    btn.onmouseover = () => btn.style.background = '#f3f4f6';
    btn.onmouseout = () => btn.style.background = 'none';
    btn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().insertContent(em).run(); emojiDrop.style.display = 'none'; };
    emojiDrop.appendChild(btn);
  });
  document.body.appendChild(emojiDrop);
  const emojiBtn = document.createElement('button');
  emojiBtn.type = 'button'; emojiBtn.title = '이모지'; emojiBtn.textContent = '🙂';
  emojiBtn.style.cssText = 'padding:5px 7px;border:none;border-radius:5px;background:none;cursor:pointer;font-size:17px;line-height:1;';
  emojiBtn.onmouseover = () => emojiBtn.style.background = '#f3f4f6';
  emojiBtn.onmouseout = () => emojiBtn.style.background = 'none';
  emojiBtn.onmousedown = (e) => {
    e.preventDefault();
    const rect = emojiBtn.getBoundingClientRect();
    emojiDrop.style.left = rect.left + 'px';
    emojiDrop.style.top = (rect.bottom + 4) + 'px';
    emojiDrop.style.display = emojiDrop.style.display === 'none' ? 'flex' : 'none';
  };
  tb.appendChild(emojiBtn);

  // 전역 닫기
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.__fixed-toolbar-drop') &&
        e.target !== colorBtn && e.target !== hlBtn &&
        e.target !== emojiBtn && e.target !== sizeToggle) {
      document.querySelectorAll('.__fixed-toolbar-drop').forEach(d => d.style.display = 'none');
      sizeDrop.style.display = 'none';
    }
  });

  return tb;
}

function matchesSearch(note) {
  if (!_searchQuery) return true;
  const q = _searchQuery.toLowerCase();
  const title = (note.title || '').toLowerCase();
  const div = document.createElement('div'); div.innerHTML = note.content || '';
  return title.includes(q) || (div.textContent || '').toLowerCase().includes(q);
}

function updateUndoBtn() {
  const btn = document.getElementById('note-undo-btn');
  if (btn) btn.style.opacity = _undoStack.length > 0 ? '1' : '0.3';
}

function buildNoteCard(note, colorEntry) {
  const card = document.createElement('div');
  card.className = 'note-card';
  card.dataset.noteId = note.id || '';
  card.style.cssText = 'background:#fff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);transition:box-shadow 0.15s;';

  let isCollapsed = false;

  // ── header ──────────────────────────────────────────
  const header = document.createElement('div');
  header.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:${colorEntry.bg};border-bottom:1px solid ${colorEntry.border};gap:6px;`;

  // 날짜
  const dateEl = document.createElement('span');
  dateEl.style.cssText = 'font-size:11px;color:#9ca3af;flex-shrink:0;cursor:pointer;';
  dateEl.textContent = note.note_date || todayStr();

  // 타이틀 (header 안으로 이동)
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = 'Title (optional)';
  titleInput.value = note.title || '';
  titleInput.style.cssText = 'flex:1;min-width:0;border:none;background:transparent;font-size:13px;font-weight:600;font-family:inherit;outline:none;color:#111827;padding:0;';
  const updateTitleVisibility = () => {
    titleInput.style.display = titleInput.value.trim() === '' && document.activeElement !== titleInput ? 'none' : '';
  };

  titleInput.onchange = async () => {
    const sb = getSb();
    if (sb && note.id) await sb.from('notes').update({ title: titleInput.value }).eq('id', note.id);
    updateTitleVisibility();
  };

  titleInput.addEventListener('focus', () => {
    titleInput.style.display = '';
    titleInput.style.outline = 'none';
  });

  titleInput.addEventListener('blur', () => {
    titleInput.style.outline = 'none';
    updateTitleVisibility();
  });

  // 초기 상태 적용
  updateTitleVisibility();

  // 우측 액션 버튼들
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:4px;align-items:center;flex-shrink:0;';

  // 접고펴기 버튼
  const collapseBtn = document.createElement('button');
  collapseBtn.type = 'button';
  collapseBtn.textContent = '▲';
  collapseBtn.title = '접기';
  collapseBtn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:10px;color:#9ca3af;padding:2px 4px;line-height:1;';

  const pinBtn = document.createElement('button');
  pinBtn.type = 'button'; pinBtn.textContent = '📌';
  pinBtn.style.cssText = `border:none;background:none;cursor:pointer;font-size:12px;opacity:${note.is_pinned?'1':'0.3'};padding:2px;`;
  pinBtn.onclick = async (e) => {
    e.stopPropagation();
    await togglePinDB(note.id, note.is_pinned);
    note.is_pinned = !note.is_pinned;
    pinBtn.style.opacity = note.is_pinned ? '1' : '0.3';
  };

  const delBtn = document.createElement('button');
  delBtn.type = 'button'; delBtn.textContent = '×';
  delBtn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:16px;color:#9ca3af;padding:2px 4px;line-height:1;';
  delBtn.onclick = async (e) => {
    e.stopPropagation();
    if (!confirm('노트를 삭제할까요?')) return;
    if (note.id) { _undoStack.push({ noteId: note.id, prevContent: note.content, prevTitle: note.title }); updateUndoBtn(); }
    const ed = _editors.get(note.id); if (ed) { ed.destroy(); _editors.delete(note.id); }
    await deleteNoteDB(note.id);
    card.remove();
  };

  actions.append(collapseBtn, pinBtn, delBtn);
  header.append(dateEl, titleInput, actions);

  card.onmouseenter = () => card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
  card.onmouseleave = () => card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';

  // ── body ────────────────────────────────────────────
  const body = document.createElement('div');
  body.style.cssText = 'transition:none;';

  const preview = document.createElement('div');
  preview.className = 'note-card-preview';
  preview.style.cssText = 'padding:8px 10px;font-size:13px;line-height:1.6;color:#374151;min-height:56px;cursor:text;';
  preview.innerHTML = note.content || '<span style="color:#d1d5db;font-size:12px;">클릭해서 입력...</span>';

  // 접힌 상태 미리보기 (3줄)
  const collapsedPreview = document.createElement('div');
  collapsedPreview.className = 'note-card-preview';
  collapsedPreview.style.cssText = 'padding:6px 10px;font-size:12px;line-height:1.5;color:#6b7280;display:none;overflow:hidden;display:none;-webkit-line-clamp:3;-webkit-box-orient:vertical;max-height:60px;pointer-events:none;';

  const editorEl = document.createElement('div');
  editorEl.style.cssText = 'border:1.5px solid #3b82f6;border-radius:6px;overflow:hidden;margin:4px 8px 8px;display:none;';

  body.append(preview, collapsedPreview, editorEl);
  card.append(header, body);

  let isEditing = false, editorInstance = null, toolbar = null;

  // ── 접고펴기 토글 ────────────────────────────────────
  const updateCollapsed = () => {
    if (isCollapsed) {
      collapseBtn.textContent = '▼';
      collapseBtn.title = '펴기';
      // 접힌 미리보기: 본문 텍스트 3줄
      const div = document.createElement('div');
      div.innerHTML = note.content || '';
      const text = div.textContent || '';
      collapsedPreview.textContent = text;
      collapsedPreview.style.cssText = 'padding:6px 10px;font-size:12px;line-height:1.5;color:#6b7280;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;max-height:60px;pointer-events:none;';
      preview.style.display = 'none';
      editorEl.style.display = 'none';
      if (toolbar) { toolbar.style.display = 'none'; }
    } else {
      collapseBtn.textContent = '▲';
      collapseBtn.title = '접기';
      collapsedPreview.style.display = 'none';
      preview.style.display = '';
      if (!isEditing) editorEl.style.display = 'none';
      else editorEl.style.display = '';
      if (toolbar) { toolbar.style.display = ''; }
    }
  };

  // ── 편집 활성화 ──────────────────────────────────────
  const activateEditor = () => {
    if (isEditing || isCollapsed) return;
    isEditing = true;
    preview.style.display = 'none';
    editorEl.style.display = '';
    editorInstance = createEditor({
      element: editorEl, content: note.content || '', placeholder: '내용을 입력하세요...',
      onUpdate: async (html) => {
        note.content = html;
        if (note.id) { await updateNoteContent(note.id, html); }
        else {
          const saved = await saveNoteDB({ sectionId: note.section_id, title: titleInput.value, content: html, noteDate: note.note_date });
          if (saved) { note.id = saved.id; card.dataset.noteId = saved.id; _editors.set(saved.id, editorInstance); }
        }
      },
    });
    toolbar = buildToolbar(editorInstance);
    editorEl.parentNode.insertBefore(toolbar, editorEl);
    if (note.id) _editors.set(note.id, editorInstance);
    setTimeout(() => editorInstance.commands.focus('end'), 50);
  };

  const deactivateEditor = () => {
    if (!isEditing) return;
    isEditing = false;
    if (toolbar) { toolbar.remove(); toolbar = null; }
    if (editorInstance) {
      note.content = editorInstance.getHTML();
      editorInstance.destroy(); editorInstance = null;
      if (note.id) _editors.delete(note.id);
    }
    preview.innerHTML = note.content || '<span style="color:#d1d5db;font-size:12px;">클릭해서 입력...</span>';
    preview.style.display = '';
    editorEl.innerHTML = '';
    editorEl.style.display = 'none';
  };

  collapseBtn.onmousedown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isCollapsed = !isCollapsed;
    if (isCollapsed && isEditing) deactivateEditor();
    updateCollapsed();
  };

  preview.onclick = activateEditor;
  titleInput.onfocus = activateEditor;
  document.addEventListener('mousedown', (e) => { if (!isEditing || card.contains(e.target)) return; deactivateEditor(); });

  return card;
}

function buildSection(section, notes, colorEntry) {
  const wrap = document.createElement('div');
  wrap.dataset.sectionId = section.id;

  const header = document.createElement('div');
  header.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;margin-bottom:8px;background:${colorEntry.bg};border:1px solid ${colorEntry.border};`;

  const left = document.createElement('div');
  left.style.cssText = 'display:flex;align-items:center;gap:6px;';
  const emoji = document.createElement('span'); emoji.textContent = section.emoji || '📁'; emoji.style.fontSize = '14px';
  const nameEl = document.createElement('span'); nameEl.textContent = section.name; nameEl.style.cssText = `font-size:13px;font-weight:700;color:${colorEntry.text};`;
  left.append(emoji, nameEl);

  const addBtn = document.createElement('button');
  addBtn.type = 'button'; addBtn.textContent = '+';
  addBtn.style.cssText = `border:none;background:none;cursor:pointer;font-size:18px;color:${colorEntry.text};padding:0 4px;font-weight:300;line-height:1;`;
  header.append(left, addBtn);

  const list = document.createElement('div');
  const sectionNotes = notes
    .filter(n => n.section_id === section.id && matchesSearch(n))
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const dateA = (a.updated_at || a.note_date || '');
      const dateB = (b.updated_at || b.note_date || '');
      return dateB.localeCompare(dateA);
    });
  sectionNotes.forEach(note => list.appendChild(buildNoteCard(note, colorEntry)));

  addBtn.onclick = () => {
    const newNote = { id: null, section_id: section.id, title: '', content: '', note_date: todayStr(), is_pinned: false };
    const card = buildNoteCard(newNote, colorEntry);
    list.insertBefore(card, list.firstChild);
    setTimeout(() => card.querySelector('.note-card-preview')?.click(), 50);
  };

  wrap.append(header, list);
  return wrap;
}

function buildNoteHeader(page) {
  const cardHeader = page.previousElementSibling;
  if (!cardHeader || !cardHeader.classList.contains('card__header')) return;
  cardHeader.innerHTML = '';
  cardHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;flex-shrink:0;gap:8px;border-bottom:1px solid #f3f4f6;';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:14px;font-weight:700;color:#111827;white-space:nowrap;';
  title.textContent = '📝 Note';

  const searchWrap = document.createElement('div');
  searchWrap.style.cssText = 'flex:1;min-width:100px;max-width:200px;';
  const searchInput = document.createElement('input');
  searchInput.type = 'text'; searchInput.placeholder = 'Search memos...';
  searchInput.style.cssText = 'width:100%;box-sizing:border-box;padding:4px 10px;border:1px solid #e5e7eb;border-radius:20px;font-size:12px;outline:none;background:#f9fafb;';
  searchInput.oninput = () => { _searchQuery = searchInput.value.trim(); renderNotePage(); };
  searchWrap.appendChild(searchInput);

  const right = document.createElement('div');
  right.style.cssText = 'display:flex;align-items:center;gap:4px;flex-shrink:0;';

  // Undo
  const undoBtn = document.createElement('button');
  undoBtn.id = 'note-undo-btn'; undoBtn.type = 'button'; undoBtn.textContent = '↩ Undo';
  undoBtn.style.cssText = 'padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;font-size:11px;cursor:pointer;color:#374151;opacity:0.3;';
  undoBtn.onclick = async () => {
    if (!_undoStack.length) return;
    const { noteId, prevContent, prevTitle } = _undoStack.pop();
    const sb = getSb();
    if (sb && noteId) await sb.from('notes').update({ content: prevContent, title: prevTitle, updated_at: new Date().toISOString() }).eq('id', noteId);
    updateUndoBtn(); renderNotePage();
  };

  // Day/Month/All
  const mkViewBtn = (label, mode) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = label;
    const active = () => _viewMode === mode;
    const upd = () => { btn.style.cssText = `padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;cursor:pointer;${active()?'background:#1a56db;color:#fff;border-color:#1a56db;':'background:#fff;color:#374151;'}`; };
    upd();
    btn.onclick = () => { _viewMode = mode; document.querySelectorAll('.note-view-btn').forEach(b => b._upd()); renderNotePage(); };
    btn.className = 'note-view-btn'; btn._upd = upd;
    return btn;
  };

  // 패널 토글 1/2/3
  const panelBtns = [0, 1, 2].map(idx => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = String(idx + 1);
    const upd = () => {
      const hidden = _hiddenPanels.has(idx);
      btn.style.cssText = `width:24px;height:24px;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;cursor:pointer;${hidden?'background:#e5e7eb;color:#9ca3af;':'background:#fff;color:#374151;'}`;
    };
    upd();
    btn.onclick = () => {
      if (_hiddenPanels.has(idx)) _hiddenPanels.delete(idx); else _hiddenPanels.add(idx);
      upd();
      const panels = document.querySelectorAll('#memoPageContent > div > div');
      if (panels[idx]) panels[idx].style.display = _hiddenPanels.has(idx) ? 'none' : '';
    };
    return btn;
  });

  right.append(undoBtn, mkViewBtn('Day','day'), mkViewBtn('Month','month'), mkViewBtn('All','all'), ...panelBtns);
  cardHeader.append(title, searchWrap, right);
}

async function renderNotePage() {
  const page = document.getElementById('memoPageContent');
  if (!page) return;

  if (!document.getElementById('note-tiptap-styles')) {
    const style = document.createElement('style');
    style.id = 'note-tiptap-styles';
    style.textContent = `
      .note-tiptap-editor{outline:none;}
      .note-tiptap-editor p{margin:0 0 4px;}
      .note-tiptap-editor ul,.note-tiptap-editor ol{padding-left:20px;margin:4px 0;}
      .note-tiptap-editor table{border-collapse:collapse;width:100%;margin:8px 0;}
      .note-tiptap-editor td,.note-tiptap-editor th{border:1px solid #e5e7eb;padding:4px 8px;min-width:40px;}
      .note-tiptap-editor th{background:#f9fafb;font-weight:600;}
      .note-tiptap-editor img{max-width:100%;border-radius:6px;}
      .note-tiptap-editor p.is-editor-empty:first-child::before{content:attr(data-placeholder);float:left;color:#9ca3af;pointer-events:none;height:0;}
      .note-card-preview table{border-collapse:collapse;width:100%;margin:4px 0;font-size:13px;}
      .note-card-preview td,.note-card-preview th{border:1px solid #e5e7eb;padding:3px 6px;min-width:30px;}
      .note-card-preview th{background:#f9fafb;font-weight:600;}
      .note-card-preview ul,.note-card-preview ol{padding-left:18px;margin:2px 0;}
      .note-card-preview img{max-width:100%;border-radius:4px;}
      .note-card-preview p{margin:0 0 2px;}
      .note-card-preview ul[data-type="taskList"]{list-style:none;padding-left:4px;margin:2px 0;}
      .note-card-preview ul[data-type="taskList"] li{display:flex;align-items:flex-start;gap:6px;padding:2px 0;}
      .note-card-preview ul[data-type="taskList"] li > label{margin-top:2px;flex-shrink:0;}
      .note-card-preview ul[data-type="taskList"] li > div{flex:1;}
      .note-card-preview ul[data-type="taskList"] li[data-checked="true"] > div p{text-decoration:line-through;color:#9ca3af;}
      .note-tiptap-editor span[style*="font-size"]{line-height:1.4;}
      .note-tiptap-editor ul[data-type="taskList"]{list-style:none;padding-left:4px;}
      .note-tiptap-editor ul[data-type="taskList"] li{display:flex;align-items:flex-start;gap:6px;padding:2px 0;}
      .note-tiptap-editor ul[data-type="taskList"] li > label{margin-top:2px;flex-shrink:0;}
      .note-tiptap-editor ul[data-type="taskList"] li > div{flex:1;}
      .note-tiptap-editor ul[data-type="taskList"] li[data-checked="true"] > div p{text-decoration:line-through;color:#9ca3af;}
    `;
    document.head.appendChild(style);
  }

  page.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;">불러오는 중...</div>';

  const userId = await getUserId();
  if (!userId) {
    page.innerHTML = '';
    const gate = document.createElement('div');
    gate.style.cssText = 'padding:20px;font-size:13px;';
    gate.textContent = '로그인 후 노트를 사용할 수 있습니다.';
    gate.style.cursor = 'pointer';
    gate.style.color = '#5C8DFF';
    gate.onclick = () => window.openAppLoginModal?.();
    page.appendChild(gate);
    return;
  }

  _sections = await loadSections();
  _notes = await loadNotes();

  page.innerHTML = '';
  page.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;';

  const container = document.createElement('div');
  container.style.cssText = 'display:flex;gap:10px;padding:10px;flex:1;overflow:hidden;box-sizing:border-box;';

  _sections.forEach((section, idx) => {
    const colorEntry = SECTION_COLORS.find(c => c.bg === section.color) || SECTION_COLORS[idx % SECTION_COLORS.length];
    const panel = document.createElement('div');
    panel.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;overflow-y:auto;height:100%;';
    if (_hiddenPanels.has(idx)) panel.style.display = 'none';
    panel.appendChild(buildSection(section, _notes, colorEntry));
    container.appendChild(panel);
  });

  page.appendChild(container);
  buildNoteHeader(page);
  updateUndoBtn();
}

async function showNotePage() {
  _editors.forEach(ed => ed.destroy()); _editors.clear();
  localStorage.setItem('memo2.lastPage', 'memo');

  // 다른 페이지 숨김 — memoPage 계열만 건드림
  ['calendarPage','routinePage','dailyPage','timerPage',
   'logsPage','insightPage','insightWritePage','memoWritePage','homeIntroSection']
    .forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });

  // memoPage show
  const memoPage = document.getElementById('memoPage');
  if (memoPage) memoPage.classList.remove('hidden');

  await renderNotePage();
}

window.showNotePage = showNotePage;
window.JCal = window.JCal || {};
window.JCal.showMemoPage = showNotePage;
window.showMemoPage = showNotePage;
