/* js/daily.js — Daily 페이지 (memo2_app.js에서 이동, 1단계: 원본 유지) */
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
  const WEEKDAY_LABELS_EN = JCal.WEEKDAY_LABELS_EN || ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS_EN = JCal.MONTHS_EN || ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function formatYearMonth(y, m) { return MONTHS_EN[m] + ' ' + y; }

  function kDaily(d) { return 'memo2.daily.' + d; }

  function getJayMemoList() {
    return (window.JCal?.getJayMemoList || window.getJayMemoList)?.() ?? [];
  }
  function setJayMemoList(list) {
    (window.JCal?.setJayMemoList || window.setJayMemoList)?.(list);
  }
  function createMemoId() {
    return (window.JCal?.createMemoId || window.createMemoId)?.() ?? ('memo_' + Date.now());
  }
  function renderMemoHtml(targetEl, content, emojiPrefix) {
    (window.JCal?.renderMemoHtml || window.renderMemoHtml)?.(targetEl, content, emojiPrefix);
  }

  let dailyOpenPop = null;

  function hideInsightPages() {
    document.getElementById('insightPage')?.classList.add('hidden');
    document.getElementById('insightWritePage')?.classList.add('hidden');
  }

  function showDailyPage() {
    localStorage.setItem('memo2.lastPage', 'daily');
    document.getElementById('homeIntroSection')?.classList.add('hidden');
    document.getElementById('calendarPage')?.classList.add('hidden');
    document.getElementById('memoPage')?.classList.add('hidden');
    document.getElementById('memoWritePage')?.classList.add('hidden');
    document.getElementById('routinePage')?.classList.add('hidden');
    document.getElementById('timerPage')?.classList.add('hidden');
    document.getElementById('logsPage')?.classList.add('hidden');
    document.getElementById('dailyPage')?.classList.remove('hidden');
    hideInsightPages();
    document.querySelector('.right')?.classList.add('hidden');
    initDailyPage();
    applyDailyView();
  }

/* ── Daily 페이지 ── */
let dailyViewMode = 'day';
let dailySelectedDate = new Date();
let dailyViewButtonsBound = false;
let dailySectionTaskInputSectionId = null;
let dailySectionTaskInputText = '';
let dailyIsAddingSection = false;
let dailyNewSectionTitle = '';
const SECTION_COLORS=[
  {bg:'#dcfce7',text:'#166534'}, // Green
  {bg:'#EEF2FF',text:'#5C8DFF'}, // Blue
  {bg:'#fef9c3',text:'#854d0e'}, // Amber
  {bg:'#ffedd5',text:'#9a3412'}, // Orange
  {bg:'#ede9fe',text:'#4c1d95'}, // Purple
  {bg:'#fce7f3',text:'#9d174d'}, // Pink
];
const SECTION_COLOR_LABELS=['Green','Blue','Amber','Orange','Purple','Pink'];
const LEGACY_DAILY_SECTION_COLOR_IDS={
  yellow:'#fef9c3',
  green:'#dcfce7',
  blue:'#EEF2FF',
  purple:'#ede9fe',
  red:'#fce7f3',
  gray:'#f1f5f9',
};
const LEGACY_DAILY_SECTION_HEX={
  '#4ADE80':'#dcfce7',
  '#60A5FA':'#EEF2FF',
  '#FCD34D':'#fef9c3',
  '#FB923C':'#ffedd5',
  '#A78BFA':'#ede9fe',
  '#F472B6':'#fce7f3',
  '#10B981':'#dcfce7',
  '#185FA5':'#EEF2FF',
  '#F59E0B':'#fef9c3',
  '#F97316':'#ffedd5',
  '#8B5CF6':'#ede9fe',
  '#EC4899':'#fce7f3',
};
function findSectionColorEntry(colorValue){
  const raw=(colorValue||'').trim();
  if(!raw) return SECTION_COLORS[0];
  const byBg=SECTION_COLORS.find(c=>c.bg.toLowerCase()===raw.toLowerCase());
  if(byBg) return byBg;
  if(LEGACY_DAILY_SECTION_COLOR_IDS[raw]){
    const legacyBg=LEGACY_DAILY_SECTION_COLOR_IDS[raw];
    return SECTION_COLORS.find(c=>c.bg===legacyBg)||SECTION_COLORS[0];
  }
  const mappedBg=LEGACY_DAILY_SECTION_HEX[raw]||LEGACY_DAILY_SECTION_HEX[raw.toUpperCase()];
  if(mappedBg){
    return SECTION_COLORS.find(c=>c.bg===mappedBg)||SECTION_COLORS[0];
  }
  if(/^#[0-9a-f]{3,8}$/i.test(raw)){
    return {bg:raw,text:'#1f2937'};
  }
  return SECTION_COLORS[0];
}
function resolveDailySectionPalette(section){
  if(section?.id==='__none__') return {bg:'#f1f5f9',text:'#475569'};
  return findSectionColorEntry(section?.color);
}
const DAILY_SECTION_EMOJI_OPTIONS=['☀️','🌤️','🌙','📌','🗂️','✅','⭐','🔥','💼','📅','📝','🎯','💡','🍀','❤️'];
const DAILY_TASK_EDIT_SVG='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
const DAILY_SB_URL='https://kwiwsjvuvmwtfboxtfij.supabase.co';
const DAILY_SB_KEY='sb_publishable_c6617EGJLrdzmJvt_tlAnA_dmYkHJTD';
let _dailySbClient=null;
let _dailySbUserId=null;
const _dailyTasksCache=new Map();
const _dailySectionsCache=new Map();
const _dailyTasksLoadPromises=new Map();
const _dailySectionsLoadPromises=new Map();

