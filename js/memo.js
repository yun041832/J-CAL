/* js/memo.js — Memo 페이지 (memo2_app.js에서 이동, 1단계: 원본 유지) */
(function () {
  'use strict';

  const JCal = window.JCal || {};
  const el = JCal.el || function (t, c, txt) {
    const x = document.createElement(t);
    if (c) x.className = c;
    if (txt != null) x.textContent = txt;
    return x;
  };
  const get = JCal.get || ((k, def = []) => {
    try { return JSON.parse(localStorage.getItem(k) || 'null') ?? def; } catch { return def; }
  });
  const set = JCal.set || ((k, v) => localStorage.setItem(k, JSON.stringify(v)));
  const fmtLocalDate = JCal.fmtLocalDate || function (d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };
  function invalidateStoreCache(key) {
    if (typeof JCal.invalidateStoreCache === 'function') JCal.invalidateStoreCache(key);
  }

  const kMemo = (d) => 'memo2.memos.' + d;

// ── Supabase 동기화 레이어 ──────────────────────────────
const MEMO_SB_URL = 'https://kwiwsjvuvmwtfboxtfij.supabase.co';
let _memoSbClient = null;
let _memoSbUserId = null;
const MEMO_SB_UPLOADED_KEY = 'memo_sb_uploaded_v1';

function getMemoSupabaseClient() {
  if (!_memoSbClient && typeof window !== 'undefined' && window.supabase?.auth) {
    _memoSbClient = window.supabase;
    _memoSbClient.auth.onAuthStateChange((_evt, session) => {
      _memoSbUserId = session?.user?.id || null;
      if (_memoSbUserId) {
        syncMemoFromSupabase();
      }
    });
    _memoSbClient.auth.getSession().then(({ data: { session } }) => {
      _memoSbUserId = session?.user?.id || null;
    }).catch((err) => console.error('[memo] supabase auth init', err));
  }
  return _memoSbClient;
}

async function resolveMemoUserId() {
  getMemoSupabaseClient();
  if (_memoSbUserId) return _memoSbUserId;
  const sb = _memoSbClient;
  if (!sb) return null;
  try {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) throw error;
    _memoSbUserId = session?.user?.id || null;
    return _memoSbUserId;
  } catch (err) {
    console.error('[memo] resolveMemoUserId', err);
    return null;
  }
}

// Supabase row → 내부 형식
function mapSupabaseMemoRow(row) {
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    date: row.date || '',
    emoji: row.emoji || '',
    color: row.color || '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

// Supabase에서 전체 memo 로드 후 localStorage에 저장
async function syncMemoFromSupabase() {
  const userId = await resolveMemoUserId();
  if (!userId) return;
  const sb = getMemoSupabaseClient();
  if (!sb) return;
  try {
    const { data, error } = await sb.from('memo')
      .select('id,title,content,date,emoji,color,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const list = (data || []).map(mapSupabaseMemoRow);
    // Supabase 데이터가 있을 때만 localStorage 덮어씀
    if (list.length > 0) {
      localStorage.setItem(JAY_MEMO_LIST_KEY, JSON.stringify(list));
      invalidateStoreCache(JAY_MEMO_LIST_KEY);
      if (typeof renderMemos === 'function') renderMemos();
      if (typeof renderMemoPageList === 'function') renderMemoPageList();
    } else {
      // Supabase 비어있으면 localStorage → Supabase 최초 업로드
      await uploadLocalMemosToSupabase(userId, sb);
    }
  } catch (err) {
    console.error('[memo] syncMemoFromSupabase', err);
    // 실패해도 localStorage 건드리지 않음
  }
}

// 최초 1회: localStorage 데이터 → Supabase 업로드
async function uploadLocalMemosToSupabase(userId, sb) {
  if (localStorage.getItem(MEMO_SB_UPLOADED_KEY) === 'true') return;
  const localList = JSON.parse(localStorage.getItem(JAY_MEMO_LIST_KEY) || '[]');
  if (!Array.isArray(localList) || localList.length === 0) return;
  try {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rows = localList.map(m => ({
      id: (m.id && UUID_REGEX.test(m.id)) ? m.id : crypto.randomUUID(),
      user_id: userId,
      title: m.title || '',
      content: m.content || m.text || '',
      date: m.date || new Date().toISOString().slice(0, 10),
      emoji: m.emoji || '',
      color: m.color || '',
    }));
    const { error } = await sb.from('memo').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    localStorage.setItem(MEMO_SB_UPLOADED_KEY, 'true');
    console.log('[memo] 최초 업로드 완료:', rows.length, '개');
  } catch (err) {
    console.error('[memo] uploadLocalMemosToSupabase', err);
  }
}

// 개별 메모 저장 (추가/수정)
async function upsertMemoToSupabase(memo) {
  const userId = await resolveMemoUserId();
  if (!userId) return;
  const sb = getMemoSupabaseClient();
  if (!sb) return;
  try {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const row = {
      id: (memo.id && UUID_REGEX.test(memo.id)) ? memo.id : crypto.randomUUID(),
      user_id: userId,
      title: memo.title || '',
      content: memo.content || memo.text || '',
      date: memo.date || new Date().toISOString().slice(0, 10),
      emoji: memo.emoji || '',
      color: memo.color || '',
    };
    const { error } = await sb.from('memo').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    console.error('[memo] upsertMemoToSupabase', err);
  }
}

// 개별 메모 삭제
async function deleteMemoFromSupabase(id) {
  const userId = await resolveMemoUserId();
  if (!userId) return;
  const sb = getMemoSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb.from('memo').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  } catch (err) {
    console.error('[memo] deleteMemoFromSupabase', err);
  }
}
// ── Supabase 동기화 레이어 끝 ───────────────────────────

  const JAY_MEMO_LIST_KEY = 'jay_memo_list';
  const JAY_MEMO_MIGRATED_KEY = 'memo2.jay_memo_migrated';
  function getMemoSelectedDateStr() {
    if (typeof ST !== 'undefined' && ST.selected) return fmtLocalDate(ST.selected);
    const saved = localStorage.getItem('memo2.selected');
    return saved || fmtLocalDate(new Date());
  }
  function memoPostApp(msg) {
    if (typeof postApp === 'function') postApp(msg);
  }
  function memoMakeWidget(title, bodyBuilder, rootClass) {
    if (typeof makeWidget === 'function') return makeWidget(title, bodyBuilder, rootClass);
    return null;
  }
  function memoOpenWidgetPopup(title, bodyBuilder) {
    const openFn = window.openWidgetPopup;
    if (typeof openFn === 'function') return openFn(title, bodyBuilder);
    return null;
  }


  function hideInsightPages() {
    document.getElementById('insightPage')?.classList.add('hidden');
    document.getElementById('insightWritePage')?.classList.add('hidden');
  }

  function showMemoPage() {
    localStorage.setItem('memo2.lastPage', 'memo');
    document.getElementById('homeIntroSection')?.classList.add('hidden');
    document.getElementById('calendarPage')?.classList.add('hidden');
    document.getElementById('memoPage')?.classList.remove('hidden');
    document.getElementById('memoWritePage')?.classList.add('hidden');
    document.getElementById('routinePage')?.classList.add('hidden');
    document.getElementById('dailyPage')?.classList.add('hidden');
    document.getElementById('timerPage')?.classList.add('hidden');
    document.getElementById('logsPage')?.classList.add('hidden');
    hideInsightPages();
    document.querySelector('.right')?.classList.add('hidden');
    getJayMemoList();
    initMemoPage();
    getMemoSupabaseClient(); // 최초 진입 시 인증 상태 초기화 + 동기화 트리거
    const savedView = localStorage.getItem('memoViewMode') || 'grid';
    setTimeout(() => { if (typeof setMemoView === 'function') setMemoView(savedView); }, 50);
  }

  function showMemoWritePage(editMode = false, itemId = null, idx = null, dstr = null) {
    document.getElementById('homeIntroSection')?.classList.add('hidden');
    document.getElementById('calendarPage')?.classList.add('hidden');
    document.getElementById('memoPage')?.classList.add('hidden');
    document.getElementById('memoWritePage')?.classList.remove('hidden');
    document.getElementById('routinePage')?.classList.add('hidden');
    document.getElementById('dailyPage')?.classList.add('hidden');
    document.getElementById('timerPage')?.classList.add('hidden');
    document.getElementById('logsPage')?.classList.add('hidden');
    hideInsightPages();
    document.querySelector('.right')?.classList.add('hidden');
    initMemoWritePage(editMode, itemId, idx, dstr);
  }

function createMemoId(){ return 'memo_'+Date.now(); }
function normalizeJayMemo(raw,defaultDate){
  const ts=raw.createdAt||Date.now();
  return {
    id:raw.id||createMemoId(),
    title:raw.title||'',
    content:raw.content??raw.text??'',
    date:raw.date||defaultDate||fmtLocalDate(new Date(ts)),
    createdAt:ts,
    emoji:raw.emoji||'',
    color:raw.color||'',
  };
}
function migrateJayMemoListIfNeeded(){
  if(localStorage.getItem(JAY_MEMO_MIGRATED_KEY)==='true') return;
  const merged=[];
  const seen=new Set();
  try{
    const existing=JSON.parse(localStorage.getItem(JAY_MEMO_LIST_KEY)||'[]');
    if(Array.isArray(existing)){
      existing.forEach((raw,idx)=>{
        const m=normalizeJayMemo(raw);
        if(!seen.has(m.id)){ seen.add(m.id); merged.push(m); }
      });
    }
  }catch{}
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!key||!key.startsWith('memo2.memos.')) continue;
    const dstr=key.slice('memo2.memos.'.length);
    let arr=[];
    try{ arr=JSON.parse(localStorage.getItem(key)||'[]'); }catch{}
    if(!Array.isArray(arr)) continue;
    arr.forEach((raw,idx)=>{
      const m=normalizeJayMemo(raw,dstr);
      if(!m.id) m.id='memo_'+(m.createdAt)+'_'+idx;
      if(!seen.has(m.id)){ seen.add(m.id); merged.push(m); }
    });
  }
  setJayMemoList(merged);
  localStorage.setItem(JAY_MEMO_MIGRATED_KEY,'true');
}
function syncJayMemoListToDateKeys(list){
  const byDate={};
  list.forEach(m=>{
    const d=m.date||fmtLocalDate(new Date(m.createdAt));
    if(!byDate[d]) byDate[d]=[];
    byDate[d].push({
      id:m.id,
      title:m.title,
      text:m.content,
      emoji:m.emoji,
      color:m.color,
      createdAt:m.createdAt,
    });
  });
  Object.keys(byDate).forEach(d=>set(kMemo(d),byDate[d]));
}
function getJayMemoList(){
  migrateJayMemoListIfNeeded();
  const list=get(JAY_MEMO_LIST_KEY,[]);
  return Array.isArray(list)?list:[];
}
function setJayMemoList(list){
  set(JAY_MEMO_LIST_KEY,list);
  syncJayMemoListToDateKeys(list);
  invalidateStoreCache(JAY_MEMO_LIST_KEY);
}
function deleteJayMemoById(id){
  setJayMemoList(getJayMemoList().filter(m=>m.id!==id));
  deleteMemoFromSupabase(id); // Supabase 동기화
}

