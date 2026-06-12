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
  function kDailyNote(d) { return 'memo2.daily.note.' + d; }

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

  function isDailyPageVisible() {
    const page = document.getElementById('dailyPage');
    if (!page || page.classList.contains('hidden')) return false;
    return window.getComputedStyle(page).display !== 'none';
  }

  function openAppLoginModal() {
    const overlay = document.getElementById('login-modal-overlay');
    if (overlay) overlay.style.display = 'flex';
    else document.getElementById('login-btn')?.click();
  }

  function syncLoginNudgeBanner(pageEl, show) {
    // 제거됨 — 탭바로 이동
  }

  function setDailyMainContentVisible(visible) {
    const ids = ['dailyDayWorkspace', 'dailyWeekCalendar', 'dailyMonthCalendar', 'dailyList'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (visible) el.style.removeProperty('display');
      else el.style.display = 'none';
    });
  }

  function ensureDailyLoginGateEl() {
    const page = document.getElementById('dailyPage');
    if (!page) return null;
    let gate = document.getElementById('dailyLoginGate');
    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'dailyLoginGate';
      gate.style.cssText = 'flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;';
      page.appendChild(gate);
    }
    return gate;
  }

  function renderDailyLoginGate() {
    // 제거됨
  }

  function hideDailyLoginGate() {
    const gate = document.getElementById('dailyLoginGate');
    if (gate) gate.style.display = 'none';
  }

  function isDailyLoggedIn() {
    return !!_dailySbUserId;
  }

  function syncDailyPageLoginNudge() {
    const page = document.getElementById('dailyPage');
    syncLoginNudgeBanner(page, !isDailyLoggedIn());
  }

  async function showDailyPage() {
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
    getDailySupabaseClient();
    await resolveDailyUserId();
    initDailyPage();
    hideDailyLoginGate();
    syncDailyPageLoginNudge();
    applyDailyView();
  }

/* ── Daily 페이지 ── */
let dailyViewMode = 'day';
let dailySelectedDate = new Date();
let dailyViewButtonsBound = false;
let dailyIsAddingSection = false;
let dailyNewSectionTitle = '';
let dailySectionRenameId = null;
// Virtual render mode: show latest real section structure on dates with 0 rows (no DB insert until task add).
let dailyIsVirtualMode = false;
let dailyVirtualTargetDateStr = null;
let dailyVirtualSourceRows = [];
let dailyVirtualSectionIdMap = new Map();
const _dailyVirtualDateKeys = new Set();
const _dailySkipPrepareOnce = new Set();
let _dailyPreparePromises = new Map();
let _dailyDayWorkspaceRenderId = 0;
let _dailySectionAddInFlight = false;

function dedupeDailySectionsById(sections){
  const seen=new Set();
  const out=[];
  (sections||[]).forEach((s)=>{
    if(!s?.id||seen.has(s.id)) return;
    seen.add(s.id);
    out.push(s);
  });
  return out;
}

function maxDailySectionOrder(sections){
  const list=Array.isArray(sections)?sections:[];
  if(!list.length) return -1;
  return Math.max(...list.map((s)=>Number(s?.order??0)));
}

function dailyDateKey(val){
  if(val==null||val===undefined) return '';
  if(typeof val==='string') return val.slice(0,10);
  const d=new Date(val);
  if(Number.isNaN(d.getTime())) return '';
  return fmtLocalDate(d);
}

function syncDailyVirtualWindowFlags(){
  if(typeof window!=='undefined'){
    window.dailyIsVirtualMode=!!dailyIsVirtualMode;
    window.dailyVirtualDate=dailyVirtualTargetDateStr||null;
  }
}

function clearDailyVirtualState(){
  dailyIsVirtualMode=false;
  dailyVirtualTargetDateStr=null;
  dailyVirtualSourceRows=[];
  dailyVirtualSectionIdMap=new Map();
  _dailyVirtualDateKeys.clear();
  syncDailyVirtualWindowFlags();
}

function isDailyVirtualDate(dstr){
  return dailyIsVirtualMode && dailyVirtualTargetDateStr===dstr && _dailyVirtualDateKeys.has(dstr);
}

function ensureDailySectionsPreparedForDate(dstr){
  if(_dailyPreparePromises.has(dstr)) return _dailyPreparePromises.get(dstr);
  const p=prepareDailySectionsForDate(dstr).finally(()=>{
    _dailyPreparePromises.delete(dstr);
  });
  _dailyPreparePromises.set(dstr,p);
  return p;
}

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
      if(!isDailyPageVisible()) return;
      hideDailyLoginGate();
      syncDailyPageLoginNudge();
      if(typeof applyDailyView==='function') applyDailyView();
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
    repeatGroupId:row.repeat_group_id||null,
    repeatOriginDate:row.repeat_origin_date||null,
  };
}