function getDailySupabaseClient(){
  if(!_dailySbClient && typeof window!=='undefined' && window.supabase?.auth){
    _dailySbClient=window.supabase;
    _dailySbClient.auth.onAuthStateChange((_evt,session)=>{
      _dailySbUserId=session?.user?.id||null;
      _dailyTasksCache.clear();
      _dailySectionsCache.clear();
      _dailyTasksLoadPromises.clear();
      _dailySectionsLoadPromises.clear();
      if(typeof refreshDailyTaskViews==='function') refreshDailyTaskViews();
    });
    _dailySbClient.auth.getSession().then(({data:{session}})=>{
      _dailySbUserId=session?.user?.id||null;
    }).catch((err)=> console.error('daily supabase auth init',err));
  }
  return _dailySbClient;
}

function readDailyTasksLocal(dstr){
  const list=get(kDaily(dstr),[]);
  return Array.isArray(list)?list.slice():[];
}

function readDailySectionsLocal(dstr){
  const list=get(kDailySections(dstr),[]);
  return Array.isArray(list)?list.slice():[];
}

async function resolveDailyUserId(){
  getDailySupabaseClient();
  if(_dailySbUserId) return _dailySbUserId;
  const sb=_dailySbClient;
  if(!sb) return null;
  try{
    const {data:{session},error}=await sb.auth.getSession();
    if(error) throw error;
    _dailySbUserId=session?.user?.id||null;
    return _dailySbUserId;
  }catch(err){
    console.error('resolveDailyUserId',err);
    return null;
  }
}

function mapSupabaseTaskRow(row){
  return {
    id:row.id,
    text:row.text||'',
    done:!!row.done,
    sectionId:row.section_id||undefined,
  };
}

function mapSupabaseSectionRow(row){
  return {
    id:row.id,
    title:row.title||'',
    emoji:row.emoji||'📌',
    color:row.color||SECTION_COLORS[0].bg,
    order:row.sort_order??0,
  };
}

