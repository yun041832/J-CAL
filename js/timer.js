/* js/timer.js — Timer + Stopwatch (memo2_app.js에서 이동, 1단계: 원본 유지) */
(function () {
  'use strict';

  const JCal = window.JCal || {};
  const el = JCal.el || function (t, c, txt) {
    const x = document.createElement(t);
    if (c) x.className = c;
    if (txt != null) x.textContent = txt;
    return x;
  };

  let timerSubView = 'timer';

  function hideInsightPages() {
    document.getElementById('insightPage')?.classList.add('hidden');
    document.getElementById('insightWritePage')?.classList.add('hidden');
  }

function applyTimerSubView(){
  const page=document.getElementById('timerPage');
  const timerPanel=document.getElementById('timerPanel');
  const stopwatchPanel=document.getElementById('stopwatchPanel');
  const widgetBtn=document.getElementById('openStopwatchWidgetBtn');
  const showStopwatch=timerSubView==='stopwatch';
  page?.classList.toggle('timer-page--stopwatch',showStopwatch);
  if(timerPanel){
    timerPanel.hidden=showStopwatch;
    timerPanel.style.display=showStopwatch?'none':'block';
  }
  if(stopwatchPanel){
    stopwatchPanel.hidden=!showStopwatch;
    stopwatchPanel.style.display=showStopwatch?'flex':'none';
  }
  if(widgetBtn) widgetBtn.style.display=showStopwatch?'':'none';
  document.getElementById('timerSubTabTimer')?.classList.toggle('is-active',!showStopwatch);
  document.getElementById('timerSubTabStopwatch')?.classList.toggle('is-active',showStopwatch);
  const tabTimer=document.getElementById('timerSubTabTimer');
  const tabSw=document.getElementById('timerSubTabStopwatch');
  if(tabTimer) tabTimer.setAttribute('aria-selected',String(!showStopwatch));
  if(tabSw) tabSw.setAttribute('aria-selected',String(showStopwatch));
  if(showStopwatch) initStopwatchPage?.();
}
function setTimerSubView(mode){
  timerSubView=mode==='stopwatch'?'stopwatch':'timer';
  localStorage.setItem('memo2.timerSubView',timerSubView);
  localStorage.setItem('memo2.lastPage',timerSubView==='stopwatch'?'stopwatch':'timer');
  applyTimerSubView();
}
function bindTimerSubTabs(){
  if(window._jcalTimerSubTabsBound) return;
  window._jcalTimerSubTabsBound=true;
  document.getElementById('timerSubTabTimer')?.addEventListener('click',()=> setTimerSubView('timer'));
  document.getElementById('timerSubTabStopwatch')?.addEventListener('click',()=> setTimerSubView('stopwatch'));
}

  function showTimerPage(subView) {
  if(subView==='stopwatch') timerSubView='stopwatch';
  else if(subView==='timer') timerSubView='timer';
  else if(localStorage.getItem('memo2.lastPage')==='stopwatch') timerSubView='stopwatch';
  else timerSubView='timer';
  localStorage.setItem('memo2.lastPage', timerSubView==='stopwatch'?'stopwatch':'timer');
  document.getElementById('homeIntroSection')?.classList.add('hidden');
  document.getElementById('calendarPage')?.classList.add('hidden');
  document.getElementById('memoPage')?.classList.add('hidden');
  document.getElementById('memoWritePage')?.classList.add('hidden');
  document.getElementById('routinePage')?.classList.add('hidden');
  document.getElementById('dailyPage')?.classList.add('hidden');
  document.getElementById('timerPage')?.classList.remove('hidden');
  document.getElementById('logsPage')?.classList.add('hidden');
  hideInsightPages();
  document.querySelector('.right')?.classList.add('hidden');
  typeof hideUsage === "function" && hideUsage();
  bindTimerSubTabs();
  initTimersPage();
  applyTimerSubView();
}

  function showStopwatchPage(){
  showTimerPage('stopwatch');
}

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

/* ── 스탑워치·타이머 localStorage 동기화 (브라우저↔위젯) ── */
const SW_LS_KEYS=['stopwatch_start_time','stopwatch_is_running','stopwatch_elapsed_ms'];
const TIMER_PRESETS=[
  {label:'15m',ms:15*60*1000},
  {label:'30m',ms:30*60*1000},
  {label:'1h',ms:60*60*1000},
  {label:'1h 30m',ms:90*60*1000},
  {label:'2h',ms:120*60*1000},
  {label:'3h',ms:180*60*1000},
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
    const tick=()=>{ const left=Math.max(0,endPerf-performance.now()); draw(left); if(left<=0){ cancelAnimationFrame(raf); raf=null; alert('Timer finished'); send({type:'reset'}); saveState({status:'idle'}); return; } raf=requestAnimationFrame(tick); }

    function apply(msg,remote=false){
      if(msg.type==='start'){
        totalMs=msg.totalMs; const dur=Math.max(0,msg.endEpoch-Date.now()); endPerf=performance.now()+dur; paused=false; remainMs=0;
        eta.textContent=`Ends ${fmtAmPm(new Date(msg.endEpoch))}`; bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
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
        paused=false; endPerf=performance.now()+msg.remainMs; eta.textContent=`Ends ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; bPause.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/></svg>`;
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
  return makeWidget('Timer', build, 'widget--timer');
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
  const popoutBtn=el('button','timer-box__btn widget-open-btn','Widget');
  popoutBtn.title='Open widget';
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
    const ampm=h>=12?'PM':'AM';
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
      alert(`Timer ${displayNum} finished`); 
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
      eta.textContent=`Ends ${fmtAmPm(new Date(msg.endEpoch))}`; 
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
      eta.textContent=`Ends ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; 
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
        alert(`Timer ${idx+1} finished`); 
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
        eta.textContent=`Ends ${fmtAmPm(new Date(msg.endEpoch))}`; 
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
        eta.textContent=`Ends ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; 
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
  
  openWidgetPopup(`Timer ${displayNum}`, build, {timerIndex});
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
    ih.type='number'; ih.min=0; ih.placeholder='h'; ih.value=savedSettings.h||'';
    const im=document.createElement('input'); 
    im.type='number'; im.min=0; im.placeholder='m'; im.value=savedSettings.m||'';
    const is=document.createElement('input'); 
    is.type='number'; is.min=0; is.placeholder='s'; is.value=savedSettings.s||'';
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
        alert(`Timer ${index} finished`); 
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
        eta.textContent=`Ends ${fmtAmPm(new Date(msg.endEpoch))}`; 
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
        eta.textContent=`Ends ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; 
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
  return makeWidget(`Timer ${index}`, build, 'widget--timer');
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
  sub.textContent='Ready';

  const actions=doc.createElement('div');
  actions.className='stopwatch-actions';
  const startBtn=doc.createElement('button');
  startBtn.type='button';
  startBtn.className='stopwatch-btn stopwatch-btn--primary';
  startBtn.textContent='Start';
  const pauseBtn=doc.createElement('button');
  pauseBtn.type='button';
  pauseBtn.className='stopwatch-btn stopwatch-btn--primary';
  pauseBtn.textContent='Pause';
  const resetBtn=doc.createElement('button');
  resetBtn.type='button';
  resetBtn.className='stopwatch-btn stopwatch-btn--reset';
  resetBtn.textContent='Reset';
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
      running=true; accMs=base; segmentStart=start; sub.textContent='Running';
      updateDisplay(ms); raf=win.requestAnimationFrame(tick);
    }else{
      running=false; accMs=ms; segmentStart=0;
      updateDisplay(ms); sub.textContent=ms>0?'Paused':'Ready';
    }
  };

  startBtn.onclick=()=>{
    if(running) return;
    segmentStart=Date.now(); running=true; sub.textContent='Running';
    persistStopwatch(true,accMs,segmentStart);
    raf=win.requestAnimationFrame(tick);
  };
  pauseBtn.onclick=()=>{
    if(!running){
      segmentStart=Date.now(); running=true; sub.textContent='Running';
      persistStopwatch(true,accMs,segmentStart);
      raf=win.requestAnimationFrame(tick);
      return;
    }
    running=false; accMs=currentMs(); segmentStart=0; sub.textContent='Paused';
    persistStopwatch(false,accMs);
    updateDisplay(accMs);
    if(raf){ win.cancelAnimationFrame(raf); raf=null; }
  };
  resetBtn.onclick=()=>{
    running=false; accMs=0; segmentStart=0; updateDisplay(0); sub.textContent='Ready';
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
  return makeWidget('Stopwatch',(isPopup, win)=> buildStopwatchCard(win,!!isPopup), 'widget--stopwatch');
}


  const timerApi = {
    showTimerPage,
    showStopwatchPage,
    applyTimerSubView,
    bindTimerSubTabs,
    setTimerSubView,
    initTimersPage,
    initStopwatchPage,
    widgetTimer,
    widgetStopwatch,
    initTimerSettingModal,
    openTimerSettingModal,
    getTimerButtonLabel,
    timerLsKey,
    ensureTimeStyles,
  };

  Object.assign(window.JCal || (window.JCal = {}), timerApi);

  window.showTimerPage = showTimerPage;
  window.showStopwatchPage = showStopwatchPage;
  window.applyTimerSubView = applyTimerSubView;
  window.bindTimerSubTabs = bindTimerSubTabs;
  window.setTimerSubView = setTimerSubView;
  window.initTimersPage = initTimersPage;
  window.initStopwatchPage = initStopwatchPage;
  window.widgetTimer = widgetTimer;
  window.widgetStopwatch = widgetStopwatch;
  window.initTimerSettingModal = initTimerSettingModal;
  window.openTimerSettingModal = openTimerSettingModal;
  window.ensureTimeStyles = ensureTimeStyles;
})();
