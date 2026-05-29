// memo2_app.js
/* 메모위젯 v0.8.2 — 홈패널/달력/메모/ToDo + 팝아웃/위젯 동기화 */
function el(t,c,txt){const x=document.createElement(t);if(c)x.className=c;if(txt!=null)x.textContent=txt;return x;}
const DEFAULT_COLOR='', DONE_COLOR='#9aa5b1';
// ...existing code...
const homeIntroSection=document.getElementById('homeIntroSection');
const calendarPage=document.getElementById('calendarPage');
const memoPage=document.getElementById('memoPage');
const memoWritePage=document.getElementById('memoWritePage');
const insightPage=document.getElementById('insightPage');
const insightWritePage=document.getElementById('insightWritePage');
const routinePage=document.getElementById('routinePage');
const dailyPage=document.getElementById('dailyPage');
const timerPage=document.getElementById('timerPage');
const stopwatchPage=document.getElementById('stopwatchPage');
const rightPane=document.querySelector('.right');

function hideInsightPages(){
  insightPage?.classList.add('hidden');
  insightWritePage?.classList.add('hidden');
}
function hideStopwatchPage(){
  stopwatchPage?.classList.add('hidden');
}

function showHomeIntro(){
  localStorage.setItem('memo2.lastPage', 'home');
  homeIntroSection?.classList.remove('hidden');
  homeIntroSection?.style && (homeIntroSection.style.display = '');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  hideInsightPages();
  rightPane?.classList.add('hidden');
}
function showCalendarPage(){
  localStorage.setItem('memo2.lastPage', 'calendar');
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.remove('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  hideInsightPages();
  rightPane?.classList.remove('hidden');
  renderCalendar?.();
  renderRight?.();
  renderMonthlyGoals?.();
}
function showMemoPage(){
  localStorage.setItem('memo2.lastPage', 'memo');
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.remove('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  hideInsightPages();
  rightPane?.classList.add('hidden');
  getJayMemoList();
  initMemoPage?.();
  const savedView=localStorage.getItem('memoViewMode')||'grid';
  setTimeout(()=>{ if(typeof setMemoView==='function') setMemoView(savedView); },50);
}
function showMemoWritePage(editMode=false,itemId=null,idx=null,dstr=null){
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.remove('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  hideInsightPages();
  rightPane?.classList.add('hidden');
  initMemoWritePage?.(editMode,itemId,idx,dstr);
}
function showRoutinePage(){
  localStorage.setItem('memo2.lastPage', 'routine');
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.remove('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  hideInsightPages();
  rightPane?.classList.add('hidden');
  initRoutinePage?.();
}
function showDailyPage(){
  localStorage.setItem('memo2.lastPage', 'daily');
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  dailyPage?.classList.remove('hidden');
  hideInsightPages();
  rightPane?.classList.add('hidden');
  initDailyPage?.();
  applyDailyView?.();
}
function showTimerPage(){
  localStorage.setItem('memo2.lastPage', 'timer');
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.remove('hidden');
  hideStopwatchPage();
  hideInsightPages();
  rightPane?.classList.add('hidden');
  initTimersPage?.();
}
function showStopwatchPage(){
  localStorage.setItem('memo2.lastPage', 'stopwatch');
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideInsightPages();
  stopwatchPage?.classList.remove('hidden');
  rightPane?.classList.add('hidden');
  hideUsage?.();
  initStopwatchPage?.();
}
function showInsightPage(){
  localStorage.setItem('memo2.lastPage', 'insight');
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  insightWritePage?.classList.add('hidden');
  insightPage?.classList.remove('hidden');
  rightPane?.classList.add('hidden');
  hideUsage?.();
  initInsightPage?.();
}
function showInsightWritePage(editMode=false,editItemId=null){
  homeIntroSection?.classList.add('hidden');
  calendarPage?.classList.add('hidden');
  memoPage?.classList.add('hidden');
  memoWritePage?.classList.add('hidden');
  routinePage?.classList.add('hidden');
  dailyPage?.classList.add('hidden');
  timerPage?.classList.add('hidden');
  hideStopwatchPage();
  insightPage?.classList.add('hidden');
  insightWritePage?.classList.remove('hidden');
  rightPane?.classList.add('hidden');
  hideUsage?.();
  initInsightWritePage?.(editMode,editItemId);
}
// ...existing code...

document.addEventListener('DOMContentLoaded',()=>{
  // ...existing code...
  const openCalWidgetBtn=document.getElementById('openCalendarWidgetBtn');

  if(openCalWidgetBtn){
    openCalWidgetBtn.onclick=()=>{
      widgetCalendar?.({popupOnly:true});
      trackMenuPV('nav:widgetCalendar');
    };
  }

  const openStopwatchWidgetBtn=document.getElementById('openStopwatchWidgetBtn');
  if(openStopwatchWidgetBtn){
    openStopwatchWidgetBtn.onclick=()=>{
      widgetStopwatch?.();
      trackMenuPV('nav:widgetStopwatch');
    };
  }
  
  // 메뉴 버튼 설정
  document.querySelectorAll('.menu-btn').forEach(b=>{
    b.onclick=()=>{
      document.querySelectorAll('.menu-btn').forEach(m=>m.classList.remove('is-active'));
      b.classList.add('is-active');
      const t=b.dataset.widget;
      trackMenuPV(`menu:${t||'unknown'}`);
      showUsage(t);
      if(t==='calendar'){ showCalendarPage(); }
      if(t==='memo') showMemoPage();
      if(t==='routine') showRoutinePage();
      if(t==='daily') showDailyPage();
      if(t==='todo') widgetTodo?.();
      if(t==='timer') showTimerPage();
      if(t==='alarm') widgetAlarm?.();
      if(t==='stopwatch') showStopwatchPage();
      if(t==='insight') showInsightPage();
    };
  });

  // 홈 메뉴 클릭 핸들러
  const homeBtn = document.getElementById('homeBtn');
  if(homeBtn) {
    homeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.menu-btn').forEach(m=>m.classList.remove('is-active'));
      homeBtn.classList.add('is-active');
      showHomeIntro();
      trackMenuPV('menu:home');
    });
  }

  // 노트 메뉴 클릭 핸들러
  const noteBtn = document.getElementById('noteBtn');
  if(noteBtn) {
    noteBtn.addEventListener('click', function(e) {
      e.preventDefault();
      widgetNote?.();
      trackMenuPV('menu:note');
    });
  }
  
  // 루틴 추가 버튼 핸들러 (초기화)
  const addRoutineBtn = document.getElementById('addRoutineBtn');
  if(addRoutineBtn) {
    addRoutineBtn.onclick = () => {
      console.log('루틴 추가 버튼 클릭됨');
      showRoutineModal();
    };
  }
  
  getJayMemoList();

  // 마지막으로 열었던 페이지 복원
  const lastPage = localStorage.getItem('memo2.lastPage') || 'home';
  if(lastPage === 'calendar') showCalendarPage();
  else if(lastPage === 'memo') showMemoPage();
  else if(lastPage === 'routine') showRoutinePage();
  else if(lastPage === 'daily') showDailyPage();
  else if(lastPage === 'timer') showTimerPage();
  else if(lastPage === 'stopwatch') showStopwatchPage();
  else if(lastPage === 'insight') showInsightPage();
  else showHomeIntro();

  initTimerSettingModal?.();

  // ...existing code...
});

// ...existing code...
const effectiveColor=(it)=> it.done?DONE_COLOR:(it.color||DEFAULT_COLOR);
const EMOJI_ICON='<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M360-390q-21 0-35.5-14.5T310-440q0-21 14.5-35.5T360-490q21 0 35.5 14.5T410-440q0 21-14.5 35.5T360-390Zm240 0q-21 0-35.5-14.5T550-440q0-21 14.5-35.5T600-490q21 0 35.5 14.5T650-440q0 21-14.5 35.5T600-390ZM480-160q134 0 227-93t93-227q0-24-3-46.5T786-570q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-708q-32 78-91.5 135.5T160-486v6q0 134 93 227t227 93Zm0 80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-54-715q42 70 114 112.5T700-640q14 0 27-1.5t27-3.5q-42-70-114-112.5T480-800q-14 0-27 1.5t-27 3.5ZM177-581q51-29 89-75t57-103q-51 29-89 75t-57 103Zm249-214Zm-103 36Z"/></svg>';
const setEmojiIcon=(btn,val)=>{
  if(!btn) return;
  if(val){
    btn.textContent=val;
  } else {
    btn.innerHTML=EMOJI_ICON;
  }
};

function fmtLocalDate(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
function parseLocalDate(str){ if(!str) return new Date(); const [y,m,d]=str.split('-').map(Number); return new Date(y,(m||1)-1,d||1); }
const normalizeDate=(d)=>{ const nd=new Date(d); nd.setHours(0,0,0,0); return nd; };
function ymLabel(y,m){return `${y}년 ${m+1}월`;}
function fmtAmPm(date){let h=date.getHours();const m=date.getMinutes();const ap=h>=12?'오후':'오전';const hh=(h%12)||12;return `${ap} ${hh}:${String(m).padStart(2,'0')}`;}

const ST={viewYear:new Date().getFullYear(),viewMonth:new Date().getMonth(),selected:new Date(),linesHint:4,cellHeight:120,eventEmoji:'',eventColor:'',todoEmoji:'',todoColor:'',reminderEmoji:'',reminderColor:''};
const $={
  ym:document.getElementById('headerYmLabel'),
  grid:document.getElementById('calendarGrid'),
  todayBtn:document.getElementById('todayBtn'),
  prev:document.getElementById('prevMonth'),
  next:document.getElementById('nextMonth'),
  reminderList:document.getElementById('reminderList'),
  selText:document.getElementById('selectedDateText'),
  eventMenuBtn:document.getElementById('eventMenuBtn'),
  eventStartDate:document.getElementById('eventStartDate'),
  eventEndDate:document.getElementById('eventEndDate'),
  eventTime:document.getElementById('eventTime'),
  eventAlarm:document.getElementById('eventAlarm'),
  eventRepeatBtn:document.getElementById('eventRepeatBtn'),
  todoInput:document.getElementById('todoInput'),
  todoAddBtn:document.getElementById('todoAddBtn'),
  todoColorBtn:document.getElementById('todoColorBtn'),
  todoEmojiBtn:document.getElementById('todoEmojiBtn'),
  todoStartDate:document.getElementById('todoStartDate'),
  todoEndDate:document.getElementById('todoEndDate'),
  todoList:document.getElementById('todoList'),
  memoDate:document.getElementById('memoDate'),
  memoInput:document.getElementById('memoInput'),
  memoAdd:document.getElementById('memoAddBtn'),
  memoList:document.getElementById('memoList'),
  calWrap:document.querySelector('.calendar'),
  host:document.getElementById('widgetHost'),
  calSizeSlider:document.getElementById('calSizeSlider'),
};

// 날짜 필드 초기값 설정
// 일정/투두 탭 상태
let scheduleTab = 'event'; // 'event' 또는 'todo'

const initDateStr = fmtLocalDate(ST.selected);
if($.eventStartDate) $.eventStartDate.value = initDateStr;
if($.eventEndDate) $.eventEndDate.value = initDateStr;
if($.todoStartDate) $.todoStartDate.value = initDateStr;
if($.todoEndDate) $.todoEndDate.value = initDateStr;
if($.memoDate) $.memoDate.value = initDateStr;
if($.selText) $.selText.textContent = initDateStr;

const kTodo=(d)=>`memo2.todos.${d}`, kMemo=(d)=>`memo2.memos.${d}`;
const JAY_MEMO_LIST_KEY='jay_memo_list';
const JAY_MEMO_MIGRATED_KEY='memo2.jay_memo_migrated';
function kDaily(d){ return `memo2.daily.${d}`; }

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

const JAY_INSIGHT_LIST_KEY='jay_insight_list';
let insightActiveLang='KR';
let insightWriteLang='KR';

function createInsightId(){ return 'insight_'+Date.now(); }
function normalizeJayInsight(raw){
  const lang=(raw.lang==='EN'||raw.lang==='KR')?raw.lang:'KR';
  const ts=raw.createdAt||Date.now();
  return {
    id:raw.id||createInsightId(),
    lang,
    title:raw.title||'',
    content:raw.content||'',
    date:raw.date||fmtLocalDate(new Date(ts)),
    createdAt:ts,
  };
}
function getJayInsightList(){
  try{
    const arr=JSON.parse(localStorage.getItem(JAY_INSIGHT_LIST_KEY)||'[]');
    if(!Array.isArray(arr)) return [];
    return arr.map(normalizeJayInsight);
  }catch{
    return [];
  }
}
function setJayInsightList(list){
  localStorage.setItem(JAY_INSIGHT_LIST_KEY,JSON.stringify(list));
}
function deleteJayInsightById(id){
  setJayInsightList(getJayInsightList().filter(i=>i.id!==id));
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
const storeCache=new Map();
const cloneDefault=(val)=>{
  if(Array.isArray(val)) return [...val];
  return (val && typeof val==='object')?{...val}:val;
};
const readFromStore=(key,def=[])=>{
  if(storeCache.has(key)) return storeCache.get(key);
  let parsed=cloneDefault(def);
  try{
    const raw=localStorage.getItem(key);
    if(raw!=null) parsed=JSON.parse(raw);
  }catch(err){
    console.warn('storage parse fail', err);
  }
  storeCache.set(key,parsed);
  return parsed;
};
const writeToStore=(key,val)=>{
  storeCache.set(key,val);
  localStorage.setItem(key,JSON.stringify(val));
};
const invalidateStoreCache=(key)=>{
  if(!key){
    storeCache.clear();
    return;
  }
  storeCache.delete(key);
};
const get=(k,def=[])=>readFromStore(k,def);
const set=(k,v)=>writeToStore(k,v);
if(typeof window!=='undefined'){
  window.addEventListener('storage',(evt)=>{
    if(evt.key){
      storeCache.delete(evt.key);
    }else{
      storeCache.clear();
    }
  });
}
const isMobileViewport=()=>{
  if(typeof window==='undefined') return false;
  try{
    const mq=window.matchMedia('(max-width: 768px)');
    if(mq?.matches) return true;
  }catch{}
  try{
    return /Mobi|Android/i.test(window.navigator?.userAgent||'');
  }catch{}
  return false;
};
const runWhenIdle=(task,timeout=800)=>{
  if(typeof window==='undefined'){ task(); return; }
  if('requestIdleCallback' in window){
    requestIdleCallback(()=>task(),{timeout});
  }else{
    setTimeout(task,timeout);
  }
};

// 메뉴 클릭 시 페이지뷰 유사 카운터 (광고 효과 확인용)
const PV_KEY='memo2.menuPV';
function trackMenuPV(label){
  try{
    const snap=get(PV_KEY,{count:0,events:[]});
    snap.count+=1;
    snap.events.unshift({label,ts:Date.now()});
    if(snap.events.length>100) snap.events.length=100;
    set(PV_KEY,snap);
    if(window.memo2PVLogEnabled){
      const ts=new Date().toISOString();
      console.log(`[menuPV] ${label} | total=${snap.count} | ${ts}`);
    }
  }catch(err){ console.warn('menuPV track fail', err); }
}
window.memo2PVStats=()=>{ const snap=get(PV_KEY,{count:0,events:[]}); console.table(snap.events.map(e=>({label:e.label, time:new Date(e.ts).toLocaleString()}))); console.log('total', snap.count); return snap; };
window.memo2ClearPV=()=>{ localStorage.removeItem(PV_KEY); invalidateStoreCache(PV_KEY); console.log('menuPV cleared'); };

/* ── 전역 앱 채널 ── */
const APP_CH='memo2.app';
const appBC=('BroadcastChannel' in window)? new BroadcastChannel(APP_CH):null;
function postApp(msg){ if(appBC) appBC.postMessage(msg); }
function setGlobalSelected(d){
  const s=typeof d==='string'?d:fmtLocalDate(d);
  localStorage.setItem('memo2.selected',s);
  postApp({type:'select',date:s});
}
if(!localStorage.getItem('memo2.selected')) localStorage.setItem('memo2.selected', fmtLocalDate(new Date()));

/* ── 달력 ── */
const dim=(y,m)=>new Date(y,m+1,0).getDate();
function calcCellHeight(){
  const weekdays=$.calWrap?.querySelector('.calendar__weekdays');
  const wrapH=$.calWrap?.clientHeight||0;
  const widthBase=$.grid?.clientWidth||$.calWrap?.clientWidth||0;
  const rows=6;
  // Reduced min height further so ads below calendar stay visible on desktop
  const minHeight=isMobileViewport()?80:90;
  let candidate=minHeight;
  if(widthBase){
    const perCol=Math.floor(widthBase/7);
    candidate=Math.max(candidate, perCol+10);
  }
  if(wrapH){
    const usable=wrapH-(weekdays?.offsetHeight||0)-12;
    if(usable>0){
      candidate=Math.max(candidate, Math.floor(usable/rows));
    }
  }
  return Math.min(Math.max(candidate,minHeight),125);
}
function calcMaxLines(){
  const cellH=ST.cellHeight||calcCellHeight();
  const usable=cellH-34;
  return Math.max(1,Math.floor(usable/18));
}
function renderCalendar(){
  const y=ST.viewYear,m=ST.viewMonth;
  if($.ym) $.ym.textContent=`🗓 ${ymLabel(y,m)}`;
  $.grid.innerHTML='';
  const first=new Date(y,m,1),start=first.getDay(),total=dim(y,m);
  const prevTotal=new Date(y,m,0).getDate(),cells=42; // 6주 고정
  
  const cellH=calcCellHeight();
  ST.cellHeight=cellH;

  for(let i=0;i<cells;i++){
    const cell=el('div','day'); let dNum,dObj,out=false;
    cell.style.height=cellH+'px';
    if(i<start){dNum=prevTotal-start+1+i; dObj=new Date(y,m-1,dNum); out=true;}
    else if(i>=start+total){dNum=i-(start+total)+1; dObj=new Date(y,m+1,dNum); out=true;}
    else{dNum=i-start+1; dObj=new Date(y,m,dNum);}
    cell.append(el('div','day__num',dNum));
    if(out) cell.classList.add('day--outside');
    if(fmtLocalDate(dObj)===fmtLocalDate(new Date())) cell.classList.add('day--today');
    if(fmtLocalDate(dObj)===fmtLocalDate(ST.selected)) cell.classList.add('day--selected');

    const dstr=fmtLocalDate(dObj);
    const allItems=get(kTodo(dstr));
    const memoItems=get(kMemo(dstr));
    const isEvent=(t)=>Object.prototype.hasOwnProperty.call(t,'time');
    const events=allItems.filter(isEvent);
    const todos=allItems.filter(t=>!isEvent(t));
    const combined=[...events,...todos];

    if(Array.isArray(memoItems) && memoItems.length){
      const memoFlag=el('span','memo-flag','🗒️');
      memoFlag.title=`메모 ${memoItems.length}개`;
      memoFlag.setAttribute('aria-label',`메모 ${memoItems.length}개`);
      memoFlag.dataset.count=String(memoItems.length);
      cell.appendChild(memoFlag);
    }
    
    if(combined.length){
      // 일정/투두 분리 표시
      const labels=el('div','labels');
      labels.style.gap='0';
      labels.style.padding='0';
      const MAX_LINES=7;
      let linesLeft=MAX_LINES;
      const eventItems = linesLeft>0 ? events.slice(0,linesLeft) : [];
      linesLeft-=eventItems.length;
      if(eventItems.length){
        eventItems.forEach(t=>{
          const row=el('div','label');
          row.style.margin='0';
          row.style.padding='0';
          row.style.width='100%';
          const content=el('div','label-content');
          content.style.padding='0';
          content.style.margin='0';
          content.style.lineHeight='1.2';
          content.style.fontSize='10px';
          content.style.width='100%';
          content.style.borderRadius='0';
          if(t.emoji){
            const emoji=el('span','label-emoji',t.emoji);
            content.appendChild(emoji);
          }
          const txt=el('span','label-text',t.text);
          content.appendChild(txt);
          txt.style.color = '#000';
          if(t.color==='rainbow'){
            content.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
          } else {
            content.style.backgroundColor=t.color||'transparent';
          }
          content.onclick=(e)=>{
            e.stopPropagation();
            if(isMobileViewport()){
              showEventDetailModal(t,allItems,dstr);
            }else{
              showEventMenu(content,t,allItems,dstr,()=>{
                txt.style.color='#000';
                if(t.color==='rainbow'){
                  content.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
                }else{
                  content.style.background='';
                  content.style.backgroundColor=t.color||'transparent';
                }
              });
            }
          };
          content.style.cursor='pointer';
          row.appendChild(content);
          labels.appendChild(row);
        });
      }
      // 투두 리스트
      const todoItems = linesLeft>0 ? todos.slice(0,linesLeft) : [];
      linesLeft=Math.max(0,linesLeft-todoItems.length);
      if(todoItems.length){
        todoItems.forEach(t=>{
          const row=el('div','label');
          row.style.margin='0';
          row.style.padding='0';
          row.style.width='100%';
          const chk=el('input'); chk.type='checkbox'; chk.checked=!!t.done;
          chk.className='label-checkbox';
          chk.onclick=(e)=>{
            e.stopPropagation();
            t.done=!t.done;
            set(kTodo(dstr),allItems);
            postApp({type:'refresh'});
            renderCalendar();
          };
          row.appendChild(chk);
          const content=el('div','label-content');
          content.style.padding='0';
          content.style.margin='0';
          content.style.lineHeight='1.2';
          content.style.fontSize='10px';
          content.style.width='100%';
          content.style.borderRadius='0';
          if(t.emoji){
            const emoji=el('span','label-emoji',t.emoji);
            content.appendChild(emoji);
          }
          const txt=el('span','label-text',t.text);
          content.appendChild(txt);
          content.style.backgroundColor='transparent';
          if(t.done) {
            txt.classList.add('done');
            txt.style.color='#9aa5b1';
          } else {
            txt.style.color=t.color||'#000';
          }
          row.appendChild(content);
          labels.appendChild(row);
        });
      }
      const displayed=eventItems.length+todoItems.length;
      const hidden=events.length+todos.length-displayed;
      if(hidden>0){
        const moreRow=el('div','label');
        moreRow.style.margin='0';
        moreRow.style.padding='0';
        moreRow.style.display='flex';
        moreRow.style.justifyContent='flex-end';
        moreRow.style.width='100%';
        const moreTxt=el('span','label-more',`+${hidden}`);
        moreTxt.style.fontSize='10px';
        moreTxt.style.color='#5c8dff';
        moreTxt.style.padding='0';
        moreTxt.style.margin='0';
        moreRow.append(moreTxt);
        labels.appendChild(moreRow);
      }
      cell.append(labels);
      const dots=el('div','dots');
      combined.slice(0,5).forEach(t=>{const d=el('span','dot'); d.style.background=effectiveColor(t); dots.append(d);});
      cell.append(dots);
    }

    cell.addEventListener('click',()=>{
      ST.selected=dObj; setGlobalSelected(dObj); renderCalendar(); renderRight();
    });
    $.grid.appendChild(cell);
  }
  const measured=calcMaxLines();
  if(measured!==ST.linesHint){ ST.linesHint=measured; requestAnimationFrame(renderCalendar); }
}
function renderRight(){
  const dstr=fmtLocalDate(ST.selected);
  if($.selText) $.selText.textContent=dstr;
  if($.eventStartDate) $.eventStartDate.value=dstr;
  if($.eventEndDate) $.eventEndDate.value=dstr;
  if($.todoStartDate) $.todoStartDate.value=dstr;
  if($.todoEndDate) $.todoEndDate.value=dstr;
  if($.memoDate) $.memoDate.value=dstr;
  // 일정/투두 리스트 분리 렌더링
  const eventLabel = document.getElementById('eventListLabel');
  const todoLabel = document.getElementById('todoListLabel');
  if(eventLabel) eventLabel.innerHTML = '<span class="tab-icon">📅</span>일정';
  if(todoLabel) todoLabel.innerHTML = '<span class="tab-icon">✅</span>TODO';
  renderEvents();
  renderTodos();
  renderMemos();
}

let fabInitScheduled=false;
function scheduleFabButton(){
  if(fabInitScheduled) return;
  fabInitScheduled=true;
  runWhenIdle(()=>{
    try{
      setupFabButton();
    }catch(err){
      fabInitScheduled=false;
      console.warn('fab init failed', err);
    }
  });
}
function setupFabButton(){
  if(document.querySelector('.fab-add')) return;
  const host=document.getElementById('calendarWrapper')||document.body;
  const fab=el('button','fab-add','+');
  // 기본 스타일 백업(스타일시트가 늦게 로드될 때 대비)
  Object.assign(fab.style,{
    position:'absolute',right:'16px',bottom:'16px',width:'58px',height:'58px',
    borderRadius:'50%',border:'2px solid #1f2933',background:'#fff',color:'#1f2933',
    fontSize:'30px',fontWeight:'800',boxShadow:'0 10px 24px rgba(0,0,0,0.16)',
    cursor:'pointer',zIndex:'5000',display:'grid',placeItems:'center',opacity:'1',visibility:'visible'
  });
  fab.type='button';
  const menu=document.createElement('div'); menu.className='fab-menu';
  Object.assign(menu.style,{position:'absolute',right:'16px',bottom:'84px',zIndex:'4999'});
  const addEvent=el('button','fab-action','일정 추가');
  const addTodo=el('button','fab-action','TODO 추가');
  menu.append(addEvent,addTodo);
  host.append(fab,menu);
  // 만약 다른 요소에 가려지면 위치/디스플레이를 재보정
  const ensureVisible=()=>{
    if(!host.contains(fab)) host.appendChild(fab);
    if(!host.contains(menu)) host.appendChild(menu);
    fab.style.display='grid';
    fab.style.position='absolute';
    fab.style.opacity='1';
    fab.style.visibility='visible';
  };
  setTimeout(ensureVisible,50);
  setTimeout(ensureVisible,250);
  setTimeout(ensureVisible,800);
  let open=false;
  const close=()=>{ open=false; menu.classList.remove('fab-menu--open'); };
  fab.addEventListener('click',(e)=>{ e.stopPropagation(); open=!open; menu.classList.toggle('fab-menu--open',open); });
  document.addEventListener('click',(e)=>{ if(!open) return; if(!menu.contains(e.target) && !fab.contains(e.target)){ close(); } });
  const activateTab=(mode)=>{
    const tabEvent=document.getElementById('tabEvent');
    const tabTodo=document.getElementById('tabTodo');
    scheduleTab=mode;
    if(tabEvent&&tabTodo){
      tabEvent.classList.toggle('active',mode==='event');
      tabTodo.classList.toggle('active',mode==='todo');
    }
    const panel=document.getElementById('todoOptionsPanel');
    if(panel){ panel.style.display=mode==='event'?'block':'none'; }
  };
  const focusForm=()=>{
    document.querySelector('.right')?.scrollIntoView({behavior:'smooth',block:'start'});
    if($.todoInput){ $.todoInput.focus(); $.todoInput.select?.(); }
  };
  addEvent.onclick=(e)=>{ e.stopPropagation(); activateTab('event'); focusForm(); close(); };
  addTodo.onclick=(e)=>{ e.stopPropagation(); activateTab('todo'); focusForm(); close(); };
}

// 일정 리스트 렌더링 함수 (체크박스 없음, 바탕색만 적용)
function renderEvents(){
  const dstr=fmtLocalDate(ST.selected);
  const allItems=get(kTodo(dstr));
  const isEvent=(t)=>Object.prototype.hasOwnProperty.call(t,'time');
  const list=allItems.filter(isEvent);
  const eventList = document.getElementById('eventList');
  if(!eventList) return;
  eventList.innerHTML='';
  if(list.length === 0) {
    const empty = el('div', '', '등록된 일정이 없습니다');
    empty.style.color = '#b0b8c1';
    empty.style.fontSize = '14px';
    empty.style.textAlign = 'center';
    eventList.appendChild(empty);
  } else {
    list.forEach((it,i)=> {
      const li=el('li','event-item');
      const labelWrap=el('span','event-label-wrapper');
      if(it.emoji){ labelWrap.appendChild(el('span','event-emoji',it.emoji)); }
      const txt=el('span','event-text',it.text);
      labelWrap.appendChild(txt);
      // 바탕색 적용
      txt.style.color='#000';
      if(it.color==='rainbow'){
        labelWrap.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
      } else {
        labelWrap.style.backgroundColor=it.color||'transparent';
        labelWrap.style.background='';
      }

      const actions=el('div','item-actions');
      const delBtn=el('button','del-btn','🗑'); delBtn.type='button';
      const menuBtn=el('button','event-menu-btn','⋮'); menuBtn.type='button';
      delBtn.onclick=(e)=>{
        e.stopPropagation();
        allItems.splice(allItems.indexOf(it),1);
        set(kTodo(dstr),allItems);
        renderEvents();
        renderCalendar();
        postApp({type:'refresh'});
      };
      menuBtn.onclick=(e)=>{
        e.stopPropagation();
        showEventMenu(menuBtn,it,allItems,dstr,()=>{
          // applyStyle inline
          txt.style.color='#000';
          if(it.color==='rainbow'){
            labelWrap.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
          } else {
            labelWrap.style.backgroundColor=it.color||'transparent';
            labelWrap.style.background='';
          }
        });
      };
      actions.append(delBtn,menuBtn);
      li.append(labelWrap,actions);
      eventList.appendChild(li);
    });
  }
  renderCalendar();
}

document.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.style.fontFamily='"Noto Sans KR","Noto Sans",sans-serif';
  if(document.body) document.body.style.fontFamily='"Noto Sans KR","Noto Sans",sans-serif';
  const tabEvent = document.getElementById('tabEvent');
  const tabTodo = document.getElementById('tabTodo');
  
  if(tabEvent && tabTodo){
    tabEvent.onclick = ()=>{
      scheduleTab = 'event';
      tabEvent.classList.add('active');
      tabTodo.classList.remove('active');
      renderRight();
      reloadAdsense();
      trackMenuPV('tab:event');
    };
    tabTodo.onclick = ()=>{
      scheduleTab = 'todo';
      tabTodo.classList.add('active');
      tabEvent.classList.remove('active');
      renderRight();
      reloadAdsense();
      trackMenuPV('tab:todo');
    };
  }

  runWhenIdle(()=>setupInlineRepeat());
  scheduleFabButton();
});

// 페이지가 이미 로드된 상태에서 스크립트가 삽입되는 경우를 대비한 안전 호출
if(document.readyState!=='loading'){
  scheduleFabButton();
}
window.addEventListener('load',()=>scheduleFabButton());

/* ── 선택 날짜 (Event) - 사용하지 않음 ── */
function eventItemEl(item,idx,ref,dstr){
  const li=el('li','event-item');
  const labelWrap=el('span','event-label-wrapper');
  
  if(item.emoji){ const emoji=el('span','event-emoji',item.emoji); labelWrap.appendChild(emoji); }
  const txt=el('span','event-text',item.text);
  labelWrap.appendChild(txt);

  const delBtn=el('button','del-btn','🗑'); delBtn.type='button';
  const menuBtn=el('button','event-menu-btn','⋮'); menuBtn.type='button';

  const applyStyle=()=>{
    txt.style.color=item.color==='rainbow'?'#fff':'#000';
    if(item.color==='rainbow'){
      labelWrap.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
      labelWrap.style.backgroundColor='transparent';
    } else {
      labelWrap.style.backgroundColor=item.color||'transparent';
      labelWrap.style.background='';
    }
  };
  applyStyle();
  
  labelWrap.onclick=()=>{
    if(isMobileViewport()){
      showEventDetailModal(item,ref,dstr);
    }else{
      showEventMenu(labelWrap,item,ref,dstr,applyStyle);
    }
  };
  
  menuBtn.onclick=(e)=>{
    e.stopPropagation();
    labelWrap.onclick();
  };

  delBtn.onclick=(e)=>{
    e.stopPropagation();
    ref.splice(ref.indexOf(item),1);
    set(kTodo(dstr),ref);
    renderEvents();
    renderCalendar();
    postApp({type:'refresh'});
  };

  labelWrap.draggable=true;
  labelWrap.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',String(idx)); });
  li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); const to=idx; if(from===to)return; const [m]=ref.splice(from,1); ref.splice(to,0,m); set(kTodo(dstr),ref); renderEvents(); renderCalendar(); postApp({type:'refresh'}); });

  const actions=el('div','item-actions');
  actions.append(delBtn,menuBtn);
  li.append(labelWrap,actions);
  return li;
}

/* ── 일정 메뉴 ── */
function showEventMenu(anchor,item,ref,dstr,applyStyle){
  const doc=anchor.ownerDocument||document;
  if(openPop) openPop.remove();
  
  const pop=doc.createElement('div');
  pop.className='event-menu-popup';
  
  const emojiBtn=el('button','menu-item','💬 이모티콘 변경');
  const colorBtn=el('button','menu-item','🎨 색상 변경');
  
  emojiBtn.onclick=()=>{
    pop.remove();
    openPop=null;
    showEmojiPicker(anchor,(emoji)=>{
      item.emoji=emoji;
      set(kTodo(dstr),ref);
      renderEvents();
      renderCalendar();
      postApp({type:'refresh'});
    });
  };
  
  colorBtn.onclick=()=>{
    pop.remove();
    openPop=null;
    showPalette(anchor,(c)=>{
      item.color=c;
      set(kTodo(dstr),ref);
      applyStyle();
      renderCalendar();
      postApp({type:'refresh'});
    });
  };
  
  pop.append(emojiBtn,colorBtn);
  doc.body.appendChild(pop);
  openPop=pop;
  
  const rect=anchor.getBoundingClientRect();
  pop.style.left=rect.left+'px';
  pop.style.top=(rect.bottom+4)+'px';
  
  const closeMenu=(e)=>{
    if(!pop.contains(e.target) && e.target!==anchor){
      pop.remove();
      openPop=null;
      doc.removeEventListener('click',closeMenu);
    }
  };
  setTimeout(()=>doc.addEventListener('click',closeMenu),10);
}