function getMemosForDate(dstr){
  return getJayMemoList()
    .filter(m=>(m.date||fmtLocalDate(new Date(m.createdAt)))===dstr)
    .map(m=>({
      id:m.id,
      title:m.title,
      text:m.content,
      content:m.content,
      emoji:m.emoji,
      color:m.color,
      date:m.date,
      createdAt:m.createdAt,
    }));
}
function formatMemoCardDate(dateStr){
  if(!dateStr) return '';
  const parts=dateStr.split('-').map(Number);
  if(parts.length>=3&&!Number.isNaN(parts[1])&&!Number.isNaN(parts[2])){
    return `${parts[1]}월 ${parts[2]}일`;
  }
  return dateStr;
}
function ensureMemoDateInput(){
  let dateInput=document.getElementById('memoDateInput');
  if(dateInput) return dateInput;
  const titleInput=document.getElementById('memoTitleInput');
  const textarea=document.getElementById('memoTextarea');
  const editorWrap=document.querySelector('.memo-editor-wrap');
  if(!titleInput||!textarea||!titleInput.parentElement) return null;
  dateInput=document.createElement('input');
  dateInput.type='date';
  dateInput.id='memoDateInput';
  dateInput.style.width='100%';
  dateInput.style.border='1px solid var(--line)';
  dateInput.style.borderRadius='8px';
  dateInput.style.padding='8px 12px';
  dateInput.style.fontSize='14px';
  dateInput.style.fontFamily='inherit';
  dateInput.style.boxSizing='border-box';
  dateInput.style.background='var(--card)';
  dateInput.style.color='var(--text)';
  titleInput.parentElement.insertBefore(dateInput,editorWrap||textarea);
  return dateInput;
}
let memoWriteOnInput=null;
function isHtmlContent(str){
  return /<\/?[a-z][\s\S]*>/i.test(str||'');
}
function escapeHtml(str){
  return String(str||'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}
function plainTextToHtml(str){
  return escapeHtml(str||'').replace(/\n/g,'<br>');
}
function getMemoEditorHtml(editor){
  return (editor?.innerHTML||'').trim();
}
function isMemoEditorEmpty(editor){
  if(!editor) return true;
  const text=(editor.textContent||'').replace(/\u00a0/g,' ').trim();
  if(text) return false;
  return !editor.querySelector('img');
}
function setMemoEditorHtml(editor,content){
  if(!editor) return;
  editor.innerHTML=isHtmlContent(content)?content:plainTextToHtml(content||'');
}
function syncMemoTextarea(textarea,editor){
  if(textarea&&editor) textarea.value=getMemoEditorHtml(editor);
}
function sanitizeMemoHtml(html){
  const template=document.createElement('template');
  template.innerHTML=html||'';
  template.content.querySelectorAll('script,iframe,object,embed').forEach(el=>el.remove());
  template.content.querySelectorAll('*').forEach(el=>{
    [...el.attributes].forEach(attr=>{
      const name=attr.name.toLowerCase();
      const value=attr.value||'';
      if(name.startsWith('on')) el.removeAttribute(attr.name);
      if((name==='href'||name==='src')&&value.trim().toLowerCase().startsWith('javascript:')){
        el.removeAttribute(attr.name);
      }
    });
  });
  return template.innerHTML;
}
function getMemoContentHtml(content){
  const raw=content||'';
  return isHtmlContent(raw)?sanitizeMemoHtml(raw):plainTextToHtml(raw);
}
function renderMemoHtml(targetEl,content,emojiPrefix){
  if(!targetEl) return;
  let html=getMemoContentHtml(content);
  if(emojiPrefix) html=escapeHtml(emojiPrefix)+' '+html;
  targetEl.innerHTML=html;
  targetEl.style.whiteSpace='normal';
}
function renderMemoCardContent(el,raw){
  renderMemoHtml(el,raw);
}
function ensureMemoWidgetPopupStyles(doc){
  if(!doc||doc.getElementById('memo-widget-popup-style')) return;
  const st=doc.createElement('style');
  st.id='memo-widget-popup-style';
  st.textContent=`
.memo-widget img,.memo-widget-content img,.memo-popup-content img{max-width:100%;height:auto;display:block;margin:10px 0;border-radius:10px}
.memo-image-block{display:block;margin:12px 0;text-align:left}
.memo-image-block img{max-width:100%;height:auto;border-radius:10px;display:inline-block}
.memo-widget ul,.memo-widget-content ul,.memo-popup-content ul{padding-left:22px}
.memo-widget .memo-check-row,.memo-widget-content .memo-check-row{display:flex;align-items:center;gap:8px;margin:4px 0}
`;
  doc.head.appendChild(st);
}
function insertHtmlAtCursor(html){
  document.execCommand('insertHTML',false,html);
}
function triggerMemoWriteInput(){
  memoWriteOnInput?.();
}
let selectedMemoImageBlock=null;
let resizingMemoImage=null;
function ensureMemoImageBlockStructure(block){
  let el=block;
  if(el.tagName==='FIGURE'){
    const div=document.createElement('div');
    div.className='memo-image-block';
    while(el.firstChild) div.appendChild(el.firstChild);
    el.replaceWith(div);
    el=div;
  }
  el.classList.add('memo-image-block');
  el.contentEditable='false';
  el.draggable=true;
  const img=el.querySelector('img');
  if(img){
    img.classList.add('memo-pasted-image');
    img.style.maxWidth='100%';
    if(!img.style.width){
      const w=img.width||img.getBoundingClientRect().width||420;
      img.style.width=`${Math.round(w)}px`;
    }
  }
  if(!el.querySelector('.memo-image-resize-handle')){
    const handle=document.createElement('span');
    handle.className='memo-image-resize-handle';
    el.appendChild(handle);
  }
  return el;
}
function normalizeMemoImages(editor){
  if(!editor) return;
  editor.querySelectorAll('figure.memo-image-block, .memo-image-block').forEach(block=>{
    ensureMemoImageBlockStructure(block);
  });
  editor.querySelectorAll('img').forEach(img=>{
    if(img.closest('.memo-image-block')) return;
    const block=document.createElement('div');
    block.className='memo-image-block';
    block.contentEditable='false';
    block.draggable=true;
    img.classList.add('memo-pasted-image');
    if(!img.style.width){
      img.style.width=img.width?`${img.width}px`:'420px';
    }
    img.style.maxWidth='100%';
    const handle=document.createElement('span');
    handle.className='memo-image-resize-handle';
    img.parentNode.insertBefore(block,img);
    block.appendChild(img);
    block.appendChild(handle);
  });
}
function getDragAfterElement(container,y){
  const draggableElements=[...container.children].filter(el=>!el.classList.contains('is-dragging'));
  return draggableElements.reduce((closest,child)=>{
    const box=child.getBoundingClientRect();
    const offset=y-box.top-box.height/2;
    if(offset<0&&offset>closest.offset) return {offset,element:child};
    return closest;
  },{offset:Number.NEGATIVE_INFINITY}).element;
}
function setupMemoImageDragMove(editor,onChange,selectBlock){
  let draggingBlock=null;
  editor.addEventListener('dragstart',(e)=>{
    if(e.target.closest('.memo-image-resize-handle')){
      e.preventDefault();
      return;
    }
    const block=e.target.closest('.memo-image-block');
    if(!block||!editor.contains(block)) return;
    draggingBlock=block;
    selectBlock(block);
    block.classList.add('is-dragging');
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain','memo-image-block');
  });
  editor.addEventListener('dragover',(e)=>{
    if(!draggingBlock) return;
    e.preventDefault();
    const afterEl=getDragAfterElement(editor,e.clientY);
    if(afterEl==null) editor.appendChild(draggingBlock);
    else editor.insertBefore(draggingBlock,afterEl);
  });
  editor.addEventListener('drop',(e)=>{
    if(!draggingBlock) return;
    e.preventDefault();
    draggingBlock.classList.remove('is-dragging');
    draggingBlock=null;
    onChange?.();
  });
  editor.addEventListener('dragend',()=>{
    if(draggingBlock){
      draggingBlock.classList.remove('is-dragging');
      draggingBlock=null;
      onChange?.();
    }
  });
}
function setupMemoImageDirectControls(editor){
  if(!editor||editor.dataset.directImageControlsReady==='1') return;
  editor.dataset.directImageControlsReady='1';
  document.getElementById('memoImageToolbar')?.remove();
  function clearSelection(){
    if(selectedMemoImageBlock) selectedMemoImageBlock.classList.remove('is-selected');
    selectedMemoImageBlock=null;
  }
  function selectBlock(block){
    clearSelection();
    selectedMemoImageBlock=block;
    block.classList.add('is-selected');
  }
  editor.addEventListener('click',(e)=>{
    const block=e.target.closest('.memo-image-block');
    if(block&&editor.contains(block)){
      selectBlock(block);
      return;
    }
    clearSelection();
  });
  editor.addEventListener('mousedown',(e)=>{
    const handle=e.target.closest('.memo-image-resize-handle');
    if(!handle) return;
    const block=handle.closest('.memo-image-block');
    const img=block?.querySelector('img');
    if(!block||!img) return;
    e.preventDefault();
    e.stopPropagation();
    selectBlock(block);
    resizingMemoImage={
      block,
      img,
      startX:e.clientX,
      startWidth:img.getBoundingClientRect().width,
    };
    document.body.classList.add('memo-image-resizing');
  });
  document.addEventListener('mousemove',(e)=>{
    if(!resizingMemoImage) return;
    const dx=e.clientX-resizingMemoImage.startX;
    const nextWidth=Math.max(80,resizingMemoImage.startWidth+dx);
    const editorWidth=editor.getBoundingClientRect().width-32;
    const finalWidth=Math.min(nextWidth,editorWidth);
    resizingMemoImage.img.style.width=`${finalWidth}px`;
    resizingMemoImage.img.style.maxWidth='100%';
  });
  document.addEventListener('mouseup',()=>{
    if(!resizingMemoImage) return;
    resizingMemoImage=null;
    document.body.classList.remove('memo-image-resizing');
    triggerMemoWriteInput();
  });
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape') clearSelection();
    if((e.key==='Delete'||e.key==='Backspace')&&selectedMemoImageBlock&&editor.contains(selectedMemoImageBlock)){
      const sel=window.getSelection();
      if(sel&&!sel.isCollapsed) return;
      if(!editor.contains(sel?.anchorNode)) return;
      e.preventDefault();
      selectedMemoImageBlock.remove();
      selectedMemoImageBlock=null;
      triggerMemoWriteInput();
    }
  });
  setupMemoImageDragMove(editor,triggerMemoWriteInput,selectBlock);
}
function setupMemoImagePaste(editor){
  if(!editor||editor.dataset.pasteReady==='1') return;
  editor.dataset.pasteReady='1';
  editor.addEventListener('paste',(e)=>{
    const items=e.clipboardData?.items;
    if(!items) return;
    const imageItem=Array.from(items).find(item=>item.type&&item.type.startsWith('image/'));
    if(!imageItem) return;
    e.preventDefault();
    const file=imageItem.getAsFile();
    if(!file) return;
    if(file.size>500000){
      console.warn('[memo] pasted image is large ('+Math.round(file.size/1024)+'KB); localStorage may fill quickly.');
    }
    const reader=new FileReader();
    reader.onload=()=>{
      const src=reader.result;
      insertHtmlAtCursor(`
        <div class="memo-image-block" contenteditable="false" draggable="true">
          <img src="${src}" class="memo-pasted-image" alt="pasted image" style="width:420px;max-width:100%;">
          <span class="memo-image-resize-handle"></span>
        </div>
        <p><br></p>
      `);
      triggerMemoWriteInput();
    };
    reader.readAsDataURL(file);
  });
}
function setupMemoToolbar(editor){
  const toolbar=document.getElementById('memoMiniToolbar');
  if(!toolbar||!editor||toolbar.dataset.ready==='1') return;
  toolbar.dataset.ready='1';
  toolbar.addEventListener('click',(e)=>{
    const btn=e.target.closest('button');
    if(!btn) return;
    editor.focus();
    const cmd=btn.dataset.cmd;
    const action=btn.dataset.action;
    if(cmd){
      document.execCommand(cmd,false,null);
      triggerMemoWriteInput();
      return;
    }
    if(action==='checklist'){
      document.execCommand(
        'insertHTML',
        false,
        '<div class="memo-check-row"><input type="checkbox"> <span>체크 항목</span></div>'
      );
      triggerMemoWriteInput();
      return;
    }
    if(action==='emoji'){
      document.execCommand('insertText',false,'😊');
      triggerMemoWriteInput();
    }
  });
  const sizeSelect=document.getElementById('memoFontSizeSelect');
  sizeSelect?.addEventListener('change',()=>{
    if(!sizeSelect.value) return;
    editor.focus();
    document.execCommand('fontSize',false,'7');
    editor.querySelectorAll('font[size="7"]').forEach(el=>{
      el.removeAttribute('size');
      el.style.fontSize=sizeSelect.value;
    });
    sizeSelect.value='';
    triggerMemoWriteInput();
  });
  const colorInput=document.getElementById('memoColorInput');
  colorInput?.addEventListener('input',()=>{
    editor.focus();
    document.execCommand('foreColor',false,colorInput.value);
    triggerMemoWriteInput();
  });
  const highlightInput=document.getElementById('memoHighlightInput');
  highlightInput?.addEventListener('input',()=>{
    editor.focus();
    if(!document.execCommand('hiliteColor',false,highlightInput.value)){
      document.execCommand('backColor',false,highlightInput.value);
    }
    triggerMemoWriteInput();
  });
}