function ensureDailyTaskId(task){
  if(task?.id && typeof task.id==='string' && task.id.length>10) return task.id;
  if(typeof crypto!=='undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `task_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
}

async function loadDailyTasksFromSupabase(dstr){
  const userId=await resolveDailyUserId();
  if(!userId) return readDailyTasksLocal(dstr);
  const sb=getDailySupabaseClient();
  try{
    const {data,error}=await sb.from('daily_tasks')
      .select('id,text,done,section_id,created_at')
      .eq('user_id',userId)
      .eq('date',dstr)
      .order('created_at',{ascending:true});
    if(error) throw error;
    const list=(data||[]).map(mapSupabaseTaskRow);
    _dailyTasksCache.set(dstr,list);
    set(kDaily(dstr),list);
    return list.slice();
  }catch(err){
    console.error('loadDailyTasksFromSupabase',err);
    return readDailyTasksLocal(dstr);
  }
}

async function persistDailyTasksToSupabase(dstr,list){
  const userId=await resolveDailyUserId();
  if(!userId) return;
  const sb=getDailySupabaseClient();
  const normalized=Array.isArray(list)?list.slice():[];
  try{
    const rows=normalized.map((t)=>{
      const id=ensureDailyTaskId(t);
      t.id=id;
      return {
        id,
        user_id:userId,
        date:dstr,
        text:t.text||'',
        done:!!t.done,
        section_id:t.sectionId||null,
      };
    });
    const {data:existing,error:fetchErr}=await sb.from('daily_tasks')
      .select('id')
      .eq('user_id',userId)
      .eq('date',dstr);
    if(fetchErr) throw fetchErr;
    const keepIds=new Set(rows.map(r=>r.id));
    const deleteIds=(existing||[]).map(r=>r.id).filter(id=>!keepIds.has(id));
    if(rows.length){
      const {error}=await sb.from('daily_tasks').upsert(rows,{onConflict:'id'});
      if(error) throw error;
    }
    if(deleteIds.length){
      const {error}=await sb.from('daily_tasks').delete().in('id',deleteIds);
      if(error) throw error;
    }
    _dailyTasksCache.set(dstr,normalized);
    set(kDaily(dstr),normalized);
  }catch(err){
    console.error('persistDailyTasksToSupabase',err);
    set(kDaily(dstr),normalized);
  }
}

async function loadDailySectionsFromSupabase(dstr){
  const userId=await resolveDailyUserId();
  if(!userId) return readDailySectionsLocal(dstr);
  const sb=getDailySupabaseClient();
  try{
    const {data,error}=await sb.from('daily_sections')
      .select('id,title,emoji,color,sort_order')
      .eq('user_id',userId)
      .eq('date',dstr)
      .order('sort_order',{ascending:true});
    if(error) throw error;
    const list=(data||[]).map(mapSupabaseSectionRow);
    _dailySectionsCache.set(dstr,list);
    set(kDailySections(dstr),list);
    return list.slice();
  }catch(err){
    console.error('loadDailySectionsFromSupabase',err);
    return readDailySectionsLocal(dstr);
  }
}

async function persistDailySectionsToSupabase(dstr,list){
  const userId=await resolveDailyUserId();
  if(!userId) return;
  const sb=getDailySupabaseClient();
  const normalized=Array.isArray(list)?list.slice():[];
  try{
    const rows=normalized.map((s,i)=>({
      id:s.id,
      user_id:userId,
      date:dstr,
      title:s.title||'',
      emoji:s.emoji||'📌',
      color:s.color||SECTION_COLORS[0].bg,
      sort_order:s.order??i,
    }));
    const {data:existing,error:fetchErr}=await sb.from('daily_sections')
      .select('id')
      .eq('user_id',userId)
      .eq('date',dstr);
    if(fetchErr) throw fetchErr;
    const keepIds=new Set(rows.map(r=>r.id));
    const deleteIds=(existing||[]).map(r=>r.id).filter(id=>!keepIds.has(id));
    if(rows.length){
      const {error}=await sb.from('daily_sections').upsert(rows,{onConflict:'id'});
      if(error) throw error;
    }
    if(deleteIds.length){
      const {error}=await sb.from('daily_sections').delete().in('id',deleteIds);
      if(error) throw error;
    }
    _dailySectionsCache.set(dstr,normalized);
    set(kDailySections(dstr),normalized);
  }catch(err){
    console.error('persistDailySectionsToSupabase',err);
    set(kDailySections(dstr),normalized);
  }
}

function prefetchDailyTasks(dstr){
  if(_dailyTasksCache.has(dstr)||_dailyTasksLoadPromises.has(dstr)) return;
  const p=loadDailyTasksFromSupabase(dstr).then(()=>{
    _dailyTasksLoadPromises.delete(dstr);
    if(typeof refreshDailyTaskViews==='function') refreshDailyTaskViews();
  }).catch((err)=>{
    console.error('prefetchDailyTasks',err);
    _dailyTasksLoadPromises.delete(dstr);
  });
  _dailyTasksLoadPromises.set(dstr,p);
}

function prefetchDailySections(dstr){
  if(_dailySectionsCache.has(dstr)||_dailySectionsLoadPromises.has(dstr)) return;
  const p=loadDailySectionsFromSupabase(dstr).then(()=>{
    _dailySectionsLoadPromises.delete(dstr);
    if(typeof refreshDailyTaskViews==='function') refreshDailyTaskViews();
  }).catch((err)=>{
    console.error('prefetchDailySections',err);
    _dailySectionsLoadPromises.delete(dstr);
  });
  _dailySectionsLoadPromises.set(dstr,p);
}

function getDailyTasks(dstr){
  getDailySupabaseClient();
  if(_dailySbUserId){
    if(_dailyTasksCache.has(dstr)) return _dailyTasksCache.get(dstr).slice();
    prefetchDailyTasks(dstr);
    return readDailyTasksLocal(dstr);
  }
  resolveDailyUserId().then((userId)=>{
    if(!userId||_dailyTasksCache.has(dstr)) return;
    return loadDailyTasksFromSupabase(dstr).then(()=>{
      if(typeof refreshDailyTaskViews==='function') refreshDailyTaskViews();
    });
  }).catch(err=> console.error('getDailyTasks',err));
  return readDailyTasksLocal(dstr);
}

function saveDailyTasks(dstr,list){
  const normalized=Array.isArray(list)?list.slice():[];
  set(kDaily(dstr),normalized);
  _dailyTasksCache.set(dstr,normalized);
  (async ()=>{
    try{
      const userId=await resolveDailyUserId();
      if(!userId) return;
      await persistDailyTasksToSupabase(dstr,normalized);
    }catch(err){
      console.error('saveDailyTasks',err);
    }
  })();
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
  editBtn.title='Edit';
  editBtn.innerHTML=DAILY_TASK_EDIT_SVG;
  editBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    startDailyTaskInlineEdit(dstr,idx,txt);
  });
  const delBtn=el('button','daily-day-task-icon-btn daily-day-task-delete','✕');
  delBtn.type='button';
  delBtn.setAttribute('aria-label','Delete task');
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
  const next=sections.concat([{id:createDailySectionId(),title:value,emoji:'📌',color:SECTION_COLORS[0].bg,order:sections.length}]);
  setDailySections(dstr,next);
  dailyIsAddingSection=false;
  dailyNewSectionTitle='';
  renderDailyDayWorkspace();
}
function saveDailySection(dstr,sectionId,{title,emoji,color}){
  const value=(title||'').trim();
  if(!value) return;
  const safeColor=findSectionColorEntry(color).bg;
  const sections=getDailySections(dstr);
  const patch={
    id:sectionId,
    title:value,
    emoji:emoji||'📌',
    color:safeColor,
  };
  const idx=sections.findIndex(s=>s.id===sectionId);
  if(idx<0) return;
  sections[idx]={...sections[idx],...patch};
  setDailySections(dstr,sections);
  renderDailyDayWorkspace();
}
function isDailySectionDeletable(section){
  if(!section||section.id==='__none__') return false;
  const title=(section.title||'').trim();
  if(title==='Uncategorized'||title==='미분류') return false;
  return true;
}
function deleteDailySection(dstr,sectionId){
  const sections=getDailySections(dstr);
  const target=sections.find(s=>s.id===sectionId);
  if(!target||!isDailySectionDeletable(target)) return;
  setDailySections(dstr,sections.filter(s=>s.id!==sectionId));
  saveDailyTasks(dstr,getDailyTasks(dstr).filter(t=>t.sectionId!==sectionId));
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
  inp.placeholder='Enter task and press Enter';
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
  getDailySupabaseClient();
  if(_dailySbUserId){
    if(_dailySectionsCache.has(dstr)) return _dailySectionsCache.get(dstr).slice();
    prefetchDailySections(dstr);
    return readDailySectionsLocal(dstr);
  }
  resolveDailyUserId().then((userId)=>{
    if(!userId||_dailySectionsCache.has(dstr)) return;
    return loadDailySectionsFromSupabase(dstr).then(()=>{
      if(typeof refreshDailyTaskViews==='function') refreshDailyTaskViews();
    });
  }).catch(err=> console.error('getDailySections',err));
  return readDailySectionsLocal(dstr);
}