function newDailyRepeatGroupId(){
  if(typeof crypto!=='undefined'&&crypto.randomUUID) return crypto.randomUUID();
  return 'repeat_'+Date.now()+'_'+Math.random().toString(36).slice(2,9);
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

function shiftDateString(dstr, deltaDays){
  const parts=(dstr||'').split('-').map(Number);
  const d=new Date(parts[0],(parts[1]||1)-1,parts[2]||1);
  d.setDate(d.getDate()+deltaDays);
  return fmtLocalDate(d);
}

async function fetchDailySectionRowsFromSupabase(sb,userId,dstr){
  const {data,error}=await sb.from('daily_sections')
    .select('id,title,emoji,color,sort_order,repeat_group_id,repeat_origin_date')
    .eq('user_id',userId)
    .eq('date',dstr)
    .order('sort_order',{ascending:true});
  if(error) throw error;
  return data||[];
}

function isVirtualSectionId(sectionId){
  return typeof sectionId==='string' && sectionId.startsWith('virtual-');
}

async function fetchLatestDailySectionsRowsForVirtualSource(sb,userId){
  const {data,error}=await sb.from('daily_sections')
    .select('id,date,title,emoji,color,sort_order,repeat_group_id,repeat_origin_date')
    .eq('user_id',userId)
    .order('date',{ascending:false})
    .limit(20);
  if(error) throw error;
  const rows=data||[];
  if(!rows.length) return [];
  let sourceDate=dailyDateKey(rows[0].date);
  rows.forEach((r)=>{
    const dk=dailyDateKey(r.date);
    if(dk>sourceDate) sourceDate=dk;
  });
  if(!sourceDate) return [];
  return rows
    .filter(r=>dailyDateKey(r.date)===sourceDate)
    .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}

async function prepareDailySectionsForDate(dstr){
  if(_dailySkipPrepareOnce.has(dstr)){
    _dailySkipPrepareOnce.delete(dstr);
    return;
  }
  _dailySectionsLoadPromises.delete(dstr);

  const userId=await resolveDailyUserId();
  if(!userId){
    clearDailyVirtualState();
    _dailySectionsCache.delete(dstr);
    console.log('[daily-virtual] prepare skipped (not logged in)', dstr);
    return;
  }

  dailyIsVirtualMode=false;
  dailyVirtualTargetDateStr=null;
  dailyVirtualSourceRows=[];
  dailyVirtualSectionIdMap=new Map();
  _dailyVirtualDateKeys.delete(dstr);
  syncDailyVirtualWindowFlags();

  const sb=getDailySupabaseClient();
  const realRows=await fetchDailySectionRowsFromSupabase(sb,userId,dstr);
  console.log('[daily-virtual] prepare', dstr, 'realRows=', realRows.length);

  if(realRows.length){
    const list=dedupeDailySectionsById(realRows.map(mapSupabaseSectionRow));
    _dailySectionsCache.set(dstr,list);
    set(kDailySections(dstr),list);
    return;
  }

  const sourceRows=await fetchLatestDailySectionsRowsForVirtualSource(sb,userId);
  console.log('[daily-virtual] prepare', dstr, 'latestSourceRows=', sourceRows.length,
    sourceRows[0]?dailyDateKey(sourceRows[0].date):null);

  if(!sourceRows.length){
    _dailySectionsCache.set(dstr,[]);
    _dailyTasksCache.set(dstr,[]);
    set(kDailySections(dstr),[]);
    return;
  }

  dailyIsVirtualMode=true;
  dailyVirtualTargetDateStr=dstr;
  dailyVirtualSourceRows=sourceRows.slice();
  _dailyVirtualDateKeys.add(dstr);

  const virtualSections=dedupeDailySectionsById(sourceRows.map((row)=>({
    ...mapSupabaseSectionRow(row),
    id:'virtual-'+row.id,
    virtualSourceId:row.id,
  })));

  _dailySectionsCache.set(dstr,virtualSections);
  _dailyTasksCache.set(dstr,[]);
  syncDailyVirtualWindowFlags();
  console.log('[daily-virtual] virtual mode ON', dstr, 'sections=', virtualSections.length);
}

async function materializeDailyVirtualSections(dstr){
  if(!dailyIsVirtualMode || dailyVirtualTargetDateStr!==dstr) return new Map();
  const userId=await resolveDailyUserId();
  if(!userId) return new Map();

  const sb=getDailySupabaseClient();
  const sourceRows=dailyVirtualSourceRows.slice();
  if(!sourceRows.length){
    _dailyVirtualDateKeys.delete(dstr);
    dailyIsVirtualMode=false;
    dailyVirtualTargetDateStr=null;
    dailyVirtualSourceRows=[];
    dailyVirtualSectionIdMap=new Map();
    syncDailyVirtualWindowFlags();
    return new Map();
  }

  const insertRows=sourceRows.map((row,i)=>({
    id:(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():createDailySectionId(),
    user_id:userId,
    date:dstr,
    title:row.title||'',
    emoji:row.emoji||'📌',
    color:row.color||SECTION_COLORS[0].bg,
    sort_order:row.sort_order??i,
    repeat_group_id:row.repeat_group_id??null,
    repeat_origin_date:row.repeat_origin_date??null,
  }));

  const {error}=await sb.from('daily_sections').insert(insertRows);
  if(error) throw error;

  const realRows=await fetchDailySectionRowsFromSupabase(sb,userId,dstr);
  _dailySectionsCache.set(dstr, dedupeDailySectionsById(realRows.map(mapSupabaseSectionRow)));

  const idMap=new Map();
  sourceRows.forEach((src)=>{
    const virtualId='virtual-'+src.id;
    const match=realRows.find((r)=>{
      return (r.repeat_group_id??null)===(src.repeat_group_id??null)
        && (r.repeat_origin_date??null)===(src.repeat_origin_date??null)
        && (r.sort_order??0)===(src.sort_order??0)
        && (r.title||'')===(src.title||'')
        && (r.color||SECTION_COLORS[0].bg)===(src.color||SECTION_COLORS[0].bg)
        && (r.emoji||'📌')===(src.emoji||'📌');
    });
    if(match) idMap.set(virtualId, match.id);
  });

  _dailyVirtualDateKeys.delete(dstr);
  dailyIsVirtualMode=false;
  dailyVirtualTargetDateStr=null;
  dailyVirtualSourceRows=[];
  dailyVirtualSectionIdMap=idMap;
  syncDailyVirtualWindowFlags();
  return idMap;
}

async function resolveDailySectionIdForTaskIfVirtual(dstr, sectionId){
  if(!dailyIsVirtualMode || dailyVirtualTargetDateStr!==dstr) return sectionId;
  if(!isVirtualSectionId(sectionId)) return sectionId;
  const idMap=await materializeDailyVirtualSections(dstr);
  return idMap.get(sectionId) || sectionId;
}

async function ensureFirstSectionIdForDailyDate(dstr){
  const userId=await resolveDailyUserId();
  if(userId) await ensureDailySectionsPreparedForDate(dstr);

  let sections=userId
    ? getSectionsForDailyDayRender(dstr)
    : dedupeDailySectionsById(getDailySections(dstr)).sort((a,b)=>(a.order||0)-(b.order||0));

  if(!sections.length){
    if(userId){
      const sb=getDailySupabaseClient();
      const newId=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():createDailySectionId();
      const insertRow={
        id:newId,
        user_id:userId,
        date:dstr,
        title:'Tasks',
        emoji:'📌',
        color:SECTION_COLORS[0].bg,
        sort_order:0,
        repeat_group_id:null,
        repeat_origin_date:null,
      };
      const {error}=await sb.from('daily_sections').insert(insertRow);
      if(error) throw error;
      const newSection={
        id:newId,
        title:'Tasks',
        emoji:'📌',
        color:SECTION_COLORS[0].bg,
        order:0,
        repeatGroupId:null,
        repeatOriginDate:null,
      };
      _dailySectionsCache.set(dstr,[newSection]);
      set(kDailySections(dstr),[newSection]);
      _dailyVirtualDateKeys.delete(dstr);
      if(dailyVirtualTargetDateStr===dstr){
        dailyIsVirtualMode=false;
        dailyVirtualTargetDateStr=null;
        dailyVirtualSourceRows=[];
        syncDailyVirtualWindowFlags();
      }
      return newId;
    }
    const localSection={
      id:createDailySectionId(),
      title:'Tasks',
      emoji:'📌',
      color:SECTION_COLORS[0].bg,
      order:0,
    };
    setDailySections(dstr,[localSection]);
    return localSection.id;
  }

  const firstId=sections[0].id;
  if(userId&&isVirtualSectionId(firstId)&&isDailyVirtualDate(dstr)){
    return await resolveDailySectionIdForTaskIfVirtual(dstr,firstId);
  }
  return firstId;
}

async function insertDailyTaskViaFirstSection(dstr,text){
  const value=(text||'').trim();
  if(!value) return null;
  const sectionId=await ensureFirstSectionIdForDailyDate(dstr);
  const task=await insertDailyTask(dstr,{text:value,sectionId,done:false});
  return task?{task,sectionId}:null;
}

function appendDailyWeekViewTaskRow(itemList,dstr,task,idx){
  const sections=getDailySections(dstr);
  const section=task.sectionId?sections.find((s)=>s.id===task.sectionId):null;
  const sectionColor=window.JCal.getSectionColor(section);

  const row=el('div');
  row.style.cssText='display:flex;align-items:flex-start;gap:4px;padding:4px 2px;border-radius:6px;';

  const cb=window.JCal.createCheckbox(sectionColor);
  cb.checked=!!task.done;
  const text=el('span',null,task.text||'');
  text.style.cssText=`font-size:11px;line-height:1.4;word-break:break-all;${task.done?'text-decoration:line-through;color:#9aa5b1;':'color:#374151;'}`;

  cb.addEventListener('change',(e)=>{
    e.stopPropagation();
    const checked=cb.checked;
    text.style.textDecoration=checked?'line-through':'';
    text.style.color=checked?'#9aa5b1':'#374151';
    setDailyItemDone(dstr,idx,checked,{skipRefresh:true});
  });

  row.append(cb,text);
  itemList.appendChild(row);
}

function appendDailyMonthViewTaskRow(body,dstr,task,idx){
  const sections=getDailySections(dstr);
  const section=task.sectionId?sections.find((s)=>s.id===task.sectionId):null;
  const sectionColor=window.JCal.getSectionColor(section);

  const rowItem=el('div','daily-month-task-item');
  rowItem.style.position='relative';

  const cb=window.JCal.createCheckbox(sectionColor);
  cb.checked=!!task.done;
  const txt=el('span','daily-month-task-text',task.text||'');
  if(task.done) txt.classList.add('is-done');

  const delBtn=window.JCal.createDeleteBtn();
  delBtn.type='button';
  delBtn.title='Delete task';
  rowItem.addEventListener('mouseenter',()=>{ delBtn.style.opacity='1'; });
  rowItem.addEventListener('mouseleave',()=>{ delBtn.style.opacity='0'; });

  cb.addEventListener('change',(e)=>{
    e.stopPropagation();
    const checked=cb.checked;
    if(checked) txt.classList.add('is-done');
    else txt.classList.remove('is-done');
    setDailyItemDone(dstr,idx,checked,{skipRefresh:true});
  });
  delBtn.addEventListener('click',(e)=>{
    e.stopPropagation();
    void deleteMonthViewTask(dstr,task.id,idx,rowItem,body);
  });

  rowItem.append(cb,txt,delBtn);
  body.appendChild(rowItem);
}

function bindDailyCellInlineAddButton({hostEl,addBtn,dstr,onTaskAdded}){
  addBtn.type='button';
  if(!addBtn.textContent) addBtn.textContent='+';

  let addWrap=null;
  let addInput=null;

  const closeInput=()=>{
    if(addWrap){
      addWrap.remove();
      addWrap=null;
      addInput=null;
    }
    addBtn.style.display='';
  };

  addBtn.addEventListener('click',(e)=>{
    e.stopPropagation();
    if(addInput){
      addInput.focus();
      return;
    }
    addBtn.style.display='none';
    addWrap=el('div','daily-week-day-add-wrap');
    addInput=document.createElement('input');
    addInput.type='text';
    addInput.className='daily-week-day-add-input daily-month-inline-input';
    addInput.placeholder='+';
    addWrap.appendChild(addInput);
    hostEl.appendChild(addWrap);
    addInput.focus();

    const commit=async ()=>{
      const text=addInput?.value.trim();
      if(!text) return;
      const result=await insertDailyTaskViaFirstSection(dstr,text);
      if(!result?.task) return;
      closeInput();
      onTaskAdded(result.task);
    };

    addInput.addEventListener('keydown',async (e)=>{
      e.stopPropagation();
      if(e.key==='Enter'){
        e.preventDefault();
        await commit();
      }
      if(e.key==='Escape'){
        e.preventDefault();
        closeInput();
      }
    });
  });
}

async function addDailySectionInVirtualMode(dstr, title){
  const value=(title||'').trim();
  if(!value) return false;
  try{
    const userId=await resolveDailyUserId();
    if(!userId){
      await addDailySection(dstr,value);
      return true;
    }

    const sb=getDailySupabaseClient();
    const current=dedupeDailySectionsById(_dailySectionsCache.get(dstr)||[]);
    const newOrder=maxDailySectionOrder(current)+1;
    const newId=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():createDailySectionId();

    const insertRow={
      id:newId,
      user_id:userId,
      date:dstr,
      title:value,
      emoji:'📌',
      color:SECTION_COLORS[0].bg,
      sort_order:newOrder,
      repeat_group_id:null,
      repeat_origin_date:null,
    };
    const {error}=await sb.from('daily_sections').insert(insertRow);
    if(error) throw error;

    const newSection={
      id:newId,
      title:value,
      emoji:'📌',
      color:SECTION_COLORS[0].bg,
      order:newOrder,
      repeatGroupId:null,
      repeatOriginDate:null,
    };
    _dailySectionsCache.set(dstr, dedupeDailySectionsById(current.concat([newSection])));
    dailyIsVirtualMode=true;
    dailyVirtualTargetDateStr=dstr;
    _dailyVirtualDateKeys.add(dstr);
    syncDailyVirtualWindowFlags();
    _dailySkipPrepareOnce.add(dstr);
    await renderDailyDayWorkspace();
    return true;
  }catch(err){
    console.error('addDailySectionInVirtualMode',err);
    return false;
  }
}

async function todayHasDailySections(sb,userId,dstr){
  const {data,error}=await sb.from('daily_sections')
    .select('id')
    .eq('user_id',userId)
    .eq('date',dstr)
    .limit(1);
  if(error) throw error;
  return (data||[]).length>0;
}

async function copyYesterdaySectionsToTodayIfEmpty(sb,userId,todayStr){
  if(await todayHasDailySections(sb,userId,todayStr)) return false;
  const yesterdayStr=shiftDateString(todayStr,-1);
  const yesterdayRows=await fetchDailySectionRowsFromSupabase(sb,userId,yesterdayStr);
  if(!yesterdayRows.length) return false;
  if(await todayHasDailySections(sb,userId,todayStr)) return false;
  const insertRows=yesterdayRows.map((row,i)=>{
    const groupId=row.repeat_group_id||newDailyRepeatGroupId();
    const originDate=row.repeat_origin_date||yesterdayStr;
    return {
      id:(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():createDailySectionId(),
      user_id:userId,
      date:todayStr,
      title:row.title||'',
      emoji:row.emoji||'📌',
      color:row.color||SECTION_COLORS[0].bg,
      sort_order:row.sort_order??i,
      repeat_group_id:groupId,
      repeat_origin_date:originDate,
    };
  });
  const {error:insertErr}=await sb.from('daily_sections').insert(insertRows);
  if(insertErr) throw insertErr;
  return true;
}

async function loadDailySectionsFromSupabase(dstr){
  const userId=await resolveDailyUserId();
  if(!userId) return readDailySectionsLocal(dstr);
  if(isDailyVirtualDate(dstr)){
    console.log('[daily-virtual] loadDailySectionsFromSupabase skipped (virtual)', dstr);
    return (_dailySectionsCache.get(dstr)||[]).slice();
  }
  const sb=getDailySupabaseClient();
  try{
    let rows=await fetchDailySectionRowsFromSupabase(sb,userId,dstr);
    const todayStr=fmtLocalDate(new Date());
    if(!rows.length&&dstr===todayStr){
      const copied=await copyYesterdaySectionsToTodayIfEmpty(sb,userId,todayStr);
      if(copied) rows=await fetchDailySectionRowsFromSupabase(sb,userId,dstr);
    }
    const list=rows.map(mapSupabaseSectionRow);
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
  const persistable=normalized.filter((s)=>!isVirtualSectionId(s?.id));
  if(!persistable.length) return;
  const hasVirtualInList=normalized.length!==persistable.length;
  try{
    const rows=persistable.map((s,i)=>({
      id:s.id,
      user_id:userId,
      date:dstr,
      title:s.title||'',
      emoji:s.emoji||'📌',
      color:s.color||SECTION_COLORS[0].bg,
      sort_order:s.order??i,
      repeat_group_id:s.repeatGroupId??null,
      repeat_origin_date:s.repeatOriginDate??null,
    }));
    if(hasVirtualInList||isDailyVirtualDate(dstr)){
      if(rows.length){
        const {error}=await sb.from('daily_sections').upsert(rows,{onConflict:'id'});
        if(error) throw error;
      }
      return;
    }
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
  }catch(err){
    console.error('persistDailySectionsToSupabase',err);
    if(!hasVirtualInList) set(kDailySections(dstr),normalized);
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
  if(isDailyVirtualDate(dstr)) return;
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
    if(!userId) return;
    if(_dailyTasksCache.has(dstr)) return;
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
  if(dailyViewMode==='day'){
    void renderDailyDayWorkspace();
    return;
  }
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
    const {data,error}=await sb.from('daily_tasks').insert({
      id,
      user_id:userId,
      date:dstr,
      text:value,
      done:!!done,
      section_id:resolvedSectionId||null,
    }).select('id,date,text,done,section_id').single();
    if(error){
      console.error('insertDailyTask',error);
      return task;
    }
    const savedTask={
      id:data.id,
      text:data.text,
      done:!!data.done,
      sectionId:data.section_id||undefined,
    };
    const savedList=getDailyTasks(dstr).slice();
    const savedIdx=savedList.findIndex((t)=>t.id===savedTask.id);
    if(savedIdx>=0) savedList[savedIdx]=savedTask;
    else savedList.push(savedTask);
    _dailyTasksCache.set(dstr,savedList);
    set(kDaily(dstr),savedList);
    return savedTask;
  })();
}
function patchDailyTask(dstr,taskId,patch,opts={}){
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
    if(!opts.skipRefresh) refreshDailyTaskViews();
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
async function addDailySection(dstr,title){
  const value=(title||'').trim();
  if(!value) return;
  const sections=dedupeDailySectionsById(
    _dailySectionsCache.has(dstr)?_dailySectionsCache.get(dstr):getDailySections(dstr)
  );
  if(isDailyVirtualDate(dstr)||sections.some((s)=>isVirtualSectionId(s?.id))){
    dailyIsAddingSection=false;
    dailyNewSectionTitle='';
    await addDailySectionInVirtualMode(dstr,value);
    return;
  }
  const newOrder=maxDailySectionOrder(sections)+1;
  const next=sections.concat([{
    id:createDailySectionId(),
    title:value,
    emoji:'📌',
    color:SECTION_COLORS[0].bg,
    order:newOrder,
    repeatGroupId:null,
    repeatOriginDate:null,
  }]);
  setDailySections(dstr,next);
  _dailySkipPrepareOnce.add(dstr);
  dailyIsAddingSection=false;
  dailyNewSectionTitle='';
  await renderDailyDayWorkspace();
}
function saveDailySection(dstr,sectionId,{title,emoji,color}){
  const value=(title||'').trim();
  if(!value) return;
  const safeColor=findSectionColorEntry(color).bg;
  const patch={
    title:value,
    emoji:emoji||'📌',
    color:safeColor,
  };
  if(isVirtualSectionId(sectionId)){
    patchDailySection(dstr,sectionId,patch);
    return;
  }
  const sections=getDailySections(dstr);
  const idx=sections.findIndex(s=>s.id===sectionId);
  if(idx<0) return;
  sections[idx]={...sections[idx],...patch,id:sectionId};
  setDailySections(dstr,sections);
  renderDailyDayWorkspace();
}
function isDailySectionDeletable(section){
  if(!section||section.id==='__none__') return false;
  const title=(section.title||'').trim();
  if(title==='Uncategorized'||title==='미분류') return false;
  return true;
}
function normalizeDailySectionPatch(patch){
  const normalized={...patch};
  if(normalized.color!=null) normalized.color=findSectionColorEntry(normalized.color).bg;
  if(normalized.title!=null){
    const value=(normalized.title||'').trim();
    if(!value) return null;
    normalized.title=value;
  }
  return normalized;
}

function buildDailySectionDbPatch(patch,normalized){
  const dbPatch={};
  if(patch.title!=null) dbPatch.title=normalized.title;
  if(patch.emoji!=null) dbPatch.emoji=normalized.emoji;
  if(patch.color!=null) dbPatch.color=normalized.color;
  return dbPatch;
}

async function reloadDailySectionsAfterRepeatChange(dstr){
  _dailySectionsCache.delete(dstr);
  _dailyTasksCache.delete(dstr);
  const userId=await resolveDailyUserId();
  if(userId) await loadDailySectionsFromSupabase(dstr);
  if(typeof refreshDailyTaskViews==='function') refreshDailyTaskViews();
}

function invalidateDailyRepeatCaches(){
  _dailySectionsCache.clear();
  _dailyTasksCache.clear();
}

function showDailyRepeatActionModal(title,actionButtons){
  if(dailyOpenPop) dailyOpenPop.remove();
  const overlay=el('div','repeat-modal-overlay daily-repeat-modal-overlay');
  const modal=el('div','repeat-modal daily-repeat-modal');
  modal.appendChild(el('div','repeat-modal-header',title));
  actionButtons.forEach(({label,onClick,danger})=>{
    const btn=el('button','repeat-option',label);
    btn.type='button';
    if(danger) btn.classList.add('del');
    btn.onclick=()=>{
      overlay.remove();
      dailyOpenPop=null;
      onClick?.();
    };
    modal.appendChild(btn);
  });
  const cancelBtn=el('button','repeat-option','Cancel');
  cancelBtn.type='button';
  cancelBtn.onclick=()=>{
    overlay.remove();
    dailyOpenPop=null;
  };
  modal.appendChild(cancelBtn);
  overlay.appendChild(modal);
  overlay.onclick=(e)=>{ if(e.target===overlay){ overlay.remove(); dailyOpenPop=null; } };
  document.body.appendChild(overlay);
  dailyOpenPop=overlay;
}

async function fetchDailySectionRepeatRow(sb,userId,sectionId){
  if(isVirtualSectionId(sectionId)) return null;
  const {data,error}=await sb.from('daily_sections')
    .select('id,date,repeat_group_id,repeat_origin_date')
    .eq('id',sectionId)
    .eq('user_id',userId)
    .maybeSingle();
  if(error) throw error;
  return data;
}

async function fetchDailySectionIdsByRepeatGroup(sb,userId,repeatGroupId,{fromDate=null}={}){
  let q=sb.from('daily_sections').select('id').eq('user_id',userId).eq('repeat_group_id',repeatGroupId);
  if(fromDate) q=q.gte('date',fromDate);
  const {data,error}=await q;
  if(error) throw error;
  return (data||[]).map(r=>r.id);
}

async function deleteDailySectionsByIds(sb,userId,sectionIds){
  if(!sectionIds.length) return;
  const {error:taskErr}=await sb.from('daily_tasks').delete().eq('user_id',userId).in('section_id',sectionIds);
  if(taskErr) throw taskErr;
  const {error:secErr}=await sb.from('daily_sections').delete().eq('user_id',userId).in('id',sectionIds);
  if(secErr) throw secErr;
}

async function applyDailySectionPatchSingle(dstr,sectionId,patch){
  const normalized=normalizeDailySectionPatch(patch);
  if(!normalized) return;
  const sections=getDailySections(dstr);
  const idx=sections.findIndex(s=>s.id===sectionId);
  if(idx<0) return;
  sections[idx]={...sections[idx],...normalized};
  _dailySectionsCache.set(dstr,sections);
  set(kDailySections(dstr),sections);
  if(isVirtualSectionId(sectionId)){
    refreshDailyTaskViews();
    return;
  }
  const userId=await resolveDailyUserId();
  if(!userId){
    refreshDailyTaskViews();
    return;
  }
  const sb=getDailySupabaseClient();
  const dbPatch=buildDailySectionDbPatch(patch,normalized);
  const {error}=await sb.from('daily_sections').update(dbPatch).eq('id',sectionId).eq('user_id',userId);
  if(error) console.error('applyDailySectionPatchSingle',error);
  refreshDailyTaskViews();
}

async function applyDailySectionPatchFromTodayOnly(dstr,sectionId,patch){
  const normalized=normalizeDailySectionPatch(patch);
  if(!normalized) return;
  const userId=await resolveDailyUserId();
  if(!userId) return;
  const sb=getDailySupabaseClient();
  const dbPatch=buildDailySectionDbPatch(patch,normalized);
  dbPatch.repeat_group_id=newDailyRepeatGroupId();
  const {error}=await sb.from('daily_sections').update(dbPatch).eq('id',sectionId).eq('user_id',userId);
  if(error){ console.error('applyDailySectionPatchFromTodayOnly',error); return; }
  invalidateDailyRepeatCaches();
  await reloadDailySectionsAfterRepeatChange(dstr);
}

async function applyDailySectionPatchAllFromToday(dstr,sectionId,patch,repeatGroupId,todayStr){
  const normalized=normalizeDailySectionPatch(patch);
  if(!normalized) return;
  const userId=await resolveDailyUserId();
  if(!userId) return;
  const sb=getDailySupabaseClient();
  const dbPatch=buildDailySectionDbPatch(patch,normalized);
  const {error}=await sb.from('daily_sections')
    .update(dbPatch)
    .eq('user_id',userId)
    .eq('repeat_group_id',repeatGroupId)
    .gte('date',todayStr);
  if(error){ console.error('applyDailySectionPatchAllFromToday',error); return; }
  invalidateDailyRepeatCaches();
  await reloadDailySectionsAfterRepeatChange(dstr);
}

function requestDailySectionPatch(dstr,sectionId,patch){
  (async ()=>{
    const normalized=normalizeDailySectionPatch(patch);
    if(!normalized) return;
    if(isVirtualSectionId(sectionId)){
      await applyDailySectionPatchSingle(dstr,sectionId,patch);
      return;
    }
    const userId=await resolveDailyUserId();
    if(!userId){
      await applyDailySectionPatchSingle(dstr,sectionId,patch);
      return;
    }
    const sb=getDailySupabaseClient();
    let row=null;
    try{
      row=await fetchDailySectionRepeatRow(sb,userId,sectionId);
    }catch(err){
      console.error('requestDailySectionPatch',err);
      await applyDailySectionPatchSingle(dstr,sectionId,patch);
      return;
    }
    if(!row?.repeat_group_id){
      await applyDailySectionPatchSingle(dstr,sectionId,patch);
      return;
    }
    const todayStr=fmtLocalDate(new Date());
    showDailyRepeatActionModal('반복 섹션을 수정합니다',[
      {
        label:'오늘부터 변경',
        onClick:()=> applyDailySectionPatchFromTodayOnly(dstr,sectionId,patch),
      },
      {
        label:'전체 기간 변경',
        onClick:()=> applyDailySectionPatchAllFromToday(dstr,sectionId,patch,row.repeat_group_id,todayStr),
      },
    ]);
  })();
}

async function deleteDailySectionTodayOnly(dstr,sectionId){
  const sections=getDailySections(dstr);
  const userId=await resolveDailyUserId();
  if(userId){
    const sb=getDailySupabaseClient();
    try{
      await deleteDailySectionsByIds(sb,userId,[sectionId]);
    }catch(err){
      console.error('deleteDailySectionTodayOnly',err);
      return;
    }
  }
  const nextSections=sections.filter(s=>s.id!==sectionId);
  const nextTasks=getDailyTasks(dstr).filter(t=>t.sectionId!==sectionId);
  _dailySectionsCache.set(dstr,nextSections);
  _dailyTasksCache.set(dstr,nextTasks);
  set(kDailySections(dstr),nextSections);
  set(kDaily(dstr),nextTasks);
  if(dailySectionRenameId===sectionId) dailySectionRenameId=null;
  renderDailyDayWorkspace();
}

async function deleteDailySectionFromToday(dstr,repeatGroupId,todayStr){
  const userId=await resolveDailyUserId();
  if(!userId) return;
  const sb=getDailySupabaseClient();
  try{
    const ids=await fetchDailySectionIdsByRepeatGroup(sb,userId,repeatGroupId,{fromDate:todayStr});
    await deleteDailySectionsByIds(sb,userId,ids);
  }catch(err){
    console.error('deleteDailySectionFromToday',err);
    return;
  }
  invalidateDailyRepeatCaches();
  await reloadDailySectionsAfterRepeatChange(dstr);
}

async function deleteDailySectionEntireGroup(dstr,repeatGroupId){
  const userId=await resolveDailyUserId();
  if(!userId) return;
  const sb=getDailySupabaseClient();
  try{
    const ids=await fetchDailySectionIdsByRepeatGroup(sb,userId,repeatGroupId);
    await deleteDailySectionsByIds(sb,userId,ids);
  }catch(err){
    console.error('deleteDailySectionEntireGroup',err);
    return;
  }
  invalidateDailyRepeatCaches();
  await reloadDailySectionsAfterRepeatChange(dstr);
}

function requestDeleteDailySection(dstr,sectionId){
  (async ()=>{
    const sections=getDailySections(dstr);
    const target=sections.find(s=>s.id===sectionId);
    if(!target||!isDailySectionDeletable(target)) return;
    const userId=await resolveDailyUserId();
    if(!userId){
      await deleteDailySectionTodayOnly(dstr,sectionId);
      return;
    }
    const sb=getDailySupabaseClient();
    let row=null;
    try{
      row=await fetchDailySectionRepeatRow(sb,userId,sectionId);
    }catch(err){
      console.error('requestDeleteDailySection',err);
      await deleteDailySectionTodayOnly(dstr,sectionId);
      return;
    }
    if(!row?.repeat_group_id){
      await deleteDailySectionTodayOnly(dstr,sectionId);
      return;
    }
    const todayStr=fmtLocalDate(new Date());
    showDailyRepeatActionModal('Delete repeating section',[
      {label:'Today only',onClick:()=> deleteDailySectionTodayOnly(dstr,sectionId)},
      {label:'From today',onClick:()=> deleteDailySectionFromToday(dstr,row.repeat_group_id,todayStr),danger:true},
      {label:'All',onClick:()=> deleteDailySectionEntireGroup(dstr,row.repeat_group_id),danger:true},
    ]);
  })();
}

function deleteDailySection(dstr,sectionId){
  requestDeleteDailySection(dstr,sectionId);
}

function patchDailySection(dstr,sectionId,patch){
  requestDailySectionPatch(dstr,sectionId,patch);
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
  let _isComposing = false;
  inp.addEventListener('compositionstart', () => { _isComposing = true; });
  inp.addEventListener('compositionend', () => {
    _isComposing = false;
  });
  inp.addEventListener('keydown', async (e) => {
    if (e.keyCode === 229 || e.key === 'Process') return;
    const isEnter = e.key === 'Enter' || e.keyCode === 13;
    if (!isEnter) return;
    if (_isComposing) return;
    e.preventDefault();
    e.stopPropagation();
    const value = inp.value.trim();
    if (!value) return;

    let resolvedSectionId=sectionId;
    let didVirtualMaterialize=false;
    if(dailyIsVirtualMode && dailyVirtualTargetDateStr===dstr && isVirtualSectionId(sectionId)){
      resolvedSectionId=await resolveDailySectionIdForTaskIfVirtual(dstr,sectionId);
      didVirtualMaterialize=true;
    }

    const task=await insertDailyTask(dstr,{text:value,sectionId:resolvedSectionId});
    if(!task) return;

    inp.value='';
    const empty=body.querySelector('.daily-day-empty');
    if(empty) empty.remove();

    if(didVirtualMaterialize){
      // Section cards were updated (virtual -> real). Re-render to keep DOM consistent.
      renderDailyDayWorkspace();
      return;
    }

    const list=getDailyTasks(dstr);
    const idx=list.findIndex(t=>t.id===task.id);
    if(idx>=0) appendDailyDayTaskRow(body,dstr,idx,task,inp);
    inp.focus();
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
  hideDailyLoginGate();
  syncDailyPageLoginNudge();
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
    if(isDailyVirtualDate(dstr)&&_dailySectionsCache.has(dstr)){
      return _dailySectionsCache.get(dstr).slice();
    }
    if(_dailySectionsCache.has(dstr)) return _dailySectionsCache.get(dstr).slice();
    prefetchDailySections(dstr);
    return readDailySectionsLocal(dstr);
  }
  resolveDailyUserId().then((userId)=>{
    if(!userId) return;
    if(_dailySectionsCache.has(dstr)) return;
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

function getSectionsForDailyDayRender(dstr){
  if(isDailyVirtualDate(dstr)&&_dailySectionsCache.has(dstr)){
    return dedupeDailySectionsById(_dailySectionsCache.get(dstr))
      .sort((a,b)=>(a.order||0)-(b.order||0));
  }
  return dedupeDailySectionsById(ensureDailySections(dstr))
    .sort((a,b)=>(a.order||0)-(b.order||0));
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
const SECTION_MENU_SVG={
  color:'<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#1f1f1f"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-177 23q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120-160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm200 0q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120 160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/></svg>',
  emoji:'<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#1f1f1f"><path d="M324.5-404.5Q310-419 310-440t14.5-35.5Q339-490 360-490t35.5 14.5Q410-461 410-440t-14.5 35.5Q381-390 360-390t-35.5-14.5Zm240 0Q550-419 550-440t14.5-35.5Q579-490 600-490t35.5 14.5Q650-461 650-440t-14.5 35.5Q621-390 600-390t-35.5-14.5ZM480-160q134 0 227-93t93-227q0-24-3-46.5T786-570q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-708q-32 78-91.5 135.5T160-486v6q0 134 93 227t227 93Zm0 80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-54-715q42 70 114 112.5T700-640q14 0 27-1.5t27-3.5q-42-70-114-112.5T480-800q-14 0-27 1.5t-27 3.5ZM177-581q51-29 89-75t57-103q-51 29-89 75t-57 103Zm249-214Zm-103 36Z"/></svg>',
  rename:'<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#1f1f1f"><path d="M160-400v-80h280v80H160Zm0-160v-80h440v80H160Zm0-160v-80h440v80H160Zm360 560v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T863-380L643-160H520Zm300-263-37-37 37 37ZM580-220h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/></svg>',
  delete:'<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#1f1f1f"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
};
function makeDailySectionMenuItem(label,svgHtml,extraClass=''){
  const btn=el('button','menu-item'+(extraClass?' '+extraClass:''));
  btn.style.cssText='display:flex;align-items:center;gap:8px;width:100%;';
  btn.innerHTML=svgHtml+'<span>'+label+'</span>';
  return btn;
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

  const colorBtn=makeDailySectionMenuItem('Change Color',SECTION_MENU_SVG.color);
  colorBtn.type='button';
  colorBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    showDailySectionColorPicker(anchor,dstr,section);
  };

  const emojiBtn=makeDailySectionMenuItem('Change Emoji',SECTION_MENU_SVG.emoji);
  emojiBtn.type='button';
  emojiBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    showDailySectionEmojiPicker(anchor,dstr,section);
  };

  const renameBtn=makeDailySectionMenuItem('Rename',SECTION_MENU_SVG.rename);
  renameBtn.type='button';
  renameBtn.onclick=(e)=>{
    e.stopPropagation();
    close();
    dailySectionRenameId=section.id;
    renderDailyDayWorkspace();
  };

  pop.append(colorBtn,emojiBtn,renameBtn);

  if(isDailySectionDeletable(section)){
    const delBtn=makeDailySectionMenuItem('Delete',SECTION_MENU_SVG.delete,'del');
    delBtn.type='button';
    delBtn.onclick=(e)=>{
      e.stopPropagation();
      close();
      requestDeleteDailySection(dstr,section.id);
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
function setDailyItemDone(dstr,idx,checked,opts={}){
  const list=getDailyTasks(dstr);
  const task=list[idx];
  if(!task) return;
  if(task.id) patchDailyTask(dstr,task.id,{done:checked},opts);
  else{
    list[idx].done=checked;
    saveDailyTasks(dstr,list);
    if(!opts.skipRefresh) refreshDailyTaskViews();
  }
}

async function navigateMonthDateToDayView(date){
  await loadDailyByDate(date);
  setDailyViewMode('day');
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

async function loadDailyByDate(date){
  dailySelectedDate=new Date(date);
  dailySelectedDate.setHours(0,0,0,0);
  miniCalYear=dailySelectedDate.getFullYear();
  miniCalMonth=dailySelectedDate.getMonth();
  const dstr=fmtLocalDate(dailySelectedDate);
  _dailySectionsCache.delete(dstr);
  _dailyPreparePromises.delete(dstr);
  console.log('[daily-virtual] loadDailyByDate', dstr);
  await renderDailyDayWorkspace();
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

function initDailyDaySectionSortable(listEl,dstr){
  if(typeof Sortable==='undefined'||!listEl) return;
  if(listEl._dailySortable){
    listEl._dailySortable.destroy();
    listEl._dailySortable=null;
  }
  listEl._dailySortable=new Sortable(listEl,{
    animation:150,
    handle:'.daily-day-section-head',
    draggable:'.daily-day-section-card',
    onEnd(){
      persistDailySectionSortOrderFromDom(dstr,listEl);
    },
  });
}

async function persistDailySectionSortOrderFromDom(dstr,listEl){
  const userId=await resolveDailyUserId();
  if(!userId) return;
  const cards=listEl.querySelectorAll('.daily-day-section-card');
  const sb=getDailySupabaseClient();
  const orderUpdates=[];
  cards.forEach((card,index)=>{
    const sectionId=card.dataset.sectionId;
    if(!sectionId||sectionId==='__none__'||isVirtualSectionId(sectionId)) return;
    orderUpdates.push({id:sectionId,sort_order:index});
  });
  for(const {id,sort_order} of orderUpdates){
    const {error}=await sb.from('daily_sections')
      .update({sort_order})
      .eq('id',id)
      .eq('user_id',userId);
    if(error) console.error('persistDailySectionSortOrderFromDom',error);
  }
  const cached=_dailySectionsCache.get(dstr);
  if(cached&&orderUpdates.length){
    const orderMap=new Map(orderUpdates.map((u)=>[u.id,u.sort_order]));
    cached.forEach((s)=>{ if(orderMap.has(s.id)) s.order=orderMap.get(s.id); });
    cached.sort((a,b)=>(a.order||0)-(b.order||0));
    _dailySectionsCache.set(dstr,cached);
  }
}

async function renderDailyDayWorkspace(){
  const renderId=++_dailyDayWorkspaceRenderId;
  const host=document.getElementById('dailyDayWorkspace');
  if(!host) return;
  const dstr=fmtLocalDate(dailySelectedDate);
  const userId=await resolveDailyUserId();
  if(userId){
    await ensureDailySectionsPreparedForDate(dstr);
  }
  if(renderId!==_dailyDayWorkspaceRenderId) return;
  const allTasks=isDailyVirtualDate(dstr)?[]:getDailyTasks(dstr);
  const sections=getSectionsForDailyDayRender(dstr);
  if(renderId!==_dailyDayWorkspaceRenderId) return;

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
      onSubmit:async (v)=>{
        if(_dailySectionAddInFlight) return;
        _dailySectionAddInFlight=true;
        try{
          const nextTitle=(v||'').trim();
          dailyIsAddingSection=false;
          dailyNewSectionTitle='';
          if(!nextTitle) return;
          await addDailySection(dstr,nextTitle);
        }finally{
          _dailySectionAddInFlight=false;
        }
      },
      onCancel:()=>{
        dailyIsAddingSection=false;
        dailyNewSectionTitle='';
        renderDailyDayWorkspace();
      },
      onBlur:async (v)=>{
        if(_dailySectionAddInFlight) return;
        const value=(v||'').trim();
        if(value){
          _dailySectionAddInFlight=true;
          try{
            dailyIsAddingSection=false;
            dailyNewSectionTitle='';
            await addDailySection(dstr,value);
          }finally{
            _dailySectionAddInFlight=false;
          }
        }else{
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
    sec.dataset.sectionId=section.id;
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
  const memoHead=el('div','daily-memo-head');
  const memoHeadLeft=el('div','daily-memo-head-title','📝 Daily Memo');
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
      const text=memoInput.value||'';
      const userId=await resolveDailyUserId();
      if(userId){
        const out=await upsertDailyNoteToSupabase(dstr,text);
        if(out?.updatedAt){
          savedAtEl.textContent=formatDailyMemoSavedAt(new Date(out.updatedAt).getTime());
        }
      }else{
        set(kDailyNote(dstr),{content:text,updatedAt:Date.now()});
        savedAtEl.textContent=formatDailyMemoSavedAt(Date.now());
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
    let content='';
    let updatedAt=null;
    if(userId){
      const loaded=await loadDailyNoteFromSupabase(dstr);
      content=loaded?.content||'';
      updatedAt=loaded?.updatedAt||null;
    }else{
      const local=get(kDailyNote(dstr),null);
      if(local&&typeof local==='object'){
        content=local.content||'';
        updatedAt=local.updatedAt||null;
      }
    }
    memoInput.value=content;
    autoResizeDailyNote();
    if(updatedAt){
      savedAtEl.textContent=formatDailyMemoSavedAt(new Date(updatedAt).getTime());
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
  if(renderId!==_dailyDayWorkspaceRenderId) return;
  host.innerHTML='';
  host.appendChild(wrap);
  renderMiniCal();
  initDailyDaySectionSortable(listWrap,dstr);
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

  // Week tab 상단: Weekly Focus / Next Week 2컬럼 블록
  const weekStartMonday = getWeekStartMondayDateStr(dailySelectedDate);
  const weeklyNotesWrap = el('div','daily-weekly-notes-wrap');
  weeklyNotesWrap.style.cssText = 'margin:0 12px 12px;background:#f8f9fa;border-radius:12px;padding:10px 12px;display:none;gap:10px;align-items:stretch;border:1px solid #e9ecef;min-height:80px;';
  container.appendChild(weeklyNotesWrap);
  renderDailyWeeklyNotesBlock(weeklyNotesWrap, weekStartMonday);

  const weekdays = WEEKDAY_LABELS_EN;

  const weekGrid = el('div');
  weekGrid.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:0 12px 12px;flex:1;overflow:hidden;';

  for(let i=0; i<7; i++){
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate()+i);
    const dstr = fmtLocalDate(date);
    const items = getDailyTasks(dstr);
    const isToday = fmtLocalDate(date) === fmtLocalDate(new Date());
    const isSelected = fmtLocalDate(date) === fmtLocalDate(dailySelectedDate);

    const col = el('div','daily-week-day-col');
    col.style.cssText = 'display:flex;flex-direction:column;gap:4px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;cursor:pointer;';

    const dayHeader = el('div','daily-week-day-header');
    const dayName = el('div','daily-week-day-name',weekdays[i]);
    const dayNum = el('div','daily-week-day-num',String(date.getDate()));
    if(isToday) dayHeader.classList.add('is-today');
    else if(isSelected) dayHeader.classList.add('is-selected');

    dayHeader.append(dayName,dayNum);

    const itemList = el('div', 'weekly-day-card-scroll');
    itemList.style.cssText = 'display:flex;flex-direction:column;gap:3px;padding:6px 4px;flex:1;overflow-y:auto;max-height:300px;';

    const sections=getDailySections(dstr);

    items.forEach((item, idx)=>{
      const row = el('div');
      row.style.cssText = `display:flex;align-items:flex-start;gap:4px;padding:4px 2px;border-radius:6px;`;

      const section=item.sectionId?sections.find((s)=>s.id===item.sectionId):null;
      const sectionColor=window.JCal.getSectionColor(section);

      const cb=window.JCal.createCheckbox(sectionColor);
      cb.checked=!!item.done;

      const text = el('span', null, item.text);
      text.style.cssText = `font-size:11px;line-height:1.4;word-break:break-all;${item.done?'text-decoration:line-through;color:#9aa5b1;':'color:#374151;'}`;

      cb.addEventListener('change', (e)=>{
        e.stopPropagation();
        const checked=cb.checked;
        text.style.textDecoration=checked?'line-through':'';
        text.style.color=checked?'#9aa5b1':'#374151';
        setDailyItemDone(dstr,idx,checked,{skipRefresh:true});
      });

      row.append(cb, text);
      itemList.appendChild(row);
    });

    const addFoot=el('div','daily-week-day-add-foot');
    const addBtn=el('button','daily-month-day-add-btn','+');
    addBtn.title='Add task';
    bindDailyCellInlineAddButton({
      hostEl:addFoot,
      addBtn,
      dstr,
      onTaskAdded:(task)=>{
        const list=_dailyTasksCache.get(dstr)||getDailyTasks(dstr);
        const idx=list.findIndex((t)=>t.id===task.id);
        appendDailyWeekViewTaskRow(itemList,dstr,task,idx>=0?idx:list.length-1);
      },
    });
    addFoot.appendChild(addBtn);

    col.addEventListener('click', (e)=>{
      if(e.target.closest('input,button,.daily-week-day-add-wrap')) return;
      dailySelectedDate = new Date(date);
      renderDailyWeekCalendar();
      renderDailyList();
    });

    col.append(dayHeader, itemList, addFoot);
    weekGrid.appendChild(col);
  }

  container.appendChild(weekGrid);
}

function focusDailyDayTaskInput(){
  requestAnimationFrame(()=>{
    document.querySelector('#dailyDayWorkspace .daily-section-task-input')?.focus();
  });
}

async function openMonthDayInDailyView(date,opts={}){
  await navigateMonthDateToDayView(date);
  if(opts.focusTaskInput!==false) focusDailyDayTaskInput();
}

async function deleteMonthViewTask(dstr,taskId,idx,rowItem,body){
  const list=getDailyTasks(dstr).slice();
  let removeIdx=idx;
  if(taskId){
    const byId=list.findIndex((t)=>t.id===taskId);
    if(byId>=0) removeIdx=byId;
  }
  const task=removeIdx>=0?list[removeIdx]:null;
  if(removeIdx>=0) list.splice(removeIdx,1);
  _dailyTasksCache.set(dstr,list);
  set(kDaily(dstr),list);

  const userId=await resolveDailyUserId();
  const id=taskId||task?.id;
  if(userId&&id){
    const sb=getDailySupabaseClient();
    const {error}=await sb.from('daily_tasks')
      .delete()
      .eq('id',id)
      .eq('user_id',userId);
    if(error) console.error('deleteMonthViewTask',error);
  }else if(!userId&&removeIdx>=0){
    saveDailyTasks(dstr,list);
  }

  rowItem.remove();
}

let dailyMonthCalendarClickBound=false;

function renderDailyMonthCalendar(){
  const container = document.getElementById('dailyMonthCalendar');
  if(!container) return;
  container.innerHTML = '';
  updateDailyHeaderPeriodNav();

  const monthStartStr=getMonthStartDateStr(dailySelectedDate);
  const monthlyNotesWrap=el('div','daily-weekly-notes-wrap daily-monthly-notes-wrap');
  monthlyNotesWrap.style.cssText='margin:0 12px 12px;background:#f8f9fa;border-radius:12px;padding:10px 12px;display:none;gap:10px;align-items:stretch;border:1px solid #e9ecef;min-height:80px;';
  container.appendChild(monthlyNotesWrap);
  renderDailyMonthlyNotesBlock(monthlyNotesWrap,monthStartStr);

  const y = dailySelectedDate.getFullYear();
  const m = dailySelectedDate.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const totalDays = new Date(y, m+1, 0).getDate();

  const view = el('div','daily-month-record-view daily-month-grid');
  const weekdays=WEEKDAY_LABELS_EN;

  const weekdayHeaderRow=el('div','daily-month-weekday-header');
  weekdays.forEach((name)=>{
    weekdayHeaderRow.appendChild(el('div','daily-month-weekday-cell',name));
  });
  view.appendChild(weekdayHeaderRow);

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
      const items=getDailyTasks(dstr);
      const sections=getDailySections(dstr);
      const isCurrentMonth=date.getMonth()===m;
      const isToday=dstr===fmtLocalDate(new Date());
      const isSelected=dstr===fmtLocalDate(dailySelectedDate);

      const card=el('div','daily-month-day-card');
      if(!isCurrentMonth) card.classList.add('is-outside-month');
      if(isSelected) card.classList.add('is-selected');

      const cardHeader=el('div','daily-month-day-card-header');
      const dayNum=el('div','daily-month-day-num daily-month-day-num-clickable',String(date.getDate()));
      dayNum.dataset.date=dstr; // YYYY-MM-DD
      if(isToday) cardHeader.classList.add('is-today');
      else if(isSelected) cardHeader.classList.add('is-selected');

      dayNum.title='Open day view';
      cardHeader.append(dayNum);

      const body=el('div','daily-month-day-card-body');
      if(items.length){
        items.forEach((item,idx)=>{
          const rowItem=el('div','daily-month-task-item');
          rowItem.style.position='relative';

          const section=item.sectionId?sections.find((s)=>s.id===item.sectionId):null;
          const sectionColor=window.JCal.getSectionColor(section);

          const cb=window.JCal.createCheckbox(sectionColor);
          cb.checked=!!item.done;
          const txt=el('span','daily-month-task-text',item.text);
          if(item.done) txt.classList.add('is-done');

          const delBtn=window.JCal.createDeleteBtn();
          delBtn.type='button';
          delBtn.title='Delete task';
          rowItem.addEventListener('mouseenter',()=>{ delBtn.style.opacity='1'; });
          rowItem.addEventListener('mouseleave',()=>{ delBtn.style.opacity='0'; });

          cb.addEventListener('change',(e)=>{
            e.stopPropagation();
            const checked=cb.checked;
            if(checked) txt.classList.add('is-done');
            else txt.classList.remove('is-done');
            setDailyItemDone(dstr,idx,checked,{skipRefresh:true});
          });
          delBtn.addEventListener('click',(e)=>{
            e.stopPropagation();
            void deleteMonthViewTask(dstr,item.id,idx,rowItem,body);
          });

          rowItem.append(cb,txt,delBtn);
          body.appendChild(rowItem);
        });
      }

      const addFoot=el('div','daily-month-day-add-foot');
      const addDayBtn=el('button','daily-month-day-add-btn','+');
      addDayBtn.title='Add task';
      bindDailyCellInlineAddButton({
        hostEl:addFoot,
        addBtn:addDayBtn,
        dstr,
        onTaskAdded:(task)=>{
          const list=getDailyTasks(dstr);
          const idx=list.findIndex((t)=>t.id===task.id);
          appendDailyMonthViewTaskRow(body,dstr,task,idx>=0?idx:list.length-1);
        },
      });
      addFoot.appendChild(addDayBtn);

      card.addEventListener('click',function(e){
        if(e.target.closest('.daily-month-day-add-btn')) return;
        if(e.target.closest('.daily-month-inline-input')) return;
        e.stopPropagation();
        void loadDailyByDate(dstr).then(()=>{
          setTimeout(()=>setDailyViewMode('day'),80);
        });
      });

      card.append(cardHeader,body,addFoot);
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

    const cb=window.JCal.createCheckbox(window.JCal.getSectionColor(null));
    cb.checked=!!item.done;

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
      const dstr=fmtLocalDate(dailySelectedDate||new Date());
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
        row.style.cssText='display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid #e9ecf2;border-radius:8px;margin-bottom:6px;font-size:13px;';

        const cb=window.JCal.createCheckbox(window.JCal.getSectionColor(null));
        cb.checked=!!item.done;

        const txt=doc.createElement('span');
        txt.textContent=item.text;
        txt.style.cssText=item.done
          ?'text-decoration:line-through;color:#9aa5b1;font-size:13px;'
          :'color:#374151;font-size:13px;';

        cb.addEventListener('change',()=>{
          const list2=JSON.parse(win.localStorage.getItem(kDaily(dstr))||'[]');
          const target=list2.find(t=>t.text===item.text);
          if(target){
            target.done=cb.checked;
            win.localStorage.setItem(kDaily(dstr),JSON.stringify(list2));
            txt.style.textDecoration=cb.checked?'line-through':'';
            txt.style.color=cb.checked?'#9aa5b1':'#374151';
          }
        });

        row.append(cb,txt);
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

  function getMonthStartDateStr(date) {
    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
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

  async function loadMonthlyNotesFromSupabase(monthStartStr) {
    const userId = await resolveDailyUserId();
    if (!userId) return null;
    const sb = getDailySupabaseClient();
    const { data, error } = await sb
      .from('monthly_notes')
      .select('id,focus,next_month')
      .eq('user_id', userId)
      .eq('month_start', monthStartStr);
    if (error) throw error;

    const row = (data || [])[0] || null;
    const focusArr = safeJsonParseStringArray(row?.focus) || [''];
    const nextMonthArr = safeJsonParseStringArray(row?.next_month) || [''];
    return {
      focus: focusArr.length ? focusArr : [''],
      next_month: nextMonthArr.length ? nextMonthArr : [''],
    };
  }

  async function upsertMonthlyNotesToSupabase(monthStartStr, focusArr, nextMonthArr) {
    const userId = await resolveDailyUserId();
    if (!userId) return;
    const sb = getDailySupabaseClient();
    const { error } = await sb.from('monthly_notes').upsert(
      {
        user_id: userId,
        month_start: monthStartStr,
        focus: JSON.stringify(focusArr),
        next_month: JSON.stringify(nextMonthArr),
      },
      { onConflict: 'user_id,month_start' }
    );
    if (error) throw error;
  }

  function renderDailyDualBulletNotesBlock(hostEl, { leftTitle, rightTitle, loadItems, saveItems }) {
    const doc = hostEl.ownerDocument || document;

    hostEl.innerHTML = '';
    hostEl.style.display = 'flex';
    hostEl.style.justifyContent = 'space-between';
    hostEl.style.flexWrap = 'nowrap';
    hostEl.style.alignItems = 'stretch';

    const renderHidden = () => {
      hostEl.style.display = 'none';
    };

    let leftItems = [''];
    let rightItems = [''];
    let saveTimer = null;
    const pending = { left: null, right: null };

    const scheduleSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          await saveItems(leftItems, rightItems);
        } catch (err) {
          console.error('saveDailyDualBulletNotes', err);
        }
      }, 500);
    };

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
          setTimeout(() => makeInput(row, span, idx), 0);
        }
      });
    };

    const leftListEl = doc.createElement('div');
    const rightListEl = doc.createElement('div');

    const leftCol = doc.createElement('div');
    leftCol.className = 'daily-weekly-notes-col';
    leftCol.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;align-self:stretch;';
    const rightCol = doc.createElement('div');
    rightCol.className = 'daily-weekly-notes-col';
    rightCol.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;align-self:stretch;';

    const leftTitleEl = doc.createElement('div');
    leftTitleEl.textContent = leftTitle;
    leftTitleEl.style.cssText = 'color:#374151;font-weight:600;font-size:0.85rem;margin-bottom:6px;letter-spacing:0;';
    const rightTitleEl = doc.createElement('div');
    rightTitleEl.textContent = rightTitle;
    rightTitleEl.style.cssText = 'color:#374151;font-weight:600;font-size:0.85rem;margin-bottom:6px;letter-spacing:0;';

    const listWrapStyle = 'background:#ffffff;border:1px solid #e9ecef;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;height:100%;flex:1;min-height:0;';
    leftCol.append(leftTitleEl, leftListEl);
    rightCol.append(rightTitleEl, rightListEl);
    leftListEl.style.cssText = listWrapStyle;
    rightListEl.style.cssText = listWrapStyle;

    hostEl.style.alignItems = 'stretch';
    hostEl.append(leftCol, rightCol);

    const renderAll = () => {
      leftListEl.style.cssText = listWrapStyle;
      rightListEl.style.cssText = listWrapStyle;
      renderBulletList(leftListEl, leftItems, pending.left, (nextArr, focusIdx) => {
        leftItems = nextArr.length ? nextArr : [''];
        pending.left = focusIdx;
        scheduleSave();
        renderAll();
      });
      renderBulletList(rightListEl, rightItems, pending.right, (nextArr, focusIdx) => {
        rightItems = nextArr.length ? nextArr : [''];
        pending.right = focusIdx;
        scheduleSave();
        renderAll();
      });
      pending.left = null;
      pending.right = null;
    };

    renderAll();

    (async () => {
      try {
        const userId = await resolveDailyUserId();
        if (!userId) {
          renderHidden();
          return;
        }

        const loaded = await loadItems();
        if (loaded) {
          leftItems = loaded.left || [''];
          rightItems = loaded.right || [''];
          renderAll();
        }
      } catch (err) {
        console.error('loadDailyDualBulletNotes', err);
      }
    })();
  }

  function renderDailyWeeklyNotesBlock(hostEl, weekStartStr) {
    renderDailyDualBulletNotesBlock(hostEl, {
      leftTitle: '📌 Weekly Focus',
      rightTitle: '📅 Next Week',
      loadItems: async () => {
        const loaded = await loadWeeklyNotesFromSupabase(weekStartStr);
        if (!loaded) return { left: [''], right: [''] };
        return { left: loaded.reminder, right: loaded.monthly };
      },
      saveItems: (leftArr, rightArr) => upsertWeeklyNotesToSupabase(weekStartStr, leftArr, rightArr),
    });
  }

  function renderDailyMonthlyNotesBlock(hostEl, monthStartStr) {
    renderDailyDualBulletNotesBlock(hostEl, {
      leftTitle: '📌 Monthly Focus',
      rightTitle: '📅 Next Month',
      loadItems: async () => {
        const loaded = await loadMonthlyNotesFromSupabase(monthStartStr);
        if (!loaded) return { left: [''], right: [''] };
        return { left: loaded.focus, right: loaded.next_month };
      },
      saveItems: (leftArr, rightArr) => upsertMonthlyNotesToSupabase(monthStartStr, leftArr, rightArr),
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

  window.syncLoginNudgeBanner = syncLoginNudgeBanner;
  window.openAppLoginModal = openAppLoginModal;

  window.showDailyPage = showDailyPage;
  window.initDailyPage = initDailyPage;
  window.applyDailyView = applyDailyView;
  window.refreshDailyTaskViews = refreshDailyTaskViews;
  window.widgetDaily = widgetDaily;
  window.getDailyTasks = getDailyTasks;
})();