/* ── 팔레트 ── */
const PALETTE_BASE=["#3b82f6","#ef4444","#ec4899","#f97316","#eab308","#22c55e",
               "#10b981","#14b8a6","#6366f1","#8b5cf6","#9ca3af","#64748b"];
const PALETTE_EXTENDED=[
  "#fee2e2","#fecaca","#fca5a5","#f87171","#ef4444","#dc2626",
  "#fed7aa","#fdba74","#fb923c","#f97316","#ea580c","#c2410c",
  "#fef08a","#fde047","#facc15","#eab308","#ca8a04","#a16207",
  "#d9f99d","#bef264","#a3e635","#84cc16","#65a30d","#4d7c0f",
  "#a7f3d0","#6ee7b7","#34d399","#10b981","#059669","#047857",
  "#a5f3fc","#67e8f9","#22d3ee","#06b6d4","#0891b2","#0e7490",
  "#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8",
  "#c7d2fe","#a5b4fc","#818cf8","#6366f1","#4f46e5","#4338ca",
  "#ddd6fe","#c4b5fd","#a78bfa","#8b5cf6","#7c3aed","#6d28d9",
  "#f0abfc","#e879f9","#d946ef","#c026d3","#a21caf","#86198f"
];
const getRecentColors=()=>get('memo2.recentColors',[]);
const saveRecentColor=(col)=>{
  let recent=getRecentColors();
  recent=recent.filter(c=>c!==col);
  recent.unshift(col);
  if(recent.length>10) recent=recent.slice(0,10);
  set('memo2.recentColors',recent);
};

/* ── 이모티콘 선택기 ── */
const EMOJI_CATEGORIES={
  '자주 사용': ['😊','😂','❤️','🎉','👍','🔥','✨','💯','🎯','⭐'],
  '얼굴': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','😮‍💨','🤥'],
  '활동': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂'],
  '음식': ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨'],
  '여행': ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️'],
  '기호': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']
};

let openPop=null;
function showEmojiPicker(anchor,onPick){
  const doc=anchor.ownerDocument||document;
  const win=doc.defaultView||window;
  if(openPop) openPop.remove();
  
  const pop=doc.createElement('div'); pop.className='emoji-picker';
  
  Object.keys(EMOJI_CATEGORIES).forEach(category=>{
    const title=doc.createElement('div');
    title.className='emoji-category-title';
    title.textContent=category;
    pop.appendChild(title);
    
    const grid=doc.createElement('div');
    grid.className='emoji-grid';
    EMOJI_CATEGORIES[category].forEach(emoji=>{
      const btn=doc.createElement('button');
      btn.className='emoji-item';
      btn.textContent=emoji;
      btn.onclick=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        onPick(emoji);
        pop.remove();
        openPop=null;
      };
      grid.appendChild(btn);
    });
    pop.appendChild(grid);
  });
  
  doc.body.appendChild(pop);
  const r=anchor.getBoundingClientRect();
  
  let left=r.left+(win.scrollX||0);
  let top=r.bottom+6+(win.scrollY||0);
  
  pop.style.left=`${left}px`;
  pop.style.top=`${top}px`;
  pop.style.visibility='hidden';
  
  requestAnimationFrame(()=>{
    const popRect=pop.getBoundingClientRect();
    const viewWidth=win.innerWidth;
    const viewHeight=win.innerHeight;
    
    if(popRect.right>viewWidth){
      left=Math.max(0, viewWidth-popRect.width-10);
    }
    if(popRect.bottom>viewHeight){
      top=r.top-popRect.height-6+(win.scrollY||0);
    }
    
    pop.style.left=`${left}px`;
    pop.style.top=`${top}px`;
    pop.style.visibility='visible';
  });
  
  const close=(e)=>{ if(!pop.contains(e.target)&&e.target!==anchor){pop.remove();openPop=null;doc.removeEventListener('mousedown',close);} };
  doc.addEventListener('mousedown',close);
  openPop=pop;
}
function showPalette(anchor,onPick){
  const doc=anchor.ownerDocument||document;
  const win=doc.defaultView||window;
  if(openPop) openPop.remove();
  const pop=doc.createElement('div'); pop.className='color-pop-advanced';
  
  // 색상없음
  const noColorRow=doc.createElement('div'); noColorRow.className='color-row';
  const noColor=doc.createElement('div');
  noColor.className='color-swatch no-color';
  noColor.textContent='없음';
  noColor.style.background='#fff';
  noColor.style.border='2px solid #e2e8f0';
  noColor.style.color='#64748b';
  noColor.style.fontSize='11px';
  noColor.style.fontWeight='600';
  noColor.onclick=()=>{onPick(''); pop.remove(); openPop=null;};
  noColorRow.appendChild(noColor);
  pop.appendChild(noColorRow);
  
  // 기본 색상
  const basicRow=doc.createElement('div'); basicRow.className='color-row';
  PALETTE_BASE.forEach(col=>{
    const sw=doc.createElement('div'); 
    sw.className='color-swatch'; 
    sw.style.background=col;
    sw.onclick=()=>{saveRecentColor(col); onPick(col); pop.remove(); openPop=null;}; 
    basicRow.appendChild(sw);
  });
  
  // 무지개 색상
  const rainbow=doc.createElement('div');
  rainbow.className='color-swatch rainbow';
  rainbow.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
  rainbow.onclick=()=>{saveRecentColor('rainbow'); onPick('rainbow'); pop.remove(); openPop=null;};
  basicRow.appendChild(rainbow);
  
  pop.appendChild(basicRow);
  
  // 확장 색상 그리드
  const extendedGrid=doc.createElement('div'); extendedGrid.className='color-grid';
  PALETTE_EXTENDED.forEach(col=>{
    const sw=doc.createElement('div'); 
    sw.className='color-swatch-small'; 
    sw.style.background=col;
    sw.onclick=()=>{saveRecentColor(col); onPick(col); pop.remove(); openPop=null;}; 
    extendedGrid.appendChild(sw);
  });
  pop.appendChild(extendedGrid);
  
  // 최근 사용 색상
  const recentColors=getRecentColors();
  if(recentColors.length>0){
    const recentTitle=doc.createElement('div');
    recentTitle.className='color-section-title';
    recentTitle.textContent='최근 사용';
    pop.appendChild(recentTitle);
    
    const recentRow=doc.createElement('div'); recentRow.className='color-row';
    recentColors.forEach(col=>{
      const sw=doc.createElement('div'); 
      sw.className='color-swatch'; 
      if(col==='rainbow'){
        sw.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
        sw.classList.add('rainbow');
      } else {
        sw.style.background=col;
      }
      sw.onclick=()=>{onPick(col); pop.remove(); openPop=null;}; 
      recentRow.appendChild(sw);
    });
    pop.appendChild(recentRow);
  }
  
  doc.body.appendChild(pop);
  const r=anchor.getBoundingClientRect();
  
  // 팔레트 위치 계산 (화면 밖으로 나가지 않도록)
  let left=r.left+(win.scrollX||0);
  let top=r.bottom+6+(win.scrollY||0);
  
  // 팝업 크기 측정 후 위치 조정
  pop.style.left=`${left}px`; 
  pop.style.top=`${top}px`;
  pop.style.visibility='hidden';
  
  requestAnimationFrame(()=>{
    const popRect=pop.getBoundingClientRect();
    const viewWidth=win.innerWidth;
    const viewHeight=win.innerHeight;
    
    // 오른쪽으로 벗어나면 왼쪽으로 이동
    if(popRect.right>viewWidth){
      left=Math.max(0, viewWidth-popRect.width-10);
    }
    // 아래로 벗어나면 위로 표시
    if(popRect.bottom>viewHeight){
      top=r.top-popRect.height-6+(win.scrollY||0);
    }
    
    pop.style.left=`${left}px`;
    pop.style.top=`${top}px`;
    pop.style.visibility='visible';
  });
  
  const close=(e)=>{ if(!pop.contains(e.target)&&e.target!==anchor){pop.remove();openPop=null;doc.removeEventListener('mousedown',close);} };
  doc.addEventListener('mousedown',close);
  openPop=pop;
}

/* ── 오른쪽 ToDo ── */
function renderTodos(){
  const dstr=fmtLocalDate(ST.selected);
  const allItems=get(kTodo(dstr));
  const isEvent=(t)=>Object.prototype.hasOwnProperty.call(t,'time');
  const list=allItems.filter(t=>!isEvent(t)); // 투두만 필터링
  const todoList = document.getElementById('todoList');
  if(!todoList) return;
  todoList.innerHTML='';
  if(list.length === 0) {
    const empty = el('div', '', '등록된 할 일이 없습니다');
    empty.style.color = '#b0b8c1';
    empty.style.fontSize = '14px';
    empty.style.textAlign = 'center';
    todoList.appendChild(empty);
  } else {
    list.forEach((it,i)=> {
      todoList.appendChild(todoItemEl(it,i,allItems,dstr));
    });
  }
  renderCalendar();
}
function todoItemEl(item,idx,ref,dstr){
  const li=el('li','todo-item');
  const cb=document.createElement('input'); 
  cb.type='checkbox'; 
  cb.checked=item.done;
  cb.className='todo-checkbox';
  const emoji=item.emoji?el('span','todo-emoji',item.emoji):null;
  const txt=el('span','text',item.text);
  const delBtn=el('button','del-btn','🗑'); delBtn.type='button';
  const menuBtn=el('button','event-menu-btn','⋮'); menuBtn.type='button';

  const applyText=()=>{
    // 투두: 색상 변경은 글자색만 적용
    if(item.done){
      txt.style.color='#9aa5b1';
      txt.style.textDecoration='line-through';
      txt.style.backgroundColor='transparent';
    } else {
      txt.style.color=item.color||'#000';
      txt.style.textDecoration='none';
      txt.style.backgroundColor='transparent';
    }
    txt.classList.toggle('done',!!item.done);
  };
  applyText();

  cb.addEventListener('change',()=>{ 
    item.done=cb.checked; 
    set(kTodo(dstr),ref); 
    applyText(); 
    renderCalendar(); 
    postApp({type:'refresh'}); 
  });
  
  // 더블클릭으로 수정
  txt.ondblclick=(e)=>{ 
    e.stopPropagation();
    const inp=document.createElement('input'); 
    inp.type='text'; 
    inp.value=item.text; 
    inp.className='todo-edit';
    inp.style.flex='1';
    inp.onkeydown=(ev)=>{
      if(ev.key==='Enter'){ item.text=inp.value.trim()||item.text; set(kTodo(dstr),ref); renderTodos(); postApp({type:'refresh'}); }
      if(ev.key==='Escape'){ renderTodos(); }
    };
    inp.onblur=()=>{ item.text=inp.value.trim()||item.text; set(kTodo(dstr),ref); renderTodos(); postApp({type:'refresh'}); };
    li.replaceChild(inp,txt); 
    inp.focus(); 
    inp.select();
  };

  menuBtn.onclick=(e)=>{
    e.stopPropagation();
    showTodoMenu(menuBtn,item,ref,dstr,applyText);
  };

  delBtn.onclick=(e)=>{
    e.stopPropagation();
    ref.splice(ref.indexOf(item),1);
    set(kTodo(dstr),ref);
    renderTodos();
    renderCalendar();
    postApp({type:'refresh'});
  };

  // 정렬(텍스트만 드래그)
  txt.draggable=true;
  txt.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',String(idx)); });
  li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); const to=idx; if(from===to)return; const [m]=ref.splice(from,1); ref.splice(to,0,m); set(kTodo(dstr),ref); renderTodos(); postApp({type:'refresh'}); });

  const actions=el('div','item-actions');
  actions.append(delBtn,menuBtn);
  if(emoji) li.append(cb,emoji,txt,actions);
  else li.append(cb,txt,actions);
  return li;
}

/* ── TODO 메뉴 ── */
function showTodoMenu(anchor,item,ref,dstr,applyText){
  const doc=anchor.ownerDocument||document;
  if(openPop) openPop.remove();
  
  const pop=doc.createElement('div');
  pop.className='event-menu-popup';
  
  const emojiBtn=el('button','menu-item','💬 이모티콘 변경');
  const colorBtn=el('button','menu-item','🎨 색상 변경');
  
  emojiBtn.onclick=()=>{
    pop.remove();
    openPop=null;
    showEmojiPicker(anchor,(emoji)=>{
      item.emoji=emoji;
      set(kTodo(dstr),ref);
      renderTodos();
      postApp({type:'refresh'});
    });
  };
  
  colorBtn.onclick=()=>{
    pop.remove();
    openPop=null;
    showPalette(anchor,(c)=>{
      item.color=c;
      set(kTodo(dstr),ref);
      applyText();
      renderCalendar();
      postApp({type:'refresh'});
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
    
    // 화면 오른쪽 경계 처리
    if(popRect.right>viewWidth){
      left=Math.max(10, viewWidth-popRect.width-10);
    }
    
    // 화면 아래쪽 경계 처리
    if(popRect.bottom>viewHeight){
      top=rect.top-popRect.height-4+(win.scrollY||0);
    }
    
    pop.style.left=`${left}px`;
    pop.style.top=`${top}px`;
    pop.style.visibility='visible';
  });
  
  const closeMenu=(e)=>{
    if(!pop.contains(e.target) && e.target!==anchor){
      pop.remove();
      openPop=null;
      doc.removeEventListener('click',closeMenu);
    }
  };
  setTimeout(()=>doc.addEventListener('click',closeMenu),10);
}

/* ── 반복 설정 ── */
ST.eventRepeat='none';
function updateRepeatButton(){
  const labels={
    'none':'반복 안 함',
    'daily':'매일',
    'weekly':'매주',
    'monthly':'매월',
    'yearly':'매년'
  };
  if($.eventRepeatBtn){
    $.eventRepeatBtn.textContent=labels[ST.eventRepeat]||'반복 안 함';
    if(ST.eventRepeat!=='none'){
      $.eventRepeatBtn.classList.add('active');
    }else{
      $.eventRepeatBtn.classList.remove('active');
    }
  }

  const inlineBtn=document.getElementById('inlineRepeatBtn');
  if(inlineBtn){
    inlineBtn.textContent=labels[ST.eventRepeat]||'반복 안 함';
    const active=ST.eventRepeat && ST.eventRepeat!=='none';
    inlineBtn.style.background=active?'#e0ecff':'#f8fafc';
    inlineBtn.style.color=active?'#2563eb':'#334155';
  }
}

if($.eventRepeatBtn){
  $.eventRepeatBtn.onclick=(e)=>{
    e.stopPropagation();
    showRepeatModal(ST.eventRepeat,(value)=>{
      ST.eventRepeat=value;
      updateRepeatButton();
    });
  };
}

function showRepeatModal(currentValue,onConfirm){
  const overlay=el('div','repeat-modal-overlay');
  const modal=el('div','event-detail-modal');
  
  const options=['none','daily','weekly','monthly','yearly'];
  const labels={'none':'반복 안 함','daily':'매일','weekly':'매주','monthly':'매월','yearly':'매년'};
  
  modal.innerHTML='<h3>반복 설정</h3>';
  options.forEach(opt=>{
    const btn=el('button','repeat-option',labels[opt]);
    if(opt===currentValue) btn.classList.add('active');
    btn.onclick=()=>{
      onConfirm(opt);
      overlay.remove();
    };
    modal.appendChild(btn);
  });
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.onclick=(e)=>{ if(e.target===overlay) overlay.remove(); };
}

/* ── 일정 상세 편집 모달 ── */
function showEventDetailModal(item,ref,dstr){
  if(!isMobileViewport()) return;
  const overlay=el('div','repeat-modal-overlay');
  const modal=el('div','event-detail-modal');
  
  // 제목 입력
  const titleInput=document.createElement('input');
  titleInput.type='text';
  titleInput.className='event-detail-title';
  titleInput.value=item.text;
  titleInput.placeholder='제목';
  
  // 이모티콘과 색상 버튼
  const toolRow=el('div','event-detail-tools');
  const emojiBtn=el('button','tool-btn');
  setEmojiIcon(emojiBtn,item.emoji||'');
  const colorBtn=el('button','tool-btn color-wheel-btn');
  colorBtn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
  if(item.color && item.color!=='rainbow'){
    colorBtn.style.background=item.color;
  }else if(item.color==='rainbow'){
    colorBtn.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
  }
  
  emojiBtn.onclick=(e)=>{
    e.stopPropagation();
    showEmojiPicker(emojiBtn,(emoji)=>{
      item.emoji=emoji;
      setEmojiIcon(emojiBtn,emoji);
    });
  };
  
  colorBtn.onclick=(e)=>{
    e.stopPropagation();
    showPalette(colorBtn,(c)=>{
      item.color=c;
      if(c && c!=='rainbow'){
        colorBtn.style.background=c;
      }else if(c==='rainbow'){
        colorBtn.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
      }else{
        colorBtn.style.background='';
      }
    });
  };
  
  toolRow.append(emojiBtn,colorBtn);
  
  // 하루 종일 토글
  const allDayRow=el('div','event-detail-row');
  const allDayIcon=el('span','row-icon','🕐');
  const allDayLabel=el('span','row-label','하루 종일');
  const allDayToggle=document.createElement('input');
  allDayToggle.type='checkbox';
  allDayToggle.className='toggle-switch';
  allDayToggle.checked=!item.time;
  allDayRow.append(allDayIcon,allDayLabel,allDayToggle);
  
  // 날짜 범위
  const dateRow=el('div','event-detail-row');
  const dateIcon=el('span','row-icon','📅');
  const dateInputs=el('div','date-inputs');
  const startDateInput=document.createElement('input');
  startDateInput.type='date';
  startDateInput.value=dstr;
  const arrow=el('span','','→');
  const endDateInput=document.createElement('input');
  endDateInput.type='date';
  endDateInput.value=dstr;
  dateInputs.append(startDateInput,arrow,endDateInput);
  dateRow.append(dateIcon,dateInputs);
  
  // 시간
  const timeRow=el('div','event-detail-row');
  const timeIcon=el('span','row-icon','⏰');
  const timeLabel=el('span','row-label','시간');
  const timeInput=document.createElement('input');
  timeInput.type='time';
  timeInput.value=item.time||'';
  timeInput.disabled=allDayToggle.checked;
  timeRow.append(timeIcon,timeLabel,timeInput);
  
  allDayToggle.onchange=()=>{
    timeInput.disabled=allDayToggle.checked;
    if(allDayToggle.checked) timeInput.value='';
  };
  
  // 알림
  const alarmRow=el('div','event-detail-row');
  const alarmIcon=el('span','row-icon','🔔');
  const alarmLabel=el('span','row-label','알림');
  const alarmValue=el('span','row-value',item.alarm?'설정됨':'없음');
  alarmRow.append(alarmIcon,alarmLabel,alarmValue);
  
  // 반복
  const repeatLabels={'none':'반복 안 함','daily':'매일','weekly':'매주','monthly':'매월','yearly':'매년'};
  const repeatRow=el('div','event-detail-row');
  const repeatIcon=el('span','row-icon','🔄');
  const repeatLabel=el('span','row-label','반복');
  const repeatValue=el('span','row-value',repeatLabels[item.repeat||'none']);
  repeatRow.append(repeatIcon,repeatLabel,repeatValue);
  repeatRow.style.cursor='pointer';
  repeatRow.onclick=()=>{
    showRepeatModal(item.repeat||'none',(value)=>{
      item.repeat=value;
      repeatValue.textContent=repeatLabels[value];
    });
  };
  
  // 삭제 버튼
  const deleteRow=el('div','event-detail-row delete-row');
  const deleteIcon=el('span','row-icon','🗑');
  const deleteLabel=el('span','row-label','삭제');
  deleteRow.append(deleteIcon,deleteLabel);
  deleteRow.onclick=()=>{
    if(confirm('이 일정을 삭제하시겠습니까?')){
      ref.splice(ref.indexOf(item),1);
      set(kTodo(dstr),ref);
      renderEvents();
      renderCalendar();
      postApp({type:'refresh'});
      overlay.remove();
    }
  };
  
  // 저장/취소 버튼
  const footer=el('div','repeat-modal-footer');
  const cancelBtn=el('button','btn-cancel','취소');
  const saveBtn=el('button','btn-confirm','저장');
  
  cancelBtn.onclick=()=>overlay.remove();
  saveBtn.onclick=()=>{
    item.text=titleInput.value.trim()||item.text;
    item.time=allDayToggle.checked?'':timeInput.value;
    set(kTodo(dstr),ref);
    renderEvents();
    renderCalendar();
    postApp({type:'refresh'});
    overlay.remove();
  };
  
  footer.append(cancelBtn,saveBtn);
  modal.append(titleInput,toolRow,allDayRow,dateRow,timeRow,alarmRow,repeatRow,deleteRow,footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  overlay.onclick=(e)=>{
    if(e.target===overlay) overlay.remove();
  };
  
  titleInput.focus();
}

/* ── 일정 등록 메뉴 버튼 ── */
if($.eventMenuBtn){
  $.eventMenuBtn.onclick=(e)=>{
    e.stopPropagation();
    showEventInputMenu($.eventMenuBtn);
  };
}

function showEventInputMenu(anchor){
  const doc=anchor.ownerDocument||document;
  if(openPop) openPop.remove();
  
  const pop=doc.createElement('div');
  pop.className='event-menu-popup';
  
  const emojiBtn=el('button','menu-item','💬 이모티콘 추가');
  const colorBtn=el('button','menu-item','🎨 색상 변경');
  
  emojiBtn.onclick=()=>{
    pop.remove();
    openPop=null;
    showEmojiPicker(anchor,(emoji)=>{
      ST.eventEmoji=emoji;
    });
  };
  
  colorBtn.onclick=()=>{
    pop.remove();
    openPop=null;
    showPalette(anchor,(c)=>{
      ST.eventColor=c;
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
    
    // 화면 오른쪽 경계 처리
    if(popRect.right>viewWidth){
      left=Math.max(10, viewWidth-popRect.width-10);
    }
    
    // 화면 아래쪽 경계 처리
    if(popRect.bottom>viewHeight){
      top=rect.top-popRect.height-4+(win.scrollY||0);
    }
    
    pop.style.left=`${left}px`;
    pop.style.top=`${top}px`;
    pop.style.visibility='visible';
  });
  
  const closeMenu=(e)=>{
    if(!pop.contains(e.target) && e.target!==anchor){
      pop.remove();
      openPop=null;
      doc.removeEventListener('click',closeMenu);
    }
  };
  setTimeout(()=>doc.addEventListener('click',closeMenu),10);
}


function addTodoFromInput(){
  const text=($.todoInput?.value||'').trim(); 
  if(!text) return;
  
  const startDateRaw = (scheduleTab==='event' ? ($.eventStartDate?.value || $.todoStartDate?.value) : ($.todoStartDate?.value)) || fmtLocalDate(ST.selected);
  const endDateRawInput = (scheduleTab==='event' ? ($.eventEndDate?.value || $.todoEndDate?.value) : ($.todoEndDate?.value)) || startDateRaw;

  const startDate = startDateRaw;
  const endDate = endDateRawInput;

  const start=normalizeDate(parseLocalDate(startDate));
  const endRaw=normalizeDate(parseLocalDate(endDate));
  let end=endRaw<start?start:endRaw;
  
  if(scheduleTab==='event'){
    const timeVal=$.eventTime?$.eventTime.value:'';
    const alarmChecked=$.eventAlarm?.checked||false;
    const repeatValue=ST.eventRepeat||'none';

    const addEventForDate=(dObj)=>{
      const dstr=fmtLocalDate(dObj);
      const list=get(kTodo(dstr));
      list.push({
        text,
        emoji:ST.eventEmoji||'',
        color:ST.eventColor||DEFAULT_COLOR,
        done:false,
        time:timeVal,
        alarm:alarmChecked,
        repeat:repeatValue,
      });
      set(kTodo(dstr),list);
    };
    const maxIterations=400; // 안전장치
    if(repeatValue==='weekly'){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setDate(d.getDate()+7),count++) addEventForDate(d);
    } else if(repeatValue==='daily' || (repeatValue==='none' && end>start)){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setDate(d.getDate()+1),count++) addEventForDate(d);
    } else if(repeatValue==='monthly'){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setMonth(d.getMonth()+1),count++) addEventForDate(d);
    } else if(repeatValue==='yearly'){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setFullYear(d.getFullYear()+1),count++) addEventForDate(d);
    } else {
      addEventForDate(start);
    }
  } else {
    const repeatValue=ST.eventRepeat||'none';
    const addTodoForDate=(dObj)=>{
      const dstr=fmtLocalDate(dObj);
      const list=get(kTodo(dstr));
      list.push({
        text,
        emoji:ST.todoEmoji||'',
        color:ST.todoColor||DEFAULT_COLOR,
        done:false,
      });
      set(kTodo(dstr),list);
    };
    const maxIterations=400;
    if(repeatValue==='weekly'){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setDate(d.getDate()+7),count++) addTodoForDate(d);
    } else if(repeatValue==='daily' || (repeatValue==='none' && end>start)){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setDate(d.getDate()+1),count++) addTodoForDate(d);
    } else if(repeatValue==='monthly'){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setMonth(d.getMonth()+1),count++) addTodoForDate(d);
    } else if(repeatValue==='yearly'){
      let count=0; for(let d=new Date(start); d<=end && count<maxIterations; d.setFullYear(d.getFullYear()+1),count++) addTodoForDate(d);
    } else {
      addTodoForDate(start);
    }
  }
  
  $.todoInput.value=''; 
  const dstr=fmtLocalDate(ST.selected);
  if($.todoStartDate) $.todoStartDate.value=dstr;
  if($.todoEndDate) $.todoEndDate.value=dstr;
  if(scheduleTab==='event'){
    ST.eventEmoji='';
    if($.eventTime) $.eventTime.value='';
    if($.eventAlarm) $.eventAlarm.checked=false;
    ST.eventRepeat='none';
    updateRepeatButton();
  } else {
    ST.todoEmoji='';
  }
  renderEvents(); 
  renderTodos(); 
  renderCalendar();
  postApp({type:'refresh'});
}
if($.todoInput){
  $.todoInput.onkeydown=(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addTodoFromInput(); } };
}
if($.todoAddBtn){
  $.todoAddBtn.onclick=()=>addTodoFromInput();
}
if($.todoColorBtn){
  $.todoColorBtn.onclick=()=>{
    showPalette($.todoColorBtn, (c)=>{
      if(scheduleTab==='event') ST.eventColor=c; else ST.todoColor=c;
      const colorToApply=c;
      if(colorToApply==='rainbow'){
        $.todoColorBtn.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        $.todoColorBtn.classList.add('has-color');
      } else if(colorToApply){
        $.todoColorBtn.style.background=colorToApply;
        $.todoColorBtn.classList.add('has-color');
      } else {
        $.todoColorBtn.style.background='#e5e7eb';
        $.todoColorBtn.classList.remove('has-color');
      }
    });
  };
}
if($.todoEmojiBtn){
  setEmojiIcon($.todoEmojiBtn,'');
  $.todoEmojiBtn.onclick=()=>{
    showEmojiPicker($.todoEmojiBtn, (emoji)=>{
      if(scheduleTab==='event') ST.eventEmoji=emoji; else ST.todoEmoji=emoji;
      setEmojiIcon($.todoEmojiBtn,emoji);
      $.todoEmojiBtn.classList.remove('emoji-gray');
    });
  };
}
if(document.getElementById('todoOptionsBtn')){
  document.getElementById('todoOptionsBtn').onclick=()=>{
    const panel=document.getElementById('todoOptionsPanel');
    if(!panel) return;
    const isOpen=panel.style.display!=='none';
    panel.style.display=isOpen?'none':'block';
    if(!isOpen) setupInlineRepeat();
  };
}

// 인라인 반복 버튼: 날짜 입력 옆에 생성
function setupInlineRepeat(){
  const row=document.querySelector('.event-datetime-row');
  if(!row || document.getElementById('inlineRepeatBtn')) return;
  row.style.display='flex';
  row.style.flexWrap='wrap';
  row.style.gap='8px';
  row.querySelectorAll('.event-date-group').forEach(g=>{
    g.style.flex='1 1 140px';
    g.style.minWidth='140px';
    const inp=g.querySelector('input');
    if(inp) inp.style.width='100%';
  });
  const wrap=document.createElement('div');
  wrap.style.display='flex';
  wrap.style.alignItems='center';
  wrap.style.gap='6px';

  const btn=document.createElement('button');
  btn.id='inlineRepeatBtn';
  btn.type='button';
  Object.assign(btn.style,{
    padding:'6px 10px',
    border:'1px solid #e2e8f0',
    borderRadius:'10px',
    background:'#f8fafc',
    cursor:'pointer',
    minWidth:'80px'
  });

  const list=document.createElement('div');
  list.id='inlineRepeatList';
  Object.assign(list.style,{
    position:'absolute',
    zIndex:'9999',
    background:'#fff',
    border:'1px solid #e2e8f0',
    borderRadius:'10px',
    boxShadow:'0 10px 24px rgba(0,0,0,0.12)',
    padding:'6px',
    display:'none',
    minWidth:'120px'
  });

  const options=[
    {val:'none',label:'반복 안 함'},
    {val:'daily',label:'매일'},
    {val:'weekly',label:'매주'},
    {val:'monthly',label:'매월'},
    {val:'yearly',label:'매년'},
  ];

  options.forEach(opt=>{
    const oBtn=document.createElement('button');
    oBtn.type='button';
    oBtn.textContent=opt.label;
    Object.assign(oBtn.style,{
      display:'block',width:'100%',padding:'6px 8px',border:'1px solid #e2e8f0',borderRadius:'8px',background:'#f8fafc',margin:'3px 0',cursor:'pointer'
    });
    oBtn.onclick=(e)=>{
      e.stopPropagation();
      ST.eventRepeat=opt.val;
      updateRepeatButton();
      list.style.display='none';
    };
    list.appendChild(oBtn);
  });

  btn.onclick=(e)=>{
    e.stopPropagation();
    const rect=btn.getBoundingClientRect();
    list.style.left=`${rect.left + (window.scrollX||0)}px`;
    list.style.top=`${rect.bottom + 4 + (window.scrollY||0)}px`;
    list.style.display=list.style.display==='none'?'block':'none';
  };

  document.addEventListener('mousedown',(e)=>{
    const listEl=document.getElementById('inlineRepeatList');
    const btnEl=document.getElementById('inlineRepeatBtn');
    if(!listEl || !btnEl) return;
    if(listEl.style.display==='none') return;
    if(!listEl.contains(e.target) && !btnEl.contains(e.target)) listEl.style.display='none';
  });

  wrap.appendChild(btn);
  row.appendChild(wrap);
  document.body.appendChild(list);
  updateRepeatButton();
}

/* ── REMINDER ── */
const kReminder=()=>'memo2.reminders';
function renderReminders(){
  if(!$.reminderList) return;
  const list=get(kReminder(),[]);
  $.reminderList.innerHTML='';
  list.forEach((it,i)=> $.reminderList.appendChild(reminderItemEl(it,i,list)));
}
function reminderItemEl(item,idx,ref){
  const li=el('li','reminder-item');
  const chk=document.createElement('input'); chk.type='checkbox'; chk.checked=!!item.done;
  chk.className='reminder-check';
  
  const labelWrap=el('span','reminder-label-wrapper');
  if(item.emoji){ const emoji=el('span','reminder-emoji',item.emoji); labelWrap.appendChild(emoji); }
  const txt=el('span','reminder-text',item.text);
  labelWrap.appendChild(txt);
  
  const colorBtn=el('button','color-btn','🎨'); colorBtn.type='button';
  const del=el('button','del-btn','🗑'); del.type='button';

  const applyStyle=()=>{
    if(item.done){
      txt.style.color='#9aa5b1';
      labelWrap.style.backgroundColor='transparent';
      labelWrap.style.background='transparent';
      chk.classList.add('done');
    } else {
      txt.style.color=item.color==='rainbow'?'#fff':'#000';
      if(item.color==='rainbow'){
        labelWrap.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
        labelWrap.style.backgroundColor='transparent';
      } else {
        labelWrap.style.backgroundColor=item.color||'transparent';
        labelWrap.style.background='';
      }
      chk.classList.remove('done');
    }
    txt.classList.toggle('done',!!item.done);
  };
  applyStyle();

  chk.addEventListener('change',()=>{ item.done=chk.checked; set(kReminder(),ref); applyStyle(); postApp({type:'refresh'}); });
  
  txt.ondblclick=()=>{
    const inp=document.createElement('input'); inp.type='text'; inp.className='reminder-edit'; inp.value=item.text;
    inp.onblur=()=>{ item.text=inp.value.trim()||item.text; set(kReminder(),ref); renderReminders(); postApp({type:'refresh'}); };
    inp.onkeydown=(e)=>{ if(e.key==='Enter'){ inp.blur(); } if(e.key==='Escape'){ inp.value=item.text; inp.blur(); } };
    labelWrap.replaceChild(inp,txt); inp.focus(); inp.select();
  };
  
  colorBtn.onclick=()=> showPalette(colorBtn,(c)=>{ item.color=c; set(kReminder(),ref); applyStyle(); postApp({type:'refresh'}); });
  del.onclick=()=>{ ref.splice(idx,1); set(kReminder(),ref); renderReminders(); postApp({type:'refresh'}); };

  labelWrap.draggable=true;
  labelWrap.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',String(idx)); });
  li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); const to=idx; if(from===to)return; const [m]=ref.splice(from,1); ref.splice(to,0,m); set(kReminder(),ref); renderReminders(); postApp({type:'refresh'}); });

  li.append(chk,labelWrap,colorBtn,del);
  return li;
}

