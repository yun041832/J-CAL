/**
 * js/note.js — 제이캘 노트탭 (TipTap 기반)
 * - notes + note_sections 테이블 연동
 * - 카드 클릭 즉시 인라인 편집
 * - 300ms debounce 자동저장
 * - 표/불렛/번호/줄바꿈 복붙 지원
 * - focus 시 툴바 표시
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

// ─── 상수 ────────────────────────────────────────────────────────────────────

const SECTION_COLORS = [
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' }, // 인디고
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' }, // 그린
  { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' }, // 오렌지
  { bg: '#FDF4FF', border: '#E9D5FF', text: '#6B21A8' }, // 퍼플
  { bg: '#FFF1F2', border: '#FFE4E6', text: '#9F1239' }, // 로즈
  { bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E' }, // 스카이
  { bg: '#FEFCE8', border: '#FEF08A', text: '#854D0E' }, // 옐로우
];

const DEFAULT_SECTIONS = [
  { name: "Today's Work", emoji: '💼', color: '#EEF2FF' },
  { name: 'Thoughts', emoji: '💭', color: '#F0FDF4' },
  { name: 'Journal', emoji: '📖', color: '#FFF7ED' },
];

// ─── 상태 ────────────────────────────────────────────────────────────────────

let _sb = null;
let _userId = null;
let _sections = [];
let _notes = [];
let _editors = new Map(); // noteId → Editor 인스턴스

// ─── Supabase 클라이언트 ──────────────────────────────────────────────────────

function getSb() {
  if (!_sb && window.supabase?.auth) _sb = window.supabase;
  return _sb;
}

async function getUserId() {
  if (_userId) return _userId;
  const sb = getSb();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  _userId = data?.user?.id || null;
  return _userId;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── 데이터 CRUD ──────────────────────────────────────────────────────────────

async function loadSections() {
  const sb = getSb();
  const userId = await getUserId();
  if (!sb || !userId) return [];

  const { data, error } = await sb
    .from('note_sections')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');

  if (error) { console.error('[note] loadSections', error); return []; }

  // 기본 섹션이 없으면 자동 생성
  if (!data || data.length === 0) {
    const rows = DEFAULT_SECTIONS.map((s, i) => ({
      user_id: userId,
      name: s.name,
      emoji: s.emoji,
      color: s.color,
      sort_order: i,
    }));
    const { data: created } = await sb.from('note_sections').insert(rows).select('*');
    return created || [];
  }

  return data;
}

async function loadNotes() {
  const sb = getSb();
  const userId = await getUserId();
  if (!sb || !userId) return [];

  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('note_date', { ascending: false });

  if (error) { console.error('[note] loadNotes', error); return []; }
  return data || [];
}

async function saveNote({ sectionId, title, content, noteDate, emoji, color }) {
  const sb = getSb();
  const userId = await getUserId();
  if (!sb || !userId) return null;

  const row = {
    user_id: userId,
    section_id: sectionId || null,
    title: title || '',
    content: content || '',
    note_date: noteDate || todayStr(),
    emoji: emoji || '',
    color: color || '',
  };

  const { data, error } = await sb.from('notes').insert(row).select('*').single();
  if (error) { console.error('[note] saveNote', error); return null; }
  return data;
}

async function updateNoteContent(noteId, html) {
  const sb = getSb();
  if (!sb || !noteId) return;
  await sb.from('notes').update({ content: html, updated_at: new Date().toISOString() }).eq('id', noteId);
}

async function deleteNote(noteId) {
  const sb = getSb();
  if (!sb || !noteId) return;
  await sb.from('notes').delete().eq('id', noteId);
}

async function togglePin(noteId, current) {
  const sb = getSb();
  if (!sb || !noteId) return;
  await sb.from('notes').update({ is_pinned: !current }).eq('id', noteId);
}

// ─── TipTap 에디터 생성 ───────────────────────────────────────────────────────

function createEditor({ element, content, placeholder, onUpdate }) {
  const debounceTimer = { current: null };

  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ bulletList: false, orderedList: false, listItem: false }),
      ListItem,
      BulletList,
      OrderedList,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Underline,
      Placeholder.configure({ placeholder: placeholder || '내용을 입력하세요...' }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'note-tiptap-editor',
        style: 'outline:none; min-height:80px; padding:8px; font-size:14px; line-height:1.6; color:#1a1a1a;',
      },
      handlePaste(_, event) {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        const html = clipboard.getData('text/html');
        if (html && html.trim().length > 20) {
          event.preventDefault();
          editor.commands.insertContent(sanitizePasteHtml(html));
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onUpdate(html);
      }, 300);
    },
  });

  // IME 처리 (한글)
  let isComposing = false;
  element.addEventListener('compositionstart', () => { isComposing = true; });
  element.addEventListener('compositionend', () => {
    isComposing = false;
    setTimeout(() => onUpdate(editor.getHTML()), 50);
  });

  return editor;
}

function sanitizePasteHtml(html) {
  // 기본 클리닝 - 위험한 태그 제거, 줄바꿈/표/리스트 보존
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('script, style, meta, link').forEach(el => el.remove());
  return div.innerHTML;
}

// ─── 툴바 ──────────────────────────────────────────────────────────────────────

function buildToolbar(editor) {
  const toolbar = document.createElement('div');
  toolbar.className = 'note-toolbar';
  toolbar.style.cssText = `
    display:flex; gap:2px; padding:4px 6px;
    border-bottom:1px solid #e5e7eb;
    flex-wrap:wrap; align-items:center;
    background:#fafafa; border-radius:8px 8px 0 0;
  `;

  const buttons = [
    { label: 'B', title: '굵게', action: () => editor.chain().focus().toggleBold().run(), mark: 'bold' },
    { label: 'I', title: '기울임', action: () => editor.chain().focus().toggleItalic().run(), mark: 'italic' },
    { label: 'U', title: '밑줄', action: () => editor.chain().focus().toggleUnderline().run(), mark: 'underline' },
    { label: '—', title: '구분선', action: () => editor.chain().focus().setHorizontalRule().run() },
    { label: '•', title: '불렛리스트', action: () => editor.chain().focus().toggleBulletList().run(), mark: 'bulletList' },
    { label: '1.', title: '번호리스트', action: () => editor.chain().focus().toggleOrderedList().run(), mark: 'orderedList' },
    { label: '⊞', title: '표 삽입', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  ];

  buttons.forEach(({ label, title, action, mark }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.textContent = label;
    btn.style.cssText = `
      padding:3px 7px; border:1px solid #e5e7eb; border-radius:4px;
      background:#fff; cursor:pointer; font-size:12px; font-weight:${label==='B'?'700':'400'};
      color:#374151; line-height:1.4;
      transition: background 0.1s;
    `;
    btn.onmousedown = (e) => { e.preventDefault(); action(); };
    btn.onmouseover = () => { btn.style.background = '#f3f4f6'; };
    btn.onmouseout = () => { btn.style.background = '#fff'; };

    if (mark) {
      editor.on('selectionUpdate', () => {
        const isActive = editor.isActive(mark);
        btn.style.background = isActive ? '#e0e7ff' : '#fff';
        btn.style.borderColor = isActive ? '#6366f1' : '#e5e7eb';
      });
    }

    toolbar.appendChild(btn);
  });

  return toolbar;
}

// ─── 노트카드 렌더 ────────────────────────────────────────────────────────────

function buildNoteCard(note, sectionColor) {
  const card = document.createElement('div');
  card.className = 'note-card';
  card.dataset.noteId = note.id;
  card.style.cssText = `
    background:#fff; border:1px solid #e5e7eb; border-radius:10px;
    margin-bottom:10px; overflow:hidden;
    box-shadow:0 1px 3px rgba(0,0,0,0.06);
    transition: box-shadow 0.15s;
  `;

  // 카드 헤더
  const header = document.createElement('div');
  header.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 12px; border-bottom:1px solid #f3f4f6;
    background:${sectionColor || '#f9fafb'};
  `;

  const dateEl = document.createElement('span');
  dateEl.style.cssText = 'font-size:11px; color:#9ca3af;';
  dateEl.textContent = note.note_date || todayStr();

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex; gap:4px; align-items:center;';

  // 핀 버튼
  const pinBtn = document.createElement('button');
  pinBtn.type = 'button';
  pinBtn.title = note.is_pinned ? '핀 해제' : '핀';
  pinBtn.textContent = '📌';
  pinBtn.style.cssText = `
    border:none; background:none; cursor:pointer; font-size:12px;
    opacity:${note.is_pinned ? '1' : '0.3'}; padding:2px;
  `;
  pinBtn.onclick = async (e) => {
    e.stopPropagation();
    await togglePin(note.id, note.is_pinned);
    note.is_pinned = !note.is_pinned;
    pinBtn.style.opacity = note.is_pinned ? '1' : '0.3';
  };

  // 삭제 버튼
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.title = '삭제';
  delBtn.textContent = '×';
  delBtn.style.cssText = `
    border:none; background:none; cursor:pointer; font-size:16px;
    color:#9ca3af; padding:2px 4px; line-height:1;
    opacity:0; transition:opacity 0.15s;
  `;
  delBtn.onclick = async (e) => {
    e.stopPropagation();
    if (!confirm('노트를 삭제할까요?')) return;
    const editor = _editors.get(note.id);
    if (editor) { editor.destroy(); _editors.delete(note.id); }
    await deleteNote(note.id);
    card.remove();
  };

  card.onmouseenter = () => { delBtn.style.opacity = '1'; };
  card.onmouseleave = () => { delBtn.style.opacity = '0'; };

  actions.append(pinBtn, delBtn);
  header.append(dateEl, actions);

  // 타이틀
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = 'Title (optional)';
  titleInput.value = note.title || '';
  titleInput.style.cssText = `
    width:100%; box-sizing:border-box;
    border:none; border-bottom:1px solid #f3f4f6;
    padding:8px 12px; font-size:15px; font-weight:600;
    font-family:inherit; outline:none; background:#fff;
    color:#111827;
  `;
  titleInput.onchange = async () => {
    const sb = getSb();
    if (sb && note.id) {
      await sb.from('notes').update({ title: titleInput.value }).eq('id', note.id);
    }
  };

  // 툴바 (포커스 시 표시)
  let toolbar = null;
  let editorEl = null;
  let editorInstance = null;

  // 에디터 영역
  editorEl = document.createElement('div');
  editorEl.style.cssText = 'padding:0;';

  // 에디터 초기화 (지연 - 처음엔 미리보기)
  const preview = document.createElement('div');
  preview.className = 'note-card-preview';
  preview.style.cssText = `
    padding:8px 12px; font-size:14px; line-height:1.6;
    color:#374151; min-height:60px; cursor:text;
  `;

  // 미리보기 내용
  if (note.content) {
    preview.innerHTML = note.content;
  } else {
    preview.innerHTML = '<span style="color:#9ca3af;font-size:13px;">클릭해서 내용 입력...</span>';
  }

  // 클릭 시 에디터 활성화
  let isEditing = false;
  const activateEditor = () => {
    if (isEditing) return;
    isEditing = true;
    preview.style.display = 'none';

    // 툴바 생성 및 삽입
    editorInstance = createEditor({
      element: editorEl,
      content: note.content || '',
      placeholder: '내용을 입력하세요...',
      onUpdate: async (html) => {
        note.content = html;
        const sb = getSb();
        if (sb && note.id) {
          await updateNoteContent(note.id, html);
        } else if (!note.id) {
          // 신규 노트 — DB 저장
          const saved = await saveNote({
            sectionId: note.section_id,
            title: titleInput.value,
            content: html,
            noteDate: note.note_date,
          });
          if (saved) {
            note.id = saved.id;
            card.dataset.noteId = saved.id;
            _editors.set(saved.id, editorInstance);
          }
        }
      },
    });

    toolbar = buildToolbar(editorInstance);
    editorEl.parentNode.insertBefore(toolbar, editorEl);
    _editors.set(note.id || 'new', editorInstance);

    setTimeout(() => editorInstance.commands.focus('end'), 50);
  };

  preview.onclick = activateEditor;
  titleInput.onfocus = activateEditor;

  // 바깥 클릭 시 미리보기로 복귀
  document.addEventListener('mousedown', (e) => {
    if (!isEditing) return;
    if (card.contains(e.target)) return;
    isEditing = false;
    if (toolbar) { toolbar.remove(); toolbar = null; }
    if (editorInstance) {
      note.content = editorInstance.getHTML();
      editorInstance.destroy();
      editorInstance = null;
      _editors.delete(note.id);
    }
    // 미리보기 업데이트
    preview.innerHTML = note.content || '<span style="color:#9ca3af;font-size:13px;">클릭해서 내용 입력...</span>';
    preview.style.display = '';
    editorEl.innerHTML = '';
  });

  card.append(header, titleInput, preview, editorEl);
  return card;
}

// ─── 섹션 렌더 ────────────────────────────────────────────────────────────────

function buildSection(section, notes) {
  const colorEntry = SECTION_COLORS.find(c => c.bg === section.color) || SECTION_COLORS[0];

  const wrap = document.createElement('div');
  wrap.className = 'note-section';
  wrap.dataset.sectionId = section.id;
  wrap.style.cssText = 'margin-bottom:20px;';

  // 섹션 헤더
  const header = document.createElement('div');
  header.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 12px; border-radius:8px; margin-bottom:8px;
    background:${colorEntry.bg}; border:1px solid ${colorEntry.border};
  `;

  const left = document.createElement('div');
  left.style.cssText = 'display:flex; align-items:center; gap:6px;';

  const emoji = document.createElement('span');
  emoji.textContent = section.emoji || '📁';
  emoji.style.fontSize = '16px';

  const nameEl = document.createElement('span');
  nameEl.textContent = section.name;
  nameEl.style.cssText = `font-size:13px; font-weight:700; color:${colorEntry.text};`;

  // 노트 추가 버튼
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.title = '노트 추가';
  addBtn.textContent = '+';
  addBtn.style.cssText = `
    border:none; background:none; cursor:pointer;
    font-size:18px; color:${colorEntry.text}; padding:0 4px;
    font-weight:300; line-height:1;
  `;

  left.append(emoji, nameEl);
  header.append(left, addBtn);

  // 노트 목록
  const list = document.createElement('div');
  list.className = 'note-list';

  const sectionNotes = notes
    .filter(n => n.section_id === section.id)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return b.note_date.localeCompare(a.note_date);
    });

  sectionNotes.forEach(note => {
    list.appendChild(buildNoteCard(note, colorEntry.bg));
  });

  // 노트 추가
  addBtn.onclick = () => {
    const newNote = {
      id: null,
      section_id: section.id,
      title: '',
      content: '',
      note_date: todayStr(),
      is_pinned: false,
    };
    const card = buildNoteCard(newNote, colorEntry.bg);
    list.insertBefore(card, list.firstChild);
    // 즉시 에디터 활성화
    setTimeout(() => card.querySelector('.note-card-preview')?.click(), 50);
  };

  wrap.append(header, list);
  return wrap;
}

// ─── 페이지 렌더 ─────────────────────────────────────────────────────────────

async function renderNotePage() {
  const page = document.getElementById('memoPageContent');
  if (!page) return;

  page.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;">불러오는 중...</div>';

  const userId = await getUserId();
  if (!userId) {
    page.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;">로그인 후 노트를 사용할 수 있습니다.</div>';
    return;
  }

  _sections = await loadSections();
  _notes = await loadNotes();

  page.innerHTML = '';

  // CSS 주입 (한 번만)
  if (!document.getElementById('note-tiptap-styles')) {
    const style = document.createElement('style');
    style.id = 'note-tiptap-styles';
    style.textContent = `
      .note-tiptap-editor { outline: none; }
      .note-tiptap-editor p { margin: 0 0 4px; }
      .note-tiptap-editor ul, .note-tiptap-editor ol { padding-left: 20px; margin: 4px 0; }
      .note-tiptap-editor table { border-collapse: collapse; width: 100%; margin: 8px 0; }
      .note-tiptap-editor td, .note-tiptap-editor th { border: 1px solid #e5e7eb; padding: 4px 8px; min-width: 40px; }
      .note-tiptap-editor th { background: #f9fafb; font-weight: 600; }
      .note-tiptap-editor img { max-width: 100%; border-radius: 6px; }
      .note-tiptap-editor p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left; color: #9ca3af; pointer-events: none; height: 0;
      }
      .note-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important; }
    `;
    document.head.appendChild(style);
  }

  const container = document.createElement('div');
  container.style.cssText = 'padding:16px;';

  _sections.forEach(section => {
    container.appendChild(buildSection(section, _notes));
  });

  page.appendChild(container);
}

// ─── 진입점 ───────────────────────────────────────────────────────────────────

async function showNotePage() {
  // 기존 에디터 정리
  _editors.forEach(editor => editor.destroy());
  _editors.clear();

  await renderNotePage();
}

// window에 노출 (기존 memo.js의 showMemoPage 대체)
window.showNotePage = showNotePage;
window.JCal = window.JCal || {};
window.JCal.showNotePage = showNotePage;

// 기존 showMemoPage 덮어쓰기 — memo.js보다 늦게 실행되므로 DOMContentLoaded 후 등록
window.addEventListener('DOMContentLoaded', () => {
  window.showMemoPage = showNotePage;
  window.JCal = window.JCal || {};
  window.JCal.showMemoPage = showNotePage;
});

// 즉시도 등록 (혹시 이미 로드된 경우 대비)
window.showMemoPage = showNotePage;
window.JCal = window.JCal || {};
window.JCal.showMemoPage = showNotePage;