/* ── 오른쪽 메모 ── */
function renderMemos(){
  const memoDateEl=document.getElementById('memoDate');
  const memoListEl=document.getElementById('memoList');
  if(!memoListEl) return;
  const dstr=memoDateEl?.value||getMemoSelectedDateStr();
  const list=getMemosForDate(dstr);
  memoListEl.innerHTML='';
  list.forEach((it,i)=> memoListEl.appendChild(memoItemEl(it,i,list,dstr)));
}
function updateJayMemoById(id,patch){
  const list=getJayMemoList();
  const idx=list.findIndex(m=>m.id===id);
  if(idx<0) return;
  list[idx]={...list[idx],...patch};
  setJayMemoList(list);
  upsertMemoToSupabase(list.find(m=>m.id===id)||{id});
}
function memoItemEl(item,idx,ref,dstr){
  const li=el('li','memo-item');
  if(!item.hasOwnProperty('emoji')) item.emoji='';
  const text=el('span','memo-text');
  renderMemoHtml(text,item.content??item.text??'',item.emoji||'');
  const applyColor=(col)=>{
    if(col==='rainbow'){
      text.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
      text.style.color='#fff';
    } else if(col){
      text.style.backgroundColor=col;
      const c=col.replace('#','');
      const r=parseInt(c.substr(0,2),16)||0,g=parseInt(c.substr(2,2),16)||0,b=parseInt(c.substr(4,2),16)||0;
      const lum=(0.299*r+0.587*g+0.114*b)/255;
      text.style.color=lum>0.6?'#111':'#fff';
    } else {
      text.style.background='transparent';
      text.style.backgroundColor='transparent';
      text.style.color='#111';
    }
    text.style.padding='2px 6px';
    text.style.borderRadius='6px';
    text.style.display='inline-block';
  };
  applyColor(item.color);

  const delBtn=el('button','del-btn','🗑'); delBtn.type='button';
  const menuBtn=el('button','memo-menu-btn','⋮'); menuBtn.type='button';
  const actions=el('div','item-actions'); actions.append(delBtn,menuBtn);
  li.append(text,actions);

  text.ondblclick=()=>{ 
    const box=document.createElement('div'); 
    box.style.display='grid'; 
    box.style.gridTemplateColumns='1fr auto auto'; 
    box.style.gap='6px';
    const ta=document.createElement('textarea'); 
    ta.className='memo-edit'; 
    ta.rows=3; 
    ta.value=item.content??item.text??'';
    const save=el('button','btn','Save'), cancel=el('button','btn','Cancel');
    save.onclick=()=>{
      const val=ta.value.trim()||(item.content??item.text??'');
      if(item.id) updateJayMemoById(item.id,{content:val});
      else{ item.text=val; item.content=val; }
      renderMemos(); renderMemoPageList?.(); postApp({type:'refresh'});
    };
    cancel.onclick=()=> renderMemos();
    box.append(ta,save,cancel); 
    li.replaceChild(box,text); 
    ta.focus();
  };

  menuBtn.onclick=(e)=>{ e.stopPropagation(); showMemoMenu(menuBtn,item,idx,ref,dstr); };
  delBtn.onclick=(e)=>{
    e.stopPropagation();
    if(item.id) deleteJayMemoById(item.id);
    renderMemos(); renderMemoPageList?.(); postApp({type:'refresh'});
  };

  text.draggable=true;
  text.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',String(idx)); });
  li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{
    e.preventDefault();
    const from=+e.dataTransfer.getData('text/plain'); const to=idx;
    if(from===to) return;
    const [m]=ref.splice(from,1); ref.splice(to,0,m);
    const all=getJayMemoList();
    const others=all.filter(x=>(x.date||fmtLocalDate(new Date(x.createdAt)))!==dstr);
    const dayMemos=ref.map(r=>{
      const j=all.find(x=>x.id===r.id);
      return j?{...j,content:r.content??r.text??''}:normalizeJayMemo({...r,date:dstr});
    });
    setJayMemoList([...others,...dayMemos]);
    renderMemos(); renderMemoPageList?.(); postApp({type:'refresh'});
  });

  return li;
}