/* ── 오른쪽 메모 ── */
function renderMemos(){
  const dstr=$.memoDate.value||fmtLocalDate(ST.selected);
  const list=getMemosForDate(dstr);
  $.memoList.innerHTML='';
  list.forEach((it,i)=> $.memoList.appendChild(memoItemEl(it,i,list,dstr)));
}
function updateJayMemoById(id,patch){
  const list=getJayMemoList();
  const idx=list.findIndex(m=>m.id===id);
  if(idx<0) return;
  list[idx]={...list[idx],...patch};
  setJayMemoList(list);
}
function deleteJayMemoById(id){
  setJayMemoList(getJayMemoList().filter(m=>m.id!==id));
}
function showEventConfigModal(anchor){
  const doc=anchor?.ownerDocument||document;
  const win=doc.defaultView||window;
  if(openPop){ openPop.remove(); openPop=null; }
  const pop=doc.createElement('div');
  pop.className='event-config-pop';
  Object.assign(pop.style,{
    position:'absolute',
    zIndex:'9999',
    background:'#fff',
    border:'1px solid #e2e8f0',
    borderRadius:'12px',
    boxShadow:'0 10px 30px rgba(0,0,0,0.12)',
    padding:'12px',
    minWidth:'240px'
  });

  const title=el('div','event-config-title','일정 설정');

  const allDayRow=el('div','event-detail-row');
  const allDayIcon=el('span','row-icon','⏰');
  const allDayLabel=el('span','row-label','하루 종일');
  const allDayToggle=document.createElement('input');
  allDayToggle.type='checkbox';
  allDayToggle.className='toggle-switch';
  allDayToggle.checked=false;
  allDayRow.append(allDayIcon,allDayLabel,allDayToggle);

  const dateRow=el('div','event-detail-row');
  const dateIcon=el('span','row-icon','📅');
  const dateInputs=el('div','date-inputs');
  dateInputs.style.gap='6px';
  dateInputs.style.alignItems='center';
  const startInput=document.createElement('input'); startInput.type='date'; startInput.value=$.eventStartDate?.value||$.todoStartDate?.value||fmtLocalDate(ST.selected);
  const arrow=el('span','','→');
  const endInput=document.createElement('input'); endInput.type='date'; endInput.value=$.eventEndDate?.value||$.todoEndDate?.value||startInput.value;
  dateInputs.append(startInput,arrow,endInput);
  dateRow.append(dateIcon,dateInputs);

  const timeRow=el('div','event-detail-row');
  const timeIcon=el('span','row-icon','⏱️');
  const timeLabel=el('span','row-label','시간');
  const timeInput=document.createElement('input'); timeInput.type='time'; timeInput.value=$.eventTime?.value||''; timeInput.disabled=allDayToggle.checked;
  allDayToggle.onchange=()=>{ timeInput.disabled=allDayToggle.checked; if(allDayToggle.checked) timeInput.value=''; };
  timeRow.append(timeIcon,timeLabel,timeInput);

  const alarmRow=el('div','event-detail-row');
  const alarmIcon=el('span','row-icon','🔔');
  const alarmLabel=el('span','row-label','알림');
  const alarmToggle=document.createElement('input'); alarmToggle.type='checkbox'; alarmToggle.className='toggle-switch'; alarmToggle.checked=$.eventAlarm?.checked||false;
  alarmRow.append(alarmIcon,alarmLabel,alarmToggle);

  const repeatRow=el('div','event-detail-row');
  const repeatIcon=el('span','row-icon','🔄');
  const repeatLabel=el('span','row-label','반복');
  const repeatBtn=document.createElement('button');
  repeatBtn.type='button';
  repeatBtn.className='repeat-inline-btn';
  repeatBtn.style.padding='8px 12px';
  repeatBtn.style.border='1px solid #e2e8f0';
  repeatBtn.style.borderRadius='10px';
  repeatBtn.style.background='#f8fafc';
  repeatBtn.style.cursor='pointer';
  const repeatLabels={'none':'반복 안 함','daily':'매일','weekly':'매주','monthly':'매월','yearly':'매년'};
  const applyRepeatLabel=()=>{
    repeatBtn.textContent=repeatLabels[ST.eventRepeat]||'반복 안 함';
    const active=ST.eventRepeat && ST.eventRepeat!=='none';
    repeatBtn.style.background=active?'#e0ecff':'#f8fafc';
    repeatBtn.style.color=active?'#2563eb':'#334155';
  };
  applyRepeatLabel();
  repeatBtn.onclick=(e)=>{
    e.stopPropagation();
    showRepeatModal(ST.eventRepeat,(value)=>{
      ST.eventRepeat=value;
      applyRepeatLabel();
      updateRepeatButton();
    });
  };
  repeatRow.append(repeatIcon,repeatLabel,repeatBtn);

  const footer=el('div','repeat-modal-footer');
  const saveBtn=el('button','btn-confirm','저장');
  saveBtn.onclick=()=>{
    if($.eventStartDate) $.eventStartDate.value=startInput.value;
    if($.eventEndDate) $.eventEndDate.value=endInput.value;
    if($.todoStartDate) $.todoStartDate.value=startInput.value;
    if($.todoEndDate) $.todoEndDate.value=endInput.value;
    if($.eventTime){ $.eventTime.value=allDayToggle.checked?'':timeInput.value; $.eventTime.disabled=allDayToggle.checked; }
    if($.eventAlarm) $.eventAlarm.checked=alarmToggle.checked;
    updateRepeatButton();
    pop.remove();
    openPop=null;
  };
  footer.append(saveBtn);

  pop.append(title,allDayRow,dateRow,timeRow,alarmRow,repeatRow,footer);
  doc.body.appendChild(pop);
  openPop=pop;

  const rect=anchor?.getBoundingClientRect?.()||{left:0,bottom:0};
  let left=rect.left+(win.scrollX||0);
  let top=rect.bottom+4+(win.scrollY||0);
  pop.style.left=`${left}px`;
  pop.style.top=`${top}px`;
  pop.style.minWidth='240px';

  requestAnimationFrame(()=>{
    const popRect=pop.getBoundingClientRect();
    const vw=win.innerWidth; const vh=win.innerHeight;
    if(popRect.right>vw) left=Math.max(10,vw-popRect.width-10);
    if(popRect.bottom>vh) top=Math.max(10,vh-popRect.height-10);
    pop.style.left=`${left}px`;
    pop.style.top=`${top}px`;
  });

  const close=(e)=>{
    if(!pop.contains(e.target) && e.target!==anchor){ pop.remove(); openPop=null; doc.removeEventListener('mousedown',close); }
  };
  setTimeout(()=>doc.addEventListener('mousedown',close),10);
}

function memoItemEl(item,idx,ref,dstr){
  const li=el('li','memo-item');
  if(!item.hasOwnProperty('emoji')) item.emoji='';
  const text=el('span','memo-text',(item.emoji?item.emoji+' ':'')+(item.content??item.text??''));
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
    const save=el('button','btn','저장'), cancel=el('button','btn','취소');
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
$.memoAdd.onclick=()=>{
  const txt=$.memoInput.value.replace(/\s+$/,'');
  if(!txt) return;
  const dstr=$.memoDate.value||fmtLocalDate(ST.selected);
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
  $.memoInput.value='';
  renderMemos();
  renderMemoPageList?.();
  postApp({type:'refresh'});
};
$.memoInput.onkeydown=()=>{};

/* ── 공통 위젯 + 팝아웃 ── */
const TIME_STYLE_ID='time-style-shared';
const TIME_STYLE=`
        /* 타이머 */
        .timer__ring{position:relative;width:220px;height:220px;margin:4px auto 6px;display:flex;align-items:center;justify-content:center}
        .timer__display{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}
        .timer__eta{display:block;text-align:center;font-size:12px;color:#6b7280;background:#eef2ff;border-radius:999px;width:max-content;margin:0 auto 6px;padding:4px 10px}
        .timer__inputs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 auto 6px;max-width:220px}
        .timer__inputs input{width:100%;box-sizing:border-box;padding:6px 6px;font-size:14px}
        /* 알람 & 스탑워치 공통 */
        .time-card{width:100%;max-width:260px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px;box-sizing:border-box}
        .time-circle{position:relative;width:220px;height:220px;border:10px solid #e9ecf2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:4px auto 6px;box-sizing:border-box}
        .time-circle__label{font-size:26px;font-weight:800}
        .time-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;max-width:240px}
        .time-grid input,.time-grid select{width:100%;box-sizing:border-box;padding:6px;font-size:14px;text-align:center}
`;
/* about:blank 위젯 전용 — openWidgetPopup document.write에만 삽입 */
const WIDGET_TIMER_BTN_STYLE=`
        .timer__footer{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:220px;margin:0 auto 6px}
        .timer__footer .timer__controls{display:flex;justify-content:center;gap:12px;width:100%;margin:0}
        .timer-label-btn{
          display:inline-block;
          padding:5px 16px;
          background:#eef2ff;
          color:#5c8dff;
          border:1.5px solid #c7d7ff;
          border-radius:999px;
          font-size:13px;
          font-weight:600;
          cursor:pointer;
          font-family:inherit;
          transition:background 0.15s;
          margin-bottom:8px;
          max-width:100%;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .timer-label-btn:hover{background:#dce8ff}
        .timer-btn{
          width:44px;
          height:44px;
          border-radius:50%;
          border:none;
          background:#5c8dff;
          color:#fff;
          font-size:18px;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 2px 8px rgba(92,141,255,0.3);
          transition:background 0.2s;
        }
        .timer-btn:hover{background:#4a7be8}
        .timer-btn svg{display:block}
`;
const WIDGET_STOPWATCH_STYLE=`
        .stopwatch-card--popup{
          background:#ffffff;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-sizing:border-box;
          width:100%;
          min-height:100%;
          padding:32px;
        }
        .stopwatch-card--popup .stopwatch-time{
          font-size:64px;
          font-weight:800;
          color:#111827;
          letter-spacing:3px;
          margin-bottom:12px;
          line-height:1.1;
          font-variant-numeric:tabular-nums;
        }
        .stopwatch-card--popup .stopwatch-status{
          font-size:13px;
          color:#5c8dff;
          background:#eef2ff;
          border-radius:999px;
          padding:4px 14px;
          display:inline-block;
          margin-bottom:24px;
          font-weight:600;
        }
        .stopwatch-card--popup .stopwatch-actions{
          display:flex;
          flex-wrap:wrap;
          justify-content:center;
          align-items:center;
          gap:8px;
        }
        .stopwatch-card--popup .stopwatch-btn{
          border-radius:999px;
          padding:10px 24px;
          font-size:15px;
          font-weight:600;
          border:none;
          cursor:pointer;
          font-family:inherit;
          background:#5c8dff;
          color:#fff;
          transition:background 0.15s;
        }
        .stopwatch-card--popup .stopwatch-btn:hover{background:#4a7be8}
        .stopwatch-card--popup .stopwatch-btn--reset{
          background:#fff;
          color:#5c8dff;
          border:1.5px solid #5c8dff;
        }
        .stopwatch-card--popup .stopwatch-btn--reset:hover{background:#eef2ff}
`;
function ensureTimeStyles(win){
  try{
    if(win.document.getElementById(TIME_STYLE_ID)) return;
    const st=win.document.createElement('style'); st.id=TIME_STYLE_ID; st.textContent=TIME_STYLE;
    win.document.head.appendChild(st);
  }catch{}
}

function openWidgetPopup(title, bodyBuilder, opts){
  opts=opts||{};
  let openUrl='about:blank';
  if(opts.timerIndex!=null){
    const u=new URL(window.location.href);
    u.searchParams.set('index',String(opts.timerIndex));
    openUrl=u.href;
  }
  const win=window.open(openUrl,'_blank','width=420,height=420,resizable=yes');
  if(!win) return null;
  win.document.write(`<!doctype html><meta charset="utf-8"><title>${title}</title>
      <style id="${TIME_STYLE_ID}">
        html,body{margin:0;height:100%;overflow:hidden}
        body{background:#fff;font-family:"Noto Sans","Noto Sans KR",sans-serif}
        .wrap{padding:0;box-sizing:border-box;height:100%;width:100%;overflow:hidden;display:flex;align-items:stretch;justify-content:stretch}
        .wrap > *{flex:1;min-height:100%}
        .btn{padding:6px 10px;border:1px solid #e9ecf2;border-radius:10px;background:#f6f8ff;cursor:pointer}
        .color-btn,.del-btn{width:32px;height:28px;padding:0;border:1px solid #d9e0eb;border-radius:10px;background:#f7f9fc;display:inline-grid;place-items:center;cursor:pointer;font-size:15px;line-height:1;color:#475569}
        .color-btn:hover,.del-btn:hover{background:#eef2f8;border-color:#cdd5e2}
        .color-pop{position:absolute;z-index:9999;background:#fff;border:1px solid #e9ecf2;border-radius:10px;padding:8px;display:grid;grid-template-columns:repeat(10,16px);gap:6px;box-shadow:0 6px 18px rgba(17,24,39,.08)}
        .color-pop .sw{width:16px;height:16px;border-radius:4px;border:1px solid #d6dae3;cursor:pointer}
${TIME_STYLE}
${WIDGET_TIMER_BTN_STYLE}
${WIDGET_STOPWATCH_STYLE}
        /* ★ 미니 달력 */
        .mini-cal__head{display:flex;gap:8px;align-items:center;margin-bottom:6px;font-size:12px}
        .mini-cal__days{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px}
        .mini-cal__days span{font-size:11px;font-weight:600;color:#475569;text-align:center}
        .mini-cal__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:0;border:1px solid #e9ecf2;border-radius:12px;overflow:hidden;background:#fff;height:100%;min-height:0;grid-auto-rows:minmax(0,1fr)}
        .mini-day{position:relative;display:flex;flex-direction:column;gap:3px;padding:4px 2px 2px;border-right:1px solid #e9ecf2;border-bottom:1px solid #e9ecf2;background:#fff;min-height:0;box-sizing:border-box}
        .mini-day:nth-child(7n){border-right:none}
        .mini-day:nth-last-child(-n+7){border-bottom:none}
        .mini-day__num{font-size:11px;font-weight:700;color:#0f172a;margin-bottom:0}
        .mini-day--out .mini-day__num{color:#cbd5e1}
        .mini-day--sel{outline:2px solid #dbeafe}
        .mini-labels{display:flex;flex-direction:column;gap:2px;flex:1;overflow:hidden}
        .mini-label{display:flex;align-items:center;gap:3px;font-size:10px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#1f2937;padding:0;border-radius:0;background:transparent}
        .mini-label.done{color:#94a3b8;text-decoration:line-through;background:transparent}
        .mini-more{margin-left:auto;font-size:10px;color:#2563eb;font-weight:600}
      </style><div class="wrap"></div>`);
  const wrap=win.document.querySelector('.wrap');
  if(wrap) wrap.appendChild(bodyBuilder(true, win));
  win.document.close();
  return win;
}

let z=10;
let widgetSpawnIdx=0;
function makeWidget(title, bodyBuilder, rootClass){
  ensureTimeStyles(window);
  const w=el('section','widget'+(rootClass?` ${rootClass}`:'')); w.style.zIndex=++z; w.style.fontFamily='"Noto Sans KR","Noto Sans",sans-serif';
  const head=el('div','widget__head'); head.style.cursor='grab';
  const t=el('div','widget__title',title);
  const btns=el('div'); const pop=el('button','widget__btn widget-open-btn','위젯'); const x=el('button','widget__btn','✕');
  btns.append(pop,x); head.append(t,btns);
  const body=el('div','widget__body'); body.appendChild(bodyBuilder(false, window));

  let sx=0,sy=0,ox=0,oy=0,dragging=false;
  const onMove=(e)=>{ if(!dragging) return; w.style.left=`${ox+(e.clientX-sx)}px`; w.style.top=`${oy+(e.clientY-sy)}px`; };
  const onUp=()=>{ dragging=false; window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); head.style.cursor='grab'; };
  head.addEventListener('mousedown',(e)=>{ dragging=true; head.style.cursor='grabbing'; sx=e.clientX; sy=e.clientY; const r=w.getBoundingClientRect(); ox=r.left; oy=r.top; w.style.zIndex=++z; window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp); });

  x.onclick=()=>w.remove();

  // spawn offset so multiple widgets don't perfectly overlap
  const step=28;
  const guessW=380, guessH=240;
  const idx=widgetSpawnIdx++;
  const offset=idx*step;
  const baseL=260, baseT=140;
  const maxL=Math.max(16,(window.innerWidth||960)-guessW-24);
  const maxT=Math.max(16,(window.innerHeight||640)-guessH-24);
  w.style.left=`${Math.min(baseL+offset, maxL)}px`;
  w.style.top=`${Math.min(baseT+offset, maxT)}px`;

  pop.onclick=()=>{ openWidgetPopup(title, bodyBuilder); };

  w.append(head,body); $.host.appendChild(w); return w;
}

/* ── 스탑워치·타이머 localStorage 동기화 (브라우저↔위젯) ── */
const SW_LS_KEYS=['stopwatch_start_time','stopwatch_is_running','stopwatch_elapsed_ms'];
const TIMER_PRESETS=[
  {label:'15분',ms:15*60*1000},
  {label:'30분',ms:30*60*1000},
  {label:'1시간',ms:60*60*1000},
  {label:'1시간 30분',ms:90*60*1000},
  {label:'2시간',ms:120*60*1000},
  {label:'3시간',ms:180*60*1000},
];
const LEGACY_TM_LS_KEYS=['timer_start_time','timer_is_running','timer_remaining_ms'];