function setDailySections(dstr,list){
  const normalized=Array.isArray(list)?list.slice():[];
  set(kDailySections(dstr),normalized);
  _dailySectionsCache.set(dstr,normalized);
  (async ()=>{
    try{
      const userId=await resolveDailyUserId();
      if(!userId) return;
      await persistDailySectionsToSupabase(dstr,normalized);
    }catch(err){
      console.error('setDailySections',err);
    }
  })();
}
function ensureDailySections(dstr){
  const sections=getDailySections(dstr);
  return sections.slice().sort((a,b)=>(a.order||0)-(b.order||0));
}
function getDailySectionTheme(section){
  const palette=resolveDailySectionPalette(section);
  return {
    emoji:section?.emoji||'📌',
    bg:palette.bg,
    text:palette.text,
  };
}
function formatDailyMemoSavedAt(ts){
  if(!ts) return 'No save history';
  const d=new Date(ts);
  if(Number.isNaN(d.getTime())) return 'No save history';
  const hh=String(d.getHours()).padStart(2,'0');
  const mm=String(d.getMinutes()).padStart(2,'0');
  return `Saved ${hh}:${mm}`;
}
function showDailySectionMenu(anchor,dstr,section){
  const doc=anchor.ownerDocument||document;
  if(dailyOpenPop) dailyOpenPop.remove();
  const pop=doc.createElement('div');
  pop.className='event-menu-popup daily-section-menu-popup';
  const close=()=>{ pop.remove(); dailyOpenPop=null; doc.removeEventListener('mousedown',onDocDown); };
  const onDocDown=(e)=>{ if(!pop.contains(e.target)&&e.target!==anchor) close(); };
  const editBtn=el('button','menu-item','✏️ Edit');
  editBtn.type='button';
  editBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    showDailySectionEditPopup(anchor,dstr,section);
  };
  pop.appendChild(editBtn);
  if(isDailySectionDeletable(section)){
    const delBtn=el('button','menu-item del','🗑️ Delete');
    delBtn.type='button';
    delBtn.onclick=(e)=>{
      e.stopPropagation();
      close();
      deleteDailySection(dstr,section.id);
    };
    pop.appendChild(delBtn);
  }
  doc.body.appendChild(pop);
  dailyOpenPop=pop;
  const r=anchor.getBoundingClientRect();
  pop.style.position='fixed';
  pop.style.left=`${Math.min(r.left,window.innerWidth-pop.offsetWidth-8)}px`;
  pop.style.top=`${r.bottom+6}px`;
  pop.style.zIndex='10000';
  setTimeout(()=>doc.addEventListener('mousedown',onDocDown),10);
}
function showDailySectionEditPopup(anchor,dstr,section){
  const doc=anchor.ownerDocument||document;
  if(dailyOpenPop) dailyOpenPop.remove();
  const draft={
    title:section.title||'',
    emoji:section.emoji||'📌',
    color:resolveDailySectionPalette(section).bg,
  };
  const pop=doc.createElement('div');
  pop.className='daily-section-edit-popup';
  const close=()=>{ pop.remove(); dailyOpenPop=null; doc.removeEventListener('mousedown',onDocDown); };
  const onDocDown=(e)=>{ if(!pop.contains(e.target)&&e.target!==anchor) close(); };

  const titleLabel=el('div','daily-section-edit-label','Section name');
  const titleInp=document.createElement('input');
  titleInp.type='text';
  titleInp.className='daily-section-edit-title';
  titleInp.value=draft.title;
  titleInp.placeholder='Section name';
  titleInp.addEventListener('input',()=>{ draft.title=titleInp.value; });

  const emojiLabel=el('div','daily-section-edit-label','Choose emoji');
  const emojiGrid=el('div','daily-section-edit-emoji-grid');
  const emojiBtns=[];
  DAILY_SECTION_EMOJI_OPTIONS.forEach((emo)=>{
    const btn=el('button','daily-section-edit-emoji-btn',emo);
    btn.type='button';
    if(emo===draft.emoji) btn.classList.add('is-selected');
    btn.onclick=(e)=>{
      e.stopPropagation();
      draft.emoji=emo;
      emojiBtns.forEach(b=>b.classList.toggle('is-selected',b.textContent===emo));
    };
    emojiBtns.push(btn);
    emojiGrid.appendChild(btn);
  });

  const colorLabel=el('div','daily-section-edit-label','Choose color');
  const colorGrid=el('div','daily-section-edit-color-grid');
  const colorBtns=[];
  SECTION_COLORS.forEach((opt,i)=>{
    const btn=el('button','daily-section-edit-color-btn section-dot');
    btn.type='button';
    btn.title=SECTION_COLOR_LABELS[i]||opt.bg;
    btn.style.background=opt.bg;
    if(opt.bg===draft.color) btn.classList.add('is-selected');
    btn.onclick=(e)=>{
      e.stopPropagation();
      draft.color=opt.bg;
      colorBtns.forEach(b=>b.classList.toggle('is-selected',b===btn));
    };
    colorBtns.push(btn);
    colorGrid.appendChild(btn);
  });

  const actions=el('div','daily-section-edit-actions');
  const cancelBtn=el('button','daily-section-edit-cancel','Cancel');
  cancelBtn.type='button';
  cancelBtn.onclick=(e)=>{ e.stopPropagation(); close(); };
  const saveBtn=el('button','daily-section-edit-save','Save');
  saveBtn.type='button';
  saveBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    saveDailySection(dstr,section.id,draft);
  };
  actions.append(cancelBtn,saveBtn);

  pop.append(titleLabel,titleInp,emojiLabel,emojiGrid,colorLabel,colorGrid,actions);
  doc.body.appendChild(pop);
  dailyOpenPop=pop;
  const r=anchor.getBoundingClientRect();
  pop.style.position='fixed';
  pop.style.left=`${Math.min(r.left,window.innerWidth-280)}px`;
  pop.style.top=`${Math.min(r.bottom+6,window.innerHeight-pop.offsetHeight-8)}px`;
  pop.style.zIndex='10001';
  setTimeout(()=>{
    doc.addEventListener('mousedown',onDocDown);
    titleInp.focus();
    titleInp.select();
  },10);
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
    btn.classList.toggle('is-active', dailyViewMode===mode);
    btn.style.removeProperty('background');
    btn.style.removeProperty('color');
    btn.style.removeProperty('border');
    btn.style.removeProperty('font-weight');
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

