/* js/core.js — 공통 유틸·라우팅 골격 (memo2_app.js에서 복사, 원본 유지) */
(function () {
  'use strict';

  function el(t, c, txt) {
    const x = document.createElement(t);
    if (c) x.className = c;
    if (txt != null) x.textContent = txt;
    return x;
  }

  const storeCache = new Map();
  const cloneDefault = (val) => {
    if (Array.isArray(val)) return [...val];
    return val && typeof val === 'object' ? { ...val } : val;
  };
  const readFromStore = (key, def = []) => {
    if (storeCache.has(key)) return storeCache.get(key);
    let parsed = cloneDefault(def);
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) parsed = JSON.parse(raw);
    } catch (err) {
      console.warn('storage parse fail', err);
    }
    storeCache.set(key, parsed);
    return parsed;
  };
  const writeToStore = (key, val) => {
    storeCache.set(key, val);
    localStorage.setItem(key, JSON.stringify(val));
  };
  const get = (k, def = []) => readFromStore(k, def);
  const set = (k, v) => writeToStore(k, v);

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (evt) => {
      if (evt.key) {
        storeCache.delete(evt.key);
      } else {
        storeCache.clear();
      }
    });
  }

  function fmtLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function parseLocalDate(str) {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  /* ── 페이지 라우팅 (memo2_app.js: showHomeIntro 등) ── */
  const homeIntroSection = document.getElementById('homeIntroSection');
  const calendarPage = document.getElementById('calendarPage');
  const memoPage = document.getElementById('memoPage');
  const memoWritePage = document.getElementById('memoWritePage');
  const insightPage = document.getElementById('insightPage');
  const insightWritePage = document.getElementById('insightWritePage');
  const routinePage = document.getElementById('routinePage');
  const dailyPage = document.getElementById('dailyPage');
  const timerPage = document.getElementById('timerPage');
  const logsPage = document.getElementById('logsPage');
  let timerSubView = 'timer';
  const rightPane = document.querySelector('.right');

  function hideInsightPages() {
    insightPage?.classList.add('hidden');
    insightWritePage?.classList.add('hidden');
  }

  function applyTimerSubView() {
    const page = document.getElementById('timerPage');
    const timerPanel = document.getElementById('timerPanel');
    const stopwatchPanel = document.getElementById('stopwatchPanel');
    const widgetBtn = document.getElementById('openStopwatchWidgetBtn');
    const showStopwatch = timerSubView === 'stopwatch';
    page?.classList.toggle('timer-page--stopwatch', showStopwatch);
    if (timerPanel) {
      timerPanel.hidden = showStopwatch;
      timerPanel.style.display = showStopwatch ? 'none' : 'block';
    }
    if (stopwatchPanel) {
      stopwatchPanel.hidden = !showStopwatch;
      stopwatchPanel.style.display = showStopwatch ? 'flex' : 'none';
    }
    if (widgetBtn) widgetBtn.style.display = showStopwatch ? '' : 'none';
    document.getElementById('timerSubTabTimer')?.classList.toggle('is-active', !showStopwatch);
    document.getElementById('timerSubTabStopwatch')?.classList.toggle('is-active', showStopwatch);
    const tabTimer = document.getElementById('timerSubTabTimer');
    const tabSw = document.getElementById('timerSubTabStopwatch');
    if (tabTimer) tabTimer.setAttribute('aria-selected', String(!showStopwatch));
    if (tabSw) tabSw.setAttribute('aria-selected', String(showStopwatch));
    if (showStopwatch) initStopwatchPage?.();
  }

  function setTimerSubView(mode) {
    timerSubView = mode === 'stopwatch' ? 'stopwatch' : 'timer';
    localStorage.setItem('memo2.timerSubView', timerSubView);
    localStorage.setItem('memo2.lastPage', timerSubView === 'stopwatch' ? 'stopwatch' : 'timer');
    applyTimerSubView();
  }

  function bindTimerSubTabs() {
    if (window._jcalTimerSubTabsBound) return;
    window._jcalTimerSubTabsBound = true;
    document.getElementById('timerSubTabTimer')?.addEventListener('click', () => setTimerSubView('timer'));
    document.getElementById('timerSubTabStopwatch')?.addEventListener('click', () => setTimerSubView('stopwatch'));
  }

  function showHomeIntro() {
    localStorage.setItem('memo2.lastPage', 'home');
    homeIntroSection?.classList.remove('hidden');
    homeIntroSection?.style && (homeIntroSection.style.display = '');
    calendarPage?.classList.add('hidden');
    memoPage?.classList.add('hidden');
    memoWritePage?.classList.add('hidden');
    routinePage?.classList.add('hidden');
    dailyPage?.classList.add('hidden');
    timerPage?.classList.add('hidden');
    logsPage?.classList.add('hidden');
    hideInsightPages();
    rightPane?.classList.add('hidden');
  }

  function showCalendarPage() {
    localStorage.setItem('memo2.lastPage', 'calendar');
    homeIntroSection?.classList.add('hidden');
    calendarPage?.classList.remove('hidden');
    memoPage?.classList.add('hidden');
    memoWritePage?.classList.add('hidden');
    routinePage?.classList.add('hidden');
    dailyPage?.classList.add('hidden');
    timerPage?.classList.add('hidden');
    logsPage?.classList.add('hidden');
    hideInsightPages();
    rightPane?.classList.remove('hidden');
    renderCalendar?.();
    renderRight?.();
    renderMonthlyGoals?.();
  }

  function showMemoPage() {
    localStorage.setItem('memo2.lastPage', 'memo');
    homeIntroSection?.classList.add('hidden');
    calendarPage?.classList.add('hidden');
    memoPage?.classList.remove('hidden');
    memoWritePage?.classList.add('hidden');
    routinePage?.classList.add('hidden');
    dailyPage?.classList.add('hidden');
    timerPage?.classList.add('hidden');
    logsPage?.classList.add('hidden');
    hideInsightPages();
    rightPane?.classList.add('hidden');
    getJayMemoList();
    initMemoPage?.();
    const savedView = localStorage.getItem('memoViewMode') || 'grid';
    setTimeout(() => {
      if (typeof setMemoView === 'function') setMemoView(savedView);
    }, 50);
  }

  function showRoutinePage() {
    localStorage.setItem('memo2.lastPage', 'routine');
    homeIntroSection?.classList.add('hidden');
    calendarPage?.classList.add('hidden');
    memoPage?.classList.add('hidden');
    memoWritePage?.classList.add('hidden');
    routinePage?.classList.remove('hidden');
    dailyPage?.classList.add('hidden');
    timerPage?.classList.add('hidden');
    logsPage?.classList.add('hidden');
    hideInsightPages();
    rightPane?.classList.add('hidden');
    initRoutinePage?.();
  }

  function showDailyPage() {
    localStorage.setItem('memo2.lastPage', 'daily');
    homeIntroSection?.classList.add('hidden');
    calendarPage?.classList.add('hidden');
    memoPage?.classList.add('hidden');
    memoWritePage?.classList.add('hidden');
    routinePage?.classList.add('hidden');
    timerPage?.classList.add('hidden');
    logsPage?.classList.add('hidden');
    dailyPage?.classList.remove('hidden');
    hideInsightPages();
    rightPane?.classList.add('hidden');
    initDailyPage?.();
    applyDailyView?.();
  }

  function showTimerPage(subView) {
    if (subView === 'stopwatch') timerSubView = 'stopwatch';
    else if (subView === 'timer') timerSubView = 'timer';
    else if (localStorage.getItem('memo2.lastPage') === 'stopwatch') timerSubView = 'stopwatch';
    else timerSubView = 'timer';
    localStorage.setItem('memo2.lastPage', timerSubView === 'stopwatch' ? 'stopwatch' : 'timer');
    homeIntroSection?.classList.add('hidden');
    calendarPage?.classList.add('hidden');
    memoPage?.classList.add('hidden');
    memoWritePage?.classList.add('hidden');
    routinePage?.classList.add('hidden');
    dailyPage?.classList.add('hidden');
    timerPage?.classList.remove('hidden');
    logsPage?.classList.add('hidden');
    hideInsightPages();
    rightPane?.classList.add('hidden');
    hideUsage?.();
    bindTimerSubTabs();
    initTimersPage?.();
    applyTimerSubView();
  }

  const PV_KEY = 'memo2.menuPV';
  function trackMenuPV(label) {
    try {
      const snap = get(PV_KEY, { count: 0, events: [] });
      snap.count += 1;
      snap.events.unshift({ label, ts: Date.now() });
      if (snap.events.length > 100) snap.events.length = 100;
      set(PV_KEY, snap);
      if (window.memo2PVLogEnabled) {
        const ts = new Date().toISOString();
        console.log(`[menuPV] ${label} | total=${snap.count} | ${ts}`);
      }
    } catch (err) {
      console.warn('menuPV track fail', err);
    }
  }

  function updateThemeButton() {
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    themeBtn.textContent = current === 'light' ? '◐ 다크모드' : '◑ 라이트모드';
  }

  function loadTheme() {
    const saved = localStorage.getItem('memo2.theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeButton();
  }

  window.JCal = {
    el,
    get,
    set,
    fmtLocalDate,
    parseLocalDate,
    MONTHS_EN,
    WEEKDAY_LABELS_EN,
    showHomePage: showHomeIntro,
    showHomeIntro,
    showCalendarPage,
    showDailyPage,
    showMemoPage,
    showRoutinePage,
    showTimerPage,
    loadTheme,
    trackMenuPV,
  };
})();