function timerLsKey(i,suffix){ return `timer_${i}_${suffix}`; }
function removeLegacyGlobalTimerKeys(){
  LEGACY_TM_LS_KEYS.forEach(k=>localStorage.removeItem(k));
}
function getPopupTimerIndex(targetWin,fallback){
  try{
    const q=new URLSearchParams(targetWin.location.search).get('index');
    if(q!=null&&q!==''){
      const n=parseInt(q,10);
      if(!isNaN(n)) return Math.max(0,Math.min(5,n));
    }
  }catch{}
  return fallback;
}
function ensureTimerPreset(i){
  const key=timerLsKey(i,'preset_ms');
  const def=TIMER_PRESETS[i]?.ms??TIMER_PRESETS[0].ms;
  if(localStorage.getItem(key)==null){
    localStorage.setItem(key,String(def));
  }
  return parseInt(localStorage.getItem(key),10)||def;
}
function msToHms(ms){
  const sec=Math.floor(ms/1000);
  return {h:Math.floor(sec/3600),m:Math.floor((sec%3600)/60),s:sec%60};
}
function formatTimerLabelFromMs(ms){
  const sec=Math.floor(ms/1000);
  const h=Math.floor(sec/3600);
  const m=Math.floor((sec%3600)/60);
  const s=sec%60;
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function getTimerButtonLabel(i){
  const custom=localStorage.getItem(timerLsKey(i,'label'));
  if(custom) return custom;
  const ms=ensureTimerPreset(i);
  const preset=TIMER_PRESETS[i];
  if(preset&&ms===preset.ms) return preset.label;
  return formatTimerLabelFromMs(ms);
}
let timerSettingActiveIndex=null;
let timerSettingOnSaved=null;

function closeTimerSettingModal(){
  const modal=document.getElementById('timerSettingModal');
  if(!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  timerSettingActiveIndex=null;
  timerSettingOnSaved=null;
}

function initTimerSettingModal(){
  const modal=document.getElementById('timerSettingModal');
  if(!modal||modal.dataset.bound==='true') return;
  modal.dataset.bound='true';
  const overlay=modal.querySelector('.timer-setting-modal__overlay');
  const closeBtn=document.getElementById('timerSettingModalClose');
  const cancelBtn=document.getElementById('timerSettingCancel');
  const saveBtn=document.getElementById('timerSettingSave');
  overlay?.addEventListener('click',closeTimerSettingModal);
  closeBtn?.addEventListener('click',closeTimerSettingModal);
  cancelBtn?.addEventListener('click',closeTimerSettingModal);
  saveBtn?.addEventListener('click',()=>{
    const i=timerSettingActiveIndex;
    if(i==null) return;
    const hh=+(document.getElementById('timerSettingH')?.value)||0;
    const mm=+(document.getElementById('timerSettingM')?.value)||0;
    const ss=+(document.getElementById('timerSettingS')?.value)||0;
    const ms=((hh*3600)+(mm*60)+ss)*1000;
    if(ms<=0){ alert('시간을 입력해 주세요.'); return; }
    const settingsKey=`memo2.timer.settings.multi.${i}`;
    localStorage.setItem(timerLsKey(i,'preset_ms'),String(ms));
    localStorage.setItem(settingsKey,JSON.stringify({h:hh,m:mm,s:ss}));
    const name=(document.getElementById('timerSettingLabel')?.value||'').trim();
    if(name) localStorage.setItem(timerLsKey(i,'label'),name);
    else localStorage.removeItem(timerLsKey(i,'label'));
    try{ window.dispatchEvent(new CustomEvent('jcal-timer-label',{detail:{index:i}})); }catch{}
    timerSettingOnSaved?.();
    closeTimerSettingModal();
  });
}

function openTimerSettingModal(timerIndex,onSaved,contextWin){
  if(contextWin?.opener?.openTimerSettingModal){
    contextWin.opener.openTimerSettingModal(timerIndex,onSaved);
    return;
  }
  initTimerSettingModal();
  const modal=document.getElementById('timerSettingModal');
  if(!modal) return;
  const presetMs=ensureTimerPreset(timerIndex);
  const hms=msToHms(presetMs);
  const labelInp=document.getElementById('timerSettingLabel');
  const hInp=document.getElementById('timerSettingH');
  const mInp=document.getElementById('timerSettingM');
  const sInp=document.getElementById('timerSettingS');
  if(labelInp) labelInp.value=localStorage.getItem(timerLsKey(timerIndex,'label'))||'';
  if(hInp) hInp.value=hms.h||'';
  if(mInp) mInp.value=hms.m||'';
  if(sInp) sInp.value=hms.s||'';
  timerSettingActiveIndex=timerIndex;
  timerSettingOnSaved=onSaved||null;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  labelInp?.focus();
}
window.openTimerSettingModal=openTimerSettingModal;
function isTimerLsKeyForIndex(key,i){
  return key===timerLsKey(i,'start_time')||key===timerLsKey(i,'is_running')||key===timerLsKey(i,'remaining_ms');
}

function readStopwatchMs(){
  const elapsed=parseInt(localStorage.getItem('stopwatch_elapsed_ms')||'0',10)||0;
  const running=localStorage.getItem('stopwatch_is_running')==='true';
  const start=parseInt(localStorage.getItem('stopwatch_start_time')||'0',10)||0;
  if(running&&start) return elapsed+(Date.now()-start);
  return elapsed;
}
function persistStopwatch(running,elapsedMs,startTime){
  if(running){
    localStorage.setItem('stopwatch_is_running','true');
    localStorage.setItem('stopwatch_elapsed_ms',String(elapsedMs));
    localStorage.setItem('stopwatch_start_time',String(startTime||Date.now()));
  }else{
    localStorage.setItem('stopwatch_is_running','false');
    localStorage.setItem('stopwatch_elapsed_ms',String(elapsedMs));
    localStorage.removeItem('stopwatch_start_time');
  }
  try{ window.dispatchEvent(new Event('jcal-stopwatch-sync')); }catch{}
}
function clearStopwatchStorage(){
  SW_LS_KEYS.forEach(k=>localStorage.removeItem(k));
  try{ window.dispatchEvent(new Event('jcal-stopwatch-sync')); }catch{}
}

function readTimerRemainingMs(i){
  let remaining=parseInt(localStorage.getItem(timerLsKey(i,'remaining_ms'))||'0',10)||0;
  const running=localStorage.getItem(timerLsKey(i,'is_running'))==='true';
  const start=parseInt(localStorage.getItem(timerLsKey(i,'start_time'))||'0',10)||0;
  if(running&&start) remaining=Math.max(0,remaining-(Date.now()-start));
  return {running,remaining};
}
function persistTimer(i,running,remainingMs,startTime){
  if(running){
    localStorage.setItem(timerLsKey(i,'is_running'),'true');
    localStorage.setItem(timerLsKey(i,'remaining_ms'),String(remainingMs));
    localStorage.setItem(timerLsKey(i,'start_time'),String(startTime||Date.now()));
  }else{
    localStorage.setItem(timerLsKey(i,'is_running'),'false');
    localStorage.setItem(timerLsKey(i,'remaining_ms'),String(remainingMs));
    localStorage.removeItem(timerLsKey(i,'start_time'));
  }
  try{ window.dispatchEvent(new CustomEvent('jcal-timer-sync',{detail:{index:i}})); }catch{}
}
function clearTimerStorage(i){
  localStorage.removeItem(timerLsKey(i,'start_time'));
  localStorage.removeItem(timerLsKey(i,'is_running'));
  localStorage.removeItem(timerLsKey(i,'remaining_ms'));
  try{ window.dispatchEvent(new CustomEvent('jcal-timer-sync',{detail:{index:i}})); }catch{}
}
function restoreTimerFromLs(i,applyFn){
  if(localStorage.getItem(timerLsKey(i,'is_running'))==null) return;
  const tr=readTimerRemainingMs(i);
  const preset=ensureTimerPreset(i);
  if(tr.running&&tr.remaining>0){
    applyFn({type:'start',totalMs:Math.max(tr.remaining,preset),endEpoch:Date.now()+tr.remaining},true);
  }else if(!tr.running){
    applyFn({type:'pause',remainMs:tr.remaining},true);
  }
}

/* ── 전역 타이머(동기화/복원) ── */
function getGlobalTimerId(){
  let id=localStorage.getItem('memo2.timer.globalId');
  if(!id){ id='global-timer-1'; localStorage.setItem('memo2.timer.globalId', id); }
  return id;
}
function widgetTimer(){
  const groupId=getGlobalTimerId();
  const key=`memo2.timer.${groupId}`;
  const stateKey=`memo2.timer.state.${groupId}`;
  const timerIndex=0;

  function build(isPopup, targetWin){
    const selfId=Math.random().toString(36).slice(2);
    const bc=('BroadcastChannel' in targetWin)? new targetWin.BroadcastChannel(key): null;
    const send=(msg)=>{ if(bc) bc.postMessage({src:selfId,...msg}); localStorage.setItem(key,JSON.stringify({src:selfId,...msg,ts:Date.now()})); };
    const saveState=(snap)=> localStorage.setItem(stateKey, JSON.stringify(snap));

    const wrap=el('div');
    wrap.style.display='flex';
    wrap.style.flexDirection='column';
    wrap.style.alignItems='center';
    wrap.style.gap='6px';
    wrap.style.padding='6px';

    const size=220, sw=10, r=(size-sw)/2, C=2*Math.PI*r, NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg'); svg.setAttribute('width',size); svg.setAttribute('height',size);
    const bg=document.createElementNS(NS,'circle'); bg.setAttribute('cx',size/2); bg.setAttribute('cy',size/2); bg.setAttribute('r',r);
    bg.setAttribute('fill','none'); bg.setAttribute('stroke','#e9ecf2'); bg.setAttribute('stroke-width',sw);
    const fg=document.createElementNS(NS,'circle'); fg.setAttribute('cx',size/2); fg.setAttribute('cy',size/2); fg.setAttribute('r',r);
    fg.setAttribute('fill','none'); fg.setAttribute('stroke','#5c8dff'); fg.setAttribute('stroke-width',sw); fg.setAttribute('stroke-linecap','round');
    fg.setAttribute('transform',`rotate(-90 ${size/2} ${size/2})`);
    fg.setAttribute('stroke-dasharray',String(C)); fg.setAttribute('stroke-dashoffset',String(C));
    const disp=el('div','timer__display','00:00:00');
    const ring=el('div','timer__ring'); ring.append(svg,disp); svg.append(bg,fg);
    const eta=el('div','timer__eta','—');

    // 버튼 컨테이너 (원형 아이콘 버튼)
    const row=el('div');
    row.style.display='flex';
    row.style.justifyContent='center';
    row.style.gap='12px';
    row.style.width='100%';
    row.style.margin='8px auto 0';
    
    // 시작 버튼 (재생 아이콘)
    const bStart=document.createElement('button');
    bStart.className='timer-btn timer-btn-start';
    bStart.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
    
    // 일시정지 버튼 (일시정지 아이콘)
    const bPause=document.createElement('button');
    bPause.className='timer-btn timer-btn-pause';
    bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
    
    // 리셋 버튼 (리셋 아이콘)
    const bReset=document.createElement('button');
    bReset.className='timer-btn timer-btn-reset';
    bReset.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/></svg>`;
    
    row.append(bStart,bPause,bReset);

    let totalMs=0,endPerf=0,raf=null,paused=false,remainMs=0;
    const fmt=(ms)=>{const s=Math.max(0,Math.ceil(ms/1000));const hh=String(Math.floor(s/3600)).padStart(2,'0');const mm=String(Math.floor((s%3600)/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');return `${hh}:${mm}:${ss}`;}
    const draw=(left)=>{ const p=totalMs>0?Math.min(1,Math.max(0,1-left/totalMs)):0; fg.setAttribute('stroke-dashoffset',String(C*(1-p))); disp.textContent=fmt(left); }
    const tick=()=>{ const left=Math.max(0,endPerf-performance.now()); draw(left); if(left<=0){ cancelAnimationFrame(raf); raf=null; alert('타이머 종료'); send({type:'reset'}); saveState({status:'idle'}); return; } raf=requestAnimationFrame(tick); }

    function apply(msg,remote=false){
      if(msg.type==='start'){
        totalMs=msg.totalMs; const dur=Math.max(0,msg.endEpoch-Date.now()); endPerf=performance.now()+dur; paused=false; remainMs=0;
        eta.textContent=`종료 ${fmtAmPm(new Date(msg.endEpoch))}`; bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
        if(raf) cancelAnimationFrame(raf); draw(dur); raf=requestAnimationFrame(tick);
        if(!remote) send({type:'start',totalMs,endEpoch:msg.endEpoch});
        saveState({status:'running',totalMs,endEpoch:msg.endEpoch});
        persistTimer(timerIndex,true,dur,Date.now());
      }else if(msg.type==='pause'){
        if(raf){ cancelAnimationFrame(raf); raf=null; } paused=true; remainMs=msg.remainMs; eta.textContent='—'; bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`; draw(remainMs);
        if(!remote) send({type:'pause',remainMs});
        saveState({status:'paused',totalMs,remainMs});
        persistTimer(timerIndex,false,remainMs);
      }else if(msg.type==='resume'){
        paused=false; endPerf=performance.now()+msg.remainMs; eta.textContent=`종료 ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
        if(raf) cancelAnimationFrame(raf); raf=requestAnimationFrame(tick);
        if(!remote) send({type:'resume',remainMs:msg.remainMs});
        saveState({status:'running',totalMs,endEpoch:Date.now()+msg.remainMs});
        persistTimer(timerIndex,true,msg.remainMs,Date.now());
      }else if(msg.type==='reset'){
        if(raf) cancelAnimationFrame(raf); raf=null; paused=false; totalMs=0; endPerf=0; remainMs=0;
        fg.setAttribute('stroke-dashoffset',String(C)); disp.textContent='00:00:00'; eta.textContent='—'; bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
        if(!remote) send({type:'reset'});
        saveState({status:'idle'});
        clearTimerStorage(timerIndex);
      }
    }

    bStart.onclick=()=>{ 
      // 입력 필드가 없으므로 프리셋(타이머 1) 기본값
      if(totalMs<=0) totalMs=ensureTimerPreset(timerIndex);
      const duration=remainMs>0?remainMs:totalMs; 
      apply({type:'start',totalMs,endEpoch:Date.now()+duration},false); 
    };
    bPause.onclick=()=>{ if(raf){const left=Math.max(0,endPerf-performance.now()); apply({type:'pause',remainMs:left},false);} else if(paused&&remainMs>0){apply({type:'resume',remainMs},false);} };
    bReset.onclick=()=> apply({type:'reset'},false);

    if(bc) bc.onmessage=(e)=>{ if(e.data?.src===selfId) return; apply(e.data,true); };
    targetWin.addEventListener('storage',(e)=>{ if(e.key!==key||!e.newValue) return; const msg=JSON.parse(e.newValue); if(msg.src===selfId) return; apply(msg,true); });
    const onTimerLsSync=(e)=>{ if(e?.detail?.index!=null&&e.detail.index!==timerIndex) return; if(raf) return; restoreTimerFromLs(timerIndex,apply); };
    targetWin.addEventListener('jcal-timer-sync',onTimerLsSync);
    targetWin.addEventListener('storage',(e)=>{ if(isTimerLsKeyForIndex(e.key,timerIndex)) onTimerLsSync(); });

    // 복원
    try{
      const snap=JSON.parse(localStorage.getItem(stateKey)||'null');
      if(snap){
        if(snap.status==='running'&&snap.endEpoch){ apply({type:'start',totalMs:snap.totalMs||0,endEpoch:snap.endEpoch},true); }
        else if(snap.status==='paused'&&typeof snap.remainMs==='number'){ totalMs=snap.totalMs||0; apply({type:'pause',remainMs:snap.remainMs},true); }
      } else restoreTimerFromLs(timerIndex,apply);
    }catch{ restoreTimerFromLs(timerIndex,apply); }

    wrap.append(ring,eta,row);
    return wrap;
  }
  return makeWidget('타이머', build, 'widget--timer');
}

/* ── 타이머 / 스탑워치 원형 크기 ── */
function getCircleSize(desktopSize=180){
  if(!isMobileViewport()) return desktopSize;
  return Math.min(Math.floor(window.innerWidth*0.6),160);
}
function buildProgressRing(doc,size,displayClass){
  const sw=10;
  let ringSize=size;
  let r=(ringSize-sw)/2;
  let C=2*Math.PI*r;
  const NS='http://www.w3.org/2000/svg';
  const svg=doc.createElementNS(NS,'svg');
  const bg=doc.createElementNS(NS,'circle');
  const fg=doc.createElementNS(NS,'circle');
  const disp=doc.createElement('div');
  disp.className=displayClass||'timer__display';
  const ring=doc.createElement('div');
  ring.className='timer__ring stopwatch__ring';

  const paint=()=>{
    svg.setAttribute('width',String(ringSize));
    svg.setAttribute('height',String(ringSize));
    svg.style.display='block';
    svg.style.margin='0 auto';
    [bg,fg].forEach(c=>{
      c.setAttribute('cx',String(ringSize/2));
      c.setAttribute('cy',String(ringSize/2));
      c.setAttribute('r',String(r));
      c.setAttribute('fill','none');
      c.setAttribute('stroke-width',String(sw));
    });
    bg.setAttribute('stroke','#e9ecf2');
    fg.setAttribute('stroke','#5c8dff');
    fg.setAttribute('stroke-linecap','round');
    fg.setAttribute('transform',`rotate(-90 ${ringSize/2} ${ringSize/2})`);
    fg.setAttribute('stroke-dasharray',String(C));
  };

  paint();
  ring.style.width=`${ringSize}px`;
  ring.style.height=`${ringSize}px`;
  ring.style.margin='0 auto';
  ring.style.display='block';
  ring.style.overflow='hidden';
  ring.append(svg,disp);
  svg.append(bg,fg);

  const resize=(newSize)=>{
    ringSize=newSize;
    r=(ringSize-sw)/2;
    C=2*Math.PI*r;
    paint();
    ring.style.width=`${ringSize}px`;
    ring.style.height=`${ringSize}px`;
    return C;
  };

  const setProgress=(ratio)=>{
    const p=Math.min(1,Math.max(0,ratio));
    fg.setAttribute('stroke-dashoffset',String(C*(1-p)));
  };

  return {ring,svg,bg,fg,disp,get C(){return C;},resize,setProgress};
}

/* ── 타이머 페이지 (6개 타이머) ── */
function initTimersPage(){
  const grid=document.getElementById('timerGrid');
  if(!grid) return;
  
  // 이미 초기화되었으면 리턴
  if(grid.dataset.initialized==='true') return;
  grid.dataset.initialized='true';
  
  removeLegacyGlobalTimerKeys();
  for(let i=0; i<6; i++){
    ensureTimerPreset(i);
    const box=createTimerBox(i);
    grid.appendChild(box);
  }
  if(!window._jcalTimerResizeBound){
    window._jcalTimerResizeBound=true;
    window.addEventListener('resize',()=>{
      document.querySelectorAll('.timer-box[data-timer-index]').forEach(box=>{
        if(typeof box._resizeTimerRing==='function') box._resizeTimerRing();
      });
    });
  }
}

function createTimerBox(timerIndex){
  const key=`memo2.timer.multi.${timerIndex}`;
  const stateKey=`memo2.timer.state.multi.${timerIndex}`;
  const settingsKey=`memo2.timer.settings.multi.${timerIndex}`;
  const displayNum=timerIndex+1;
  
  ensureTimerPreset(timerIndex);
  
  const box=el('div','timer-box');
  box.dataset.timerIndex=String(timerIndex);
  box.style.overflow='hidden';
  box.style.width='100%';
  box.style.boxSizing='border-box';
  
  // 헤더 (화살표, X 버튼)
  const header=el('div','timer-box__header');
  const popoutBtn=el('button','timer-box__btn widget-open-btn','위젯');
  popoutBtn.title='위젯으로 열기';
  popoutBtn.onclick=()=> openTimerWidgetPopup(timerIndex);
  header.appendChild(popoutBtn);
  
  const ringParts=buildProgressRing(document,getCircleSize(),'timer__display');
  const {ring,disp,fg,setProgress}=ringParts;
  let C=ringParts.C;
  disp.textContent='00:00:00';
  setProgress(0);
  
  const eta=el('div','timer__eta','—');
  
  const footer=el('div','timer__footer');
  const labelBtn=document.createElement('button');
  labelBtn.type='button';
  labelBtn.className='timer-label-btn';
  const refreshLabelBtn=()=>{ labelBtn.textContent=getTimerButtonLabel(timerIndex); };
  refreshLabelBtn();
  labelBtn.onclick=()=>openTimerSettingModal(timerIndex,()=>{
    refreshLabelBtn();
    if(!raf&&!paused){
      totalMs=ensureTimerPreset(timerIndex);
      draw(totalMs);
    }
  });
  
  const controls=el('div','timer__controls');
  const bStart=document.createElement('button');
  bStart.className='timer-btn timer-btn-start';
  bStart.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
  const bReset=document.createElement('button');
  bReset.className='timer-btn timer-btn-reset';
  bReset.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/></svg>`;
  controls.append(bStart,bReset);
  footer.append(labelBtn,controls);
  
  box.append(header,ring,eta,footer);
  
  window.addEventListener('jcal-timer-label',(e)=>{
    if(e?.detail?.index===timerIndex) refreshLabelBtn();
  });
  
  // 타이머 로직
  let totalMs=0,endPerf=0,raf=null,paused=false,remainMs=0;
  const selfId=Math.random().toString(36).slice(2);
  box._resizeTimerRing=()=>{
    C=ringParts.resize(getCircleSize());
    const left=paused?remainMs:Math.max(0,endPerf-performance.now());
    if(totalMs>0) setProgress(Math.min(1,Math.max(0,1-left/totalMs)));
    else setProgress(0);
  };
  
  const fmt=(ms)=>{
    const s=Math.max(0,Math.ceil(ms/1000));
    const hh=String(Math.floor(s/3600)).padStart(2,'0');
    const mm=String(Math.floor((s%3600)/60)).padStart(2,'0');
    const ss=String(s%60).padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  };
  
  const fmtAmPm=(d)=>{
    const h=d.getHours(),m=d.getMinutes();
    const ampm=h>=12?'오후':'오전';
    const hh=h%12||12;
    return `${ampm} ${hh}:${String(m).padStart(2,'0')}`;
  };
  
  const draw=(left)=>{ 
    const p=totalMs>0?Math.min(1,Math.max(0,1-left/totalMs)):0; 
    setProgress(p);
    disp.textContent=fmt(left); 
  };
  
  const tick=()=>{ 
    const left=Math.max(0,endPerf-performance.now()); 
    draw(left); 
    if(left<=0){ 
      cancelAnimationFrame(raf); 
      raf=null; 
      alert(`타이머 ${displayNum} 종료`); 
      apply({type:'reset'}); 
      return; 
    } 
    raf=requestAnimationFrame(tick); 
  };
  
  const saveState=(snap)=> localStorage.setItem(stateKey, JSON.stringify(snap));
  const bc=('BroadcastChannel' in window)? new BroadcastChannel(key): null;
  const send=(msg)=>{ 
    if(bc) bc.postMessage({src:selfId,...msg}); 
    localStorage.setItem(key,JSON.stringify({src:selfId,...msg,ts:Date.now()})); 
  };
  
  const setStartIcon=(playing)=>{
    bStart.innerHTML=playing
      ? `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
  };

  function apply(msg,remote=false){
    if(msg.type==='start'){
      totalMs=msg.totalMs; 
      const dur=Math.max(0,msg.endEpoch-Date.now()); 
      endPerf=performance.now()+dur; 
      paused=false; 
      remainMs=0;
      eta.textContent=`종료 ${fmtAmPm(new Date(msg.endEpoch))}`; 
      setStartIcon(true);
      if(raf) cancelAnimationFrame(raf); 
      draw(dur); 
      raf=requestAnimationFrame(tick);
      if(!remote) send({type:'start',totalMs,endEpoch:msg.endEpoch});
      saveState({status:'running',totalMs,endEpoch:msg.endEpoch});
      persistTimer(timerIndex,true,dur,Date.now());
    }else if(msg.type==='pause'){
      if(raf){ cancelAnimationFrame(raf); raf=null; } 
      paused=true; 
      remainMs=msg.remainMs; 
      eta.textContent='—'; 
      setStartIcon(false);
      draw(remainMs);
      if(!remote) send({type:'pause',remainMs});
      saveState({status:'paused',totalMs,remainMs});
      persistTimer(timerIndex,false,remainMs);
    }else if(msg.type==='resume'){
      paused=false; 
      endPerf=performance.now()+msg.remainMs; 
      eta.textContent=`종료 ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; 
      setStartIcon(true);
      if(raf) cancelAnimationFrame(raf); 
      raf=requestAnimationFrame(tick);
      if(!remote) send({type:'resume',remainMs:msg.remainMs});
      saveState({status:'running',totalMs,endEpoch:Date.now()+msg.remainMs});
      persistTimer(timerIndex,true,msg.remainMs,Date.now());
    }else if(msg.type==='reset'){
      if(raf) cancelAnimationFrame(raf); 
      raf=null; 
      paused=false; 
      totalMs=0; 
      endPerf=0; 
      remainMs=0;
      setProgress(0);
      disp.textContent='00:00:00'; 
      eta.textContent='—'; 
      setStartIcon(false);
      if(!remote) send({type:'reset'});
      saveState({status:'idle'});
      clearTimerStorage(timerIndex);
    }
  }
  
  bStart.onclick=()=>{ 
    if(raf){
      const left=Math.max(0,endPerf-performance.now());
      apply({type:'pause',remainMs:left});
      setStartIcon(false);
      return;
    }
    if(paused&&remainMs>0){
      apply({type:'resume',remainMs});
      setStartIcon(true);
      return;
    }
    totalMs=ensureTimerPreset(timerIndex);
    const duration=remainMs>0?remainMs:totalMs;
    apply({type:'start',totalMs,endEpoch:Date.now()+duration});
    setStartIcon(true);
  };
  bReset.onclick=()=>{ apply({type:'reset'}); setStartIcon(false); };
  
  if(bc) bc.onmessage=(e)=>{ 
    if(e.data?.src===selfId) return; 
    apply(e.data,true); 
  };
  
  window.addEventListener('storage',(e)=>{ 
    if(e.key!==key||!e.newValue) return; 
    const msg=JSON.parse(e.newValue); 
    if(msg.src===selfId) return; 
    apply(msg,true); 
  });
  const onTimerLsSync=(e)=>{ if(e?.detail?.index!=null&&e.detail.index!==timerIndex) return; if(raf) return; restoreTimerFromLs(timerIndex,apply); };
  window.addEventListener('jcal-timer-sync',onTimerLsSync);
  window.addEventListener('storage',(e)=>{ if(isTimerLsKeyForIndex(e.key,timerIndex)) onTimerLsSync(); });
  
  // 복원
  try{
    const snap=JSON.parse(localStorage.getItem(stateKey)||'null');
    if(snap){
      if(snap.status==='running'&&snap.endEpoch){ 
        apply({type:'start',totalMs:snap.totalMs||0,endEpoch:snap.endEpoch},true); 
      }
      else if(snap.status==='paused'&&typeof snap.remainMs==='number'){ 
        totalMs=snap.totalMs||0; 
        apply({type:'pause',remainMs:snap.remainMs},true); 
      }
    } else restoreTimerFromLs(timerIndex,apply);
  }catch{ restoreTimerFromLs(timerIndex,apply); }

  const presetMs=ensureTimerPreset(timerIndex);
  if(!raf&&!paused){
    totalMs=presetMs;
    draw(presetMs);
  }
  
  return box;
}

function openTimerWidgetPopup(timerIndex){
  const key=`memo2.timer.multi.${timerIndex}`;
  const stateKey=`memo2.timer.state.multi.${timerIndex}`;
  const settingsKey=`memo2.timer.settings.multi.${timerIndex}`;
  const displayNum=timerIndex+1;
  
  function build(isPopup, targetWin){
    const idx=getPopupTimerIndex(targetWin,timerIndex);
    const key=`memo2.timer.multi.${idx}`;
    const stateKey=`memo2.timer.state.multi.${idx}`;
    const settingsKey=`memo2.timer.settings.multi.${idx}`;
    ensureTimerPreset(idx);
    
    const selfId=Math.random().toString(36).slice(2);
    const bc=('BroadcastChannel' in targetWin)? new targetWin.BroadcastChannel(key): null;
    const send=(msg)=>{ 
      if(bc) bc.postMessage({src:selfId,...msg}); 
      localStorage.setItem(key,JSON.stringify({src:selfId,...msg,ts:Date.now()})); 
    };
    const saveState=(snap)=> localStorage.setItem(stateKey, JSON.stringify(snap));

    const wrap=el('div');
    wrap.style.display='flex';
    wrap.style.flexDirection='column';
    wrap.style.alignItems='center';
    wrap.style.gap='6px';
    wrap.style.padding='6px';

    const size=220, sw=10, r=(size-sw)/2, C=2*Math.PI*r, NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg'); 
    svg.setAttribute('width',size); 
    svg.setAttribute('height',size);
    const bg=document.createElementNS(NS,'circle'); 
    bg.setAttribute('cx',size/2); 
    bg.setAttribute('cy',size/2); 
    bg.setAttribute('r',r);
    bg.setAttribute('fill','none'); 
    bg.setAttribute('stroke','#e9ecf2'); 
    bg.setAttribute('stroke-width',sw);
    const fg=document.createElementNS(NS,'circle'); 
    fg.setAttribute('cx',size/2); 
    fg.setAttribute('cy',size/2); 
    fg.setAttribute('r',r);
    fg.setAttribute('fill','none'); 
    fg.setAttribute('stroke','#5c8dff'); 
    fg.setAttribute('stroke-width',sw); 
    fg.setAttribute('stroke-linecap','round');
    fg.setAttribute('transform',`rotate(-90 ${size/2} ${size/2})`);
    fg.setAttribute('stroke-dasharray',String(C)); 
    fg.setAttribute('stroke-dashoffset',String(C));
    const disp=el('div','timer__display','00:00:00');
    const ring=el('div','timer__ring'); 
    ring.append(svg,disp); 
    svg.append(bg,fg);
    const eta=el('div','timer__eta','—');

    const footer=el('div','timer__footer');
    const labelBtn=document.createElement('button');
    labelBtn.type='button';
    labelBtn.className='timer-label-btn';
    const refreshLabelBtn=()=>{ labelBtn.textContent=getTimerButtonLabel(idx); };
    refreshLabelBtn();
    labelBtn.onclick=()=>openTimerSettingModal(idx,()=>{
      refreshLabelBtn();
      if(!raf&&!paused){
        totalMs=ensureTimerPreset(idx);
        draw(totalMs);
      }
    },targetWin);
    const row=el('div','timer__controls');
    const bStart=document.createElement('button');
    bStart.className='timer-btn timer-btn-start';
    bStart.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
    const bReset=document.createElement('button');
    bReset.className='timer-btn timer-btn-reset';
    bReset.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/></svg>`;
    row.append(bStart,bReset);
    footer.append(labelBtn,row);
    targetWin.addEventListener('jcal-timer-label',(e)=>{
      if(e?.detail?.index===idx) refreshLabelBtn();
    });

    let totalMs=0,endPerf=0,raf=null,paused=false,remainMs=0;
    const fmt=(ms)=>{
      const s=Math.max(0,Math.ceil(ms/1000));
      const hh=String(Math.floor(s/3600)).padStart(2,'0');
      const mm=String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss=String(s%60).padStart(2,'0');
      return `${hh}:${mm}:${ss}`;
    };
    const draw=(left)=>{ 
      const p=totalMs>0?Math.min(1,Math.max(0,1-left/totalMs)):0; 
      fg.setAttribute('stroke-dashoffset',String(C*(1-p))); 
      disp.textContent=fmt(left); 
    };
    const tick=()=>{ 
      const left=Math.max(0,endPerf-performance.now()); 
      draw(left); 
      if(left<=0){ 
        cancelAnimationFrame(raf); 
        raf=null; 
        alert(`타이머 ${idx+1} 종료`); 
        send({type:'reset'}); 
        saveState({status:'idle'}); 
        clearTimerStorage(idx);
        return; 
      } 
      raf=requestAnimationFrame(tick); 
    };

    const setStartIcon=(playing)=>{
      bStart.innerHTML=playing
        ? `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`
        : `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
    };

    function apply(msg,remote=false){
      if(msg.type==='start'){
        totalMs=msg.totalMs; 
        const dur=Math.max(0,msg.endEpoch-Date.now()); 
        endPerf=performance.now()+dur; 
        paused=false; 
        remainMs=0;
        eta.textContent=`종료 ${fmtAmPm(new Date(msg.endEpoch))}`; 
        setStartIcon(true);
        if(raf) cancelAnimationFrame(raf); 
        draw(dur); 
        raf=requestAnimationFrame(tick);
        if(!remote) send({type:'start',totalMs,endEpoch:msg.endEpoch});
        saveState({status:'running',totalMs,endEpoch:msg.endEpoch});
        persistTimer(idx,true,dur,Date.now());
      }else if(msg.type==='pause'){
        if(raf){ cancelAnimationFrame(raf); raf=null; } 
        paused=true; 
        remainMs=msg.remainMs; 
        eta.textContent='—'; 
        setStartIcon(false);
        draw(remainMs);
        if(!remote) send({type:'pause',remainMs});
        saveState({status:'paused',totalMs,remainMs});
        persistTimer(idx,false,remainMs);
      }else if(msg.type==='resume'){
        paused=false; 
        endPerf=performance.now()+msg.remainMs; 
        eta.textContent=`종료 ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; 
        setStartIcon(true);
        if(raf) cancelAnimationFrame(raf); 
        raf=requestAnimationFrame(tick);
        if(!remote) send({type:'resume',remainMs:msg.remainMs});
        saveState({status:'running',totalMs,endEpoch:Date.now()+msg.remainMs});
        persistTimer(idx,true,msg.remainMs,Date.now());
      }else if(msg.type==='reset'){
        if(raf) cancelAnimationFrame(raf); 
        raf=null; 
        paused=false; 
        totalMs=0; 
        endPerf=0; 
        remainMs=0;
        fg.setAttribute('stroke-dashoffset',String(C)); 
        disp.textContent='00:00:00'; 
        eta.textContent='—'; 
        setStartIcon(false);
        if(!remote) send({type:'reset'});
        saveState({status:'idle'});
        clearTimerStorage(idx);
      }
    }

    bStart.onclick=()=>{ 
      if(raf){
        const left=Math.max(0,endPerf-performance.now());
        apply({type:'pause',remainMs:left});
        return;
      }
      if(paused&&remainMs>0){
        apply({type:'resume',remainMs});
        return;
      }
      totalMs=ensureTimerPreset(idx);
      const duration=remainMs>0?remainMs:totalMs;
      apply({type:'start',totalMs,endEpoch:Date.now()+duration});
    };
    
    bReset.onclick=()=> apply({type:'reset'});
    
    if(bc) bc.onmessage=(e)=>{ 
      if(e.data?.src===selfId) return; 
      apply(e.data,true); 
    };
    targetWin.addEventListener('storage',(e)=>{ 
      if(e.key!==key||!e.newValue) return; 
      const msg=JSON.parse(e.newValue); 
      if(msg.src===selfId) return; 
      apply(msg,true); 
    });
    const onTimerLsSync=(e)=>{ if(e?.detail?.index!=null&&e.detail.index!==idx) return; if(raf) return; restoreTimerFromLs(idx,apply); };
    targetWin.addEventListener('jcal-timer-sync',onTimerLsSync);
    targetWin.addEventListener('storage',(e)=>{ if(isTimerLsKeyForIndex(e.key,idx)) onTimerLsSync(); });

    // 복원
    try{
      const snap=JSON.parse(localStorage.getItem(stateKey)||'null');
      if(snap){
        if(snap.status==='running'&&snap.endEpoch){ 
          apply({type:'start',totalMs:snap.totalMs||0,endEpoch:snap.endEpoch},true); 
        }
        else if(snap.status==='paused'&&typeof snap.remainMs==='number'){ 
          totalMs=snap.totalMs||0; 
          apply({type:'pause',remainMs:snap.remainMs},true); 
        }
      } else restoreTimerFromLs(idx,apply);
    }catch{ restoreTimerFromLs(idx,apply); }

    const presetMs=ensureTimerPreset(idx);
    if(!raf&&!paused){
      totalMs=presetMs;
      draw(presetMs);
    }

    wrap.append(ring,eta,footer);
    return wrap;
  }
  
  openWidgetPopup(`타이머 ${displayNum}`, build, {timerIndex});
}

function openTimerWidget(index){
  const key=`memo2.timer.multi.${index}`;
  const stateKey=`memo2.timer.state.multi.${index}`;
  const settingsKey=`memo2.timer.settings.multi.${index}`;
  
  function build(isPopup, targetWin){
    // 저장된 설정값 불러오기
    let savedSettings={h:0,m:0,s:0};
    try{
      const saved=localStorage.getItem(settingsKey);
      if(saved) savedSettings=JSON.parse(saved);
    }catch{}
    
    const selfId=Math.random().toString(36).slice(2);
    const bc=('BroadcastChannel' in targetWin)? new targetWin.BroadcastChannel(key): null;
    const send=(msg)=>{ 
      if(bc) bc.postMessage({src:selfId,...msg}); 
      localStorage.setItem(key,JSON.stringify({src:selfId,...msg,ts:Date.now()})); 
    };
    const saveState=(snap)=> localStorage.setItem(stateKey, JSON.stringify(snap));

    const wrap=el('div');
    wrap.style.display='flex';
    wrap.style.flexDirection='column';
    wrap.style.alignItems='center';
    wrap.style.gap='6px';
    wrap.style.padding='6px';

    const size=220, sw=10, r=(size-sw)/2, C=2*Math.PI*r, NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg'); 
    svg.setAttribute('width',size); 
    svg.setAttribute('height',size);
    const bg=document.createElementNS(NS,'circle'); 
    bg.setAttribute('cx',size/2); 
    bg.setAttribute('cy',size/2); 
    bg.setAttribute('r',r);
    bg.setAttribute('fill','none'); 
    bg.setAttribute('stroke','#e9ecf2'); 
    bg.setAttribute('stroke-width',sw);
    const fg=document.createElementNS(NS,'circle'); 
    fg.setAttribute('cx',size/2); 
    fg.setAttribute('cy',size/2); 
    fg.setAttribute('r',r);
    fg.setAttribute('fill','none'); 
    fg.setAttribute('stroke','#5c8dff'); 
    fg.setAttribute('stroke-width',sw); 
    fg.setAttribute('stroke-linecap','round');
    fg.setAttribute('transform',`rotate(-90 ${size/2} ${size/2})`);
    fg.setAttribute('stroke-dasharray',String(C)); 
    fg.setAttribute('stroke-dashoffset',String(C));
    const disp=el('div','timer__display','00:00:00');
    const ring=el('div','timer__ring'); 
    ring.append(svg,disp); 
    svg.append(bg,fg);
    const eta=el('div','timer__eta','—');

    const inputs=el('div','timer__inputs');
    const ih=document.createElement('input'); 
    ih.type='number'; ih.min=0; ih.placeholder='시'; ih.value=savedSettings.h||'';
    const im=document.createElement('input'); 
    im.type='number'; im.min=0; im.placeholder='분'; im.value=savedSettings.m||'';
    const is=document.createElement('input'); 
    is.type='number'; is.min=0; is.placeholder='초'; is.value=savedSettings.s||'';
    [ih,im,is].forEach(inp=>{ inp.style.textAlign='center'; inp.style.height='34px'; });
    inputs.append(ih,im,is);
    
    // 설정값 저장
    const saveSettings=()=>{
      const settings={h:+ih.value||0,m:+im.value||0,s:+is.value||0};
      localStorage.setItem(settingsKey,JSON.stringify(settings));
    };
    [ih,im,is].forEach(inp=>inp.addEventListener('change',saveSettings));

    const row=el('div');
    row.style.display='flex';
    row.style.justifyContent='center';
    row.style.gap='12px';
    row.style.width='100%';
    row.style.margin='8px auto 0';
    
    // 시작 버튼 (재생 아이콘)
    const bStart=document.createElement('button');
    bStart.className='timer-btn timer-btn-start';
    bStart.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
    
    // 일시정지 버튼
    const bPause=document.createElement('button');
    bPause.className='timer-btn timer-btn-pause';
    bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
    
    // 리셋 버튼
    const bReset=document.createElement('button');
    bReset.className='timer-btn timer-btn-reset';
    bReset.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/></svg>`;
    
    row.append(bStart,bPause,bReset);

    let totalMs=0,endPerf=0,raf=null,paused=false,remainMs=0;
    const fmt=(ms)=>{
      const s=Math.max(0,Math.ceil(ms/1000));
      const hh=String(Math.floor(s/3600)).padStart(2,'0');
      const mm=String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss=String(s%60).padStart(2,'0');
      return `${hh}:${mm}:${ss}`;
    };
    const draw=(left)=>{ 
      const p=totalMs>0?Math.min(1,Math.max(0,1-left/totalMs)):0; 
      fg.setAttribute('stroke-dashoffset',String(C*(1-p))); 
      disp.textContent=fmt(left); 
    };
    const tick=()=>{ 
      const left=Math.max(0,endPerf-performance.now()); 
      draw(left); 
      if(left<=0){ 
        cancelAnimationFrame(raf); 
        raf=null; 
        alert(`타이머 ${index} 종료`); 
        send({type:'reset'}); 
        saveState({status:'idle'}); 
        return; 
      } 
      raf=requestAnimationFrame(tick); 
    };

    function apply(msg,remote=false){
      if(msg.type==='start'){
        totalMs=msg.totalMs; 
        const dur=Math.max(0,msg.endEpoch-Date.now()); 
        endPerf=performance.now()+dur; 
        paused=false; 
        remainMs=0;
        eta.textContent=`종료 ${fmtAmPm(new Date(msg.endEpoch))}`; 
        bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
        if(raf) cancelAnimationFrame(raf); 
        draw(dur); 
        raf=requestAnimationFrame(tick);
        if(!remote) send({type:'start',totalMs,endEpoch:msg.endEpoch});
        saveState({status:'running',totalMs,endEpoch:msg.endEpoch});
      }else if(msg.type==='pause'){
        if(raf){ cancelAnimationFrame(raf); raf=null; } 
        paused=true; 
        remainMs=msg.remainMs; 
        eta.textContent='—'; 
        bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`; 
        draw(remainMs);
        if(!remote) send({type:'pause',remainMs});
        saveState({status:'paused',totalMs,remainMs});
      }else if(msg.type==='resume'){
        paused=false; 
        endPerf=performance.now()+msg.remainMs; 
        eta.textContent=`종료 ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; 
        bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
        if(raf) cancelAnimationFrame(raf); 
        raf=requestAnimationFrame(tick);
        if(!remote) send({type:'resume',remainMs:msg.remainMs});
        saveState({status:'running',totalMs,endEpoch:Date.now()+msg.remainMs});
      }else if(msg.type==='reset'){
        if(raf) cancelAnimationFrame(raf); 
        raf=null; 
        paused=false; 
        totalMs=0; 
        endPerf=0; 
        remainMs=0;
        fg.setAttribute('stroke-dashoffset',String(C)); 
        disp.textContent='00:00:00'; 
        eta.textContent='—'; 
        bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
        if(!remote) send({type:'reset'});
        saveState({status:'idle'});
      }
    }

    bStart.onclick=()=>{ 
      saveSettings();
      const hh=+ih.value||0, mm=+im.value||0, ss=+is.value||0; 
      totalMs=((hh*3600)+(mm*60)+ss)*1000; 
      if(totalMs<=0) return;
      const duration=remainMs>0?remainMs:totalMs; 
      apply({type:'start',totalMs,endEpoch:Date.now()+duration},false); 
    };
    bPause.onclick=()=>{ 
      if(raf){
        const left=Math.max(0,endPerf-performance.now()); 
        apply({type:'pause',remainMs:left},false);
      } else if(paused&&remainMs>0){
        apply({type:'resume',remainMs},false);
      } 
    };
    bReset.onclick=()=> apply({type:'reset'},false);

    if(bc) bc.onmessage=(e)=>{ 
      if(e.data?.src===selfId) return; 
      apply(e.data,true); 
    };
    targetWin.addEventListener('storage',(e)=>{ 
      if(e.key!==key||!e.newValue) return; 
      const msg=JSON.parse(e.newValue); 
      if(msg.src===selfId) return; 
      apply(msg,true); 
    });

    // 복원
    try{
      const snap=JSON.parse(localStorage.getItem(stateKey)||'null');
      if(snap){
        if(snap.status==='running'&&snap.endEpoch){ 
          apply({type:'start',totalMs:snap.totalMs||0,endEpoch:snap.endEpoch},true); 
        }
        else if(snap.status==='paused'&&typeof snap.remainMs==='number'){ 
          totalMs=snap.totalMs||0; 
          apply({type:'pause',remainMs:snap.remainMs},true); 
        }
      }
    }catch{}

    wrap.append(ring,eta,inputs,row);
    return wrap;
  }
  return makeWidget(`타이머 ${index}`, build, 'widget--timer');
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
  
  if(titleEl) titleEl.textContent=editMode?'메모 수정':'새 메모 작성';
  
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
    const dateVal=dateInput?.value||fmtLocalDate(ST.selected);
    let list=getJayMemoList();
    if(savedMemoId){
      const idx=list.findIndex(m=>m.id===savedMemoId);
      if(idx<0) return;
      list[idx]={...list[idx],title,content,date:dateVal};
    }else{
      savedMemoId=createMemoId();
      list.push({
        id:savedMemoId,
        title,
        content,
        date:dateVal,
        createdAt:Date.now(),
        emoji:'',
        color:'',
      });
    }
    setJayMemoList(list);
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
    empty.textContent='등록된 메모가 없습니다.';
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
  
  const widgetBtn=el('button','memo-card__btn','위젯');
  widgetBtn.title='위젯으로 열기';
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

/* ── 인사이트 페이지 ── */
function renderInsightTabs(){
  const bar=document.getElementById('insightTabBar');
  if(!bar) return;
  bar.innerHTML='';
  ['EN','KR'].forEach(lang=>{
    const cls=insightActiveLang===lang?'insight-tab insight-tab--active':'insight-tab insight-tab--inactive';
    const btn=el('button',cls,lang);
    btn.type='button';
    btn.onclick=()=>{
      insightActiveLang=lang;
      renderInsightTabs();
      renderInsightPageList();
    };
    bar.appendChild(btn);
  });
}

function renderInsightLangToggle(container,activeLang,onChange){
  if(!container) return;
  container.innerHTML='';
  ['EN','KR'].forEach(lang=>{
    const cls=activeLang===lang?'insight-lang-btn insight-lang-btn--active':'insight-lang-btn insight-lang-btn--inactive';
    const btn=el('button',cls,lang);
    btn.type='button';
    btn.onclick=()=> onChange(lang);
    container.appendChild(btn);
  });
}

function initInsightPage(){
  const addBtn=document.getElementById('addInsightBtn');
  if(addBtn) addBtn.onclick=()=> showInsightWritePage(false);
  renderInsightTabs();
  renderInsightPageList();
}

function initInsightWritePage(editMode=false,editItemId=null){
  const titleInput=document.getElementById('insightTitleInput');
  const dateInput=document.getElementById('insightDateInput');
  const textarea=document.getElementById('insightTextarea');
  const saveBtn=document.getElementById('saveInsightBtn');
  const titleEl=document.getElementById('insightWriteTitle');
  const langToggle=document.getElementById('insightLangToggle');
  if(!titleInput||!dateInput||!textarea||!saveBtn) return;

  const editItem=editMode&&editItemId
    ? getJayInsightList().find(i=>i.id===editItemId)
    : null;

  if(titleEl) titleEl.textContent=editMode?'인사이트 수정':'새 인사이트';
  insightWriteLang=editItem?.lang||'KR';

  if(editItem){
    titleInput.value=editItem.title||'';
    textarea.value=editItem.content||'';
    dateInput.value=editItem.date||fmtLocalDate(new Date(editItem.createdAt));
  }else{
    titleInput.value='';
    textarea.value='';
    dateInput.value=fmtLocalDate(new Date());
  }

  let savedInsightId=editMode&&editItemId?editItemId:null;

  const onLangPick=(lang)=>{
    insightWriteLang=lang;
    renderInsightLangToggle(langToggle,insightWriteLang,onLangPick);
  };
  renderInsightLangToggle(langToggle,insightWriteLang,onLangPick);

  saveBtn.onclick=()=>{
    const title=titleInput.value.trim();
    const content=textarea.value.trim();
    if(!title&&!content){
      alert('제목 또는 내용을 입력하세요.');
      return;
    }
    const dateVal=dateInput.value||fmtLocalDate(new Date());
    let list=getJayInsightList();
    if(savedInsightId){
      const idx=list.findIndex(i=>i.id===savedInsightId);
      if(idx>=0){
        list[idx]={...list[idx],lang:insightWriteLang,title,content,date:dateVal};
      }
    }else{
      savedInsightId=createInsightId();
      list.push({
        id:savedInsightId,
        lang:insightWriteLang,
        title,
        content,
        date:dateVal,
        createdAt:Date.now(),
      });
    }
    setJayInsightList(list);
    insightActiveLang=insightWriteLang;
    showInsightPage();
  };

  titleInput.focus();
}

function renderInsightPageList(){
  const content=document.getElementById('insightPageContent');
  if(!content) return;
  const list=getJayInsightList()
    .filter(i=>i.lang===insightActiveLang)
    .slice()
    .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  content.innerHTML='';
  if(!list.length){
    const empty=el('div','memo-empty');
    empty.style.textAlign='center';
    empty.style.padding='60px 20px';
    empty.style.color='var(--text-muted, var(--text))';
    empty.style.fontSize='15px';
    empty.textContent=insightActiveLang==='EN'?'No posts yet.':'등록된 글이 없습니다.';
    content.appendChild(empty);
    return;
  }
  const grid=el('div','memo-page-grid');
  list.forEach(item=>{
    grid.appendChild(createInsightCard(item));
  });
  content.appendChild(grid);
}

function createInsightCard(item){
  const card=el('div','memo-card');
  const postDate=item.date||fmtLocalDate(new Date(item.createdAt||Date.now()));
  const dateEl=el('div','memo-card__date',postDate);
  dateEl.style.fontSize='11px';
  dateEl.style.color='var(--text-muted, var(--text))';
  dateEl.style.marginBottom='6px';
  const header=el('div','memo-card__header');
  header.style.display='flex';
  header.style.justifyContent='space-between';
  header.style.alignItems='center';
  header.style.marginBottom='12px';
  const titleEl=el('div','memo-card__title',item.title||'(제목 없음)');
  titleEl.style.fontWeight='600';
  titleEl.style.fontSize='16px';
  titleEl.style.flex='1';
  titleEl.style.overflow='hidden';
  titleEl.style.textOverflow='ellipsis';
  titleEl.style.whiteSpace='nowrap';
  const delBtn=el('button','memo-card__btn','✕');
  delBtn.title='삭제';
  delBtn.onclick=(e)=>{
    e.stopPropagation();
    if(confirm('삭제할까요?')&&item.id){
      deleteJayInsightById(item.id);
      renderInsightPageList();
    }
  };
  header.append(titleEl,delBtn);
  const contentWrap=el('div','memo-card__content');
  contentWrap.style.cursor='pointer';
  contentWrap.style.minHeight='60px';
  contentWrap.style.lineHeight='1.6';
  contentWrap.style.wordBreak='break-word';
  contentWrap.style.whiteSpace='pre-wrap';
  contentWrap.textContent=item.content||'';
  contentWrap.onclick=()=> showInsightWritePage(true,item.id);
  card.append(dateEl,header,contentWrap);
  return card;
}

function openMemoWidget(item){
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
    title.textContent=item.title||'제목 없음';
    
    const content=doc.createElement('div');
    content.className='memo-widget memo-widget-content';
    content.style.lineHeight='1.6';
    content.style.wordBreak='break-word';
    if(isPopup) ensureMemoWidgetPopupStyles(doc);
    renderMemoHtml(content,item.content||item.text||'',item.emoji||'');
    
    W.append(title,content);
    return W;
  }
  return makeWidget(item.title||'메모', build, 'widget--memo');
}

function openMemoWidgetPopup(item){
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
    title.textContent=item.title||'제목 없음';
    
    const content=doc.createElement('div');
    content.className='memo-widget memo-widget-content memo-popup-content';
    content.style.lineHeight='1.6';
    content.style.wordBreak='break-word';
    renderMemoHtml(content,item.content||item.text||'',item.emoji||'');
    
    W.append(title,content);
    return W;
  }
  openWidgetPopup(item.title||'메모', build);
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

/* ── Daily 페이지 ── */
let dailyViewMode = 'day';
let dailySelectedDate = new Date();
let dailyViewButtonsBound = false;
let dailySectionTaskInputSectionId = null;
let dailySectionTaskInputText = '';
let dailyIsAddingSection = false;
let dailyNewSectionTitle = '';
let dailyEditingSectionId = null;
let dailyEditingSectionTitle = '';
const DAILY_TASK_EDIT_SVG='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
function getDailyTasks(dstr){
  const list=get(kDaily(dstr),[]);
  return Array.isArray(list)?list:[];
}
function saveDailyTasks(dstr,list){
  set(kDaily(dstr),Array.isArray(list)?list:[]);
}
function refreshDailyTaskViews(){
  if(dailyViewMode==='day') renderDailyDayWorkspace();
  else if(dailyViewMode==='week'){
    renderDailyList();
    renderDailyWeekCalendar();
  }else{
    renderDailyMonthCalendar();
  }
}
function updateDailyTaskText(dstr,idx,newText){
  const list=getDailyTasks(dstr);
  if(!list[idx]) return;
  const value=(newText||'').trim();
  if(!value) return;
  list[idx].text=value;
  saveDailyTasks(dstr,list);
  refreshDailyTaskViews();
}
function deleteDailyTaskAt(dstr,idx){
  const list=getDailyTasks(dstr);
  if(!list[idx]) return;
  list.splice(idx,1);
  saveDailyTasks(dstr,list);
  refreshDailyTaskViews();
}
function addDailyTask(dstr,{text,sectionId,done=false}){
  const value=(text||'').trim();
  if(!value) return;
  const list=getDailyTasks(dstr);
  list.push({
    id:Date.now(),
    text:value,
    done:!!done,
    sectionId:sectionId||undefined,
  });
  saveDailyTasks(dstr,list);
  refreshDailyTaskViews();
}
function startDailyTaskInlineEdit(dstr,idx,textEl,options={}){
  const list=getDailyTasks(dstr);
  if(!list[idx]) return;
  const inp=document.createElement('input');
  inp.type='text';
  inp.className=options.inputClass||'daily-section-task-input';
  if(options.inputStyle) inp.style.cssText=options.inputStyle;
  inp.value=list[idx].text||'';
  const save=()=> updateDailyTaskText(dstr,idx,inp.value);
  inp.addEventListener('keydown',(ev)=>{
    if(ev.key==='Enter'){ ev.preventDefault(); save(); }
    if(ev.key==='Escape'){ ev.preventDefault(); refreshDailyTaskViews(); }
  });
  inp.addEventListener('blur',save);
  textEl.replaceWith(inp);
  inp.focus();
  inp.select();
}
function appendDailyDayTaskRow(body,dstr,idx,task){
  const row=el('div','daily-task-row daily-day-task-row');
  const cb=document.createElement('input');
  cb.type='checkbox';
  cb.checked=!!task.done;
  cb.addEventListener('change',()=> setDailyItemDone(dstr,idx,cb.checked));
  const txt=el('span','daily-day-task-text',task.text||'');
  if(task.done) txt.classList.add('is-done');
  const actions=el('div','daily-day-task-actions');
  const editBtn=el('button','daily-day-task-icon-btn');
  editBtn.type='button';
  editBtn.title='수정';
  editBtn.innerHTML=DAILY_TASK_EDIT_SVG;
  editBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    startDailyTaskInlineEdit(dstr,idx,txt);
  });
  const delBtn=el('button','daily-day-task-icon-btn daily-day-task-delete','✕');
  delBtn.type='button';
  delBtn.setAttribute('aria-label','작업 삭제');
  delBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    deleteDailyTaskAt(dstr,idx);
  });
  actions.append(editBtn,delBtn);
  row.append(cb,txt,actions);
  body.appendChild(row);
}
function addDailySection(dstr,title){
  const value=(title||'').trim();
  if(!value) return;
  const sections=getDailySections(dstr);
  const next=sections.concat([{id:createDailySectionId(),title:value,emoji:'📌',color:'',order:sections.length}]);
  setDailySections(dstr,next);
  dailyIsAddingSection=false;
  dailyNewSectionTitle='';
  renderDailyDayWorkspace();
}
function updateDailySectionTitleById(dstr,sectionId,title){
  const value=(title||'').trim();
  if(!value||DAILY_PRESET_SECTION_IDS.includes(sectionId)) return;
  const sections=getDailySections(dstr);
  const next=sections.map(s=>s.id===sectionId?{...s,title:value}:s);
  setDailySections(dstr,next);
  dailyEditingSectionId=null;
  dailyEditingSectionTitle='';
  renderDailyDayWorkspace();
}
function isDailySectionDeletable(section){
  if(!section||section.id==='__none__'||isDailyPresetSection(section)) return false;
  const title=(section.title||'').trim();
  if(title==='기본 섹션'||title==='미분류') return false;
  return true;
}
function deleteDailySection(dstr,sectionId){
  const sections=getDailySections(dstr);
  const target=sections.find(s=>s.id===sectionId);
  if(!target||!isDailySectionDeletable(target)) return;
  setDailySections(dstr,sections.filter(s=>s.id!==sectionId));
  saveDailyTasks(dstr,getDailyTasks(dstr).filter(t=>t.sectionId!==sectionId));
  if(dailyEditingSectionId===sectionId){
    dailyEditingSectionId=null;
    dailyEditingSectionTitle='';
  }
  if(dailySectionTaskInputSectionId===sectionId){
    dailySectionTaskInputSectionId=null;
    dailySectionTaskInputText='';
  }
  renderDailyDayWorkspace();
}
function appendDailySectionTitleInput(host,opts){
  const inp=document.createElement('input');
  inp.type='text';
  inp.className='daily-section-title-input';
  inp.placeholder=opts.placeholder||'';
  inp.value=opts.value||'';
  let committed=false;
  inp.addEventListener('input',()=>{ opts.onInput(inp.value); });
  inp.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'){
      e.preventDefault();
      const value=inp.value.trim();
      if(!value||committed) return;
      committed=true;
      opts.onSubmit(value);
    }
    if(e.key==='Escape'){
      e.preventDefault();
      if(committed) return;
      committed=true;
      opts.onCancel();
    }
  });
  inp.addEventListener('blur',()=>{
    if(committed) return;
    committed=true;
    if(opts.onBlur) opts.onBlur(inp.value);
    else if(!inp.value.trim()) opts.onCancel();
  });
  host.appendChild(inp);
  requestAnimationFrame(()=> inp.focus());
}
function addTaskToDailySection(dstr, sectionId, text){
  const value=(text||'').trim();
  if(!value) return;
  dailySectionTaskInputSectionId=null;
  dailySectionTaskInputText='';
  const list=getDailyTasks(dstr);
  list.push({
    id:Date.now(),
    text:value,
    done:false,
    sectionId:sectionId==='__none__'?undefined:sectionId,
  });
  saveDailyTasks(dstr,list);
  renderDailyDayWorkspace();
}
function appendDailySectionTaskInput(body, dstr, sectionId){
  const inp=document.createElement('input');
  inp.type='text';
  inp.className='daily-section-task-input';
  inp.placeholder='작업을 입력하고 Enter';
  inp.value=dailySectionTaskInputText;
  inp.addEventListener('input',()=>{ dailySectionTaskInputText=inp.value; });
  inp.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'){
      e.preventDefault();
      const value=inp.value.trim();
      if(!value) return;
      addTaskToDailySection(dstr, sectionId, value);
    }
    if(e.key==='Escape'){
      e.preventDefault();
      dailySectionTaskInputSectionId=null;
      dailySectionTaskInputText='';
      renderDailyDayWorkspace();
    }
  });
  inp.addEventListener('blur',()=>{
    setTimeout(()=>{
      if(!dailySectionTaskInputText.trim()){
        dailySectionTaskInputSectionId=null;
        renderDailyDayWorkspace();
      }
    },0);
  });
  body.appendChild(inp);
  requestAnimationFrame(()=> inp.focus());
}
function loadDailyViewMode(){
  const saved = localStorage.getItem('memo2.dailyViewMode');
  if(saved === 'day' || saved === 'week' || saved === 'month') dailyViewMode = saved;
}
function saveDailyViewMode(){
  localStorage.setItem('memo2.dailyViewMode', dailyViewMode);
}
function applyDailyView(){
  setDailyModeLayout();
  renderDailyWeekGoal();
  if(dailyViewMode === 'day'){
    renderDailyDayWorkspace();
  }else if(dailyViewMode === 'week'){
    renderDailyWeekCalendar();
    renderDailyList();
  }else if(dailyViewMode === 'month'){
    renderDailyMonthCalendar();
  }
}
function setDailyViewMode(mode){
  if(mode !== 'day' && mode !== 'week' && mode !== 'month') return;
  dailyViewMode = mode;
  saveDailyViewMode();
  applyDailyView();
}
function bindDailyViewButtons(){
  if(dailyViewButtonsBound) return;
  dailyViewButtonsBound = true;
  document.getElementById('dailyDayViewBtn')?.addEventListener('click', ()=> setDailyViewMode('day'));
  document.getElementById('dailyWeekViewBtn')?.addEventListener('click', ()=> setDailyViewMode('week'));
  document.getElementById('dailyMonthViewBtn')?.addEventListener('click', ()=> setDailyViewMode('month'));
}
function kDailySections(d){ return `memo2.daily.sections.${d}`; }
function createDailySectionId(){ return `daily_section_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }
function getDailySections(dstr){
  const list=get(kDailySections(dstr),[]);
  return Array.isArray(list)?list:[];
}
function setDailySections(dstr,list){
  set(kDailySections(dstr),Array.isArray(list)?list:[]);
}
const DAILY_PRESET_SECTION_IDS=['preset_morning','preset_afternoon','preset_evening'];
function isDailyPresetSection(section){
  return !!section && DAILY_PRESET_SECTION_IDS.includes(section.id);
}
function getDailyPresetSections(){
  return [
    {id:'preset_morning',title:'오전',emoji:'☀️',color:'yellow',order:10},
    {id:'preset_afternoon',title:'오후',emoji:'🌤️',color:'green',order:20},
    {id:'preset_evening',title:'저녁',emoji:'🌙',color:'purple',order:30},
  ];
}
function normalizeDailySectionsForView(sections){
  const presets=getDailyPresetSections();
  const custom=Array.isArray(sections)
    ? sections.filter(s=>!DAILY_PRESET_SECTION_IDS.includes(s.id))
    : [];
  return presets.concat(custom).map((s,idx)=>({
    ...s,
    order:typeof s.order==='number'?s.order:100+idx,
  })).sort((a,b)=>(a.order||0)-(b.order||0));
}
function ensureDailySections(dstr){
  const sections=getDailySections(dstr);
  return sections.slice().sort((a,b)=>(a.order||0)-(b.order||0));
}
function getDailySectionTheme(section){
  const title=section?.title||'';
  const color=section?.color||'';
  if(section?.id==='preset_morning'||title.includes('오전')||color==='yellow'){
    return {emoji:section?.emoji||'☀️',headerClass:'daily-section-header-yellow'};
  }
  if(section?.id==='preset_afternoon'||title.includes('오후')||color==='green'){
    return {emoji:section?.emoji||'🌤️',headerClass:'daily-section-header-green'};
  }
  if(section?.id==='preset_evening'||title.includes('저녁')||color==='purple'){
    return {emoji:section?.emoji||'🌙',headerClass:'daily-section-header-purple'};
  }
  return {emoji:section?.emoji||'📌',headerClass:'daily-section-header-neutral'};
}
function formatDailyMemoSavedAt(ts){
  if(!ts) return '저장 기록 없음';
  const d=new Date(ts);
  if(Number.isNaN(d.getTime())) return '저장 기록 없음';
  const hh=String(d.getHours()).padStart(2,'0');
  const mm=String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm} 저장됨`;
}
function showDailySectionMenu(anchor,dstr,section){
  const doc=anchor.ownerDocument||document;
  if(openPop) openPop.remove();
  const pop=doc.createElement('div');
  pop.className='event-menu-popup daily-section-menu-popup';
  const close=()=>{ pop.remove(); openPop=null; doc.removeEventListener('mousedown',onDocDown); };
  const onDocDown=(e)=>{ if(!pop.contains(e.target)&&e.target!==anchor) close(); };
  const editBtn=el('button','menu-item','✏️ 수정');
  editBtn.type='button';
  editBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    dailyEditingSectionId=section.id;
    dailyEditingSectionTitle=section.title||'';
    renderDailyDayWorkspace();
  };
  pop.appendChild(editBtn);
  if(isDailySectionDeletable(section)){
    const delBtn=el('button','menu-item','🗑️ 삭제');
    delBtn.type='button';
    delBtn.onclick=(e)=>{
      e.stopPropagation();
      close();
      deleteDailySection(dstr,section.id);
    };
    pop.appendChild(delBtn);
  }
  doc.body.appendChild(pop);
  openPop=pop;
  const r=anchor.getBoundingClientRect();
  pop.style.position='fixed';
  pop.style.left=`${Math.min(r.left,window.innerWidth-pop.offsetWidth-8)}px`;
  pop.style.top=`${r.bottom+6}px`;
  pop.style.zIndex='10000';
  setTimeout(()=>doc.addEventListener('mousedown',onDocDown),10);
}
function updateDailyViewButtons(){
  const map=[
    {id:'dailyDayViewBtn',mode:'day'},
    {id:'dailyWeekViewBtn',mode:'week'},
    {id:'dailyMonthViewBtn',mode:'month'},
  ];
  map.forEach(({id,mode})=>{
    const btn=document.getElementById(id);
    if(!btn) return;
    if(dailyViewMode===mode){
      btn.style.background='#3b82f6';
      btn.style.color='#fff';
    }else{
      btn.style.background='var(--card)';
      btn.style.color='#64748b';
    }
  });
}
function setDailyModeLayout(){
  const mode=dailyViewMode;
  const dayWrap=document.getElementById('dailyDayWorkspace');
  const weekWrap=document.getElementById('dailyWeekCalendar');
  const monthWrap=document.getElementById('dailyMonthCalendar');
  const inputSection=document.getElementById('dailyInputSection');
  const listSection=document.getElementById('dailyList');
  const show=(el,visible)=>{
    if(!el) return;
    if(visible) el.style.removeProperty('display');
    else el.style.display='none';
  };
  show(dayWrap, mode==='day');
  show(weekWrap, mode==='week');
  show(monthWrap, mode==='month');
  show(inputSection, mode==='week');
  show(listSection, mode==='week');
  if(inputSection) inputSection.classList.toggle('is-day-mode',mode==='day');
  updateDailyViewButtons();
}
function setDailyItemDone(dstr, idx, checked){
  const list=getDailyTasks(dstr);
  if(!list[idx]) return;
  list[idx].done=checked;
  saveDailyTasks(dstr,list);
  refreshDailyTaskViews();
}