function showMemoMenu(anchor,item,idx,ref,dstr){
  const doc=anchor.ownerDocument||document;
  if(openPop) openPop.remove();
  const pop=doc.createElement('div');
  pop.className='event-menu-popup';

  const emojiBtn=el('button','menu-item','💬 이모티콘 변경');
  const colorBtn=el('button','menu-item','🎨 색상 변경');

  emojiBtn.onclick=(e)=>{
    e.stopPropagation();
    const anchorRect=anchor.getBoundingClientRect();
    const tempAnchor={ getBoundingClientRect:()=>anchorRect, ownerDocument:doc };
    pop.remove(); openPop=null;
    showEmojiPicker(tempAnchor,(emoji)=>{
      item.emoji=emoji;
      if(item.id) updateJayMemoById(item.id,{emoji});
      renderMemos(); renderMemoPageList?.(); postApp({type:'refresh'});
    });
  };
  colorBtn.onclick=(e)=>{
    e.stopPropagation();
    const anchorRect=anchor.getBoundingClientRect();
    const tempAnchor={ getBoundingClientRect:()=>anchorRect, ownerDocument:doc };
    pop.remove(); openPop=null;
    showPalette(tempAnchor,(color)=>{
      item.color=color;
      if(item.id) updateJayMemoById(item.id,{color});
      renderMemos(); renderMemoPageList?.(); postApp({type:'refresh'});
    });
  };

  pop.append(emojiBtn,colorBtn);
  doc.body.appendChild(pop);
  openPop=pop;

  const rect=anchor.getBoundingClientRect();
  const win=doc.defaultView||window;
  let left=rect.left+(win.scrollX||0);
  let top=rect.bottom+4+(win.scrollY||0);
  pop.style.left=`${left}px`;
  pop.style.top=`${top}px`;
  pop.style.visibility='hidden';

  requestAnimationFrame(()=>{
    const popRect=pop.getBoundingClientRect();
    const viewWidth=win.innerWidth;
    const viewHeight=win.innerHeight;
    if(popRect.right>viewWidth) left=Math.max(10, viewWidth-popRect.width-10);
    if(popRect.bottom>viewHeight) top=rect.top-popRect.height-4+(win.scrollY||0);
    pop.style.left=`${left}px`;
    pop.style.top=`${top}px`;
    pop.style.visibility='visible';
  });

  const closeMenu=()=>{
    if(openPop){ openPop.remove(); openPop=null; doc.removeEventListener('click',closeMenu); }
  };
  setTimeout(()=>doc.addEventListener('click',closeMenu),10);
}
function bindMemoRightPanel(){
  const memoAdd=document.getElementById('memoAddBtn');
  const memoInput=document.getElementById('memoInput');
  const memoDateEl=document.getElementById('memoDate');
  if(!memoAdd||memoAdd.dataset.memoBound==='1') return;
  memoAdd.dataset.memoBound='1';
  memoAdd.onclick=()=>{
    const txt=memoInput?.value.replace(/\s+$/,'')||'';
    if(!txt) return;
    const dstr=memoDateEl?.value||getMemoSelectedDateStr();
    const list=getJayMemoList();
    list.push({
      id:createMemoId(),
      title:'',
      content:txt,
      date:dstr,
      createdAt:Date.now(),
      emoji:'',
      color:'',
    });
    setJayMemoList(list);
    if(memoInput) memoInput.value='';
    renderMemos();
    renderMemoPageList?.();
    memoPostApp({type:'refresh'});
  };
  if(memoInput) memoInput.onkeydown=()=>{};
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bindMemoRightPanel);
}else{
  bindMemoRightPanel();
}