const MINI_CAL_MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
let miniCalYear=new Date().getFullYear();
let miniCalMonth=new Date().getMonth();

function formatDailyTasksTitle(date){
  const today=new Date();
  today.setHours(0,0,0,0);
  const d=new Date(date);
  d.setHours(0,0,0,0);
  if(d.getTime()===today.getTime()) return "Today's tasks";
  return `${d.toLocaleDateString('en-US',{month:'long',day:'numeric'})}'s tasks`;
}

function loadDailyByDate(date){
  dailySelectedDate=new Date(date);
  dailySelectedDate.setHours(0,0,0,0);
  miniCalYear=dailySelectedDate.getFullYear();
  miniCalMonth=dailySelectedDate.getMonth();
  renderDailyDayWorkspace();
}

function buildDailyMiniCalendar(){
  const panel=el('div','mini-cal-panel');
  panel.id='daily-mini-calendar';

  const header=el('div','mini-cal-header');
  const prevBtn=el('button',null,'◀');
  prevBtn.type='button';
  prevBtn.setAttribute('aria-label','Previous month');
  prevBtn.onclick=()=> miniCalPrev();
  const label=el('span',null,'');
  label.id='mini-cal-label';
  const nextBtn=el('button',null,'▶');
  nextBtn.type='button';
  nextBtn.setAttribute('aria-label','Next month');
  nextBtn.onclick=()=> miniCalNext();
  const todayBtn=el('button',null,'Today');
  todayBtn.type='button';
  todayBtn.id='mini-cal-today-btn';
  todayBtn.onclick=()=> miniCalToday();
  header.append(prevBtn,label,nextBtn,todayBtn);

  const grid=el('div','mini-cal-grid');
  WEEKDAY_LABELS_EN.forEach((name)=>{
    grid.appendChild(el('div','mini-cal-dow',name));
  });

  panel.append(header,grid);
  return panel;
}