function initDailyPage(){
  const dailyPageEl=document.getElementById('dailyPage');
  if(!dailyPageEl) return;
  loadDailyViewMode();
  bindDailyViewButtons();
  if(dailyPageEl.dataset.initialized === 'true') return;
  dailyPageEl.dataset.initialized = 'true';

  const addBtn = document.getElementById('dailyAddBtn');
  const input = document.getElementById('dailyInput');
  const openWidgetBtn = document.getElementById('openDailyWidgetBtn');

  const addDaily = ()=>{
    const text = input.value.trim();
    if(!text) return;
    const dstr = fmtLocalDate(dailySelectedDate);
    addDailyTask(dstr,{text,done:false});
    input.value = '';
  };

  addBtn?.addEventListener('click', addDaily);
  input?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addDaily(); } });

  openWidgetBtn?.addEventListener('click', ()=>{ widgetDaily?.(); });
}

function renderDailyDayWorkspace(){
  const host=document.getElementById('dailyDayWorkspace');
  if(!host) return;
  renderDailyWeekGoal();
  const dstr=fmtLocalDate(dailySelectedDate);
  const allTasks=get(kDaily(dstr),[]);
  const sections=ensureDailySections(dstr);

  host.innerHTML='';
  const wrap=el('div','daily-day-layout');
  const left=el('div','daily-day-sections');
  const right=el('div','daily-day-memo-panel');

  const sectionHead=el('div','daily-day-sections-head');
  const sectionTitle=el('div','daily-day-head-title','오늘 작업');
  const addSectionBtn=el('button','daily-day-add-section-btn','+ 섹션 추가');
  addSectionBtn.type='button';
  addSectionBtn.onclick=()=>{
    dailyIsAddingSection=true;
    dailyNewSectionTitle='';
    renderDailyDayWorkspace();
  };
  sectionHead.append(sectionTitle,addSectionBtn);
  left.appendChild(sectionHead);
  if(dailyIsAddingSection){
    const addWrap=el('div','daily-section-add-wrap');
    appendDailySectionTitleInput(addWrap,{
      placeholder:'섹션 이름을 입력하고 Enter',
      value:dailyNewSectionTitle,
      onInput:(v)=>{ dailyNewSectionTitle=v; },
      onSubmit:(v)=> addDailySection(dstr,v),
      onCancel:()=>{
        dailyIsAddingSection=false;
        dailyNewSectionTitle='';
        renderDailyDayWorkspace();
      },
      onBlur:(v)=>{
        const value=(v||'').trim();
        if(value) addDailySection(dstr,value);
        else{
          dailyIsAddingSection=false;
          dailyNewSectionTitle='';
          renderDailyDayWorkspace();
        }
      },
    });
    left.appendChild(addWrap);
  }

  const listWrap=el('div','daily-day-sections-list');
  const unsectioned=allTasks
    .map((t,idx)=>({task:t,idx}))
    .filter(({task})=>!task.sectionId);
  const viewSections=normalizeDailySectionsForView(sections);
  const mergedSections=viewSections.concat(
    unsectioned.length
      ? [{id:'__none__',title:'미분류',emoji:'🗒️',color:'',order:99999}]
      : []
  );

  mergedSections.forEach((section)=>{
    const theme=getDailySectionTheme(section);
    const sec=el('section','daily-day-section-card daily-section-card');
    const secHead=el('div',`daily-day-section-head daily-section-header ${theme.headerClass}`);
    const leftHead=el('div','daily-day-section-left');
    const emo=el('span','daily-day-section-emoji',theme.emoji);
    leftHead.appendChild(emo);
    if(section.id!=='__none__' && !isDailyPresetSection(section) && dailyEditingSectionId===section.id){
      appendDailySectionTitleInput(leftHead,{
        placeholder:'섹션 이름',
        value:dailyEditingSectionTitle,
        onInput:(v)=>{ dailyEditingSectionTitle=v; },
        onSubmit:(v)=> updateDailySectionTitleById(dstr,section.id,v),
        onCancel:()=>{
          dailyEditingSectionId=null;
          dailyEditingSectionTitle='';
          renderDailyDayWorkspace();
        },
        onBlur:(v)=>{
          const value=(v||'').trim();
          if(value) updateDailySectionTitleById(dstr,section.id,value);
          else{
            dailyEditingSectionId=null;
            dailyEditingSectionTitle='';
            renderDailyDayWorkspace();
          }
        },
      });
    }else{
      leftHead.appendChild(el('span','daily-day-section-title',section.title||'섹션'));
    }

    const rightHead=el('div','daily-day-section-actions');
    if(section.id!=='__none__' && !isDailyPresetSection(section) && dailyEditingSectionId!==section.id){
      const menuBtn=el('button','daily-day-section-menu-btn','⋯');
      menuBtn.type='button';
      menuBtn.title='섹션 메뉴';
      menuBtn.setAttribute('aria-label','섹션 메뉴');
      menuBtn.onclick=(e)=>{
        e.stopPropagation();
        showDailySectionMenu(menuBtn,dstr,section);
      };
      rightHead.appendChild(menuBtn);
    }
    const addTaskBtn=el('button','daily-day-section-btn daily-day-add-task-btn','+ 작업 추가');
    addTaskBtn.type='button';
    addTaskBtn.onclick=()=>{
      dailySectionTaskInputSectionId=section.id;
      dailySectionTaskInputText='';
      renderDailyDayWorkspace();
    };
    rightHead.appendChild(addTaskBtn);
    secHead.append(leftHead,rightHead);

    const body=el('div','daily-day-section-body');
    const items=allTasks
      .map((t,idx)=>({task:t,idx}))
      .filter(({task})=> section.id==='__none__' ? !task.sectionId : task.sectionId===section.id);

    const showTaskInput=dailySectionTaskInputSectionId===section.id;
    if(!items.length && !showTaskInput){
      body.appendChild(el('div','daily-day-empty','작업이 없습니다.'));
    }else{
      items.forEach(({task,idx})=>{
        appendDailyDayTaskRow(body,dstr,idx,task);
      });
    }
    if(showTaskInput) appendDailySectionTaskInput(body, dstr, section.id);
    sec.append(secHead,body);
    listWrap.appendChild(sec);
  });
  left.appendChild(listWrap);

  const latestDailyMemo=getJayMemoList()
    .filter(m=>m.date===dstr)
    .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
  const memoHead=el('div','daily-memo-head');
  const memoHeadLeft=el('div','daily-memo-head-title','📝 메모 쓰기');
  const memoHeadActions=el('div','daily-memo-head-actions');
  const pinBtn=el('button','daily-memo-icon-btn','📌');
  pinBtn.type='button';
  pinBtn.title='패널 고정';
  pinBtn.onclick=()=> right.classList.toggle('is-pinned');
  const expandBtn=el('button','daily-memo-icon-btn','↗');
  expandBtn.type='button';
  expandBtn.title='패널 확장';
  expandBtn.onclick=()=> right.classList.toggle('is-expanded');
  memoHeadActions.append(pinBtn,expandBtn);
  memoHead.append(memoHeadLeft,memoHeadActions);

  const memoInput=document.createElement('textarea');
  memoInput.className='daily-memo-textarea';
  memoInput.placeholder='오늘 메모를 입력하세요.';

  const savedAtEl=el('div','daily-memo-saved-at',formatDailyMemoSavedAt(latestDailyMemo?.createdAt));

  const memoActions=el('div','daily-memo-actions');
  const saveMemoBtn=el('button','daily-day-section-btn daily-memo-save-btn','저장');
  saveMemoBtn.type='button';
  const goMemoBtn=el('button','daily-day-section-btn daily-memo-all-btn','메모 전체 보기');
  goMemoBtn.type='button';
  goMemoBtn.onclick=()=>{ if(typeof showMemoPage==='function') showMemoPage(); };
  memoActions.append(saveMemoBtn,goMemoBtn);

  const memoList=el('div','daily-memo-linked-list');
  const renderMemoList=()=>{
    memoList.innerHTML='';
    const memos=getJayMemoList()
      .filter(m=>m.date===dstr)
      .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))
      .slice(0,6);
    if(!memos.length){
      memoList.appendChild(el('div','daily-day-empty','연동된 메모가 없습니다.'));
      return;
    }
    memos.forEach((m)=>{
      const item=el('div','daily-memo-item');
      const t=el('div','daily-memo-item-title',m.title||'제목 없음');
      const c=el('div','daily-memo-item-content');
      renderMemoHtml(c,m.content||m.text||'');
      item.append(t,c);
      memoList.appendChild(item);
    });
  };
  saveMemoBtn.onclick=()=>{
    const val=memoInput.value.trim();
    if(!val) return;
    const list=getJayMemoList();
    list.push({
      id:createMemoId(),
      title:`Daily 메모 ${dstr}`,
      content:val,
      date:dstr,
      createdAt:Date.now(),
      emoji:'',
      color:'',
    });
    setJayMemoList(list);
    memoInput.value='';
    savedAtEl.textContent=formatDailyMemoSavedAt(Date.now());
    renderMemoList();
  };
  renderMemoList();

  right.append(memoHead,memoInput,savedAtEl,memoActions,memoList);
  wrap.append(left,right);
  host.appendChild(wrap);
}

