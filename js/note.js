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
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
      Image, Underline, TextStyle, Color, Highlight.configure({ multicolor: true }), Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || '내용을 입력하세요...' }),
    ],
    content: content || '',
    editorProps: {
      attributes: { class: 'note-tiptap-editor', style: 'outline:none;min-height:80px;padding:8px;font-size:14px;line-height:1.6;color:#1a1a1a;' },
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
  tb.style.cssText = 'display:flex;gap:2px;padding:4px 6px;border-bottom:1px solid #e5e7eb;flex-wrap:wrap;align-items:center;background:#fafafa;';

  const mkBtn = ({ label, title, action, mark, style }) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.title = title; btn.textContent = label;
    btn.style.cssText = `padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;${style||''}`;
    btn.onmousedown = (e) => { e.preventDefault(); action(); };
    if (mark) {
      const upd = () => {
        const a = editor.isActive(mark);
        btn.style.background = a ? '#e0e7ff' : '#fff';
        btn.style.borderColor = a ? '#6366f1' : '#e5e7eb';
      };
      editor.on('selectionUpdate', upd); editor.on('update', upd);
    }
    return btn;
  };

  // 구분선 (divider)
  const sep = () => {
    const d = document.createElement('div');
    d.style.cssText = 'width:1px;height:16px;background:#e5e7eb;margin:0 2px;';
    return d;
  };

  // B I U S
  tb.append(
    mkBtn({ label: 'B', title: '굵게', action: () => editor.chain().focus().toggleBold().run(), mark: 'bold', style: 'font-weight:700;' }),
    mkBtn({ label: 'I', title: '기울임', action: () => editor.chain().focus().toggleItalic().run(), mark: 'italic', style: 'font-style:italic;' }),
    mkBtn({ label: 'U', title: '밑줄', action: () => editor.chain().focus().toggleUnderline().run(), mark: 'underline', style: 'text-decoration:underline;' }),
    mkBtn({ label: 'S', title: '취소선', action: () => editor.chain().focus().toggleStrike().run(), mark: 'strike', style: 'text-decoration:line-through;' }),
    sep(),
  );

  // 구분선 버튼 — 불렛 드롭다운
  tb.append(
    mkBtn({ label: '—', title: '구분선', action: () => editor.chain().focus().setHorizontalRule().run() }),
    mkBtn({ label: '•', title: '불렛', action: () => editor.chain().focus().toggleBulletList().run(), mark: 'bulletList' }),
    mkBtn({ label: '1.', title: '번호', action: () => editor.chain().focus().toggleOrderedList().run(), mark: 'orderedList' }),
    mkBtn({ label: '⊞', title: '표', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }),
    sep(),
  );

  // A (글자색) — 6가지 색상 드롭다운
  const colorBtn = document.createElement('button');
  colorBtn.type = 'button'; colorBtn.title = '글자색'; colorBtn.textContent = 'A';
  colorBtn.style.cssText = 'padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;font-weight:700;position:relative;';
  const colorPalette = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#111827'];
  const colorDrop = document.createElement('div');
  colorDrop.style.cssText = 'display:none;position:absolute;top:28px;left:0;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:4px;z-index:100;display:none;flex-wrap:wrap;gap:3px;width:90px;box-shadow:0 2px 8px rgba(0,0,0,0.12);';
  colorPalette.forEach(c => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.style.cssText = `width:18px;height:18px;border-radius:50%;background:${c};border:2px solid transparent;cursor:pointer;`;
    dot.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().setColor(c).run(); colorDrop.style.display = 'none'; };
    colorDrop.appendChild(dot);
  });
  // 색상 초기화
  const resetDot = document.createElement('button');
  resetDot.type = 'button'; resetDot.title = '색상 제거'; resetDot.textContent = '✕';
  resetDot.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#f3f4f6;border:1px solid #e5e7eb;cursor:pointer;font-size:10px;';
  resetDot.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().unsetColor().run(); colorDrop.style.display = 'none'; };
  colorDrop.appendChild(resetDot);
  colorBtn.style.position = 'relative';
  colorBtn.appendChild(colorDrop);
  colorBtn.onmousedown = (e) => { e.preventDefault(); colorDrop.style.display = colorDrop.style.display === 'none' ? 'flex' : 'none'; };
  document.addEventListener('mousedown', (e) => { if (!colorBtn.contains(e.target)) colorDrop.style.display = 'none'; });
  tb.appendChild(colorBtn);

  // HL (하이라이트)
  tb.append(mkBtn({ label: 'HL', title: '하이라이트', action: () => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run(), mark: 'highlight' }));

  // 링크
  const linkBtn = mkBtn({
    label: '🔗', title: '링크',
    action: () => {
      const prev = editor.getAttributes('link').href;
      const url = prompt('링크 URL 입력', prev || 'https://');
      if (url === null) return;
      if (url === '') { editor.chain().focus().unsetLink().run(); return; }
      editor.chain().focus().setLink({ href: url }).run();
    },
    mark: 'link'
  });
  tb.appendChild(linkBtn);

  // 이모지 (간단 드롭다운)
  const emojiList = ['😊','😂','🔥','✅','❌','💡','📌','🎯','💬','⭐'];
  const emojiBtn = document.createElement('button');
  emojiBtn.type = 'button'; emojiBtn.title = '이모지'; emojiBtn.textContent = '😊';
  emojiBtn.style.cssText = 'padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;position:relative;';
  const emojiDrop = document.createElement('div');
  emojiDrop.style.cssText = 'display:none;position:absolute;top:28px;right:0;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:4px;z-index:100;flex-wrap:wrap;gap:2px;width:130px;box-shadow:0 2px 8px rgba(0,0,0,0.12);';
  emojiList.forEach(em => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = em;
    btn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:16px;padding:2px;';
    btn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().insertContent(em).run(); emojiDrop.style.display = 'none'; };
    emojiDrop.appendChild(btn);
  });
  emojiBtn.style.position = 'relative';
  emojiBtn.appendChild(emojiDrop);
  emojiBtn.onmousedown = (e) => { e.preventDefault(); emojiDrop.style.display = emojiDrop.style.display === 'none' ? 'flex' : 'none'; };
  document.addEventListener('mousedown', (e) => { if (!emojiBtn.contains(e.target)) emojiDrop.style.display = 'none'; });
  tb.appendChild(emojiBtn);

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

  const header = document.createElement('div');
  header.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:${colorEntry.bg};border-bottom:1px solid ${colorEntry.border};`;

  const dateEl = document.createElement('span');
  dateEl.style.cssText = 'font-size:11px;color:#9ca3af;';
  dateEl.textContent = note.note_date || todayStr();

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:4px;align-items:center;opacity:0;transition:opacity 0.15s;';

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

  card.onmouseenter = () => { actions.style.opacity = '1'; card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; };
  card.onmouseleave = () => { actions.style.opacity = '0'; card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; };
  actions.append(pinBtn, delBtn);
  header.append(dateEl, actions);

  const titleInput = document.createElement('input');
  titleInput.type = 'text'; titleInput.placeholder = 'Title (optional)'; titleInput.value = note.title || '';
  titleInput.style.cssText = 'width:100%;box-sizing:border-box;border:none;border-bottom:1px solid #f3f4f6;padding:7px 10px;font-size:14px;font-weight:600;font-family:inherit;outline:none;background:#fff;color:#111827;';
  titleInput.onchange = async () => { const sb = getSb(); if (sb && note.id) await sb.from('notes').update({ title: titleInput.value }).eq('id', note.id); };

  const preview = document.createElement('div');
  preview.className = 'note-card-preview';
  preview.style.cssText = 'padding:8px 10px;font-size:13px;line-height:1.6;color:#374151;min-height:56px;cursor:text;';
  preview.innerHTML = note.content || '<span style="color:#d1d5db;font-size:12px;">클릭해서 입력...</span>';

  const editorEl = document.createElement('div');

  let isEditing = false, editorInstance = null, toolbar = null;

  const activateEditor = () => {
    if (isEditing) return;
    isEditing = true;
    preview.style.display = 'none';
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
  };

  preview.onclick = activateEditor;
  titleInput.onfocus = activateEditor;
  document.addEventListener('mousedown', (e) => { if (!isEditing || card.contains(e.target)) return; deactivateEditor(); });

  card.append(header, titleInput, preview, editorEl);
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
    .sort((a, b) => { if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1; return (b.note_date||'').localeCompare(a.note_date||''); });
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
    `;
    document.head.appendChild(style);
  }

  page.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;">불러오는 중...</div>';

  const userId = await getUserId();
  if (!userId) { page.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;">로그인 후 노트를 사용할 수 있습니다.</div>'; return; }

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
  ['calendarPage','memoPage','routinePage','dailyPage','timerPage','logsPage','insightPage','insightWritePage','memoWritePage','homeIntroSection']
    .forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
  const memoPage = document.getElementById('memoPage');
  if (memoPage) memoPage.classList.remove('hidden');
  await renderNotePage();
}

window.showNotePage = showNotePage;
window.JCal = window.JCal || {};
window.JCal.showMemoPage = showNotePage;
window.showMemoPage = showNotePage;