function renderMiniCal(){
  const grid=document.querySelector('#daily-mini-calendar .mini-cal-grid');
  const label=document.getElementById('mini-cal-label');
  if(!grid||!label) return;

  label.textContent=`${MINI_CAL_MONTHS[miniCalMonth]} ${miniCalYear}`;

  grid.querySelectorAll('.mini-cal-cell').forEach((c)=> c.remove());

  const firstDay=new Date(miniCalYear,miniCalMonth,1).getDay();
  const daysInMonth=new Date(miniCalYear,miniCalMonth+1,0).getDate();
  const today=new Date();
  today.setHours(0,0,0,0);
  const selectedStr=fmtLocalDate(dailySelectedDate);

  for(let i=0;i<firstDay;i++){
    grid.appendChild(el('div','mini-cal-cell empty'));
  }

  for(let d=1;d<=daysInMonth;d++){
    const cell=el('div','mini-cal-cell',String(d));
    const cellDate=new Date(miniCalYear,miniCalMonth,d);
    cellDate.setHours(0,0,0,0);
    const cellStr=fmtLocalDate(cellDate);

    if(cellStr===fmtLocalDate(today)) cell.classList.add('mini-cal-today');
    if(cellStr===selectedStr) cell.classList.add('mini-cal-selected');

    cell.addEventListener('click',()=>{
      loadDailyByDate(cellDate);
    });
    grid.appendChild(cell);
  }
}

function miniCalPrev(){
  miniCalMonth--;
  if(miniCalMonth<0){ miniCalMonth=11; miniCalYear--; }
  renderMiniCal();
}

function miniCalNext(){
  miniCalMonth++;
  if(miniCalMonth>11){ miniCalMonth=0; miniCalYear++; }
  renderMiniCal();
}

function miniCalToday(){
  loadDailyByDate(new Date());
}