function renderDailyWeekCalendar(){
  const container = document.getElementById('dailyWeekCalendar');
  if(!container) return;
  renderDailyWeekGoal();
  container.innerHTML = '';

  const today = dailySelectedDate;
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const yearMonthRow = el('div');
  yearMonthRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px 8px;';

  const yearMonth = el('div', null, `${today.getFullYear()}년 ${today.getMonth()+1}월`);
  yearMonth.style.cssText = 'font-weight:500;font-size:14px;';

  const navBtns = el('div');
  navBtns.style.cssText = 'display:flex;gap:4px;';

  const prevBtn = el('button', null, '◀');
  prevBtn.style.cssText = 'padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;background:var(--card);cursor:pointer;font-size:12px;';
  prevBtn.onclick = ()=>{
    dailySelectedDate = new Date(today);
    dailySelectedDate.setDate(today.getDate()-7);
    renderDailyWeekCalendar();
  };

  const nextBtn = el('button', null, '▶');
  nextBtn.style.cssText = prevBtn.style.cssText;
  nextBtn.onclick = ()=>{
    dailySelectedDate = new Date(today);
    dailySelectedDate.setDate(today.getDate()+7);
    renderDailyWeekCalendar();
  };

  navBtns.append(prevBtn, nextBtn);
  yearMonthRow.append(yearMonth, navBtns);
  container.appendChild(yearMonthRow);

  const weekdays = ['일','월','화','수','목','금','토'];

  const weekGrid = el('div');
  weekGrid.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:0 12px 12px;flex:1;overflow:hidden;';

  for(let i=0; i<7; i++){
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate()+i);
    const dstr = fmtLocalDate(date);
    const items = get(kDaily(dstr), []);
    const isToday = fmtLocalDate(date) === fmtLocalDate(new Date());
    const isSelected = fmtLocalDate(date) === fmtLocalDate(dailySelectedDate);

    const col = el('div');
    col.style.cssText = `display:flex;flex-direction:column;gap:4px;border:1px solid ${isSelected?'#3b82f6':'#e2e8f0'};border-radius:10px;overflow:hidden;cursor:pointer;`;

    const dayHeader = el('div');
    dayHeader.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:8px 4px 6px;background:${isSelected?'#3b82f6':isToday?'#dbeafe':'#f8fafc'};`;

    const dayName = el('div', null, weekdays[i]);
    dayName.style.cssText = `font-size:11px;font-weight:500;color:${isSelected?'#fff':isToday?'#1d4ed8':'#64748b'};`;

    const dayNum = el('div', null, String(date.getDate()));
    dayNum.style.cssText = `font-size:16px;font-weight:700;color:${isSelected?'#fff':isToday?'#1d4ed8':'#111'};`;

    const dot = el('div');
    dot.style.cssText = `width:5px;height:5px;border-radius:50%;margin-top:2px;background:${items.length>0?(items.some(it=>it.done)?'#22c55e':'#f97316'):'transparent'};`;

    dayHeader.append(dayName, dayNum, dot);

    const itemList = el('div', 'weekly-day-card-scroll');
    itemList.style.cssText = 'display:flex;flex-direction:column;gap:3px;padding:6px 4px;flex:1;overflow-y:auto;max-height:300px;';

    items.forEach((item, idx)=>{
      const row = el('div');
      row.style.cssText = `display:flex;align-items:flex-start;gap:4px;padding:4px 2px;border-radius:6px;`;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!item.done;
      cb.style.cssText = 'width:13px;height:13px;cursor:pointer;flex-shrink:0;margin-top:2px;accent-color:#3b82f6;';

      const text = el('span', null, item.text);
      text.style.cssText = `font-size:11px;line-height:1.4;word-break:break-all;${item.done?'text-decoration:line-through;color:#9aa5b1;':'color:#374151;'}`;

      cb.addEventListener('change', (e)=>{
        e.stopPropagation();
        setDailyItemDone(dstr, idx, cb.checked);
      });

      row.append(cb, text);
      itemList.appendChild(row);
    });

    const addRow = el('div');
    addRow.style.cssText = 'padding:4px;';
    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.placeholder = '+';
    addInput.style.cssText = 'width:100%;font-size:11px;border:none;border-top:1px solid #e2e8f0;padding:4px 2px;outline:none;background:transparent;color:#64748b;';
    addInput.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        e.stopPropagation();
        const text = addInput.value.trim();
        if(!text) return;
        const list = get(kDaily(dstr), []);
        list.push({ id: Date.now(), text, done: false });
        set(kDaily(dstr), list);
        addInput.value = '';
        renderDailyWeekCalendar();
      }
    });
    addRow.appendChild(addInput);

    col.addEventListener('click', (e)=>{
      if(e.target.closest('input')) return;
      dailySelectedDate = new Date(date);
      renderDailyWeekCalendar();
      renderDailyList();
    });

    col.append(dayHeader, itemList, addRow);
    weekGrid.appendChild(col);
  }

  container.appendChild(weekGrid);
}

function renderDailyMonthCalendar(){
  const container = document.getElementById('dailyMonthCalendar');
  if(!container) return;
  renderDailyWeekGoal();
  container.innerHTML = '';

  const y = dailySelectedDate.getFullYear();
  const m = dailySelectedDate.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const totalDays = new Date(y, m+1, 0).getDate();

  const monthHeader = el('div','daily-month-header');
  const title = el('div','daily-month-title',`${y}년 ${m+1}월`);
  const nav = el('div','daily-month-nav');
  const prevBtn = el('button','daily-month-nav-btn','◀');
  prevBtn.type='button';
  prevBtn.onclick=()=>{
    dailySelectedDate = new Date(y, m-1, 1);
    renderDailyMonthCalendar();
  };
  const nextBtn = el('button','daily-month-nav-btn','▶');
  nextBtn.type='button';
  nextBtn.onclick=()=>{
    dailySelectedDate = new Date(y, m+1, 1);
    renderDailyMonthCalendar();
  };
  nav.append(prevBtn,nextBtn);
  monthHeader.append(title,nav);

  const view = el('div','daily-month-record-view');
  const weekdays=['일','월','화','수','목','금','토'];
  const startDate = new Date(y,m,1-startDay);
  const endBase = new Date(y,m,totalDays);
  const endDate = new Date(endBase);
  endDate.setDate(endBase.getDate()+(6-endBase.getDay()));
  const totalCells=Math.round((endDate-startDate)/(24*60*60*1000))+1;

  for(let weekStart=0; weekStart<totalCells; weekStart+=7){
    const row=el('div','daily-month-week-row');
    for(let i=0;i<7;i++){
      const date = new Date(startDate);
      date.setDate(startDate.getDate()+weekStart+i);
      const dstr=fmtLocalDate(date);
      const items=get(kDaily(dstr),[]);
      const isCurrentMonth=date.getMonth()===m;
      const isToday=dstr===fmtLocalDate(new Date());
      const isSelected=dstr===fmtLocalDate(dailySelectedDate);

      const card=el('div','daily-month-day-card');
      if(!isCurrentMonth) card.classList.add('is-outside-month');
      if(isToday) card.classList.add('is-today');
      if(isSelected) card.classList.add('is-selected');

      const cardHeader=el('div','daily-month-day-card-header');
      const dayName=el('div','daily-month-day-name',weekdays[i]);
      const dayNum=el('div','daily-month-day-num',String(date.getDate()));
      cardHeader.append(dayName,dayNum);

      const body=el('div','daily-month-day-card-body');
      if(!items.length){
        const empty=el('div','daily-month-empty','기록 없음');
        body.appendChild(empty);
      }else{
        items.forEach((item,idx)=>{
          const rowItem=el('label','daily-month-task-item');
          const cb=document.createElement('input');
          cb.type='checkbox';
          cb.checked=!!item.done;
          cb.addEventListener('change',()=> setDailyItemDone(dstr, idx, cb.checked));
          const txt=el('span','daily-month-task-text',item.text);
          if(item.done) txt.classList.add('is-done');
          rowItem.append(cb,txt);
          body.appendChild(rowItem);
        });
      }

      card.addEventListener('click',(e)=>{
        if(e.target.closest('input')) return;
        dailySelectedDate=new Date(date);
        renderDailyMonthCalendar();
      });

      card.append(cardHeader,body);
      row.appendChild(card);
    }
    view.appendChild(row);
  }

  container.append(monthHeader,view);
}

function renderDailyList(){
  const container = document.getElementById('dailyList');
  if(!container) return;
  const dstr = fmtLocalDate(dailySelectedDate);
  const list = getDailyTasks(dstr);
  container.innerHTML = '';

  if(!list.length){
    const empty = el('div', null, '오늘 작업을 입력해보세요.');
    empty.style.cssText = 'color:#b0b8c1;font-size:14px;text-align:center;padding:24px 0;';
    container.appendChild(empty);
    return;
  }

  list.forEach((item, idx)=>{
    const row = el('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;border:1px solid #e9ecf2;margin-bottom:6px;background:var(--card);';
    row.draggable = true;
    row.dataset.idx = String(idx);

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!item.done;
    cb.style.cssText = 'width:16px;height:16px;cursor:pointer;flex-shrink:0;accent-color:#3b82f6;';

    const text = el('span', null, item.text);
    text.style.cssText = `flex:1;font-size:14px;${item.done?'text-decoration:line-through;color:#9aa5b1;':'color:var(--text);'}`;

    const editBtn = el('button');
    editBtn.innerHTML = DAILY_TASK_EDIT_SVG;
    editBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:2px;flex-shrink:0;display:flex;align-items:center;opacity:0.6;';
    editBtn.title = '수정';

    const delBtn = el('button', null, '✕');
    delBtn.style.cssText = 'background:none;border:none;color:#cbd5e1;cursor:pointer;font-size:14px;padding:0;flex-shrink:0;';

    editBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      startDailyTaskInlineEdit(dstr, idx, text, {
        inputClass:'',
        inputStyle:'flex:1;font-size:14px;border:none;outline:none;background:transparent;width:100%;font-family:inherit;padding:0;box-sizing:border-box;',
      });
    });

    cb.addEventListener('change', ()=>{
      setDailyItemDone(dstr, idx, cb.checked);
    });

    delBtn.addEventListener('click', ()=>{
      deleteDailyTaskAt(dstr, idx);
    });

    row.addEventListener('dragstart', (e)=>{
      e.dataTransfer.setData('text/plain', String(idx));
      row.style.opacity = '0.4';
    });
    row.addEventListener('dragend', ()=>{
      row.style.opacity = '1';
    });
    row.addEventListener('dragover', (e)=>{
      e.preventDefault();
      row.style.borderTop = '2px solid #3b82f6';
    });
    row.addEventListener('dragleave', ()=>{
      row.style.borderTop = '';
    });
    row.addEventListener('drop', (e)=>{
      e.preventDefault();
      row.style.borderTop = '';
      const fromIdx = +e.dataTransfer.getData('text/plain');
      const toIdx = idx;
      if(fromIdx === toIdx) return;
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      set(kDaily(dstr), list);
      renderDailyList();
    });

    row.append(cb, text, editBtn, delBtn);
    container.appendChild(row);
  });
}

function widgetDaily(){
  return makeWidget('Daily', (isPopup, win)=>{
    const doc=win.document;
    const W=doc.createElement('div');
    W.style.cssText='display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:8px 12px;';

    const title=doc.createElement('div');
    title.textContent='📋 Daily';
    title.style.cssText='font-weight:700;font-size:14px;margin-bottom:8px;';
    W.append(title);

    const listWrap=doc.createElement('div');
    listWrap.style.cssText='flex:1;min-height:0;overflow:auto;';
    W.append(listWrap);

    const render=()=>{
      const dstr=fmtLocalDate(new Date());
      const list=JSON.parse(win.localStorage.getItem(kDaily(dstr))||'[]');
      listWrap.innerHTML='';
      if(!list.length){
        const empty=doc.createElement('div');
        empty.textContent='오늘 작업이 없습니다.';
        empty.style.cssText='color:#b0b8c1;font-size:13px;text-align:center;padding:16px 0;';
        listWrap.append(empty);
        return;
      }
      list.forEach(item=>{
        const row=doc.createElement('div');
        row.textContent=item.text;
        row.style.cssText=`padding:8px 10px;border:1px solid #e9ecf2;border-radius:8px;margin-bottom:6px;font-size:13px;${item.done?'text-decoration:line-through;color:#9aa5b1;':''}`;
        listWrap.append(row);
      });
    };

    render();
    win.addEventListener('storage',(e)=>{ if(e.key?.startsWith('memo2.daily.')) render(); });
    return W;
  }, 'widget--daily');
}

/* ── 루틴 페이지 ── */
let isReorderMode=false; // 정렬 모드 상태

function initRoutinePage(){
  const weekCal=document.getElementById('routineWeekCalendar');
  const content=document.getElementById('routineContent');
  const addBtn=document.getElementById('addRoutineBtn');
  const toggleReorderBtn=document.getElementById('toggleReorderBtn');
  
  if(!weekCal || !content) return;
  
  // 루틴 추가 버튼
  if(addBtn){
    addBtn.onclick=()=> addNewRoutine();
  }
  
  // 정렬 모드 토글 버튼
  if(toggleReorderBtn){
    toggleReorderBtn.onclick=()=>{
      isReorderMode=!isReorderMode;
      if(isReorderMode){
        toggleReorderBtn.style.background='#3b82f6';
        toggleReorderBtn.style.borderColor='#3b82f6';
        toggleReorderBtn.querySelector('svg').setAttribute('fill','#ffffff');
      }else{
        toggleReorderBtn.style.background='var(--card)';
        toggleReorderBtn.style.borderColor='#e2e8f0';
        toggleReorderBtn.querySelector('svg').setAttribute('fill','#64748b');
      }
      renderRoutineList();
    };
  }
  
  renderRoutineWeekCalendar();
  renderRoutineList();
}

function renderRoutineWeekCalendar(){
  const weekCal=document.getElementById('routineWeekCalendar');
  if(!weekCal) return;
  
  weekCal.innerHTML='';
  
  // 현재 선택된 날짜 기준으로 일주일 계산
  const today=ST.selected;
  const dayOfWeek=today.getDay(); // 0(일) ~ 6(토)
  const startOfWeek=new Date(today);
  startOfWeek.setDate(today.getDate()-dayOfWeek); // 일요일로 이동
  
  // 연도와 월 표시 (네비게이션 버튼 포함)
  const yearMonthRow=el('div');
  yearMonthRow.style.display='flex';
  yearMonthRow.style.justifyContent='space-between';
  yearMonthRow.style.alignItems='center';
  yearMonthRow.style.marginBottom='12px';
  
  const yearMonth=el('div','routine-year-month');
  yearMonth.textContent=`${today.getFullYear()}년 ${today.getMonth()+1}월`;
  yearMonth.style.textAlign='left';
  yearMonth.style.flex='1';
  
  const navBtns=el('div');
  navBtns.style.display='flex';
  navBtns.style.gap='4px';
  
  const prevBtn=el('button');
  prevBtn.textContent='◀';
  prevBtn.style.padding='4px 8px';
  prevBtn.style.border='1px solid var(--line)';
  prevBtn.style.borderRadius='6px';
  prevBtn.style.background='var(--card)';
  prevBtn.style.cursor='pointer';
  prevBtn.style.fontSize='12px';
  prevBtn.onclick=()=>{
    const newDate=new Date(today);
    newDate.setDate(today.getDate()-7);
    ST.selected=newDate;
    renderRoutineWeekCalendar();
    renderRoutineList();
  };
  
  const nextBtn=el('button');
  nextBtn.textContent='▶';
  nextBtn.style.padding='4px 8px';
  nextBtn.style.border='1px solid var(--line)';
  nextBtn.style.borderRadius='6px';
  nextBtn.style.background='var(--card)';
  nextBtn.style.cursor='pointer';
  nextBtn.style.fontSize='12px';
  nextBtn.onclick=()=>{
    const newDate=new Date(today);
    newDate.setDate(today.getDate()+7);
    ST.selected=newDate;
    renderRoutineWeekCalendar();
    renderRoutineList();
  };
  
  navBtns.append(prevBtn,nextBtn);
  yearMonthRow.append(yearMonth,navBtns);
  weekCal.appendChild(yearMonthRow);
  
  // 일주일 그리드
  const weekGrid=el('div','routine-week-grid');
  const weekdays=['일','월','화','수','목','금','토'];
  
  for(let i=0;i<7;i++){
    const date=new Date(startOfWeek);
    date.setDate(startOfWeek.getDate()+i);
    
    const dayCell=el('div','routine-day-cell');
    const dayName=el('div','routine-day-name',weekdays[i]);
    const dayNum=el('div','routine-day-num',String(date.getDate()));
    
    // 오늘 표시
    if(date.toDateString()===new Date().toDateString()){
      dayCell.classList.add('today');
    }
    
    // 선택된 날짜 표시
    if(date.toDateString()===today.toDateString()){
      dayCell.classList.add('selected');
    }
    
    dayCell.onclick=()=>{
      // 맨 왼쪽(일요일) 클릭 시 이전 주로
      if(i===0){
        const newDate=new Date(date);
        newDate.setDate(date.getDate()-7);
        ST.selected=newDate;
      }
      // 맨 오른쪽(토요일) 클릭 시 다음 주로
      else if(i===6){
        const newDate=new Date(date);
        newDate.setDate(date.getDate()+7);
        ST.selected=newDate;
      }
      // 그 외의 날짜는 해당 날짜 선택
      else{
        ST.selected=date;
      }
      renderRoutineWeekCalendar();
      renderRoutineList();
    };
    
    dayCell.append(dayName,dayNum);
    weekGrid.appendChild(dayCell);
  }
  
  weekCal.appendChild(weekGrid);
}

function renderRoutineList(){
  const content=document.getElementById('routineContent');
  if(!content) return;
  
  // 현재 선택된 날짜
  const selectedDate=ST.selected;
  const selectedDay=selectedDate.getDay(); // 0(일)~6(토)
  
  // localStorage에서 루틴 불러오기
  let routines=[];
  try{
    const saved=localStorage.getItem('memo2.routines');
    if(saved) routines=JSON.parse(saved);
  }catch{}
  
  // 샘플 데이터가 없으면 추가
  if(routines.length===0){
    routines=[
      {id:1,text:'루틴 1',checked:false,startDate:'2026-01-01',endDate:'2026-12-31',repeatDays:[1,3,5],color:'#10b981'},
      {id:2,text:'루틴 2',checked:false,startDate:'2026-01-01',endDate:'2026-12-31',repeatDays:[0,2,4,6],color:'#3b82f6'},
      {id:3,text:'루틴 3',checked:false,startDate:'2026-01-01',endDate:'2026-12-31',repeatDays:[1,2,3,4,5],color:'#f59e0b'}
    ];
    localStorage.setItem('memo2.routines',JSON.stringify(routines));
  }
  
  content.innerHTML='';
  
  const list=el('div','routine-list');
  
  let draggedIdx=null;
  let longPressTimer=null;
  
  routines.forEach((routine,idx)=>{
    // 날짜 필터링: 시작일~종료일 범위 체크
    if(routine.startDate && routine.endDate){
      const startDate=new Date(routine.startDate);
      const endDate=new Date(routine.endDate);
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
      
      const selected=new Date(selectedDate);
      selected.setHours(12,0,0,0);
      
      // 선택된 날짜가 시작일~종료일 범위 밖이면 표시하지 않음
      if(selected<startDate || selected>endDate){
        return;
      }
    }
    
    // 반복 요일 필터링
    if(routine.repeatDays && routine.repeatDays.length>0){
      // 선택된 날짜의 요일이 repeatDays에 포함되어 있지 않으면 표시하지 않음
      if(!routine.repeatDays.includes(selectedDay)){
        return;
      }
    }
    
    const item=el('div','routine-item');
    
    // 정렬 모드일 때만 드래그 가능
    if(isReorderMode){
      item.draggable=true;
      item.style.cursor='grab';
      
      // 드래그 시작
      item.ondragstart=(e)=>{
        draggedIdx=idx;
        item.style.opacity='0.5';
        item.style.cursor='grabbing';
      };
      
      // 드래그 오버
      item.ondragover=(e)=>{
        e.preventDefault();
        if(draggedIdx===null||draggedIdx===idx) return;
        item.style.borderTop='3px solid #3b82f6';
      };
      
      item.ondragleave=(e)=>{
        item.style.borderTop='';
      };
      
      // 드롭
      item.ondrop=(e)=>{
        e.preventDefault();
        item.style.borderTop='';
        
        if(draggedIdx===null||draggedIdx===idx) return;
        
        // 배열에서 위치 변경
        const draggedItem=routines[draggedIdx];
        routines.splice(draggedIdx,1);
        const newIdx=draggedIdx<idx?idx-1:idx;
        routines.splice(newIdx,0,draggedItem);
        
        // 저장 및 재렌더링
        localStorage.setItem('memo2.routines',JSON.stringify(routines));
        renderRoutineList();
        
        draggedIdx=null;
      };
      
      // 드래그 종료
      item.ondragend=()=>{
        item.style.opacity='1';
        item.style.cursor='grab';
        item.style.borderTop='';
        draggedIdx=null;
      };
      
      // 정렬 모드 시각적 표시
      const dragHandle=el('span');
      dragHandle.innerHTML='☰';
      dragHandle.style.color='#94a3b8';
      dragHandle.style.marginRight='8px';
      dragHandle.style.fontSize='18px';
    }
    
    // 색상 적용 (배경색으로)
    if(routine.color){
      item.style.backgroundColor=routine.color+'15'; // 투명도 15%
      item.style.borderLeft=`4px solid ${routine.color}`;
    }
    
    const checkbox=document.createElement('input');
    checkbox.type='checkbox';
    checkbox.checked=routine.checked||false;
    checkbox.className='routine-checkbox';
    checkbox.onchange=()=>{
      routine.checked=checkbox.checked;
      // 체크 상태에 따라 스타일 변경
      if(checkbox.checked){
        label.style.textDecoration='line-through';
        label.style.opacity='0.5';
        if(repeatInfo){
          repeatInfo.style.textDecoration='line-through';
          repeatInfo.style.opacity='0.5';
        }
      }else{
        label.style.textDecoration='none';
        label.style.opacity='1';
        if(repeatInfo){
          repeatInfo.style.textDecoration='none';
          repeatInfo.style.opacity='1';
        }
      }
      localStorage.setItem('memo2.routines',JSON.stringify(routines));
    };
    
    const labelWrap=el('div');
    labelWrap.style.flex='1';
    labelWrap.style.display='flex';
    labelWrap.style.flexDirection='column';
    labelWrap.style.gap='4px';
    
    const labelText=(routine.emoji?routine.emoji+' ':'')+routine.text;
    const label=el('div','routine-label',labelText);
    
    // 체크된 상태면 초기에 취소선 적용
    if(routine.checked){
      label.style.textDecoration='line-through';
      label.style.opacity='0.5';
    }
    
    label.ondblclick=()=>{
      showRoutineModal(true,routine,idx);
    };
    
    labelWrap.appendChild(label);
    
    // 반복 정보 표시
    let repeatInfo=null;
    if(routine.repeatDays&&routine.repeatDays.length>0){
      repeatInfo=el('div');
      repeatInfo.style.fontSize='12px';
      repeatInfo.style.color='#94a3b8';
      const dayNames=['일','월','화','수','목','금','토'];
      const selectedNames=routine.repeatDays.sort((a,b)=>a-b).map(d=>dayNames[d]);
      repeatInfo.textContent=`🔁 ${selectedNames.join(', ')}`;
      
      // 체크된 상태면 반복 정보에도 취소선 적용
      if(routine.checked){
        repeatInfo.style.textDecoration='line-through';
        repeatInfo.style.opacity='0.5';
      }
      
      labelWrap.appendChild(repeatInfo);
    }
    
    const delBtn=el('button','routine-del-btn','✕');
    delBtn.onclick=()=>{
      routines.splice(idx,1);
      localStorage.setItem('memo2.routines',JSON.stringify(routines));
      renderRoutineList();
    };
    
    item.append(checkbox,labelWrap,delBtn);
    list.appendChild(item);
  });
  
  content.appendChild(list);
}

function addNewRoutine(){
  showRoutineModal();
}

function showRoutineModal(editMode=false,routine=null,idx=null){
  const modal=el('div','modal-overlay');
  const box=el('div','modal-box');
  box.style.maxWidth='500px';
  
  const title=el('h3','modal-title',editMode?'루틴 수정':'루틴 작성하세요');
  
  const form=el('div','modal-form');
  
  // 루틴 이름 입력
  const nameGroup=el('div','form-group');
  const nameInput=document.createElement('input');
  nameInput.type='text';
  nameInput.placeholder='루틴 이름 입력';
  nameInput.value=editMode&&routine?routine.text:'';
  nameInput.style.width='100%';
  nameInput.style.padding='12px';
  nameInput.style.border='1px solid #e2e8f0';
  nameInput.style.borderRadius='8px';
  nameInput.style.fontSize='14px';
  nameInput.style.fontFamily='inherit';
  nameGroup.appendChild(nameInput);
  
  // 시작 날짜
  const startGroup=el('div','form-group');
  startGroup.style.marginTop='12px';
  const startLabel=el('label',null,'시작:');
  startLabel.style.display='block';
  startLabel.style.marginBottom='4px';
  startLabel.style.fontSize='13px';
  startLabel.style.color='#64748b';
  const startInput=document.createElement('input');
  startInput.type='date';
  startInput.value=editMode&&routine&&routine.startDate?routine.startDate:fmtLocalDate(new Date());
  startInput.style.width='100%';
  startInput.style.padding='10px';
  startInput.style.border='1px solid #e2e8f0';
  startInput.style.borderRadius='8px';
  startInput.style.fontSize='14px';
  startGroup.append(startLabel,startInput);
  
  // 종료 날짜
  const endGroup=el('div','form-group');
  endGroup.style.marginTop='12px';
  const endLabel=el('label',null,'종료:');
  endLabel.style.display='block';
  endLabel.style.marginBottom='4px';
  endLabel.style.fontSize='13px';
  endLabel.style.color='#64748b';
  const endInput=document.createElement('input');
  endInput.type='date';
  endInput.value=editMode&&routine&&routine.endDate?routine.endDate:'';
  endInput.style.width='100%';
  endInput.style.padding='10px';
  endInput.style.border='1px solid #e2e8f0';
  endInput.style.borderRadius='8px';
  endInput.style.fontSize='14px';
  endGroup.append(endLabel,endInput);
  
  // 반복 설정
  let repeatDays=editMode&&routine&&routine.repeatDays?routine.repeatDays:[];
  const repeatGroup=el('div','form-group');
  repeatGroup.style.marginTop='12px';
  const repeatLabel=el('label',null,'반복:');
  repeatLabel.style.display='block';
  repeatLabel.style.marginBottom='4px';
  repeatLabel.style.fontSize='13px';
  repeatLabel.style.color='#64748b';
  const repeatBtn=document.createElement('button');
  repeatBtn.type='button';
  repeatBtn.className='btn';
  repeatBtn.style.width='100%';
  repeatBtn.style.padding='10px';
  repeatBtn.style.textAlign='left';
  
  const updateRepeatBtn=()=>{
    if(repeatDays.length===0){
      repeatBtn.textContent='반복 안 함';
      repeatBtn.style.background='#f8fafc';
      repeatBtn.style.color='#64748b';
    }else{
      const dayNames=['일','월','화','수','목','금','토'];
      const selectedNames=repeatDays.sort((a,b)=>a-b).map(d=>dayNames[d]);
      repeatBtn.textContent=`${selectedNames.join(', ')} 중 ${repeatDays.length}일`;
      repeatBtn.style.background='#e0ecff';
      repeatBtn.style.color='#2563eb';
    }
  };
  updateRepeatBtn();
  
  repeatBtn.onclick=(e)=>{
    e.stopPropagation();
    showRepeatDayModal(repeatDays,(newDays)=>{
      repeatDays=newDays;
      updateRepeatBtn();
    });
  };
  repeatGroup.append(repeatLabel,repeatBtn);
  
  // 이모티콘 선택
  let selectedEmoji=editMode&&routine?routine.emoji:'';
  const emojiGroup=el('div','form-group');
  emojiGroup.style.marginTop='12px';
  const emojiLabel=el('label',null,'이모티콘:');
  emojiLabel.style.display='block';
  emojiLabel.style.marginBottom='4px';
  emojiLabel.style.fontSize='13px';
  emojiLabel.style.color='#64748b';
  const emojiBtn=document.createElement('button');
  emojiBtn.type='button';
  emojiBtn.className='btn';
  emojiBtn.textContent=selectedEmoji||'😀 이모티콘 선택';
  emojiBtn.style.width='100%';
  emojiBtn.style.padding='10px';
  emojiBtn.style.textAlign='left';
  emojiBtn.style.fontSize='16px';
  emojiBtn.onclick=(e)=>{
    e.stopPropagation();
    showEmojiModal(selectedEmoji,(emoji)=>{
      selectedEmoji=emoji;
      emojiBtn.textContent=emoji||'😀 이모티콘 선택';
    });
  };
  emojiGroup.append(emojiLabel,emojiBtn);
  
  // 색상 선택
  let selectedColor=editMode&&routine?routine.color:'#10b981';
  const colorGroup=el('div','form-group');
  colorGroup.style.marginTop='12px';
  const colorLabel=el('label',null,'색상:');
  colorLabel.style.display='block';
  colorLabel.style.marginBottom='4px';
  colorLabel.style.fontSize='13px';
  colorLabel.style.color='#64748b';
  const colorBtn=document.createElement('button');
  colorBtn.type='button';
  colorBtn.className='btn';
  colorBtn.textContent='🎨 색상 선택';
  colorBtn.style.width='100%';
  colorBtn.style.padding='10px';
  if(selectedColor){
    colorBtn.style.backgroundColor=selectedColor;
    colorBtn.style.color='#fff';
  }
  colorBtn.onclick=(e)=>{
    e.stopPropagation();
    showColorPickerModal(selectedColor,(color)=>{
      selectedColor=color;
      colorBtn.style.backgroundColor=color;
      colorBtn.style.color='#fff';
    });
  };
  colorGroup.append(colorLabel,colorBtn);
  
  form.append(nameGroup,startGroup,endGroup,repeatGroup,emojiGroup,colorGroup);
  
  const footer=el('div','modal-footer');
  footer.style.display='flex';
  footer.style.gap='8px';
  footer.style.justifyContent='flex-end';
  footer.style.marginTop='20px';
  
  const cancelBtn=el('button','btn','취소');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','저장');
  saveBtn.onclick=()=>{
    const text=nameInput.value.trim();
    if(!text){
      alert('루틴 이름을 입력하세요.');
      return;
    }
    
    let routines=[];
    try{
      const saved=localStorage.getItem('memo2.routines');
      if(saved) routines=JSON.parse(saved);
    }catch{}
    
    if(editMode&&routine){
      // 수정: routine.id로 실제 배열에서 찾아서 업데이트
      const targetIdx=routines.findIndex(r=>r.id===routine.id);
      if(targetIdx!==-1){
        routines[targetIdx].text=text;
        routines[targetIdx].startDate=startInput.value;
        routines[targetIdx].endDate=endInput.value;
        routines[targetIdx].repeatDays=repeatDays;
        routines[targetIdx].color=selectedColor;
        routines[targetIdx].emoji=selectedEmoji;
      }
    }else{
      // 새로 추가
      const newId=(routines.length>0?Math.max(...routines.map(r=>r.id))+1:1);
      routines.push({
        id:newId,
        text,
        checked:false,
        startDate:startInput.value,
        endDate:endInput.value,
        repeatDays,
        color:selectedColor,
        emoji:selectedEmoji
      });
    }
    
    localStorage.setItem('memo2.routines',JSON.stringify(routines));
    renderRoutineList();
    modal.remove();
  };
  
  footer.append(cancelBtn,saveBtn);
  box.append(title,form,footer);
  modal.appendChild(box);
  document.body.appendChild(modal);
  
  nameInput.focus();
  
  modal.onclick=(e)=>{
    if(e.target===modal) modal.remove();
  };
}

function showRepeatDayModal(currentDays,onSave){
  const modal=el('div','modal-overlay');
  modal.style.zIndex='10001';
  
  const box=el('div','modal-box');
  box.style.maxWidth='360px';
  box.style.padding='20px';
  
  const title=el('h3','modal-title','반복');
  title.style.fontSize='16px';
  title.style.marginBottom='16px';
  
  const subtitle=el('div');
  subtitle.textContent='요일 선택';
  subtitle.style.fontSize='13px';
  subtitle.style.color='#64748b';
  subtitle.style.marginBottom='12px';
  
  const dayButtons=el('div');
  dayButtons.style.display='flex';
  dayButtons.style.gap='8px';
  dayButtons.style.justifyContent='center';
  dayButtons.style.flexWrap='nowrap';
  
  const dayNames=['일','월','화','수','목','금','토'];
  const selectedDays=[...currentDays];
  
  dayNames.forEach((name,idx)=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.textContent=name;
    btn.style.width='44px';
    btn.style.height='44px';
    btn.style.borderRadius='50%';
    btn.style.border='2px solid #e2e8f0';
    btn.style.background='#fff';
    btn.style.fontSize='14px';
    btn.style.fontWeight='600';
    btn.style.cursor='pointer';
    btn.style.transition='all 0.2s';
    
    const updateStyle=()=>{
      if(selectedDays.includes(idx)){
        btn.style.background='#10b981';
        btn.style.borderColor='#10b981';
        btn.style.color='#fff';
      }else{
        btn.style.background='#fff';
        btn.style.borderColor='#e2e8f0';
        btn.style.color='#111';
      }
    };
    updateStyle();
    
    btn.onclick=()=>{
      const dayIdx=selectedDays.indexOf(idx);
      if(dayIdx>-1){
        selectedDays.splice(dayIdx,1);
      }else{
        selectedDays.push(idx);
      }
      updateStyle();
      updateSummary();
    };
    
    dayButtons.appendChild(btn);
  });
  
  const summary=el('div');
  summary.style.marginTop='16px';
  summary.style.padding='12px';
  summary.style.background='#f8fafc';
  summary.style.borderRadius='8px';
  summary.style.fontSize='13px';
  summary.style.textAlign='center';
  summary.style.color='#64748b';
  
  const updateSummary=()=>{
    if(selectedDays.length===0){
      summary.textContent='반복 수행 주기';
    }else{
      const names=selectedDays.sort((a,b)=>a-b).map(d=>dayNames[d]);
      summary.textContent=`${names.join(',')} 주 ${selectedDays.length}일`;
    }
  };
  updateSummary();
  
  const footer=el('div');
  footer.style.display='flex';
  footer.style.gap='8px';
  footer.style.justifyContent='flex-end';
  footer.style.marginTop='20px';
  
  const cancelBtn=el('button','btn','취소');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','확인');
  saveBtn.onclick=()=>{
    onSave(selectedDays);
    modal.remove();
  };
  
  footer.append(cancelBtn,saveBtn);
  box.append(title,subtitle,dayButtons,summary,footer);
  modal.appendChild(box);
  document.body.appendChild(modal);
  
  modal.onclick=(e)=>{
    if(e.target===modal) modal.remove();
  };
}

function showEmojiModal(currentEmoji,onSave){
  const modal=el('div','modal-overlay');
  modal.style.zIndex='10001';
  
  const box=el('div','modal-box');
  box.style.maxWidth='400px';
  box.style.padding='20px';
  
  const title=el('h3','modal-title','이모티콘 선택');
  title.style.fontSize='16px';
  title.style.marginBottom='16px';
  
  // 이모티콘 그리드
  const emojiGrid=el('div');
  emojiGrid.style.display='grid';
  emojiGrid.style.gridTemplateColumns='repeat(8, 1fr)';
  emojiGrid.style.gap='8px';
  emojiGrid.style.marginBottom='16px';
  
  const emojis=[
    // 얼굴 & 감정
    '😀','😊','😎','🤗','😍','🥰','😘','😜','🤔','😴','😇','🤩','🥳','😤','😱','🤯','😂','🤣','😁','😅','😆','🙂','🥲','😋','😛','🤪','😝','🤑','🤭','🤫','🤐','😐','😑','😶','🙄','😬','😌','😔','😪','🤤','😷','🤒','🤕','🥴','😵','🤠','🥳','🤓','🧐',
    // 손 & 제스처
    '👍','👎','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','🤙','👌','🤌','🤏','✊','👊','🤛','🤜','👋','🤚','🖐️','✋','🖖','👈','👉','👆','👇','☝️','🫵','👍','💪','🦾',
    // 하트 & 사랑
    '❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💗','💖','💕','💞','💓','💝','❣️','💟','💌',
    // 기호 & 아이콘
    '✨','⭐','🌟','💫','✴️','🔥','💥','💢','💯','✅','❌','⭕','❓','❗','🔔','🔕','🎵','🎶','💤','💬','💭','🗯️',
    // 활동 & 스포츠
    '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🏆','🥇','🥈','🥉','🏅','🎖️',
    // 음식 & 음료
    '🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🍄','🥜','🫘','🌰','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🍳','🥘','🍲','🫕','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🫗','🥤','🧋','🧃','🧉','🧊',
    // 여행 & 장소
    '🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','♨️','🎠','🎡','🎢','💈','🎪',
    // 교통
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','🪝','⛽','🚧','🚦','🚥',
    // 자연 & 날씨
    '🌍','🌎','🌏','🌐','🗺️','🗾','🧭','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','💧','💦','☔','☂️','🌊','🌫️','🌈','⚡','🔥',
    // 동물 & 식물
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🌾','💐','🌷','🌹','🥀','🪷','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐','🌟','✨','⚡','☄️','💥','🔥','🌪️','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','💧','💦','☔','☂️','🌊','🌫️',
    // 사물 & 도구
    '⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','🪪','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','🩻','🩼','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓',
    // 활동 & 취미
    '🎯','🎨','🎭','🩰','🎪','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎳','🎮','🎰','🧩','🎪',
    // 기타 기호
    '🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪','🟥','🟧','🟨','🟩','🟦','🟪','🟫','⬛','⬜','◼️','◻️','◾','◽','▪️','▫️','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔳','🔲'
  ];
  
  let selectedEmoji=currentEmoji||'';
  
  emojis.forEach(emoji=>{
    const btn=el('button');
    btn.textContent=emoji;
    btn.style.fontSize='24px';
    btn.style.padding='8px';
    btn.style.border='2px solid transparent';
    btn.style.borderRadius='8px';
    btn.style.background='var(--card)';
    btn.style.cursor='pointer';
    btn.style.transition='all 0.2s';
    
    if(emoji===selectedEmoji){
      btn.style.borderColor='#3b82f6';
      btn.style.background='#dbeafe';
    }
    
    btn.onclick=()=>{
      selectedEmoji=emoji;
      // 모든 버튼 초기화
      emojiGrid.querySelectorAll('button').forEach(b=>{
        b.style.borderColor='transparent';
        b.style.background='var(--card)';
      });
      // 선택된 버튼 강조
      btn.style.borderColor='#3b82f6';
      btn.style.background='#dbeafe';
    };
    
    emojiGrid.appendChild(btn);
  });
  
  const footer=el('div');
  footer.style.display='flex';
  footer.style.gap='8px';
  footer.style.justifyContent='flex-end';
  
  const clearBtn=el('button','btn','지우기');
  clearBtn.onclick=()=>{
    onSave('');
    modal.remove();
  };
  
  const cancelBtn=el('button','btn','취소');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','확인');
  saveBtn.onclick=()=>{
    onSave(selectedEmoji);
    modal.remove();
  };
  
  footer.append(clearBtn,cancelBtn,saveBtn);
  box.append(title,emojiGrid,footer);
  modal.appendChild(box);
  document.body.appendChild(modal);
  
  modal.onclick=(e)=>{
    if(e.target===modal) modal.remove();
  };
}

