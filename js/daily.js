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
let dailyIsAddingSection = false;
let dailyNewSectionTitle = '';
let dailySectionRenameId = null;
const SECTION_COLOR_BG=[
  '#ffcdd2','#ffe0b2','#fff9c4','#c8e6c9','#bbdefb','#e1bee7',
];
function hexToRgb(hex){
  const h=(hex||'').replace('#','').trim();
  const full=h.length===3?h.split('').map(c=>c+c).join(''):h;
  if(full.length!==6) return null;
  return {
    r:parseInt(full.slice(0,2),16),
    g:parseInt(full.slice(2,4),16),
    b:parseInt(full.slice(4,6),16),
  };
}
function contrastTextForBg(bg){
  const rgb=hexToRgb(bg);
  if(!rgb) return '#111827';
  const luminance=(0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b)/255;
  return luminance>0.62?'#111827':'#ffffff';
}
function sectionColorFromBg(bg){
  return {bg,text:contrastTextForBg(bg)};
}
const SECTION_COLORS=SECTION_COLOR_BG.map(sectionColorFromBg);
const SECTION_COLOR_LABELS=['Rose','Orange','Yellow','Green','Blue','Lavender'];
const LEGACY_DAILY_SECTION_COLOR_IDS={
  yellow:SECTION_COLOR_BG[2],
  green:SECTION_COLOR_BG[3],
  blue:SECTION_COLOR_BG[4],
  purple:SECTION_COLOR_BG[5],
  red:SECTION_COLOR_BG[0],
  gray:'#f1f5f9',
};
const LEGACY_DAILY_SECTION_HEX={
  '#dcfce7':SECTION_COLOR_BG[3],
  '#dbeafe':SECTION_COLOR_BG[4],
  '#EEF2FF':SECTION_COLOR_BG[4],
  '#fef9c3':SECTION_COLOR_BG[2],
  '#ffedd5':SECTION_COLOR_BG[1],
  '#ede9fe':SECTION_COLOR_BG[5],
  '#fce7f3':SECTION_COLOR_BG[0],
  '#fb923c':SECTION_COLOR_BG[1],
  '#d9f99d':SECTION_COLOR_BG[2],
  '#059669':SECTION_COLOR_BG[3],
  '#60a5fa':SECTION_COLOR_BG[4],
  '#ddd6fe':SECTION_COLOR_BG[5],
  '#a21caf':SECTION_COLOR_BG[5],
  '#4ADE80':SECTION_COLOR_BG[3],
  '#60A5FA':SECTION_COLOR_BG[4],
  '#FCD34D':SECTION_COLOR_BG[2],
  '#FB923C':SECTION_COLOR_BG[1],
  '#A78BFA':SECTION_COLOR_BG[5],
  '#F472B6':SECTION_COLOR_BG[0],
  '#10B981':SECTION_COLOR_BG[3],
  '#185FA5':SECTION_COLOR_BG[4],
  '#F59E0B':SECTION_COLOR_BG[2],
  '#F97316':SECTION_COLOR_BG[1],
  '#8B5CF6':SECTION_COLOR_BG[5],
  '#EC4899':SECTION_COLOR_BG[0],
};
function findSectionColorEntry(colorValue){
  const raw=(colorValue||'').trim();
  if(!raw) return SECTION_COLORS[0];
  const byBg=SECTION_COLORS.find(c=>c.bg.toLowerCase()===raw.toLowerCase());
  if(byBg) return byBg;
  if(LEGACY_DAILY_SECTION_COLOR_IDS[raw]){
    return sectionColorFromBg(LEGACY_DAILY_SECTION_COLOR_IDS[raw]);
  }
  const mappedBg=LEGACY_DAILY_SECTION_HEX[raw]||LEGACY_DAILY_SECTION_HEX[raw.toUpperCase()];
  if(mappedBg){
    return sectionColorFromBg(mappedBg);
  }
  if(/^#[0-9a-f]{3,8}$/i.test(raw)){
    return sectionColorFromBg(raw);
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
const _dailyNotesCache=new Map();
const _dailyTasksLoadPromises=new Map();
const _dailySectionsLoadPromises=new Map();
let _dailyNotesMissingTableWarned=false;

function getDailySupabaseClient(){
  if(!_dailySbClient && typeof window!=='undefined' && window.supabase?.auth){
    _dailySbClient=window.supabase;
    _dailySbClient.auth.onAuthStateChange((_evt,session)=>{
      _dailySbUserId=session?.user?.id||null;
      _dailyTasksCache.clear();
      _dailySectionsCache.clear();
      _dailyNotesCache.clear();
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

function isDailyNotesTableMissingError(err){
  if(!err) return false;
  return err.code==='42P01'||/daily_notes/i.test(err.message||'');
}

function printDailyNotesSetupGuide(err){
  if(_dailyNotesMissingTableWarned) return;
  _dailyNotesMissingTableWarned=true;
  console.error('daily_notes table missing.', err);
}

async function loadDailyNoteFromSupabase(dstr){
  const userId=await resolveDailyUserId();
  if(!userId) return null;
  if(_dailyNotesCache.has(dstr)) return _dailyNotesCache.get(dstr);
  const sb=getDailySupabaseClient();
  try{
    const {data,error}=await sb.from('daily_notes')
      .select('content,updated_at')
      .eq('user_id',userId)
      .eq('date',dstr)
      .maybeSingle();
    if(error) throw error;
    const out={
      content:data?.content||'',
      updatedAt:data?.updated_at||null,
    };
    _dailyNotesCache.set(dstr,out);
    return out;
  }catch(err){
    if(isDailyNotesTableMissingError(err)) printDailyNotesSetupGuide(err);
    else console.error('loadDailyNoteFromSupabase',err);
    return null;
  }
}

async function upsertDailyNoteToSupabase(dstr,content){
  const userId=await resolveDailyUserId();
  if(!userId) return null;
  const sb=getDailySupabaseClient();
  try{
    const row={
      user_id:userId,
      date:dstr,
      content:content||'',
      updated_at:new Date().toISOString(),
    };
    const {data,error}=await sb.from('daily_notes')
      .upsert(row,{onConflict:'user_id,date'})
      .select('content,updated_at')
      .maybeSingle();
    if(error) throw error;
    const out={
      content:data?.content??row.content,
      updatedAt:data?.updated_at??row.updated_at,
    };
    _dailyNotesCache.set(dstr,out);
    return out;
  }catch(err){
    if(isDailyNotesTableMissingError(err)) printDailyNotesSetupGuide(err);
    else console.error('upsertDailyNoteToSupabase',err);
    return null;
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
  const task=list[idx];
  if(!task) return;
  const value=(newText||'').trim();
  if(!value) return;
  if(task.id) patchDailyTask(dstr,task.id,{text:value});
  else{
    list[idx].text=value;
    saveDailyTasks(dstr,list);
    refreshDailyTaskViews();
  }
}
function deleteDailyTaskAt(dstr,idx){
  const list=getDailyTasks(dstr);
  const task=list[idx];
  if(!task) return;
  list.splice(idx,1);
  _dailyTasksCache.set(dstr,list);
  set(kDaily(dstr),list);
  refreshDailyTaskViews();
  (async ()=>{
    const userId=await resolveDailyUserId();
    if(!userId||!task.id) return;
    const sb=getDailySupabaseClient();
    const {error}=await sb.from('daily_tasks')
      .delete()
      .eq('id',task.id)
      .eq('user_id',userId);
    if(error) console.error('deleteDailyTaskAt',error);
  })();
}
function insertDailyTask(dstr,{text,sectionId,done=false}){
  return (async ()=>{
    const value=(text||'').trim();
    if(!value) return null;
    const id=ensureDailyTaskId({});
    const resolvedSectionId=sectionId==='__none__'?undefined:sectionId;
    const task={id,text:value,done:!!done,sectionId:resolvedSectionId};
    const list=getDailyTasks(dstr).slice();
    list.push(task);
    _dailyTasksCache.set(dstr,list);
    set(kDaily(dstr),list);
    const userId=await resolveDailyUserId();
    if(!userId){
      console.error('insertDailyTask: not logged in');
      return task;
    }
    const sb=getDailySupabaseClient();
    const {error}=await sb.from('daily_tasks').insert({
      id,
      user_id:userId,
      date:dstr,
      text:value,
      done:!!done,
      section_id:resolvedSectionId||null,
    });
    if(error) console.error('insertDailyTask',error);
    return task;
  })();
}
function patchDailyTask(dstr,taskId,patch){
  return (async ()=>{
    const list=getDailyTasks(dstr);
    const idx=list.findIndex(t=>t.id===taskId);
    if(idx<0) return;
    const normalized={...patch};
    if(normalized.text!=null){
      const value=(normalized.text||'').trim();
      if(!value) return;
      normalized.text=value;
    }
    if(normalized.sectionId!==undefined){
      normalized.sectionId=normalized.sectionId||undefined;
    }
    list[idx]={...list[idx],...normalized};
    _dailyTasksCache.set(dstr,list);
    set(kDaily(dstr),list);
    refreshDailyTaskViews();
    const userId=await resolveDailyUserId();
    if(!userId){
      console.error('patchDailyTask: not logged in');
      return;
    }
    const sb=getDailySupabaseClient();
    const dbPatch={};
    if(patch.text!=null) dbPatch.text=normalized.text;
    if(patch.done!=null) dbPatch.done=!!normalized.done;
    if(patch.sectionId!==undefined) dbPatch.section_id=normalized.sectionId||null;
    const {error}=await sb.from('daily_tasks')
      .update(dbPatch)
      .eq('id',taskId)
      .eq('user_id',userId);
    if(error) console.error('patchDailyTask',error);
  })();
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
function startDailyTaskInlineEdit(dstr,taskId,textEl,options={}){
  const list=getDailyTasks(dstr);
  const task=list.find(t=>t.id===taskId);
  if(!task) return;
  const originalText=task.text||'';
  const inp=document.createElement('input');
  inp.type='text';
  inp.className=options.inputClass||'daily-section-task-input daily-day-task-inline-input';
  if(options.inputStyle) inp.style.cssText=options.inputStyle;
  inp.value=originalText;
  let committed=false;
  const finish=(fn)=>{ if(committed) return; committed=true; fn(); };
  const save=()=> finish(()=>{
    const value=inp.value.trim();
    if(!value||value===originalText){
      refreshDailyTaskViews();
      return;
    }
    patchDailyTask(dstr,taskId,{text:value});
  });
  const cancel=()=> finish(()=> refreshDailyTaskViews());
  inp.addEventListener('keydown',(ev)=>{
    if(ev.key==='Enter'){ ev.preventDefault(); save(); }
    if(ev.key==='Escape'){ ev.preventDefault(); cancel(); }
  });
  inp.addEventListener('blur',()=> save());
  textEl.replaceWith(inp);
  inp.focus();
  inp.select();
}
function appendDailyDayTaskRow(body,dstr,idx,task,beforeEl=null){
  const row=el('div','daily-task-row daily-day-task-row');
  const cb=document.createElement('input');
  cb.type='checkbox';
  cb.checked=!!task.done;
  cb.addEventListener('change',()=> setDailyItemDone(dstr,idx,cb.checked));
  const txt=el('span','daily-day-task-text',task.text||'');
  if(task.done) txt.classList.add('is-done');
  txt.title='Double-click to edit';
  txt.addEventListener('dblclick',(e)=>{
    e.preventDefault();
    if(task.id) startDailyTaskInlineEdit(dstr,task.id,txt);
  });
  const actions=el('div','daily-day-task-actions');
  const delBtn=el('button','daily-day-task-icon-btn daily-day-task-delete','✕');
  delBtn.type='button';
  delBtn.setAttribute('aria-label','Delete task');
  delBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    deleteDailyTaskAt(dstr,idx);
  });
  actions.appendChild(delBtn);
  row.append(cb,txt,actions);
  if(beforeEl) body.insertBefore(row,beforeEl);
  else body.appendChild(row);
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
  (async ()=>{
    const sections=getDailySections(dstr);
    const target=sections.find(s=>s.id===sectionId);
    if(!target||!isDailySectionDeletable(target)) return;
    const userId=await resolveDailyUserId();
    if(!userId){
      console.error('deleteDailySection: not logged in');
      return;
    }
    const sb=getDailySupabaseClient();
    try{
      const {error:taskErr}=await sb.from('daily_tasks')
        .delete()
        .eq('user_id',userId)
        .eq('section_id',sectionId);
      if(taskErr) throw taskErr;
      const {error:secErr}=await sb.from('daily_sections')
        .delete()
        .eq('id',sectionId)
        .eq('user_id',userId);
      if(secErr) throw secErr;
    }catch(err){
      console.error('deleteDailySection',err);
      return;
    }
    const nextSections=sections.filter(s=>s.id!==sectionId);
    const nextTasks=getDailyTasks(dstr).filter(t=>t.sectionId!==sectionId);
    _dailySectionsCache.set(dstr,nextSections);
    _dailyTasksCache.set(dstr,nextTasks);
    set(kDailySections(dstr),nextSections);
    set(kDaily(dstr),nextTasks);
    if(dailySectionRenameId===sectionId) dailySectionRenameId=null;
    renderDailyDayWorkspace();
  })();
}
function patchDailySection(dstr,sectionId,patch){
  return (async ()=>{
    const sections=getDailySections(dstr);
    const idx=sections.findIndex(s=>s.id===sectionId);
    if(idx<0) return;
    const normalized={...patch};
    if(normalized.color!=null) normalized.color=findSectionColorEntry(normalized.color).bg;
    if(normalized.title!=null){
      const value=(normalized.title||'').trim();
      if(!value) return;
      normalized.title=value;
    }
    sections[idx]={...sections[idx],...normalized};
    _dailySectionsCache.set(dstr,sections);
    set(kDailySections(dstr),sections);
    refreshDailyTaskViews();
    const userId=await resolveDailyUserId();
    if(!userId){
      console.error('patchDailySection: not logged in');
      return;
    }
    const sb=getDailySupabaseClient();
    const dbPatch={};
    if(patch.title!=null) dbPatch.title=normalized.title;
    if(patch.emoji!=null) dbPatch.emoji=normalized.emoji;
    if(patch.color!=null) dbPatch.color=normalized.color;
    const {error}=await sb.from('daily_sections')
      .update(dbPatch)
      .eq('id',sectionId)
      .eq('user_id',userId);
    if(error) console.error('patchDailySection',error);
  })();
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
function appendDailySectionTaskInput(body,dstr,sectionId){
  const inp=document.createElement('input');
  inp.type='text';
  inp.className='daily-section-task-input';
  inp.placeholder='Add a task and press Enter';
  inp.addEventListener('keydown',(e)=>{
    if(e.key!=='Enter') return;
    e.preventDefault();
    const value=inp.value.trim();
    if(!value) return;
    insertDailyTask(dstr,{text:value,sectionId}).then((task)=>{
      if(!task) return;
      inp.value='';
      const empty=body.querySelector('.daily-day-empty');
      if(empty) empty.remove();
      const list=getDailyTasks(dstr);
      const idx=list.findIndex(t=>t.id===task.id);
      if(idx>=0) appendDailyDayTaskRow(body,dstr,idx,task,inp);
      inp.focus();
    });
  });
  body.appendChild(inp);
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
  updateDailyHeaderPeriodNav();
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
function updateDailyGoTodayBtnLabel(){
  const todayBtn=document.getElementById('dailyGoTodayBtn');
  if(!todayBtn) return;
  todayBtn.textContent=String(new Date().getDate());
}

function bindDailyGoTodayBtn(){
  const todayBtn=document.getElementById('dailyGoTodayBtn');
  if(!todayBtn||todayBtn.dataset.bound==='1') return;
  todayBtn.dataset.bound='1';
  todayBtn.onclick=()=>{
    const t=new Date();
    t.setHours(0,0,0,0);
    dailySelectedDate=t;
    setDailyViewMode('day');
  };
}

function updateDailyHeaderPeriodNav(){
  const wrap=document.getElementById('dailyPeriodNavWrap');
  const label=document.getElementById('dailyPeriodLabel');
  const prev=document.getElementById('dailyPeriodPrevBtn');
  const next=document.getElementById('dailyPeriodNextBtn');
  const goTodayBtn=document.getElementById('dailyGoTodayBtn');
  if(!wrap||!label||!prev||!next) return;

  bindDailyGoTodayBtn();

  const show=(dailyViewMode==='week'||dailyViewMode==='month');
  wrap.style.display=show?'inline-flex':'none';
  if(goTodayBtn){
    goTodayBtn.style.display=show?'inline-block':'none';
    if(show) updateDailyGoTodayBtnLabel();
  }
  if(!show) return;

  label.textContent=formatYearMonth(dailySelectedDate.getFullYear(),dailySelectedDate.getMonth());
  prev.onclick=()=>{
    if(dailyViewMode==='week'){
      const d=new Date(dailySelectedDate);
      d.setDate(d.getDate()-7);
      dailySelectedDate=d;
      renderDailyWeekCalendar();
      renderDailyList();
      updateDailyHeaderPeriodNav();
      return;
    }
    if(dailyViewMode==='month'){
      dailySelectedDate=new Date(dailySelectedDate.getFullYear(),dailySelectedDate.getMonth()-1,1);
      renderDailyMonthCalendar();
      updateDailyHeaderPeriodNav();
    }
  };
  next.onclick=()=>{
    if(dailyViewMode==='week'){
      const d=new Date(dailySelectedDate);
      d.setDate(d.getDate()+7);
      dailySelectedDate=d;
      renderDailyWeekCalendar();
      renderDailyList();
      updateDailyHeaderPeriodNav();
      return;
    }
    if(dailyViewMode==='month'){
      dailySelectedDate=new Date(dailySelectedDate.getFullYear(),dailySelectedDate.getMonth()+1,1);
      renderDailyMonthCalendar();
      updateDailyHeaderPeriodNav();
    }
  };
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
  if(!ts) return '';
  const d=new Date(ts);
  if(Number.isNaN(d.getTime())) return '';
  const hh=String(d.getHours()).padStart(2,'0');
  const mm=String(d.getMinutes()).padStart(2,'0');
  return `Saved ${hh}:${mm}`;
}
function positionDailyMenuPopup(pop,anchor,popupWidth=160){
  const win=(anchor.ownerDocument||document).defaultView||window;
  const rect=anchor.getBoundingClientRect();
  const left=(rect.right+popupWidth>win.innerWidth)
    ?rect.left-popupWidth
    :rect.right;
  pop.style.position='fixed';
  pop.style.left=left+'px';
  pop.style.top=(rect.bottom+4)+'px';
  pop.style.zIndex='10000';
}
function bindDailyMenuOutsideClose(pop,anchor,close){
  const doc=anchor.ownerDocument||document;
  const onDocDown=(e)=>{
    if(!pop.contains(e.target)&&e.target!==anchor) close();
  };
  setTimeout(()=>doc.addEventListener('mousedown',onDocDown),10);
  return onDocDown;
}
function showDailySectionColorPicker(anchor,dstr,section){
  const doc=anchor.ownerDocument||document;
  if(dailyOpenPop) dailyOpenPop.remove();
  const pop=doc.createElement('div');
  pop.className='event-menu-popup daily-section-color-popup';
  let onDocDown=null;
  const close=()=>{
    pop.remove();
    dailyOpenPop=null;
    if(onDocDown) doc.removeEventListener('mousedown',onDocDown);
  };
  onDocDown=bindDailyMenuOutsideClose(pop,anchor,close);
  const currentBg=resolveDailySectionPalette(section).bg;
  const grid=el('div','daily-section-color-grid');
  grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:4px;';
  SECTION_COLORS.forEach((opt,i)=>{
    const sw=doc.createElement('button');
    sw.type='button';
    sw.title=SECTION_COLOR_LABELS[i]||opt.bg;
    sw.style.cssText=`width:36px;height:36px;border-radius:8px;border:2px solid ${opt.bg.toLowerCase()===currentBg.toLowerCase()?'#5C8DFF':'#e5e7eb'};background:${opt.bg};cursor:pointer;padding:0;`;
    sw.onclick=(e)=>{
      e.stopPropagation();
      close();
      patchDailySection(dstr,section.id,{color:opt.bg});
    };
    grid.appendChild(sw);
  });
  pop.appendChild(grid);
  doc.body.appendChild(pop);
  dailyOpenPop=pop;
  positionDailyMenuPopup(pop,anchor,140);
}
function showDailySectionEmojiPicker(anchor,dstr,section){
  const pick=typeof window.showEmojiPicker==='function'?window.showEmojiPicker:null;
  if(!pick){
    console.error('showEmojiPicker not available');
    return;
  }
  pick(anchor,(emoji)=>{
    patchDailySection(dstr,section.id,{emoji});
  });
}
function showDailySectionMenu(anchor,dstr,section){
  const doc=anchor.ownerDocument||document;
  if(dailyOpenPop) dailyOpenPop.remove();
  const pop=doc.createElement('div');
  pop.className='event-menu-popup daily-section-menu-popup';
  let onDocDown=null;
  const close=()=>{
    pop.remove();
    dailyOpenPop=null;
    if(onDocDown) doc.removeEventListener('mousedown',onDocDown);
  };
  onDocDown=bindDailyMenuOutsideClose(pop,anchor,close);

  const colorBtn=el('button','menu-item','🎨 Change Color');
  colorBtn.type='button';
  colorBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    showDailySectionColorPicker(anchor,dstr,section);
  };

  const emojiBtn=el('button','menu-item','😊 Change Emoji');
  emojiBtn.type='button';
  emojiBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    showDailySectionEmojiPicker(anchor,dstr,section);
  };

  const renameBtn=el('button','menu-item','✏️ Rename');
  renameBtn.type='button';
  renameBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    dailySectionRenameId=section.id;
    renderDailyDayWorkspace();
  };

  pop.append(colorBtn,emojiBtn,renameBtn);

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
  positionDailyMenuPopup(pop,anchor);
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
  const listSection=document.getElementById('dailyList');
  const show=(el,visible)=>{
    if(!el) return;
    if(visible) el.style.removeProperty('display');
    else el.style.display='none';
  };
  show(dayWrap, mode==='day');
  show(weekWrap, mode==='week');
  show(monthWrap, mode==='month');
  show(listSection, mode==='week');
  updateDailyViewButtons();
}
function setDailyItemDone(dstr,idx,checked){
  const list=getDailyTasks(dstr);
  const task=list[idx];
  if(!task) return;
  if(task.id) patchDailyTask(dstr,task.id,{done:checked});
  else{
    list[idx].done=checked;
    saveDailyTasks(dstr,list);
    refreshDailyTaskViews();
  }
}

function initDailyPage(){
  const dailyPageEl=document.getElementById('dailyPage');
  if(!dailyPageEl) return;
  loadDailyViewMode();
  bindDailyViewButtons();
  if(dailyPageEl.dataset.initialized === 'true') return;
  dailyPageEl.dataset.initialized = 'true';

  const openWidgetBtn = document.getElementById('openDailyWidgetBtn');

  openWidgetBtn?.addEventListener('click', ()=>{
    const periodWrap=document.getElementById('dailyPeriodNavWrap');
    if(periodWrap) periodWrap.style.display='none';
    widgetDaily?.();
  });
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
  const dstr=fmtLocalDate(dailySelectedDate);
  const allTasks=getDailyTasks(dstr);
  const sections=ensureDailySections(dstr);

  host.innerHTML='';
  const wrap=el('div','daily-day-layout');
  const left=el('div','daily-day-sections');
  const right=el('div','daily-day-memo-panel');

  const sectionHead=el('div','daily-day-sections-head');
  sectionHead.style.cssText='display:flex;justify-content:flex-end;align-items:center;width:100%;';
  const addSectionBtn=el('button','daily-day-add-section-btn','+ Add section');
  addSectionBtn.type='button';
  addSectionBtn.onclick=()=>{
    dailyIsAddingSection=true;
    dailyNewSectionTitle='';
    renderDailyDayWorkspace();
  };
  sectionHead.append(addSectionBtn);
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
    if(section.id!=='__none__'&&dailySectionRenameId===section.id){
      appendDailySectionTitleInput(leftHead,{
        placeholder:'Section name',
        value:section.title||'',
        onInput:()=>{},
        onSubmit:(v)=>{
          dailySectionRenameId=null;
          patchDailySection(dstr,section.id,{title:v});
        },
        onCancel:()=>{
          dailySectionRenameId=null;
          renderDailyDayWorkspace();
        },
        onBlur:(v)=>{
          dailySectionRenameId=null;
          const value=(v||'').trim();
          if(value&&(value!==(section.title||''))){
            patchDailySection(dstr,section.id,{title:value});
          }else{
            renderDailyDayWorkspace();
          }
        },
      });
    }else{
      leftHead.appendChild(el('span','daily-day-section-title',section.title||'Section'));
    }

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
    secHead.append(leftHead,rightHead);

    const body=el('div','daily-day-section-body');
    const items=allTasks
      .map((t,idx)=>({task:t,idx}))
      .filter(({task})=> section.id==='__none__' ? !task.sectionId : task.sectionId===section.id);

    if(!items.length){
      body.appendChild(el('div','daily-day-empty','No tasks yet'));
    }else{
      items.forEach(({task,idx})=>{
        appendDailyDayTaskRow(body,dstr,idx,task);
      });
    }
    appendDailySectionTaskInput(body,dstr,section.id);
    sec.append(secHead,body);
    listWrap.appendChild(sec);
  });
  left.appendChild(listWrap);

  const noteSection=el('div','daily-note-section');
  noteSection.style.display='none';
  const memoHead=el('div','daily-memo-head');
  const memoHeadLeft=el('div','daily-memo-head-title','📝 Daily Note');
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
  memoInput.placeholder='Write a note...';
  memoInput.style.minHeight='80px';
  memoInput.style.maxHeight='none';
  memoInput.style.height='80px';
  const autoResizeDailyNote=()=>{
    memoInput.style.height='auto';
    memoInput.style.height=`${memoInput.scrollHeight}px`;
  };

  const savedAtEl=el('div','daily-memo-saved-at','');

  const memoActions=el('div','daily-memo-actions');
  const saveMemoBtn=el('button','daily-day-section-btn daily-memo-save-btn','Save');
  saveMemoBtn.type='button';
  memoActions.append(saveMemoBtn);

  let noteSaveTimer=null;
  let isSaving=false;
  const saveDailyNote=async()=>{
    if(isSaving) return;
    isSaving=true;
    try{
      const out=await upsertDailyNoteToSupabase(dstr,memoInput.value||'');
      if(out?.updatedAt){
        savedAtEl.textContent=formatDailyMemoSavedAt(new Date(out.updatedAt).getTime());
      }
    }finally{
      isSaving=false;
    }
  };
  saveMemoBtn.onclick=()=>{ saveDailyNote(); };
  memoInput.addEventListener('input',()=>{
    autoResizeDailyNote();
    if(noteSaveTimer) clearTimeout(noteSaveTimer);
    noteSaveTimer=setTimeout(()=>{ saveDailyNote(); },1000);
  });

  noteSection.append(memoHead,memoInput,savedAtEl,memoActions);
  (async ()=>{
    const userId=await resolveDailyUserId();
    if(!userId){
      noteSection.style.display='none';
      return;
    }
    noteSection.style.removeProperty('display');
    const loaded=await loadDailyNoteFromSupabase(dstr);
    memoInput.value=loaded?.content||'';
    autoResizeDailyNote();
    if(loaded?.updatedAt){
      savedAtEl.textContent=formatDailyMemoSavedAt(new Date(loaded.updatedAt).getTime());
    }else{
      savedAtEl.textContent='';
    }
  })();

  const miniCal=buildDailyMiniCalendar();
  const widgetRow=el('div','daily-panel-widget-row');
  const dailyWidgetBtn=el('button','daily-day-section-btn daily-panel-widget-btn','Daily widget');
  dailyWidgetBtn.type='button';
  dailyWidgetBtn.onclick=()=>{ widgetDaily?.(); };
  widgetRow.appendChild(dailyWidgetBtn);

  right.append(miniCal,noteSection,widgetRow);
  wrap.append(left,right);
  host.appendChild(wrap);
  renderMiniCal();
}

function renderDailyWeekCalendar(){
  const container = document.getElementById('dailyWeekCalendar');
  if(!container) return;
  container.innerHTML = '';
  updateDailyHeaderPeriodNav();

  const today = dailySelectedDate;
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  // Week tab 상단: WEEKLY FOCUS / THIS MONTH 2컬럼 블록
  const weekStartMonday = getWeekStartMondayDateStr(dailySelectedDate);
  const weeklyNotesWrap = el('div','daily-weekly-notes-wrap');
  weeklyNotesWrap.style.cssText = 'margin:0 12px 12px;background:#f8f9fa;border-radius:12px;padding:10px 12px;display:none;gap:10px;align-items:stretch;border:1px solid #e9ecef;';
  container.appendChild(weeklyNotesWrap);
  renderDailyWeeklyNotesBlock(weeklyNotesWrap, weekStartMonday);

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
  container.innerHTML = '';
  updateDailyHeaderPeriodNav();

  const y = dailySelectedDate.getFullYear();
  const m = dailySelectedDate.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const totalDays = new Date(y, m+1, 0).getDate();

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

  container.append(view);
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
    editBtn.title = 'Edit';

    const delBtn = el('button', null, '✕');
    delBtn.style.cssText = 'background:none;border:none;color:#cbd5e1;cursor:pointer;font-size:14px;padding:0;flex-shrink:0;';

    editBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const task=list[idx];
      if(task?.id){
        startDailyTaskInlineEdit(dstr, task.id, text, {
          inputClass:'',
          inputStyle:'flex:1;font-size:14px;border:none;outline:none;background:transparent;width:100%;font-family:inherit;padding:0;box-sizing:border-box;',
        });
      }
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

  // weekly_notes 테이블은 "해당 주 월요일" 기준 week_start 저장
  function getWeekStartMondayDateStr(date) {
    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);
    // JS getDay(): 0(Sun)~6(Sat) => Mon 기준으로 offset 보정
    const offset = (d.getDay() + 6) % 7; // Mon=0, Tue=1, ... , Sun=6
    d.setDate(d.getDate() - offset);
    return fmtLocalDate(d);
  }

  function safeJsonParseStringArray(v) {
    try {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v !== 'string') return null;
      const parsed = JSON.parse(v);
      if (!Array.isArray(parsed)) return null;
      return parsed.map(String);
    } catch {
      return null;
    }
  }

  async function loadWeeklyNotesFromSupabase(weekStartStr) {
    const userId = await resolveDailyUserId();
    if (!userId) return null;
    const sb = getDailySupabaseClient();
    const { data, error } = await sb
      .from('weekly_notes')
      .select('id,reminder,monthly')
      .eq('user_id', userId)
      .eq('week_start', weekStartStr);
    if (error) throw error;

    const row = (data || [])[0] || null;
    const reminderArr = safeJsonParseStringArray(row?.reminder) || [''];
    const monthlyArr = safeJsonParseStringArray(row?.monthly) || [''];
    return {
      reminder: reminderArr.length ? reminderArr : [''],
      monthly: monthlyArr.length ? monthlyArr : [''],
    };
  }

  function ensureUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `wn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  async function upsertWeeklyNotesToSupabase(weekStartStr, reminderArr, monthlyArr) {
    const userId = await resolveDailyUserId();
    if (!userId) return;
    const sb = getDailySupabaseClient();
    const rows = [
      {
        id: ensureUUID(),
        user_id: userId,
        week_start: weekStartStr,
        reminder: JSON.stringify(reminderArr),
        monthly: JSON.stringify(monthlyArr),
      },
    ];
    const { error } = await sb.from('weekly_notes').upsert(rows, { onConflict: 'user_id,week_start' });
    if (error) throw error;
  }

  function renderDailyWeeklyNotesBlock(hostEl, weekStartStr) {
    const doc = hostEl.ownerDocument || document;

    // 로그인 안 됐을 때는 블록 숨김
    hostEl.style.display = 'none';
    hostEl.innerHTML = '';

    const renderHidden = () => {
      hostEl.style.display = 'none';
    };

    // 방어적으로 로딩 표시
    hostEl.style.display = 'flex';
    hostEl.style.justifyContent = 'space-between';
    hostEl.style.flexWrap = 'nowrap';
    hostEl.style.alignItems = 'flex-start';
    hostEl.innerHTML = '<div style="color:#94a3b8;font-size:12px;line-height:1.4;padding:6px 0;">Loading...</div>';

    (async () => {
      const userId = await resolveDailyUserId();
      if (!userId) {
        renderHidden();
        return;
      }

      let reminderItems = [''];
      let monthlyItems = [''];
      try {
        const loaded = await loadWeeklyNotesFromSupabase(weekStartStr);
        if (loaded) {
          reminderItems = loaded.reminder || [''];
          monthlyItems = loaded.monthly || [''];
        }
      } catch (err) {
        console.error('loadWeeklyNotesFromSupabase', err);
      }

      // debounce: 500ms 후 upsert
      let saveTimer = null;
      const scheduleSave = () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          try {
            await upsertWeeklyNotesToSupabase(weekStartStr, reminderItems, monthlyItems);
          } catch (err) {
            console.error('upsertWeeklyNotesToSupabase', err);
          }
        }, 500);
      };

      const pending = { reminder: null, monthly: null };

      const renderBulletList = (listEl, items, autoEditIndex, onItemsChange) => {
        listEl.innerHTML = '';
        const makeInput = (rowEl, spanEl, idx) => {
          const input = doc.createElement('input');
          input.type = 'text';
          input.value = items[idx] || '';
          input.maxLength = 200;
          input.autocomplete = 'off';
          input.spellcheck = false;
          input.style.cssText =
            'width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;color:#374151;padding:2px 8px;font-size:0.875rem;line-height:1.4;outline:none;font-family:inherit;';

          rowEl.replaceChild(input, spanEl);
          input.focus();
          input.select();

          const original = items[idx] || '';
          let isFinished = false;
          const commitBlur = () => {
            if(isFinished) return;
            isFinished = true;
            const next = items.slice();
            next[idx] = (input.value || '').trim();
            onItemsChange(next, null);
          };

          input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              isFinished = true;
              const next = items.slice();
              next[idx] = original;
              onItemsChange(next, null);
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              isFinished = true;
              const next = items.slice();
              next[idx] = (input.value || '').trim();
              next.splice(idx + 1, 0, '');
              onItemsChange(next, idx + 1);
              return;
            }
            if (e.key === 'Backspace') {
              const atStart = input.selectionStart === 0;
              if (atStart && (input.value || '').trim() === '' && items.length > 1) {
                e.preventDefault();
                isFinished = true;
                const next = items.slice();
                next.splice(idx, 1);
                if (!next.length) next.push('');
                const focusIdx = Math.min(idx, next.length - 1);
                onItemsChange(next, focusIdx);
              }
            }
          });

          input.addEventListener('blur', commitBlur);
        };

        items.forEach((val, idx) => {
          const row = doc.createElement('div');
          row.className = 'daily-weekly-note-row';
          row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:3px 0;cursor:text;';

          const bullet = doc.createElement('span');
          bullet.textContent = '•';
          bullet.style.cssText = 'color:#6b7280;margin-top:4px;flex-shrink:0;font-size:16px;line-height:1;';

          const span = doc.createElement('span');
          span.className = 'daily-weekly-note-text';
          span.textContent = val || '\u00A0';
          span.tabIndex = 0;
          span.style.cssText =
            'color:#374151;font-size:0.9rem;line-height:1.4;word-break:break-word;flex:1;min-width:0;cursor:text;min-height:1.4em;';
          if (!val) span.style.color = '#94a3b8';

          const startEdit = (e) => {
            e.stopPropagation();
            if (row.querySelector('input')) return;
            makeInput(row, span, idx);
          };
          span.addEventListener('click', startEdit);
          row.addEventListener('click', (e) => {
            if (e.target.closest('input')) return;
            startEdit(e);
          });
          span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              startEdit(e);
            }
          });

          row.append(bullet, span);
          listEl.appendChild(row);

          if (autoEditIndex === idx) {
            // renderAll 이후 DOM이 완전히 구성된 뒤 편집 시작
            setTimeout(() => makeInput(row, span, idx), 0);
          }
        });
      };

      const reminderListEl = doc.createElement('div');
      const monthlyListEl = doc.createElement('div');

      const leftCol = doc.createElement('div');
      leftCol.className = 'daily-weekly-notes-col';
      leftCol.style.cssText = 'flex:1;min-width:0;';
      const rightCol = doc.createElement('div');
      rightCol.className = 'daily-weekly-notes-col';
      rightCol.style.cssText = 'flex:1;min-width:0;';

      const leftTitle = doc.createElement('div');
      leftTitle.textContent = '📌 Weekly Focus';
      leftTitle.style.cssText = 'color:#374151;font-weight:600;font-size:0.85rem;margin-bottom:6px;letter-spacing:0;';
      const rightTitle = doc.createElement('div');
      rightTitle.textContent = '🗓️ This Month';
      rightTitle.style.cssText = 'color:#374151;font-weight:600;font-size:0.85rem;margin-bottom:6px;letter-spacing:0;';

      const listWrapStyle = 'background:#ffffff;border:1px solid #e9ecef;border-radius:10px;padding:8px 10px;';
      leftCol.append(leftTitle, reminderListEl);
      rightCol.append(rightTitle, monthlyListEl);
      reminderListEl.style.cssText = listWrapStyle;
      monthlyListEl.style.cssText = listWrapStyle;

      hostEl.innerHTML = '';
      hostEl.append(leftCol, rightCol);

      const renderAll = () => {
        reminderListEl.style.cssText = listWrapStyle;
        monthlyListEl.style.cssText = listWrapStyle;
        renderBulletList(reminderListEl, reminderItems, pending.reminder, (nextArr, focusIdx) => {
          reminderItems = nextArr.length ? nextArr : [''];
          pending.reminder = focusIdx;
          scheduleSave();
          renderAll();
        });
        renderBulletList(monthlyListEl, monthlyItems, pending.monthly, (nextArr, focusIdx) => {
          monthlyItems = nextArr.length ? nextArr : [''];
          pending.monthly = focusIdx;
          scheduleSave();
          renderAll();
        });
        pending.reminder = null;
        pending.monthly = null;
      };

      renderAll();
    })();
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