function renderDailyDayWorkspace(){
  const host=document.getElementById('dailyDayWorkspace');
  if(!host) return;
  renderDailyWeekGoal();
  const dstr=fmtLocalDate(dailySelectedDate);
  const allTasks=getDailyTasks(dstr);
  const sections=ensureDailySections(dstr);

  host.innerHTML='';
  const wrap=el('div','daily-day-layout');
  const left=el('div','daily-day-sections');
  const right=el('div','daily-day-memo-panel');

  const sectionHead=el('div','daily-day-sections-head');
  const sectionTitle=el('div','daily-day-head-title',formatDailyTasksTitle(dailySelectedDate));
  sectionTitle.id='daily-date-label';
  const addSectionBtn=el('button','daily-day-add-section-btn','+ Add section');
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
      placeholder:'Enter section name and press Enter',
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
  const mergedSections=sections.concat(
    unsectioned.length
      ? [{id:'__none__',title:'Uncategorized',emoji:'🗒️',color:'',order:99999}]
      : []
  );

  mergedSections.forEach((section)=>{
    const theme=getDailySectionTheme(section);
    const sec=el('section','daily-day-section-card daily-section-card');
    const secHead=el('div','daily-day-section-head daily-section-header');
    const isColoredHeader=section.id!=='__none__';
    if(isColoredHeader){
      secHead.classList.add('daily-section-header--colored');
      secHead.style.backgroundColor=theme.bg;
      secHead.style.color=theme.text;
      secHead.style.setProperty('--daily-section-text',theme.text);
    }
    const leftHead=el('div','daily-day-section-left');
    const emo=el('span','daily-day-section-emoji',theme.emoji);
    leftHead.append(emo);
    leftHead.appendChild(el('span','daily-day-section-title',section.title||'Section'));

    const rightHead=el('div','daily-day-section-actions');
    if(section.id!=='__none__'){
      const menuBtn=el('button','daily-day-section-menu-btn','⋯');
      menuBtn.type='button';
      menuBtn.title='Section menu';
      menuBtn.setAttribute('aria-label','Section menu');
      menuBtn.onclick=(e)=>{
        e.stopPropagation();
        showDailySectionMenu(menuBtn,dstr,section);
      };
      rightHead.appendChild(menuBtn);
    }
    const addTaskBtn=el('button','daily-day-section-btn daily-day-add-task-btn','+ Add task');
    addTaskBtn.type='button';
    if(isColoredHeader){
      addTaskBtn.style.background='rgba(0,0,0,0.08)';
      addTaskBtn.style.color=theme.text;
    }
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
      body.appendChild(el('div','daily-day-empty','No tasks yet'));
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
  const memoHeadLeft=el('div','daily-memo-head-title','📝 Write memo');
  const memoHeadActions=el('div','daily-memo-head-actions');
  const pinBtn=el('button','daily-memo-icon-btn','📌');
  pinBtn.type='button';
  pinBtn.title='Pin panel';
  pinBtn.onclick=()=> right.classList.toggle('is-pinned');
  const expandBtn=el('button','daily-memo-icon-btn','↗');
  expandBtn.type='button';
  expandBtn.title='Expand panel';
  expandBtn.onclick=()=> right.classList.toggle('is-expanded');
  memoHeadActions.append(pinBtn,expandBtn);
  memoHead.append(memoHeadLeft,memoHeadActions);

  const memoInput=document.createElement('textarea');
  memoInput.className='daily-memo-textarea';
  memoInput.placeholder="Write today's memo...";

  const savedAtEl=el('div','daily-memo-saved-at',formatDailyMemoSavedAt(latestDailyMemo?.createdAt));

  const memoActions=el('div','daily-memo-actions');
  const saveMemoBtn=el('button','daily-day-section-btn daily-memo-save-btn','Save');
  saveMemoBtn.type='button';
  const goMemoBtn=el('button','daily-day-section-btn daily-memo-all-btn','View all');
  goMemoBtn.type='button';
  goMemoBtn.onclick=()=>{ window.JCal?.showMemoPage?.(); };
  memoActions.append(saveMemoBtn,goMemoBtn);

  const memoList=el('div','daily-memo-linked-list');
  const renderMemoList=()=>{
    memoList.innerHTML='';
    const memos=getJayMemoList()
      .filter(m=>m.date===dstr)
      .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))
      .slice(0,6);
    if(!memos.length){
      memoList.appendChild(el('div','daily-day-empty','No linked memos'));
      return;
    }
    memos.forEach((m)=>{
      const item=el('div','daily-memo-item');
      const t=el('div','daily-memo-item-title',m.title||'Untitled');
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
      title:`Daily memo ${dstr}`,
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

  const miniCal=buildDailyMiniCalendar();
  const widgetRow=el('div','daily-panel-widget-row');
  const dailyWidgetBtn=el('button','daily-day-section-btn daily-panel-widget-btn','Daily widget');
  dailyWidgetBtn.type='button';
  dailyWidgetBtn.onclick=()=>{ widgetDaily?.(); };
  widgetRow.appendChild(dailyWidgetBtn);

  right.append(miniCal,memoHead,memoInput,savedAtEl,memoActions,memoList,widgetRow);
  wrap.append(left,right);
  host.appendChild(wrap);
  renderMiniCal();
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

  const yearMonth = el('div', null, formatYearMonth(today.getFullYear(), today.getMonth()));
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

  const weekdays = WEEKDAY_LABELS_EN;

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
    col.style.cssText = `display:flex;flex-direction:column;gap:4px;border:1px solid ${isSelected?'#5C8DFF':'#e2e8f0'};border-radius:10px;overflow:hidden;cursor:pointer;`;

    const dayHeader = el('div');
    dayHeader.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:8px 4px 6px;background:${isSelected?'#5C8DFF':isToday?'#EEF2FF':'#f8fafc'};`;

    const dayName = el('div', null, weekdays[i]);
    dayName.style.cssText = `font-size:11px;font-weight:500;color:${isSelected?'#fff':isToday?'#5C8DFF':'#64748b'};`;

    const dayNum = el('div', null, String(date.getDate()));
    dayNum.style.cssText = `font-size:16px;font-weight:700;color:${isSelected?'#fff':isToday?'#5C8DFF':'#111'};`;

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
      cb.style.cssText = 'width:13px;height:13px;cursor:pointer;flex-shrink:0;margin-top:2px;accent-color:#5C8DFF;';

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
  const title = el('div','daily-month-title',formatYearMonth(y,m));
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
  const weekdays=WEEKDAY_LABELS_EN;
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
        const empty=el('div','daily-month-empty','No records');
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
    const empty = el('div', null, 'Add a task for today.');
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
    cb.style.cssText = 'width:16px;height:16px;cursor:pointer;flex-shrink:0;accent-color:#5C8DFF;';

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
      row.style.borderTop = '2px solid #5C8DFF';
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
        empty.textContent='No tasks for today.';
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

  const kDailyWeekGoal = (weekStartDate) => `memo2.dailyWeekGoal.${weekStartDate}`;
  function getWeekStartDateStr(date) {
    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return fmtLocalDate(d);
  }

  function renderDailyWeekGoal() {
    const input = document.getElementById('dailyWeekGoalInput');
    if (!input) return;
    const weekStart = getWeekStartDateStr(dailySelectedDate);
    const key = kDailyWeekGoal(weekStart);
    input.value = get(key, '');
    if (typeof applyGoalStyle === 'function') {
      applyGoalStyle(input, 'dailyGoalEmojiBadge', 'daily-week');
    }
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        set(key, input.value.trim());
        input.blur();
      }
    };
    input.onblur = () => set(key, input.value.trim());
  }

  const dailyGoalStyleBtn = document.getElementById('dailyGoalStyleBtn');
  if (dailyGoalStyleBtn) {
    dailyGoalStyleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof showGoalStyleMenu === 'function') {
        showGoalStyleMenu(dailyGoalStyleBtn, {
          scope: 'daily-week',
          inputId: 'dailyWeekGoalInput',
          badgeId: 'dailyGoalEmojiBadge',
        });
      }
    });
  }

  const dailyApi = {
    showDailyPage,
    initDailyPage,
    getDailyTasks,
    saveDailyTasks,
    saveDailyTask: saveDailyTasks,
    deleteDailyTask: deleteDailyTaskAt,
    deleteDailyTaskAt,
    getDailySections,
    setDailySections,
    saveDailySection,
    deleteDailySection,
    refreshDailyTaskViews,
    getDailySupabaseClient,
    applyDailyView,
    widgetDaily,
    loadDailyByDate,
    renderMiniCal,
    buildDailyMiniCalendar,
    miniCalPrev,
    miniCalNext,
    miniCalToday,
    addDailyTask,
    setDailyViewMode,
  };

  Object.assign(window.JCal || (window.JCal = {}), dailyApi);

  window.showDailyPage = showDailyPage;
  window.initDailyPage = initDailyPage;
  window.applyDailyView = applyDailyView;
  window.refreshDailyTaskViews = refreshDailyTaskViews;
  window.widgetDaily = widgetDaily;
  window.getDailyTasks = getDailyTasks;
})();