function showColorPickerModal(currentColor,onSave){
  const modal=el('div','modal-overlay');
  modal.style.zIndex='10001';
  
  const box=el('div','modal-box');
  box.style.maxWidth='360px';
  box.style.padding='20px';
  
  const title=el('h3','modal-title','색상 선택');
  title.style.fontSize='16px';
  title.style.marginBottom='16px';
  
  // 색상 그리드
  const colorGrid=el('div');
  colorGrid.style.display='grid';
  colorGrid.style.gridTemplateColumns='repeat(6, 1fr)';
  colorGrid.style.gap='12px';
  colorGrid.style.marginBottom='16px';
  
  const colors=[
    '#10b981','#22c55e','#84cc16','#eab308','#f59e0b','#f97316',
    '#ef4444','#ec4899','#d946ef','#a855f7','#8b5cf6','#6366f1',
    '#3b82f6','#0ea5e9','#06b6d4','#14b8a6','#64748b','#475569'
  ];
  
  let selectedColor=currentColor||'#10b981';
  
  colors.forEach(color=>{
    const btn=el('button');
    btn.style.width='100%';
    btn.style.height='40px';
    btn.style.backgroundColor=color;
    btn.style.border='3px solid transparent';
    btn.style.borderRadius='8px';
    btn.style.cursor='pointer';
    btn.style.transition='all 0.2s';
    
    if(color===selectedColor){
      btn.style.borderColor='#fff';
      btn.style.boxShadow='0 0 0 2px #3b82f6';
    }
    
    btn.onclick=()=>{
      selectedColor=color;
      // 모든 버튼 초기화
      colorGrid.querySelectorAll('button').forEach(b=>{
        b.style.borderColor='transparent';
        b.style.boxShadow='none';
      });
      // 선택된 버튼 강조
      btn.style.borderColor='#fff';
      btn.style.boxShadow='0 0 0 2px #3b82f6';
    };
    
    colorGrid.appendChild(btn);
  });
  
  const footer=el('div');
  footer.style.display='flex';
  footer.style.gap='8px';
  footer.style.justifyContent='flex-end';
  
  const cancelBtn=el('button','btn','취소');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','확인');
  saveBtn.onclick=()=>{
    onSave(selectedColor);
    modal.remove();
  };
  
  footer.append(cancelBtn,saveBtn);
  box.append(title,colorGrid,footer);
  modal.appendChild(box);
  document.body.appendChild(modal);
  
  modal.onclick=(e)=>{
    if(e.target===modal) modal.remove();
  };
}

function widgetAlarm(){
  const sounds=[
    {label:'Beep',src:'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA'},
    {label:'Bell',src:'data:audio/wav;base64,UklGRoQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRgAAAAA'}
  ];
  return makeWidget('알람', (isPopup, win)=>{
    ensureTimeStyles(win);
    const doc=win.document;
    const card=doc.createElement('div'); card.className='time-card';
    const circle=doc.createElement('div'); circle.className='time-circle';
    const label=doc.createElement('div'); label.className='time-circle__label'; label.textContent='--:--';
    circle.appendChild(label);
    const sub=doc.createElement('div'); sub.className='time-sub'; sub.textContent='알람 꺼짐';

    const grid=doc.createElement('div'); grid.className='time-grid';
    const ih=doc.createElement('input'); ih.type='number'; ih.placeholder='시'; ih.min=0; ih.max=23;
    const im=doc.createElement('input'); im.type='number'; im.placeholder='분'; im.min=0; im.max=59;
    const sound=doc.createElement('select'); sounds.forEach(s=>{ const o=doc.createElement('option'); o.value=s.src; o.textContent=s.label; sound.appendChild(o); });
    grid.append(ih,im,sound);

    const actions=doc.createElement('div'); actions.className='time-actions';
    const onBtn=el('button','btn','켜기'); const offBtn=el('button','btn','끄기'); const testBtn=el('button','btn','소리 테스트');
    actions.append(onBtn,offBtn,testBtn);

    card.append(circle,sub,grid,actions);

    let alarmTimer=null, alarmAudio=null, targetTs=null;
    const stopSound=()=>{ if(alarmAudio){ alarmAudio.pause?.(); alarmAudio.currentTime=0; alarmAudio=null; } };
    const fallbackTone=(once)=>{
      const ctx=new (win.AudioContext||win.webkitAudioContext)();
      const osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.value=880;
      const gain=ctx.createGain(); gain.gain.value=0.12; osc.connect(gain).connect(ctx.destination);
      osc.start();
      if(once){ win.setTimeout(()=>{osc.stop(); ctx.close();}, 800);} else { alarmAudio={pause:()=>{osc.stop(); ctx.close();}, currentTime:0}; }
    };
    const playSound=(once=false)=>{
      stopSound();
      try{
        alarmAudio=new win.Audio(sound.value||sounds[0].src); alarmAudio.loop=!once;
        const p=alarmAudio.play();
        if(p?.catch) p.catch(()=>fallbackTone(once));
      }catch(err){ fallbackTone(once); }
    };
    const clearTimer=()=>{ if(alarmTimer){ win.clearInterval(alarmTimer); alarmTimer=null; } targetTs=null; };
    const schedule=()=>{
      stopSound(); clearTimer();
      const hRaw=Number(ih.value); const mRaw=Number(im.value);
      if(Number.isNaN(hRaw)||Number.isNaN(mRaw)){ sub.textContent='시간을 입력하세요'; label.textContent='--:--'; return; }
      const h=Math.min(23,Math.max(0,Math.floor(hRaw))); const m=Math.min(59,Math.max(0,Math.floor(mRaw)));
      ih.value=h; im.value=m;
      const now=new Date(); const target=new Date(); target.setHours(h,m,0,0); if(target<=now) target.setDate(target.getDate()+1);
      targetTs=target.getTime();
      label.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      sub.textContent=`다음 알람 ${target.toLocaleTimeString()}`;
      alarmTimer=win.setInterval(()=>{
        if(targetTs && Date.now()>=targetTs){ clearTimer(); playSound(false); sub.textContent='알람 울림!'; }
      }, 500);
    };

    onBtn.onclick=schedule;
    offBtn.onclick=()=>{ clearTimer(); stopSound(); sub.textContent='알람 꺼짐'; label.textContent='--:--'; };
    testBtn.onclick=()=>{ playSound(true); sub.textContent='소리 미리듣기'; };

    return card;
  }, 'widget--alarm');
}

function buildStopwatchCard(win,isPopup){
  ensureTimeStyles(win);
  const doc=win.document;
  const card=doc.createElement('div');
  card.className='stopwatch-card'+(isPopup?' stopwatch-card--popup':' stopwatch-card--inline');
  card.style.overflow='hidden';
  card.style.width='100%';
  card.style.boxSizing='border-box';

  const ringParts=buildProgressRing(doc,getCircleSize(),'stopwatch-time timer__display');
  const {ring,disp,setProgress}=ringParts;
  disp.textContent='00:00.00';
  setProgress(0);

  const sub=doc.createElement('div');
  sub.className='stopwatch-status';
  sub.textContent='대기';

  const actions=doc.createElement('div');
  actions.className='stopwatch-actions';
  const startBtn=doc.createElement('button');
  startBtn.type='button';
  startBtn.className='stopwatch-btn stopwatch-btn--primary';
  startBtn.textContent='시작';
  const pauseBtn=doc.createElement('button');
  pauseBtn.type='button';
  pauseBtn.className='stopwatch-btn stopwatch-btn--primary';
  pauseBtn.textContent='일시정지';
  const resetBtn=doc.createElement('button');
  resetBtn.type='button';
  resetBtn.className='stopwatch-btn stopwatch-btn--reset';
  resetBtn.textContent='리셋';
  actions.append(startBtn,pauseBtn,resetBtn);

  card.append(ring,sub,actions);

  let segmentStart=0, accMs=0, raf=null, running=false;
  const fmt=(ms)=>{
    const cs=Math.floor(ms/10)%100; const s=Math.floor(ms/1000)%60; const m=Math.floor(ms/60000);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  };
  const currentMs=()=> running ? accMs+(Date.now()-segmentStart) : accMs;
  const updateDisplay=(ms)=>{
    disp.textContent=fmt(ms);
    setProgress((ms%60000)/60000);
  };
  card._resizeStopwatchRing=()=>{
    ringParts.resize(getCircleSize());
    updateDisplay(currentMs());
  };
  const tick=()=>{
    if(!running) return;
    updateDisplay(currentMs());
    raf=win.requestAnimationFrame(tick);
  };
  const applyFromStorage=()=>{
    const ms=readStopwatchMs();
    const isRunning=localStorage.getItem('stopwatch_is_running')==='true';
    const base=parseInt(localStorage.getItem('stopwatch_elapsed_ms')||'0',10)||0;
    const start=parseInt(localStorage.getItem('stopwatch_start_time')||'0',10)||0;
    if(raf){ win.cancelAnimationFrame(raf); raf=null; }
    if(isRunning&&start){
      running=true; accMs=base; segmentStart=start; sub.textContent='측정 중';
      updateDisplay(ms); raf=win.requestAnimationFrame(tick);
    }else{
      running=false; accMs=ms; segmentStart=0;
      updateDisplay(ms); sub.textContent=ms>0?'일시정지':'대기';
    }
  };

  startBtn.onclick=()=>{
    if(running) return;
    segmentStart=Date.now(); running=true; sub.textContent='측정 중';
    persistStopwatch(true,accMs,segmentStart);
    raf=win.requestAnimationFrame(tick);
  };
  pauseBtn.onclick=()=>{
    if(!running){
      segmentStart=Date.now(); running=true; sub.textContent='측정 중';
      persistStopwatch(true,accMs,segmentStart);
      raf=win.requestAnimationFrame(tick);
      return;
    }
    running=false; accMs=currentMs(); segmentStart=0; sub.textContent='일시정지';
    persistStopwatch(false,accMs);
    updateDisplay(accMs);
    if(raf){ win.cancelAnimationFrame(raf); raf=null; }
  };
  resetBtn.onclick=()=>{
    running=false; accMs=0; segmentStart=0; updateDisplay(0); sub.textContent='대기';
    clearStopwatchStorage();
    if(raf){ win.cancelAnimationFrame(raf); raf=null; }
  };

  const onSwSync=()=> applyFromStorage();
  win.addEventListener('jcal-stopwatch-sync',onSwSync);
  win.addEventListener('storage',(e)=>{ if(SW_LS_KEYS.includes(e.key)) onSwSync(); });
  applyFromStorage();

  return card;
}

function initStopwatchPage(){
  const host=document.getElementById('stopwatchPageContent');
  if(!host||host.dataset.initialized==='true') return;
  host.dataset.initialized='true';
  host.innerHTML='';
  host.appendChild(buildStopwatchCard(window,false));
  if(!window._jcalStopwatchResizeBound){
    window._jcalStopwatchResizeBound=true;
    window.addEventListener('resize',()=>{
      const card=document.querySelector('#stopwatchPageContent .stopwatch-card');
      if(card&&typeof card._resizeStopwatchRing==='function') card._resizeStopwatchRing();
    });
  }
}

function widgetStopwatch(){
  return makeWidget('스탑워치',(isPopup, win)=> buildStopwatchCard(win,!!isPopup), 'widget--stopwatch');
}