/* ── 메모 페이지 ── */
function initMemoPage(){
  const content=document.getElementById('memoPageContent');
  const addBtn=document.getElementById('addMemoBtn');
  if(!content) return;
  
  // 메모 추가 버튼
  if(addBtn){
    addBtn.onclick=()=> showMemoWritePage(false);
  }
  
  renderMemoPageList();
  if(typeof initMemoView==='function') initMemoView();
}

function initMemoWritePage(editMode=false,editItemId=null,editIdx=null,editDstr=null){
  const titleInput=document.getElementById('memoTitleInput');
  const textarea=document.getElementById('memoTextarea');
  const richEditor=document.getElementById('memoRichEditor');
  const saveBtn=document.getElementById('saveMemoBtn');
  const titleEl=document.getElementById('memoWriteTitle');
  const dateInput=ensureMemoDateInput();
  
  if(!titleInput||!textarea||!saveBtn||!richEditor) return;
  
  setupMemoImagePaste(richEditor);
  setupMemoImageDirectControls(richEditor);
  setupMemoToolbar(richEditor);
  
  if(titleEl) titleEl.textContent=editMode?'Edit Memo':'New Memo';
  
  const editItem=editMode&&editItemId
    ? getJayMemoList().find(m=>m.id===editItemId)
    : null;
  
  if(editItem){
    titleInput.value=editItem.title||'';
    const editContent=editItem.content||editItem.text||'';
    setMemoEditorHtml(richEditor,editContent);
    normalizeMemoImages(richEditor);
    syncMemoTextarea(textarea,richEditor);
    if(dateInput) dateInput.value=editItem.date||fmtLocalDate(new Date(editItem.createdAt));
  }else{
    titleInput.value='';
    setMemoEditorHtml(richEditor,'');
    normalizeMemoImages(richEditor);
    textarea.value='';
    if(dateInput) dateInput.value=fmtLocalDate(new Date());
  }
  
  let savedMemoId=editMode&&editItemId?editItemId:null;
  let autoSaveTimer=null;
  
  const persistMemo=()=>{
    syncMemoTextarea(textarea,richEditor);
    const title=titleInput.value.trim();
    const content=isMemoEditorEmpty(richEditor)?'':getMemoEditorHtml(richEditor);
    if(!title&&!content) return;
    const dateVal=dateInput?.value||getMemoSelectedDateStr();
    let list=getJayMemoList();
    if(savedMemoId){
      const idx=list.findIndex(m=>m.id===savedMemoId);
      if(idx<0) return;
      list[idx]={...list[idx],title,content,date:dateVal};
    }else{
      savedMemoId=createMemoId();
      const newMemo={
        id:savedMemoId,
        title,
        content,
        date:dateVal,
        createdAt:Date.now(),
        emoji:'',
        color:'',
      };
      list.push(newMemo);
    }
    setJayMemoList(list);
    upsertMemoToSupabase(list.find(m=>m.id===savedMemoId)||{id:savedMemoId}); // Supabase 동기화
    renderMemos();
    renderMemoPageList();
    postApp({type:'refresh'});
  };
  
  const onInput=()=>{
    if(autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer=setTimeout(persistMemo,1000);
  };
  
  titleInput.oninput=onInput;
  richEditor.oninput=onInput;
  memoWriteOnInput=onInput;
  if(dateInput) dateInput.onchange=onInput;
  
  saveBtn.onclick=()=>{
    syncMemoTextarea(textarea,richEditor);
    const title=titleInput.value.trim();
    const content=isMemoEditorEmpty(richEditor)?'':getMemoEditorHtml(richEditor);
    if(!title&&!content){
      alert('제목 또는 내용을 입력하세요.');
      return;
    }
    if(autoSaveTimer) clearTimeout(autoSaveTimer);
    persistMemo();
    showMemoPage();
  };
  
  titleInput.focus();
}

function renderMemoPageList(){
  const content=document.getElementById('memoPageContent');
  if(!content) return;
  
  const list=getJayMemoList()
    .slice()
    .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  
  content.innerHTML='';
  
  if(!list.length){
    const empty=el('div','memo-empty');
    empty.style.textAlign='center';
    empty.style.padding='60px 20px';
    empty.style.color='var(--text-muted)';
    empty.style.fontSize='15px';
    empty.textContent='No memos yet.';
    content.appendChild(empty);
    return;
  }
  
  const grid=el('div','memo-page-grid');
  grid.id='memo-cards-container';
  list.forEach((item,idx)=>{
    grid.appendChild(createMemoCard(item,idx,list));
  });
  
  content.appendChild(grid);
  if(typeof initMemoView==='function') initMemoView();
}

function createMemoCard(item,idx,ref){
  const card=el('div','memo-card');
  const memoDate=item.date||fmtLocalDate(new Date(item.createdAt||Date.now()));
  
  const dateEl=el('div','memo-card__date',formatMemoCardDate(memoDate));
  dateEl.style.fontSize='11px';
  dateEl.style.color='var(--text-muted)';
  dateEl.style.marginBottom='6px';
  dateEl.title=memoDate;
  
  // 헤더 (제목과 버튼들)
  const header=el('div','memo-card__header');
  header.style.display='flex';
  header.style.justifyContent='space-between';
  header.style.alignItems='center';
  header.style.marginBottom='12px';
  
  // 왼쪽: 제목
  const titleEl=el('div','memo-card__title',item.title||'제목 없음');
  titleEl.style.fontWeight='600';
  titleEl.style.fontSize='16px';
  titleEl.style.flex='1';
  titleEl.style.overflow='hidden';
  titleEl.style.textOverflow='ellipsis';
  titleEl.style.whiteSpace='nowrap';
  
  // 오른쪽: 버튼들
  const btnGroup=el('div');
  btnGroup.style.display='flex';
  btnGroup.style.gap='4px';
  
  const widgetBtn=el('button','memo-card__btn','Widget');
  widgetBtn.title='Open widget';
  widgetBtn.onclick=(e)=>{
    e.stopPropagation();
    openMemoWidgetPopup(item);
  };
  
  const delBtn=el('button','memo-card__btn','✕');
  delBtn.title='삭제';
  delBtn.onclick=(e)=>{
    e.stopPropagation();
    if(item.id) deleteJayMemoById(item.id);
    renderMemoPageList();
    renderMemos();
    postApp({type:'refresh'});
  };
  
  btnGroup.append(widgetBtn,delBtn);
  header.append(titleEl,btnGroup);
  
  // 내용 영역
  const contentWrap=el('div','memo-card__content');
  contentWrap.style.cursor='pointer';
  contentWrap.style.minHeight='60px';
  contentWrap.style.lineHeight='1.6';
  contentWrap.style.wordBreak='break-word';
  const emojiSpan=item.emoji?el('span','memo-card__emoji',item.emoji+' '):null;
  const contentBody=el('div','memo-card__html');
  renderMemoCardContent(contentBody,item.content||item.text||'');
  if(emojiSpan) contentWrap.appendChild(emojiSpan);
  contentWrap.appendChild(contentBody);
  
  // 색상 적용
  const applyColor=(col)=>{
    if(col==='rainbow'){
      card.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
      contentWrap.style.color='#fff';
      titleEl.style.color='#fff';
    } else if(col){
      card.style.backgroundColor=col;
      const c=col.replace('#','');
      const r=parseInt(c.substr(0,2),16)||0,g=parseInt(c.substr(2,2),16)||0,b=parseInt(c.substr(4,2),16)||0;
      const lum=(0.299*r+0.587*g+0.114*b)/255;
      contentWrap.style.color=lum>0.6?'#111':'#fff';
      titleEl.style.color=lum>0.6?'#111':'#fff';
    } else {
      card.style.backgroundColor='#fff';
      contentWrap.style.color='#111';
      titleEl.style.color='#111';
    }
  };
  applyColor(item.color);
  
  // 내용 클릭으로 편집
  contentWrap.onclick=()=>{
    showMemoWritePage(true,item.id,idx,memoDate);
  };
  
  card.append(dateEl,header,contentWrap);
  return card;
}

function openMemoWidget(item){
  const memo=getJayMemoList().find(m=>m.id===item?.id)||item;
  // 개별 메모를 위젯으로 여는 함수
  function build(isPopup, win){
    const doc=win.document;
    const W=doc.createElement('div');
    W.style.padding='12px';
    W.style.display='flex';
    W.style.flexDirection='column';
    W.style.height='100%';
    W.style.boxSizing='border-box';
    W.style.overflow='auto';
    
    const title=doc.createElement('div');
    title.style.fontWeight='600';
    title.style.fontSize='16px';
    title.style.marginBottom='12px';
    title.textContent=memo.title||'제목 없음';
    
    const content=doc.createElement('div');
    content.className='memo-widget memo-widget-content';
    content.style.lineHeight='1.6';
    content.style.wordBreak='break-word';
    if(isPopup) ensureMemoWidgetPopupStyles(doc);
    renderMemoHtml(content,memo.content||memo.text||'',memo.emoji||'');
    
    W.append(title,content);
    return W;
  }
  return memoMakeWidget(memo.title||'메모', build, 'widget--memo');
}

function openMemoWidgetPopup(item){
  const memo=getJayMemoList().find(m=>m.id===item?.id)||item;
  // 개별 메모를 팝업 위젯으로 바로 여는 함수
  function build(isPopup, win){
    const doc=win.document;
    if(isPopup) ensureMemoWidgetPopupStyles(doc);
    const W=doc.createElement('div');
    W.style.padding='12px';
    W.style.display='flex';
    W.style.flexDirection='column';
    W.style.height='100%';
    W.style.boxSizing='border-box';
    W.style.overflow='auto';
    
    const title=doc.createElement('div');
    title.style.fontWeight='600';
    title.style.fontSize='16px';
    title.style.marginBottom='12px';
    title.textContent=memo.title||'제목 없음';
    
    const content=doc.createElement('div');
    content.className='memo-widget memo-widget-content memo-popup-content';
    content.style.lineHeight='1.6';
    content.style.wordBreak='break-word';
    renderMemoHtml(content,memo.content||memo.text||'',memo.emoji||'');
    
    W.append(title,content);
    return W;
  }
  memoOpenWidgetPopup(memo.title||'메모', build);
}

function showMemoCardMenu(anchor,item,idx,ref,dstr){
  const doc=anchor.ownerDocument||document;
  if(openPop) openPop.remove();
  const pop=doc.createElement('div');
  pop.className='event-menu-popup';
  
  const editBtn=el('button','menu-item','✏️ 편집');
  const delBtn=el('button','menu-item','🗑️ 삭제');
  
  editBtn.onclick=(e)=>{
    e.stopPropagation();
    pop.remove();
    openPop=null;
    showMemoWritePage(true,item.id,idx,item.date);
  };
  
  delBtn.onclick=(e)=>{
    e.stopPropagation();
    if(confirm('이 메모를 삭제하시겠습니까?')){
      if(item.id) deleteJayMemoById(item.id);
      renderMemoPageList();
      renderMemos();
      postApp({type:'refresh'});
    }
    pop.remove();
    openPop=null;
  };
  
  pop.append(editBtn,delBtn);
  doc.body.appendChild(pop);
  openPop=pop;
  
  const rect=anchor.getBoundingClientRect();
  const left=rect.left+(window.scrollX||0);
  const top=rect.bottom+4+(window.scrollY||0);
  pop.style.left=`${left}px`;
  pop.style.top=`${top}px`;
  
  setTimeout(()=>{
    const close=(e)=>{
      if(!pop.contains(e.target) && e.target!==anchor){
        pop.remove();
        openPop=null;
        doc.removeEventListener('mousedown',close);
      }
    };
    doc.addEventListener('mousedown',close);
  },10);
}

function widgetMemo(){
  function build(isPopup, win){
    const doc=win.document;
    const W=doc.createElement('div');
    W.style.padding='10px 12px 12px';
    W.style.display='flex';
    W.style.flexDirection='column';
    W.style.height='100%';
    W.style.boxSizing='border-box';

    const notice=doc.createElement('div');
    notice.style.fontSize='12px';
    notice.style.color='#64748b';
    notice.style.textAlign='center';
    notice.style.marginBottom='8px';

    const ul=doc.createElement('ul');
    ul.style.listStyle='none';
    ul.style.padding='0';
    ul.style.margin='0';
    ul.style.display='flex';
    ul.style.flexDirection='column';
    ul.style.gap='8px';
    ul.style.flex='1';
    ul.style.overflowY='auto';
    ul.style.paddingBottom='4px';
    W.append(notice,ul);

    const getSel=()=> win.localStorage.getItem('memo2.selected')||fmtLocalDate(new Date());

    function render(){
      ul.innerHTML='';
      const items=getMemosForDate(getSel());
      if(!items.length){
        const empty=doc.createElement('li');
        empty.textContent='No memos yet.';
        empty.style.fontSize='13px';
        empty.style.color='#94a3b8';
        empty.style.textAlign='center';
        empty.style.padding='16px 0';
        ul.append(empty);
        return;
      }
      if(isPopup) ensureMemoWidgetPopupStyles(doc);
      items.forEach((it)=>{
        const li=doc.createElement('li');
        li.style.display='block';
        const tx=doc.createElement('div');
        tx.style.display='block';
        tx.style.padding='8px 10px';
        tx.style.borderRadius='10px';
        tx.style.wordBreak='break-word';
        renderMemoHtml(tx,it.content??it.text??'',it.emoji||'');
        const applyColor=(clr)=>{
          if(!clr){ tx.style.backgroundColor='#f8fafc'; tx.style.color='#0f172a'; return; }
          if(clr==='rainbow'){ tx.style.background='linear-gradient(135deg,#667eea 0%,#764ba2 25%,#f093fb 50%,#4facfe 75%,#00f2fe 100%)'; tx.style.color='#fff'; return; }
          tx.style.background='transparent';
          tx.style.backgroundColor=clr;
          try{
            const hex=clr.replace('#','');
            const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
            const lum=(0.299*r+0.587*g+0.114*b)/255;
            tx.style.color=lum>0.6?'#0f172a':'#fff';
          }catch{ tx.style.color='#0f172a'; }
        };
        applyColor(it.color);
        li.append(tx);
        ul.append(li);
      });
    }
    win.addEventListener('storage',(e)=>{ if(e.key==='memo2.selected'||e.key==='jay_memo_list'||e.key?.startsWith('memo2.memos.')) render(); });
    if('BroadcastChannel' in win){ const bc=new win.BroadcastChannel(APP_CH); bc.onmessage=(m)=>{ if(m.data?.type) render(); }; }
    render(); return W;
  }
  return memoMakeWidget('메모', build, 'widget--memo');
}

  const memoApi = {
    kMemo,
    showMemoPage,
    showMemoWritePage,
    initMemoPage,
    initMemoWritePage,
    getJayMemoList,
    setJayMemoList,
    getMemosForDate,
    renderMemos,
    renderMemoPageList,
    createMemoId,
    renderMemoHtml,
    bindMemoRightPanel,
    updateJayMemoById,
    deleteJayMemoById,
    widgetMemo,
    openMemoWidget,
    openMemoWidgetPopup,
  };

  Object.assign(window.JCal || (window.JCal = {}), memoApi);

  window.showMemoPage = showMemoPage;
  window.showMemoWritePage = showMemoWritePage;
  window.initMemoPage = initMemoPage;
  window.initMemoWritePage = initMemoWritePage;
  window.getJayMemoList = getJayMemoList;
  window.setJayMemoList = setJayMemoList;
  window.getMemosForDate = getMemosForDate;
  window.renderMemos = renderMemos;
  window.renderMemoPageList = renderMemoPageList;
  window.widgetMemo = widgetMemo;
  window.openMemoWidget = openMemoWidget;
  window.openMemoWidgetPopup = openMemoWidgetPopup;
  window.renderMemoHtml = renderMemoHtml;
})();