/* ── 동기화 미니 달력/메모/투두 위젯 ── */
function widgetCalendar(options){
  const opts=options||{};
  const popupOnly=!!opts.popupOnly;
  function build(isPopup, win){
    const doc=win.document;
    const W=doc.createElement('div');
    W.style.display='flex';
    W.style.flexDirection='column';
    W.style.height='100%';
    W.style.boxSizing='border-box';
    const head=doc.createElement('div'); head.className='mini-cal__head';
    const prev=doc.createElement('button'); prev.className='btn'; prev.textContent='◀';
    const title=doc.createElement('span'); const next=doc.createElement('button'); next.className='btn'; next.textContent='▶';
    const today=doc.createElement('button'); today.className='btn'; today.textContent='오늘';
    head.append(prev,title,next,today);
    const days=doc.createElement('div'); days.className='mini-cal__days';
    const grid=doc.createElement('div'); grid.className='mini-cal__grid';
    grid.style.flex='1';
    grid.style.minHeight='0';
    grid.style.height='100%';
    grid.style.display='grid';
    grid.style.gridTemplateColumns='repeat(7, minmax(0,1fr))';
    grid.style.width='100%';
    grid.style.minWidth='0';
    W.append(head,days,grid);

    ['일','월','화','수','목','금','토'].forEach(k=>{const s=doc.createElement('span'); s.textContent=k; days.appendChild(s);});

    let view=new Date(localStorage.getItem('memo2.selected')||fmtLocalDate(new Date())); view.setDate(1);
    const rows=6; // always show full 6 weeks
    const LINE_UNIT=17;
    const PADDING_RESERVE=26;
    const RAINBOW_GRAD='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';

    const getVisibleCount=(cell)=>{
      let height=cell?.getBoundingClientRect().height;
      if(!height || !Number.isFinite(height) || height<=40){
        const rect=grid.getBoundingClientRect();
        if(rect.height>0) height=rect.height/rows;
      }
      if(!height || !Number.isFinite(height) || height<=40) height=90;
      const usable=height-PADDING_RESERVE;
      const raw=Math.floor(usable/LINE_UNIT);
      return Math.max(1, Math.min(12, raw));
    };

    const applyMiniColor=(node,item)=>{
      node.style.background='transparent';
      node.style.backgroundColor='transparent';
       node.style.borderRadius='0';
       node.style.padding='0';
      node.style.color=item.done?'#94a3b8':'#1f2937';
      if(item.done) return;
      if(item.color==='rainbow'){
        node.style.background=RAINBOW_GRAD;
        node.style.color='#fff';
        return;
      }
      if(item.color){
        node.style.backgroundColor=item.color;
        try{
          let hex=item.color.replace('#','');
          if(hex.length===3){ hex=[hex[0],hex[0],hex[1],hex[1],hex[2],hex[2]].join(''); }
          const r=parseInt(hex.slice(0,2),16);
          const g=parseInt(hex.slice(2,4),16);
          const b=parseInt(hex.slice(4,6),16);
          const lum=(0.299*r+0.587*g+0.114*b)/255;
          node.style.color=lum>0.6?'#111827':'#ffffff';
        }catch{}
      }
    };

    function r(){
      title.textContent=ymLabel(view.getFullYear(), view.getMonth());
      grid.innerHTML='';
      const y=view.getFullYear(), m=view.getMonth();
      const first=new Date(y,m,1), start=first.getDay(), total=dim(y,m);
      const prevTotal=new Date(y,m,0).getDate(), cells=rows*7;
      grid.style.gridTemplateRows=`repeat(${rows}, minmax(0,1fr))`;
      const selectedKey=localStorage.getItem('memo2.selected');

      for(let i=0;i<cells;i++){
        const cell=doc.createElement('div'); cell.className='mini-day';
        cell.style.minHeight='0';
        cell.style.minWidth='0';
        grid.append(cell);
        let n,d,out=false;
        if(i<start){n=prevTotal-start+1+i; d=new Date(y,m-1,n); out=true;}
        else if(i>=start+total){n=i-(start+total)+1; d=new Date(y,m+1,n); out=true;}
        else{n=i-start+1; d=new Date(y,m,n);}
        const num=doc.createElement('div'); num.className='mini-day__num'; num.textContent=n;
        if(out) cell.classList.add('mini-day--out');
        if(fmtLocalDate(d)===selectedKey) cell.classList.add('mini-day--sel');
        cell.append(num);

        const dstr=fmtLocalDate(d);
        const todos=get(kTodo(dstr));
        if(todos.length){
          const labels=doc.createElement('div'); labels.className='mini-labels';
          labels.style.gap='0';
          labels.style.width='100%';
          const visibleCount=getVisibleCount(cell);
          const visible=todos.slice(0,visibleCount);
          visible.forEach(t=>{
            const row=doc.createElement('div'); row.className='mini-label';
            row.style.margin='0';
            row.style.padding='0';
            row.style.width='100%';
            row.style.display='flex';
            row.style.alignItems='center';
            row.style.gap='3px';
            row.style.cursor='pointer';
            row.style.userSelect='none';
            row.tabIndex=0;
            row.setAttribute('role','checkbox');
            row.setAttribute('aria-checked', t.done?'true':'false');
            if(t.done) row.classList.add('done');

            const text=doc.createElement('span');
            text.textContent=t.text;
            text.style.flex='1';
            text.style.overflow='hidden';
            text.style.textOverflow='ellipsis';
            text.style.whiteSpace='nowrap';
            row.textContent='';
            row.append(text);
            applyMiniColor(row,t);

            const toggleDone=(e)=>{
              e.stopPropagation();
              const idx=todos.indexOf(t);
              if(idx===-1) return;
              todos[idx].done=!todos[idx].done;
              set(kTodo(dstr),todos);
              row.setAttribute('aria-checked', todos[idx].done?'true':'false');
              postApp({type:'refresh'});
              r();
            };
            row.addEventListener('click',toggleDone);
            row.addEventListener('keydown',(e)=>{
              if(e.key==='Enter'||e.key===' '){
                e.preventDefault();
                toggleDone(e);
              }
            });

            labels.append(row);
          });
          if(todos.length>visible.length){
            const more=doc.createElement('div'); more.className='mini-more';
            more.style.margin='0';
            more.style.padding='0';
            more.style.textAlign='right';
            more.textContent=`+${todos.length-visible.length}`;
            labels.append(more);
          }
          cell.append(labels);
        }

        cell.onclick=()=>{ localStorage.setItem('memo2.selected', fmtLocalDate(d)); postApp({type:'select',date:fmtLocalDate(d)}); };
      }
    }
    prev.onclick=()=>{ view=new Date(view.getFullYear(), view.getMonth()-1, 1); r();};
    next.onclick=()=>{ view=new Date(view.getFullYear(), view.getMonth()+1, 1); r();};
    today.onclick=()=>{ view=new Date(); view.setDate(1); localStorage.setItem('memo2.selected', fmtLocalDate(new Date())); postApp({type:'select',date:fmtLocalDate(new Date())}); r();};
    win.addEventListener('storage',(e)=>{ if(e.key==='memo2.selected'||e.key?.startsWith('memo2.todos.')) r(); });
    if('BroadcastChannel' in win){ const bc=new win.BroadcastChannel(APP_CH); bc.onmessage=(m)=>{ if(m.data?.type==='select'||m.data?.type==='refresh') r(); }; }
    if(win.ResizeObserver){
      const ro=new win.ResizeObserver(()=>r());
      ro.observe(W);
      win.addEventListener('unload',()=>ro.disconnect(),{once:true});
    }
    r();
    return W;
  }
  if(popupOnly) return openWidgetPopup('달력', build);
  return makeWidget('달력', build, 'widget--calendar');
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
    const load=()=> JSON.parse(win.localStorage.getItem(kMemo(getSel()))||'[]');

    function render(){
      ul.innerHTML='';
      const items=load();
      if(!items.length){
        const empty=doc.createElement('li');
        empty.textContent='등록된 메모가 없습니다.';
        empty.style.fontSize='13px';
        empty.style.color='#94a3b8';
        empty.style.textAlign='center';
        empty.style.padding='16px 0';
        ul.append(empty);
        return;
      }
      items.forEach((it)=>{
        const li=doc.createElement('li');
        li.style.display='block';
        const tx=doc.createElement('span');
        tx.textContent=(it.emoji?`${it.emoji} `:'')+it.text;
        tx.style.display='block';
        tx.style.padding='8px 10px';
        tx.style.borderRadius='10px';
        tx.style.wordBreak='break-word';
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
    win.addEventListener('storage',(e)=>{ if(e.key==='memo2.selected'||e.key?.startsWith('memo2.memos.')) render(); });
    if('BroadcastChannel' in win){ const bc=new win.BroadcastChannel(APP_CH); bc.onmessage=(m)=>{ if(m.data?.type) render(); }; }
    render(); return W;
  }
  return makeWidget('메모', build, 'widget--memo');
}
function widgetTodo(){
  function build(isPopup, win){
    const doc=win.document;
    const W=doc.createElement('div');
    W.style.display='flex';
    W.style.flexDirection='column';
    W.style.height='100%';
    W.style.boxSizing='border-box';
    W.style.padding='8px 12px 12px';

    const header=doc.createElement('div');
    header.style.display='flex';
    header.style.alignItems='center';
    header.style.justifyContent='space-between';
    header.style.marginBottom='8px';

    const title=doc.createElement('span');
    title.textContent='✅ TODO';
    title.style.fontWeight='700';
    title.style.fontSize='14px';
    title.style.color='#15803d';
    header.append(title);

    const nav=doc.createElement('div');
    nav.style.display='flex';
    nav.style.alignItems='center';
    nav.style.gap='6px';

    const prev=doc.createElement('button');
    prev.className='btn';
    prev.textContent='◀';
    prev.style.padding='4px 8px';
    prev.style.fontSize='12px';

    const dateLabel=doc.createElement('span');
    dateLabel.style.fontWeight='600';
    dateLabel.style.fontSize='13px';
    dateLabel.style.minWidth='96px';
    dateLabel.style.textAlign='center';

    const next=doc.createElement('button');
    next.className='btn';
    next.textContent='▶';
    next.style.padding='4px 8px';
    next.style.fontSize='12px';

    nav.append(prev,dateLabel,next);
    header.append(nav);
    W.append(header);

    const listWrap=doc.createElement('div');
    listWrap.style.flex='1';
    listWrap.style.minHeight='0';
    listWrap.style.overflow='auto';

    const ul=doc.createElement('ul');
    ul.style.listStyle='none';
    ul.style.padding='0';
    ul.style.margin='0';
    ul.style.display='flex';
    ul.style.flexDirection='column';
    ul.style.gap='6px';
    listWrap.append(ul);
    W.append(listWrap);

    const channel=('BroadcastChannel' in win)? new win.BroadcastChannel(APP_CH):null;
    const notify=(msg)=>{ channel?.postMessage(msg); };
    if(channel){ win.addEventListener('unload',()=>channel.close(),{once:true}); }

    function clampDate(d){
      const base=new Date(d.getFullYear(), d.getMonth(), d.getDate());
      base.setHours(0,0,0,0);
      return base;
    }

    let viewDate=(()=>{ const stored=win.localStorage.getItem('memo2.selected'); return clampDate(stored?parseLocalDate(stored):new Date()); })();

    const key=()=>kTodo(fmtLocalDate(viewDate));
    const load=()=>{
      try{ return JSON.parse(win.localStorage.getItem(key())||'[]'); }
      catch{ return []; }
    };
    const save=(arr)=>{
      win.localStorage.setItem(key(), JSON.stringify(arr));
      notify({type:'refresh'});
      postApp({type:'refresh'});
    };

    const updateLabel=()=>{ dateLabel.textContent=fmtLocalDate(viewDate); };

    function render(){
      updateLabel();
      ul.innerHTML='';
      const todos=load();
      if(!todos.length){
        const empty=doc.createElement('li');
        empty.textContent='할 일이 없습니다';
        empty.style.listStyle='none';
        empty.style.fontSize='12px';
        empty.style.color='#9ca3af';
        empty.style.textAlign='center';
        empty.style.padding='8px 0';
        ul.append(empty);
        return;
      }
      todos.forEach((it,i)=>{
        const li=doc.createElement('li');
        li.style.display='flex';
        li.style.alignItems='center';
        li.style.gap='8px';

        const chk=doc.createElement('input');
        chk.type='checkbox';
        chk.checked=!!it.done;
        const applyToggle=(checked)=>{
          const arr=load();
          if(arr[i]) arr[i].done=checked;
          save(arr);
          render();
        };
        chk.onclick=(e)=>{ e.stopPropagation(); applyToggle(chk.checked); };

        const label=doc.createElement('span');
        label.style.flex='1';
        label.style.fontSize='13px';
        label.style.display='flex';
        label.style.alignItems='center';
        label.style.gap='6px';
        label.style.whiteSpace='nowrap';
        label.style.overflow='hidden';
        label.style.textOverflow='ellipsis';

        if(it.emoji){
          const emoji=doc.createElement('span');
          emoji.textContent=it.emoji;
          label.append(emoji);
        }

        const text=doc.createElement('span');
        text.textContent=it.text;
        text.style.flex='1';
        text.style.fontSize='16px';
        text.style.overflow='hidden';
        text.style.textOverflow='ellipsis';
        text.style.whiteSpace='nowrap';
        if(it.done){
          text.style.color='#9aa5b1';
          text.style.textDecoration='line-through';
        }else{
          if(it.color==='rainbow'){
            text.style.color='#2563eb';
          }else if(it.color){
            text.style.color=it.color;
          }else{
            text.style.color='#111827';
          }
          text.style.textDecoration='none';
        }
        label.onclick=()=>{
          chk.checked=!chk.checked;
          applyToggle(chk.checked);
        };

        label.append(text);
        li.append(chk,label);
        ul.append(li);
      });
    }

    const setViewDate=(date,broadcast)=>{
      viewDate=clampDate(date);
      if(broadcast){
        const str=fmtLocalDate(viewDate);
        win.localStorage.setItem('memo2.selected',str);
        notify({type:'select',date:str});
        postApp({type:'select',date:str});
      }
    };
    const shiftDay=(delta)=>{
      const next=new Date(viewDate);
      next.setDate(next.getDate()+delta);
      setViewDate(next,true);
      render();
    };

    prev.onclick=()=>shiftDay(-1);
    next.onclick=()=>shiftDay(1);

    const handleStorage=(e)=>{
      if(e.key==='memo2.selected' && e.newValue){
        const incoming=clampDate(parseLocalDate(e.newValue));
        if(fmtLocalDate(incoming)!==fmtLocalDate(viewDate)){
          setViewDate(incoming,false);
          render();
        }
      }
      if(e.key?.startsWith('memo2.todos.')){
        if(e.key===key()) render();
      }
    };
    win.addEventListener('storage',handleStorage);

    if(channel){
      channel.onmessage=(ev)=>{
        const data=ev.data||ev;
        if(data?.type==='select' && data.date){
          const incoming=clampDate(parseLocalDate(data.date));
          if(fmtLocalDate(incoming)!==fmtLocalDate(viewDate)){
            setViewDate(incoming,false);
            render();
          }
        }else if(data?.type==='refresh'){
          render();
        }
      };
    }

    render();
    return W;
  }
  return makeWidget('ToDo', build, 'widget--todo');
}

/* ── 사용법 표시 ── */
const usageTexts = {
  calendar: {
    intro: `
      <p><strong>달력 기능</strong>은 Jay 캘린더의 핵심 기능으로, 월간 일정을 한눈에 볼 수 있는 직관적인 인터페이스를 제공합니다. 구글 캘린더와 유사한 디자인으로 누구나 쉽게 사용할 수 있으며, 일정과 할 일을 체계적으로 관리할 수 있습니다.</p>
      <p>달력은 메인 화면에 항상 표시되어 있어 별도로 열 필요가 없습니다. 각 날짜 칸에는 해당 날짜의 일정과 할 일이 표시되며, 색상과 이모티콘으로 시각적으로 구분할 수 있습니다.</p>
      <p>이달의 목표 기능을 통해 매달 달성하고자 하는 목표를 설정하고, 달력을 통해 진행 상황을 확인할 수 있습니다.</p>
    `,
    method: `
      <p><strong>달력 사용 방법:</strong></p>
      <ul>
        <li><strong>날짜 선택:</strong> 달력에서 원하는 날짜를 클릭하면 우측 패널에 해당 날짜의 상세 정보가 표시됩니다</li>
        <li><strong>월 이동:</strong> ◀ ▶ 버튼을 클릭하여 이전 달, 다음 달로 이동할 수 있습니다</li>
        <li><strong>오늘로 이동:</strong> 화면 상단의 "7" 버튼(오늘 날짜)을 클릭하면 현재 날짜로 바로 이동합니다</li>
        <li><strong>이달의 목표 설정:</strong> 상단의 입력창에 이달의 목표를 입력하고 Enter를 누르면 저장됩니다</li>
        <li><strong>일정 확인:</strong> 각 날짜 칸에는 최대 6줄의 일정이 표시되며, 체크박스로 완료 여부를 표시할 수 있습니다</li>
        <li><strong>색상 구분:</strong> 일정마다 다른 색상을 지정하여 업무, 개인 일정 등을 구분할 수 있습니다</li>
        <li><strong>이모티콘 활용:</strong> 각 일정에 이모티콘을 추가하여 내용을 더 직관적으로 표현할 수 있습니다</li>
      </ul>
    `,
    widget: `
      <p><strong>달력 위젯</strong>은 별도의 팝업 창으로 달력을 표시하는 기능입니다. 왼쪽 사이드바의 "🗓 달력" 버튼을 클릭하면 위젯이 열립니다.</p>
      <ul>
        <li><strong>위젯 열기:</strong> 사이드바에서 "🗓 달력" 버튼 클릭</li>
        <li><strong>위젯 이동:</strong> 위젯 상단의 제목 부분을 마우스로 드래그하여 원하는 위치로 이동</li>
        <li><strong>크기 조절:</strong> 위젯 오른쪽 하단 모서리를 드래그하여 크기를 자유롭게 조절</li>
        <li><strong>위젯 닫기:</strong> 위젯 상단의 X 버튼을 클릭하여 닫기</li>
        <li><strong>다중 위젯:</strong> 여러 개의 위젯을 동시에 열어 비교하며 사용 가능</li>
        <li><strong>미니 달력:</strong> 위젯의 달력은 메인 화면과 동기화되어 같은 데이터를 공유합니다</li>
      </ul>
    `
  },
  memo: {
    intro: `
      <p><strong>메모 기능</strong>은 날짜별로 간단한 메모를 저장하고 관리할 수 있는 기능입니다. 일정과 별도로 자유로운 형식의 텍스트를 기록할 수 있어, 일기, 아이디어, 메모 등 다양한 용도로 활용할 수 있습니다.</p>
      <p>메모는 브라우저의 로컬 스토리지에 저장되어 별도의 로그인 없이도 안전하게 보관됩니다. 각 메모에는 이모티콘과 색상을 지정하여 시각적으로 구분할 수 있습니다.</p>
      <p>메모 기능은 우측 패널의 "⎙ 메모" 섹션에서 사용할 수 있으며, 날짜별로 여러 개의 메모를 작성할 수 있습니다.</p>
    `,
    method: `
      <p><strong>메모 사용 방법:</strong></p>
      <ul>
        <li><strong>메모 작성:</strong> 우측 패널 하단의 메모 입력창에 내용을 입력하고 "저장" 버튼을 클릭하거나 Enter를 누릅니다</li>
        <li><strong>날짜 선택:</strong> 메모를 작성하고 싶은 날짜를 먼저 선택한 후 입력합니다</li>
        <li><strong>여러 줄 입력:</strong> Shift+Enter를 눌러 여러 줄의 메모를 작성할 수 있습니다</li>
        <li><strong>메모 수정:</strong> 저장된 메모를 더블클릭하면 수정 모드로 전환됩니다</li>
        <li><strong>메모 삭제:</strong> 메모 우측의 ⋮ 버튼을 클릭하고 "🗑 삭제"를 선택합니다</li>
        <li><strong>이모티콘 추가:</strong> ⋮ 버튼 → "💬 이모티콘 변경"을 클릭하여 다양한 이모티콘 선택</li>
        <li><strong>색상 지정:</strong> ⋮ 버튼 → "🎨 색상 변경"을 클릭하여 원하는 색상 선택</li>
        <li><strong>메모 정렬:</strong> 메모를 드래그하여 순서를 변경할 수 있습니다</li>
      </ul>
    `,
    widget: `
      <p><strong>메모 위젯</strong>을 사용하면 별도의 창에서 메모를 관리할 수 있습니다. 왼쪽 사이드바의 "⎙ 메모" 버튼을 클릭하면 위젯이 열립니다.</p>
      <ul>
        <li><strong>위젯 활용:</strong> 메인 화면과 별개로 메모만 집중해서 작성하고 관리할 수 있습니다</li>
        <li><strong>날짜 전환:</strong> 위젯 내에서 날짜를 변경하며 여러 날짜의 메모를 빠르게 확인</li>
        <li><strong>자동 저장:</strong> 메모는 입력 즉시 브라우저에 자동으로 저장됩니다</li>
        <li><strong>데이터 동기화:</strong> 메인 화면과 위젯의 메모는 실시간으로 동기화됩니다</li>
        <li><strong>검색 기능:</strong> 향후 업데이트에서 메모 검색 기능이 추가될 예정입니다</li>
      </ul>
    `
  },
  todo: {
    intro: `
      <p><strong>할 일(To-Do) 기능</strong>은 업무와 일상의 작은 과제들을 체계적으로 관리할 수 있도록 도와주는 기능입니다. 간단한 체크리스트부터 시작 날짜와 종료 날짜가 있는 프로젝트성 업무까지 모두 관리할 수 있습니다.</p>
      <p>To-Do는 일정 등록 기능과 통합되어 있어, 시간이 지정된 일정과 시간 없는 할 일을 함께 관리할 수 있습니다. 각 항목에는 체크박스가 있어 완료 여부를 즉시 표시할 수 있습니다.</p>
      <p>색상과 이모티콘을 활용하여 우선순위나 카테고리를 시각적으로 구분할 수 있으며, 드래그 앤 드롭으로 순서를 쉽게 변경할 수 있습니다.</p>
    `,
    method: `
      <p><strong>할 일 사용 방법:</strong></p>
      <ul>
        <li><strong>할 일 추가:</strong> "할 일을 입력하고 Enter" 입력창에 내용을 입력하고 Enter를 누르거나 "저장" 버튼 클릭</li>
        <li><strong>날짜 지정:</strong> 시작 날짜와 종료 날짜를 설정하여 기간이 있는 작업을 관리</li>
        <li><strong>시간 지정:</strong> 시간을 입력하면 일정으로 등록되고, 비워두면 할 일로 등록됩니다</li>
        <li><strong>완료 체크:</strong> 체크박스를 클릭하여 완료 표시, 다시 클릭하면 완료 취소</li>
        <li><strong>순서 변경:</strong> 항목을 드래그하여 위아래로 이동하며 우선순위 조정</li>
        <li><strong>내용 수정:</strong> 항목을 더블클릭하면 수정 모드로 전환되어 내용을 변경할 수 있습니다</li>
        <li><strong>색상 변경:</strong> 우측 ⋮ 버튼 → "🎨 색상 변경"으로 배경색 지정</li>
        <li><strong>이모티콘 추가:</strong> ⋮ 버튼 → "💬 이모티콘 변경"으로 항목에 이모티콘 표시</li>
        <li><strong>항목 삭제:</strong> ⋮ 버튼 → "🗑 삭제"로 항목 제거</li>
      </ul>
    `,
    widget: `
      <p><strong>To-Do 위젯</strong>은 별도의 창에서 할 일 목록만 집중해서 관리할 수 있는 기능입니다. 사이드바의 "☑ ToDo" 버튼을 클릭하여 열 수 있습니다.</p>
      <ul>
        <li><strong>위젯 장점:</strong> 메인 화면과 독립적으로 할 일만 보면서 작업할 수 있습니다</li>
        <li><strong>멀티 윈도우:</strong> 여러 날짜의 할 일 위젯을 동시에 열어 비교 가능</li>
        <li><strong>빠른 확인:</strong> 위젯을 작게 만들어 화면 구석에 배치하고 항상 확인</li>
        <li><strong>드래그 정렬:</strong> 위젯 내에서도 항목을 드래그하여 순서 변경 가능</li>
        <li><strong>실시간 동기화:</strong> 메인 화면과 위젯의 데이터는 실시간으로 동기화됩니다</li>
        <li><strong>완료 항목 숨김:</strong> 향후 업데이트에서 완료된 항목을 숨기는 옵션이 추가될 예정입니다</li>
      </ul>
    `
  },
  timer: {
    intro: `
      <p><strong>타이머 기능</strong>은 시간을 측정하고 관리하는 데 유용한 카운트다운 타이머입니다. 공부 시간 측정, 요리 시간 관리, 프레젠테이션 시간 체크 등 다양한 상황에서 활용할 수 있습니다.</p>
      <p>타이머는 시, 분, 초 단위로 설정할 수 있으며, 시각적인 원형 게이지로 남은 시간을 직관적으로 보여줍니다. 타이머가 종료되면 알림이 표시되어 놓치지 않도록 도와줍니다.</p>
      <p>일시정지와 재개 기능을 제공하여 유연하게 시간을 관리할 수 있으며, 리셋 버튼으로 언제든지 처음부터 다시 시작할 수 있습니다.</p>
    `,
    method: `
      <p><strong>타이머 사용 방법:</strong></p>
      <ul>
        <li><strong>시간 설정:</strong> 시, 분, 초 입력 필드에 원하는 시간을 입력합니다</li>
        <li><strong>타이머 시작:</strong> "시작" 버튼을 클릭하면 카운트다운이 시작됩니다</li>
        <li><strong>일시정지:</strong> 진행 중인 타이머를 잠시 멈추려면 "일시정지" 버튼 클릭</li>
        <li><strong>재개:</strong> 일시정지된 타이머를 다시 시작하려면 "재개" 버튼 클릭</li>
        <li><strong>리셋:</strong> "리셋" 버튼을 클릭하면 타이머가 초기화되고 처음 설정한 시간으로 돌아갑니다</li>
        <li><strong>종료 알림:</strong> 타이머가 00:00:00에 도달하면 알림이 표시되고 소리가 울립니다</li>
        <li><strong>빠른 설정:</strong> 자주 사용하는 시간은 프리셋으로 저장하여 빠르게 시작할 수 있습니다</li>
      </ul>
    `,
    widget: `
      <p><strong>타이머 위젯</strong>을 사용하면 작업 중에도 별도의 창에서 시간을 확인할 수 있습니다. 사이드바의 "◷ 타이머" 버튼을 클릭하여 위젯을 엽니다.</p>
      <ul>
        <li><strong>화면 배치:</strong> 위젯을 화면 구석에 작게 배치하여 작업하면서 시간 확인</li>
        <li><strong>여러 타이머:</strong> 여러 개의 타이머 위젯을 동시에 열어 다양한 작업 시간을 동시에 측정</li>
        <li><strong>포커스 모드:</strong> 타이머 위젯만 크게 띄워 집중력을 높이는 용도로 활용</li>
        <li><strong>프리셋 기능:</strong> 자주 사용하는 시간을 저장해두고 버튼 한 번으로 시작</li>
        <li><strong>완료 예정 시각:</strong> 타이머 아래에 종료 예정 시각이 표시되어 계획을 세우기 쉽습니다</li>
        <li><strong>배경 작동:</strong> 다른 탭이나 프로그램을 사용 중에도 타이머는 계속 작동합니다</li>
      </ul>
    `
  },
  alarm: {
    intro: `
      <p><strong>알람 기능</strong>은 특정 시간에 알림을 받을 수 있는 기능으로, 현재 개발 중입니다. 중요한 회의, 약속, 복약 시간 등을 놓치지 않도록 도와주는 기능이 곧 추가될 예정입니다.</p>
      <p>알람은 반복 설정이 가능하여 매일, 매주 특정 요일, 매월 특정 날짜에 알림을 받을 수 있습니다. 각 알람에는 이름과 메모를 추가하여 무엇을 위한 알람인지 명확하게 표시할 수 있습니다.</p>
      <p>알람은 브라우저가 백그라운드에서 실행 중일 때도 작동하며, 시스템 알림으로 표시되어 다른 작업을 하고 있어도 놓치지 않습니다.</p>
    `,
    method: `
      <p><strong>알람 사용 방법 (개발 예정):</strong></p>
      <ul>
        <li><strong>알람 추가:</strong> 시간, 날짜, 반복 설정을 입력하고 알람 이름을 지정합니다</li>
        <li><strong>반복 설정:</strong> 매일, 평일, 주말, 특정 요일 등 다양한 반복 옵션을 선택할 수 있습니다</li>
        <li><strong>알람음 선택:</strong> 여러 가지 알람음 중에서 선택하거나 무음으로 설정할 수 있습니다</li>
        <li><strong>스누즈 기능:</strong> 알람이 울릴 때 스누즈 버튼을 눌러 5분 후 다시 알림을 받을 수 있습니다</li>
        <li><strong>알람 끄기:</strong> 알람 목록에서 토글 스위치를 눌러 일시적으로 비활성화할 수 있습니다</li>
        <li><strong>알람 삭제:</strong> 더 이상 필요 없는 알람은 삭제 버튼으로 제거할 수 있습니다</li>
      </ul>
    `,
    widget: `
      <p><strong>알람 위젯 (개발 예정)</strong>은 설정된 모든 알람을 한눈에 보고 관리할 수 있는 기능입니다.</p>
      <ul>
        <li><strong>알람 목록:</strong> 설정된 모든 알람이 시간 순서대로 표시됩니다</li>
        <li><strong>빠른 토글:</strong> 위젯에서 바로 알람을 켜고 끌 수 있습니다</li>
        <li><strong>다음 알람:</strong> 가장 가까운 시간의 알람이 강조 표시되어 쉽게 확인할 수 있습니다</li>
        <li><strong>알람 그룹:</strong> 업무용, 개인용 등으로 알람을 그룹화하여 관리할 수 있습니다</li>
        <li><strong>통계 기능:</strong> 알람을 얼마나 잘 지키는지 통계를 확인할 수 있습니다</li>
      </ul>
    `
  },
  stopwatch: {
    intro: `
      <p><strong>스탑워치 기능</strong>은 정확한 시간 측정이 필요한 상황에서 사용하는 기능으로, 현재 개발 중입니다. 운동 시간 측정, 작업 시간 기록, 경과 시간 체크 등 다양한 용도로 활용할 수 있습니다.</p>
      <p>스탑워치는 밀리초 단위까지 정확하게 시간을 측정하며, 랩타임 기능을 통해 구간별 시간도 기록할 수 있습니다. 여러 개의 스탑워치를 동시에 실행하여 여러 작업의 시간을 동시에 측정할 수도 있습니다.</p>
      <p>측정된 시간은 기록으로 저장되어 나중에 다시 확인할 수 있으며, CSV 파일로 내보내기 기능도 제공될 예정입니다.</p>
    `,
    method: `
      <p><strong>스탑워치 사용 방법 (개발 예정):</strong></p>
      <ul>
        <li><strong>측정 시작:</strong> "시작" 버튼을 클릭하면 스탑워치가 작동하기 시작합니다</li>
        <li><strong>일시정지:</strong> "일시정지" 버튼으로 시간 측정을 잠시 멈출 수 있습니다</li>
        <li><strong>재개:</strong> 일시정지된 스탑워치를 다시 시작하려면 "재개" 버튼을 클릭합니다</li>
        <li><strong>랩타임 기록:</strong> "랩" 버튼을 눌러 구간별 시간을 기록할 수 있습니다</li>
        <li><strong>리셋:</strong> "리셋" 버튼으로 스탑워치를 00:00:00으로 초기화합니다</li>
        <li><strong>기록 저장:</strong> 측정이 끝나면 자동으로 기록이 저장되어 나중에 확인할 수 있습니다</li>
        <li><strong>기록 비교:</strong> 이전 기록들과 비교하여 향상도를 확인할 수 있습니다</li>
      </ul>
    `,
    widget: `
      <p><strong>스탑워치 위젯 (개발 예정)</strong>은 화면 위에 띄워놓고 작업하면서 시간을 측정할 수 있는 기능입니다.</p>
      <ul>
        <li><strong>플로팅 윈도우:</strong> 항상 위에 표시되는 작은 창으로 다른 작업 중에도 시간을 확인할 수 있습니다</li>
        <li><strong>멀티 스탑워치:</strong> 여러 개의 스탑워치 위젯을 동시에 실행하여 여러 작업을 동시에 측정</li>
        <li><strong>랩타임 목록:</strong> 기록된 랩타임이 위젯 내에서 스크롤 가능한 목록으로 표시됩니다</li>
        <li><strong>최소화 모드:</strong> 위젯을 아주 작게 만들어 시간만 표시하도록 할 수 있습니다</li>
        <li><strong>내보내기:</strong> 측정된 시간을 CSV나 엑셀 파일로 내보낼 수 있습니다</li>
        <li><strong>통계 차트:</strong> 누적 시간과 평균 시간을 차트로 시각화하여 확인할 수 있습니다</li>
      </ul>
    `
  }
};

function showUsage(type) {
  const section = document.getElementById('usageSection');
  const introDiv = document.getElementById('usageIntro');
  const methodDiv = document.getElementById('usageMethod');
  const widgetDiv = document.getElementById('usageWidget');
  const siteIntro = document.getElementById('siteIntro');
  if (section && introDiv && methodDiv && widgetDiv && usageTexts[type]) {
    introDiv.innerHTML = usageTexts[type].intro;
    methodDiv.innerHTML = usageTexts[type].method;
    widgetDiv.innerHTML = usageTexts[type].widget;
    section.style.display = 'block';
    if(siteIntro) siteIntro.style.display = 'none';
  }
}

function hideUsage() {
  const section = document.getElementById('usageSection');
  const siteIntro = document.getElementById('siteIntro');
  if (section) section.style.display = 'none';
  if (siteIntro) siteIntro.style.display = 'block';
}

/* ── 네비 ── */
if($.todayBtn){
  const updateTodayBtn=()=>{
    const t=new Date();
    $.todayBtn.textContent=`${t.getDate()}`;
  };
  updateTodayBtn();
    $.todayBtn.onclick=()=>{const t=new Date(); ST.viewYear=t.getFullYear(); ST.viewMonth=t.getMonth(); ST.selected=t; setGlobalSelected(t); renderCalendar(); renderRight(); renderMonthlyGoals(); trackMenuPV('nav:today');};
}
  if($.prev) $.prev.onclick=()=>{const d=new Date(ST.viewYear,ST.viewMonth-1,1); ST.viewYear=d.getFullYear(); ST.viewMonth=d.getMonth(); renderCalendar(); renderMonthlyGoals(); trackMenuPV('nav:prevMonth');};
  if($.next) $.next.onclick=()=>{const d=new Date(ST.viewYear,ST.viewMonth+1,1); ST.viewYear=d.getFullYear(); ST.viewMonth=d.getMonth(); renderCalendar(); renderMonthlyGoals(); trackMenuPV('nav:nextMonth');};
if($.ym) $.ym.onclick=()=>{ showDatePicker(); };

function showDatePicker(){
  if(openPop) openPop.remove();
  const pop=document.createElement('div');
  pop.className='date-picker';
  
  const header=document.createElement('div');
  header.className='date-picker-header';
  header.innerHTML=`<div class="date-picker-title">${ST.viewYear}년 ${ST.viewMonth+1}월 ▲</div>`;
  
  const body=document.createElement('div');
  body.className='date-picker-body';
  
  const yearCol=document.createElement('div');
  yearCol.className='date-picker-col';
  const monthCol=document.createElement('div');
  monthCol.className='date-picker-col';
  
  for(let y=ST.viewYear-5; y<=ST.viewYear+5; y++){
    const item=document.createElement('div');
    item.className='date-picker-item';
    if(y===ST.viewYear) item.classList.add('selected');
    item.textContent=`${y}년`;
    item.onclick=()=>{
      ST.viewYear=y;
      pop.remove();
      openPop=null;
      renderCalendar();
    };
    yearCol.appendChild(item);
  }
  
  for(let m=1; m<=12; m++){
    const item=document.createElement('div');
    item.className='date-picker-item';
    if(m-1===ST.viewMonth) item.classList.add('selected');
    item.textContent=`${m}월`;
    item.onclick=()=>{
      ST.viewMonth=m-1;
      pop.remove();
      openPop=null;
      renderCalendar();
    };
    monthCol.appendChild(item);
  }
  
  body.append(yearCol,monthCol);
  pop.append(header,body);
  
  const closeBtn=document.createElement('div');
  closeBtn.className='date-picker-close';
  closeBtn.innerHTML='<button class="btn">완료</button>';
  closeBtn.onclick=()=>{pop.remove(); openPop=null;};
  pop.appendChild(closeBtn);
  
  document.body.appendChild(pop);
  openPop=pop;
  
  setTimeout(()=>{
    yearCol.querySelector('.selected')?.scrollIntoView({block:'center'});
    monthCol.querySelector('.selected')?.scrollIntoView({block:'center'});
  },0);
}

/* ── 달력 사이즈 조절 (모서리 드래그) ── */
const calWrapper=document.getElementById('calendarWrapper');
const resizeHandle=document.querySelector('.calendar-resize-handle');
if(calWrapper && resizeHandle){
  let isResizing=false;
  let startY=0;
  let startHeight=0;
  
  resizeHandle.addEventListener('mousedown',(e)=>{
    isResizing=true;
    startY=e.clientY;
    startHeight=calWrapper.offsetHeight;
    document.body.style.cursor='nwse-resize';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove',(e)=>{
    if(!isResizing) return;
    const deltaY=e.clientY-startY;
    const newHeight=Math.max(400, Math.min(1000, startHeight+deltaY));
    calWrapper.style.height=newHeight+'px';
    
    // 셀 높이도 자동 조정
    const rows=6;
    const weekdaysHeight=30;
    const gap=10;
    const cellHeight=Math.floor((newHeight-weekdaysHeight-gap*(rows-1))/rows);
    ST.cellHeight=Math.max(80, Math.min(200, cellHeight));
    renderCalendar();
  });
  
  document.addEventListener('mouseup',()=>{
    if(isResizing){
      isResizing=false;
      document.body.style.cursor='';
    }
  });
}

/* ── 이달의 목표 (1줄 형태) ── */
const kMonthlyGoal=(y,m)=>`memo2.monthlyGoal.${y}-${m}`;
const kGoalStyle=(scope='monthly')=>`memo2.goalStyle.${scope}`;
const kDailyWeekGoal=(weekStartDate)=>`memo2.dailyWeekGoal.${weekStartDate}`;
function getWeekStartDateStr(date){
  const d=new Date(date||new Date());
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-d.getDay());
  return fmtLocalDate(d);
}

function getGoalStyle(scope='monthly'){
  const def={color:'#1f2937',emoji:'',fontSize:'14',fontWeight:'600'};
  try{ const v=JSON.parse(localStorage.getItem(kGoalStyle(scope))||'null'); return {...def,...v}; }catch{return def;}
}
function saveGoalStyle(s,scope='monthly'){ try{ localStorage.setItem(kGoalStyle(scope), JSON.stringify(s)); }catch{} }

function applyGoalStyle(input,badgeId='goalEmojiBadge',scope='monthly'){
  if(!input) return;
  const badge=document.getElementById(badgeId);
  const st=getGoalStyle(scope);
  input.style.color=st.color||'#1f2937';
  input.style.fontSize=(st.fontSize||'14')+'px';
  input.style.fontWeight=st.fontWeight||'600';
  if(badge) badge.textContent=st.emoji||'';
  input.style.paddingLeft=st.emoji? '32px':'10px';
}

function showGoalStyleMenu(anchor,options={}){
  if(!anchor) return;
  const scope=options.scope||'monthly';
  const inputId=options.inputId||'monthlyGoalInput';
  const badgeId=options.badgeId||'goalEmojiBadge';
  const existing=document.querySelector('.goal-style-menu');
  if(existing) existing.remove();
  const st=getGoalStyle(scope);
  const menu=document.createElement('div'); menu.className='goal-style-menu';

  const rowColor=document.createElement('div'); rowColor.className='row';
  const lblColor=document.createElement('span'); lblColor.className='label'; lblColor.textContent='색상';
  const colorBtn=document.createElement('button'); colorBtn.type='button'; colorBtn.className='swatch-btn';
  const swatch=document.createElement('span'); swatch.className='swatch'; swatch.style.background=st.color||'#1f2937';
  const colorTxt=document.createElement('span'); colorTxt.textContent='변경';
  colorBtn.append(swatch,colorTxt); rowColor.append(lblColor,colorBtn);

  const rowEmoji=document.createElement('div'); rowEmoji.className='row';
  const lblEmoji=document.createElement('span'); lblEmoji.className='label'; lblEmoji.textContent='이모티콘';
  const emojiBtn=document.createElement('button'); emojiBtn.type='button'; emojiBtn.className='emoji-btn-small'; emojiBtn.textContent=st.emoji||'선택';
  rowEmoji.append(lblEmoji,emojiBtn);

  const rowSize=document.createElement('div'); rowSize.className='row';
  const lblSize=document.createElement('span'); lblSize.className='label'; lblSize.textContent='글자크기';
  const size=document.createElement('select'); ['14','16','18','20','24'].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=`${v}px`; if(v===String(st.fontSize||'14')) o.selected=true; size.appendChild(o); });
  rowSize.append(lblSize,size);

  const rowWeight=document.createElement('div'); rowWeight.className='row';
  const lblWeight=document.createElement('span'); lblWeight.className='label'; lblWeight.textContent='굵기';
  const weight=document.createElement('select'); [['500','보통'],['700','굵게']].forEach(([v,l])=>{ const o=document.createElement('option'); o.value=v; o.textContent=l; if(v===String(st.fontWeight||'600')) o.selected=true; weight.appendChild(o); });
  rowWeight.append(lblWeight,weight);

  const actions=document.createElement('div'); actions.className='menu-actions';
  const save=document.createElement('button'); save.className='menu-btn primary'; save.textContent='적용';
  const cancel=document.createElement('button'); cancel.className='menu-btn'; cancel.textContent='닫기';
  actions.append(cancel,save);

  [rowColor,rowEmoji,rowSize,rowWeight,actions].forEach(el=>menu.appendChild(el));
  document.body.appendChild(menu);
  const rect=anchor.getBoundingClientRect();
  menu.style.left=`${rect.right - (menu.offsetWidth||220) + (window.scrollX||0)}px`;
  menu.style.top=`${rect.bottom + 8 + (window.scrollY||0)}px`;

  const close=()=>menu.remove();
  cancel.onclick=(e)=>{e.stopPropagation(); close();};
  colorBtn.onclick=(e)=>{ e.stopPropagation(); showPalette(colorBtn,(c)=>{ swatch.style.background=c; swatch.dataset.val=c; }); };
  emojiBtn.onclick=(e)=>{ e.stopPropagation(); showEmojiPicker(emojiBtn,(emo)=>{ emojiBtn.textContent=emo||'선택'; emojiBtn.dataset.val=emo||''; }); };

  save.onclick=(e)=>{
    e.stopPropagation();
    const next={
      color:swatch.dataset.val||swatch.style.background||'#1f2937',
      emoji:emojiBtn.dataset.val||'',
      fontSize:size.value||'14',
      fontWeight:weight.value||'700'
    };
    saveGoalStyle(next,scope);
    applyGoalStyle(document.getElementById(inputId),badgeId,scope);
    close();
  };
  setTimeout(()=>{
    const handler=(e)=>{
      const t=e.target;
      if(menu.contains(t) || t===anchor || t.closest('.color-pop-advanced') || t.closest('.emoji-picker')) return;
      close(); document.removeEventListener('mousedown',handler);
    };
    document.addEventListener('mousedown',handler);
  },10);
}

function renderMonthlyGoals(){
  const input=document.getElementById('monthlyGoalInput');
  if(!input) return;
  
  const key=kMonthlyGoal(ST.viewYear,ST.viewMonth);
  const goalText=get(key,'');
  input.value=goalText;
  applyGoalStyle(input,'goalEmojiBadge','monthly');
  
  input.onkeydown=(e)=>{
    if(e.key==='Enter'){
      e.preventDefault();
      const txt=input.value.trim();
      set(key,txt);
      input.blur();
    }
  };
  
  input.onblur=()=>{
    const txt=input.value.trim();
    set(key,txt);
  };
}

function renderDailyWeekGoal(){
  const input=document.getElementById('dailyWeekGoalInput');
  if(!input) return;
  const weekStart=getWeekStartDateStr(dailySelectedDate);
  const key=kDailyWeekGoal(weekStart);
  input.value=get(key,'');
  applyGoalStyle(input,'dailyGoalEmojiBadge','daily-week');
  input.onkeydown=(e)=>{
    if(e.key==='Enter'){
      e.preventDefault();
      set(key,input.value.trim());
      input.blur();
    }
  };
  input.onblur=()=> set(key,input.value.trim());
}

/* ── 테마 토글 기능 ── */
function updateThemeButton(){
  const themeBtn=document.getElementById('themeToggle');
  if(!themeBtn)return;
  const current=document.documentElement.getAttribute('data-theme')||'light';
  themeBtn.textContent=current==='light'?'◐ 다크모드':'◑ 라이트모드';
}
function loadTheme(){
  const saved=localStorage.getItem('memo2.theme')||'light';
  document.documentElement.setAttribute('data-theme',saved);
  updateThemeButton();
}
function toggleTheme(){
  const current=document.documentElement.getAttribute('data-theme')||'light';
  const newTheme=current==='light'?'dark':'light';
  document.documentElement.setAttribute('data-theme',newTheme);
  localStorage.setItem('memo2.theme',newTheme);
  updateThemeButton();
}
const themeBtn=document.getElementById('themeToggle');
if(themeBtn){
  themeBtn.addEventListener('click',toggleTheme);
}

const goalStyleBtn=document.getElementById('goalStyleBtn');
if(goalStyleBtn){
  goalStyleBtn.addEventListener('click',(e)=>{ e.stopPropagation(); showGoalStyleMenu(goalStyleBtn,{scope:'monthly',inputId:'monthlyGoalInput',badgeId:'goalEmojiBadge'}); });
}
const dailyGoalStyleBtn=document.getElementById('dailyGoalStyleBtn');
if(dailyGoalStyleBtn){
  dailyGoalStyleBtn.addEventListener('click',(e)=>{ e.stopPropagation(); showGoalStyleMenu(dailyGoalStyleBtn,{scope:'daily-week',inputId:'dailyWeekGoalInput',badgeId:'dailyGoalEmojiBadge'}); });
}

/* ── (+) 버튼 클릭 이벤트 ── */
const monthlyGoalAddIcon=document.getElementById('monthlyGoalAddIcon');
if(monthlyGoalAddIcon){
  monthlyGoalAddIcon.addEventListener('click',()=>{
    const wrapper=document.getElementById('monthlyGoalInputWrapper');
    if(wrapper){
      wrapper.classList.add('active');
      const input=wrapper.querySelector('.monthly-goal-input');
      if(input) input.focus();
    }
  });
}

const homeReminderAddIcon=document.getElementById('homeReminderAddIcon');
if(homeReminderAddIcon){
  homeReminderAddIcon.addEventListener('click',()=>{
    const wrapper=document.getElementById('homeReminderInputWrapper');
    if(wrapper){
      wrapper.classList.add('active');
      const input=wrapper.querySelector('.home-reminder-input');
      if(input) input.focus();
    }
  });
}

/* ── 초기 렌더 + 동기화 리스너 ── */
/* ── 개인정보 보호정책 & 문의하기 팝업 ── */
function showModal(title, content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal-content';
  
  modal.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">${title}</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">${content}</div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

const privacyContent = `
  <h3>1. 수집하는 정보</h3>
  <p>Jay Calendar는 사용자의 개인정보를 수집하지 않습니다. 모든 데이터(일정, 메모, 할 일 등)는 사용자의 브라우저 로컬 스토리지에만 저장되며, 외부 서버로 전송되지 않습니다.</p>
  
  <h3>2. 쿠키 및 로컬 스토리지</h3>
  <p>본 서비스는 사용자 경험 향상을 위해 브라우저의 로컬 스토리지를 사용합니다. 저장되는 정보는 다음과 같습니다:</p>
  <ul>
    <li>일정, 메모, 할 일 데이터</li>
    <li>테마 설정 (다크모드/라이트모드)</li>
    <li>사용자 인터페이스 설정</li>
  </ul>
  <p>이러한 정보는 사용자의 기기에만 저장되며, 외부로 전송되지 않습니다.</p>
  
  <h3>3. Google AdSense</h3>
  <p>본 사이트는 Google AdSense를 사용하여 광고를 게재합니다. Google은 사용자의 관심사에 맞는 광고를 표시하기 위해 쿠키를 사용할 수 있습니다. Google의 개인정보 보호정책은 <a href="https://policies.google.com/privacy" target="_blank" style="color:var(--primary);">여기</a>에서 확인할 수 있습니다.</p>
  
  <h3>4. 제3자 서비스</h3>
  <p>본 서비스는 Google Analytics 등의 제3자 분석 도구를 사용할 수 있습니다. 이러한 도구는 익명화된 사용 통계를 수집하여 서비스 개선에 활용됩니다.</p>
  
  <h3>5. 데이터 보안</h3>
  <p>사용자의 모든 데이터는 브라우저 로컬 스토리지에 저장되며, 데이터 보안은 사용자의 브라우저 및 기기 보안에 의존합니다. 정기적으로 브라우저 데이터를 백업하시는 것을 권장합니다.</p>
  
  <h3>6. 아동의 개인정보</h3>
  <p>본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 의도적으로 아동의 개인정보를 수집하지 않습니다.</p>
  
  <h3>7. 개인정보 보호정책 변경</h3>
  <p>본 개인정보 보호정책은 필요에 따라 업데이트될 수 있습니다. 중요한 변경 사항이 있을 경우 웹사이트를 통해 공지됩니다.</p>
  
  <h3>8. 문의</h3>
  <p>개인정보 보호와 관련된 문의사항이 있으시면 아래 연락처로 문의해주세요.</p>
  <p><strong>최종 업데이트:</strong> 2025년 12월 7일</p>
`;

const contactContent = `
  <h3>문의하기</h3>
  <p>Jay Calendar 사용 중 문의사항이나 제안사항이 있으시면 언제든지 연락해주세요.</p>
  
  <h3>이메일 문의</h3>
  <p><strong>이메일:</strong> <a href="mailto:support@jaycalendar.com" style="color:var(--primary);">support@jaycalendar.com</a></p>
  <p>영업일 기준 1-2일 내에 답변드리겠습니다.</p>
  
  <h3>자주 묻는 질문</h3>
  <ul>
    <li><strong>데이터가 삭제되었어요!</strong> - 브라우저 캐시를 삭제하면 로컬 스토리지 데이터도 함께 삭제됩니다. 정기적으로 백업하시는 것을 권장합니다.</li>
    <li><strong>다른 기기에서도 사용할 수 있나요?</strong> - 현재는 로컬 스토리지를 사용하므로 기기 간 동기화는 지원되지 않습니다. 향후 업데이트에서 추가될 예정입니다.</li>
    <li><strong>모바일에서도 사용할 수 있나요?</strong> - 네, 모바일 브라우저에서도 사용 가능합니다.</li>
    <li><strong>버그를 발견했어요!</strong> - 위 이메일로 상세한 내용을 보내주시면 빠르게 수정하겠습니다.</li>
  </ul>
  
  <h3>기능 제안</h3>
  <p>새로운 기능에 대한 아이디어가 있으시면 언제든지 제안해주세요. 사용자 여러분의 의견은 Jay Calendar 개선에 큰 도움이 됩니다.</p>
`;

if(document.getElementById('privacyLink')) {
  document.getElementById('privacyLink').onclick = (e) => {
    e.preventDefault();
    showModal('개인정보 보호정책', privacyContent);
  };
}

if(document.getElementById('contactLink')) {
  document.getElementById('contactLink').onclick = (e) => {
    e.preventDefault();
    showModal('문의하기', contactContent);
  };
}

loadTheme();
renderCalendar(); renderRight(); renderReminders(); renderMonthlyGoals();
if(window.ResizeObserver && $.calWrap){
  new ResizeObserver(()=>{ const n=calcMaxLines(); if(n!==ST.linesHint){ ST.linesHint=n; renderCalendar(); } }).observe($.calWrap);
}
if(appBC){
  appBC.onmessage=(e)=>{
    const m=e.data||{};
    if(m.type==='select' && m.date){ ST.selected=new Date(m.date); renderCalendar(); renderRight(); }
    if(m.type==='refresh'){ renderCalendar(); renderRight(); }
  };
}
window.addEventListener('storage',(e)=>{
  if(e.key==='memo2.selected' && e.newValue){ ST.selected=new Date(e.newValue); renderCalendar(); renderRight(); }
  if(e.key && (e.key.startsWith('memo2.todos.')||e.key.startsWith('memo2.memos.'))){ renderCalendar(); renderRight(); }
});
