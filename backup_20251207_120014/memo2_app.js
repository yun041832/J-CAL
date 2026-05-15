// memo2_app.js
/* 메모위젯 v0.8.2 — 홈패널/달력/메모/ToDo + 팝아웃/위젯 동기화 */
function el(t,c,txt){const x=document.createElement(t);if(c)x.className=c;if(txt!=null)x.textContent=txt;return x;}
const DEFAULT_COLOR='#5c8dff', DONE_COLOR='#9aa5b1';
const effectiveColor=(it)=> it.done?DONE_COLOR:(it.color||DEFAULT_COLOR);

function fmtLocalDate(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
function ymLabel(y,m){return `${y}년 ${m+1}월`;}
function fmtAmPm(date){let h=date.getHours();const m=date.getMinutes();const ap=h>=12?'오후':'오전';const hh=(h%12)||12;return `${ap} ${hh}:${String(m).padStart(2,'0')}`;}

const ST={viewYear:new Date().getFullYear(),viewMonth:new Date().getMonth(),selected:new Date(),linesHint:4,cellHeight:120,eventEmoji:'',eventColor:'',todoEmoji:'',todoColor:'',reminderEmoji:'',reminderColor:''};
const $={
  ym:document.getElementById('ymLabel'),
  grid:document.getElementById('calendarGrid'),
  todayBtn:document.getElementById('todayBtn'),
  prev:document.getElementById('prevMonth'),
  next:document.getElementById('nextMonth'),
  selText:document.getElementById('selectedDateText'),
  eventTitle:document.getElementById('eventTitle'),
  emojiBtn:document.getElementById('emojiBtn'),
  eventColorBtn:document.getElementById('eventColorBtn'),
  eventStartDate:document.getElementById('eventStartDate'),
  eventEndDate:document.getElementById('eventEndDate'),
  eventTime:document.getElementById('eventTime'),
  eventAlarm:document.getElementById('eventAlarm'),
  eventRepeat:document.getElementById('eventRepeat'),
  eventAddBtn:document.getElementById('eventAddBtn'),
  eventList:document.getElementById('eventList'),
  todoInput:document.getElementById('todoInput'),
  todoEmojiBtn:document.getElementById('todoEmojiBtn'),
  todoColorBtn:document.getElementById('todoColorBtn'),
  todoStartDate:document.getElementById('todoStartDate'),
  todoEndDate:document.getElementById('todoEndDate'),
  todoAdd:document.getElementById('todoAddBtn'),
  todoList:document.getElementById('todoList'),
  reminderInput:document.getElementById('reminderInput'),
  reminderEmojiBtn:document.getElementById('reminderEmojiBtn'),
  reminderColorBtn:document.getElementById('reminderColorBtn'),
  reminderAddBtn:document.getElementById('reminderAddBtn'),
  reminderList:document.getElementById('reminderList'),
  memoDate:document.getElementById('memoDate'),
  memoInput:document.getElementById('memoInput'),
  memoAdd:document.getElementById('memoAddBtn'),
  memoList:document.getElementById('memoList'),
  calWrap:document.querySelector('.calendar'),
  host:document.getElementById('widgetHost'),
  calSizeSlider:document.getElementById('calSizeSlider'),
};
const kTodo=(d)=>`memo2.todos.${d}`, kMemo=(d)=>`memo2.memos.${d}`;
const get=(k,def=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(def));}catch{return def;}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

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
  const weekdays=$.calWrap.querySelector('.calendar__weekdays');
  const gridH=$.calWrap.clientHeight-(weekdays?.offsetHeight||0)-24;
  const rows=6,gap=10;
  return Math.max(96,(gridH-gap*(rows-1))/rows);
}
function calcMaxLines(){
  const cellH=calcCellHeight();
  const usable=cellH-38;
  return Math.max(1,Math.floor(usable/18));
}
function renderCalendar(){
  const y=ST.viewYear,m=ST.viewMonth;
  $.ym.textContent=ymLabel(y,m);
  $.grid.innerHTML='';
  const first=new Date(y,m,1),start=first.getDay(),total=dim(y,m);
  const prevTotal=new Date(y,m,0).getDate(),cells=42;
  
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
    const todos=get(kTodo(dstr));
    if(todos.length){
      const labels=el('div','labels');
      const maxShow=Math.min(ST.linesHint, 4);
      todos.slice(0,maxShow).forEach(t=>{
        const row=el('div','label');
        
        const content=el('div','label-content');
        if(t.emoji){
          const emoji=el('span','label-emoji',t.emoji);
          content.appendChild(emoji);
        }
        const txt=el('span','label-text',t.text);
        content.appendChild(txt);
        
        if(t.done) {
          txt.classList.add('done');
          txt.style.color='#9aa5b1';
          content.style.backgroundColor='transparent';
        } else {
          txt.style.color=t.color==='rainbow'?'#fff':'#000';
          if(t.color==='rainbow'){
            content.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
          } else {
            content.style.backgroundColor=t.color||'transparent';
          }
        }
        
        row.append(content);
        labels.append(row);
      });
      
      // 5개 초과 시 +N 표시
      if(todos.length>maxShow){
        const moreRow=el('div','label');
        const moreTxt=el('span','label-more',`+${todos.length-maxShow}`);
        moreRow.append(moreTxt);
        labels.append(moreRow);
      }
      
      cell.append(labels);

      const dots=el('div','dots');
      todos.slice(0,5).forEach(t=>{const d=el('span','dot'); d.style.background=effectiveColor(t); dots.append(d);});
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
  $.selText.textContent=dstr;
  $.eventStartDate.value=dstr;
  $.eventEndDate.value=dstr;
  $.todoStartDate.value=dstr;
  $.todoEndDate.value=dstr;
  $.memoDate.value=dstr;
  renderEvents(); renderTodos(); renderMemos();
}

/* ── 선택 날짜 (Event) ── */
function renderEvents(){
  const dstr=fmtLocalDate(ST.selected), list=get(kTodo(dstr));
  $.eventList.innerHTML='';
  list.forEach((it,i)=> $.eventList.appendChild(eventItemEl(it,i,list,dstr)));
}
function eventItemEl(item,idx,ref,dstr){
  const li=el('li','event-item');
  const labelWrap=el('span','event-label-wrapper');
  
  if(item.emoji){ const emoji=el('span','event-emoji',item.emoji); labelWrap.appendChild(emoji); }
  const txt=el('span','event-text',item.text);
  labelWrap.appendChild(txt);
  
  const colorBtn=el('button','color-btn','🎨'); colorBtn.type='button';
  const del=el('button','del-btn','🗑'); del.type='button';

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
  
  txt.ondblclick=()=>{
    const inp=document.createElement('input'); inp.type='text'; inp.className='event-edit'; inp.value=item.text;
    inp.onblur=()=>{ item.text=inp.value.trim()||item.text; set(kTodo(dstr),ref); renderEvents(); renderCalendar(); postApp({type:'refresh'}); };
    inp.onkeydown=(e)=>{ if(e.key==='Enter'){ inp.blur(); } if(e.key==='Escape'){ inp.value=item.text; inp.blur(); } };
    labelWrap.replaceChild(inp,txt); inp.focus(); inp.select();
  };
  
  colorBtn.onclick=()=> showPalette(colorBtn,(c)=>{ item.color=c; set(kTodo(dstr),ref); applyStyle(); renderCalendar(); postApp({type:'refresh'}); });
  del.onclick=()=>{ ref.splice(idx,1); set(kTodo(dstr),ref); renderEvents(); renderCalendar(); postApp({type:'refresh'}); };

  labelWrap.draggable=true;
  labelWrap.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',String(idx)); });
  li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); const to=idx; if(from===to)return; const [m]=ref.splice(from,1); ref.splice(to,0,m); set(kTodo(dstr),ref); renderEvents(); renderCalendar(); postApp({type:'refresh'}); });

  li.append(labelWrap,colorBtn,del);
  return li;
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
  const dstr=fmtLocalDate(ST.selected), list=get(kTodo(dstr));
  $.todoList.innerHTML='';
  list.forEach((it,i)=> $.todoList.appendChild(todoItemEl(it,i,list,dstr)));
  renderCalendar();
}
function todoItemEl(item,idx,ref,dstr){
  const li=el('li','todo-item'); li.append(el('span','pad',''));
  const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=item.done;
  const emoji=item.emoji?el('span','todo-emoji',item.emoji):null;
  const txt=el('span','text',item.text);
  const colorBtn=el('button','color-btn','🎨'); colorBtn.type='button';
  const del=el('button','del-btn','🗑'); del.type='button';

  const applyText=()=>{
    if(item.done){
      txt.style.color='#9aa5b1';
      txt.style.backgroundColor='transparent';
      txt.style.background='transparent';
    } else {
      txt.style.color=item.color==='rainbow'?'#fff':'#000';
      if(item.color==='rainbow'){
        txt.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
        txt.style.backgroundColor='transparent';
      } else {
        txt.style.backgroundColor=item.color||'transparent';
        txt.style.background='';
      }
    }
    txt.classList.toggle('done',!!item.done);
  };
  applyText();

  cb.addEventListener('change',()=>{ item.done=cb.checked; set(kTodo(dstr),ref); applyText(); renderCalendar(); postApp({type:'refresh'}); });
  txt.addEventListener('click',()=>{ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change')); });
  
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

  colorBtn.onclick=()=> showPalette(colorBtn,(c)=>{ item.color=c; set(kTodo(dstr),ref); applyText(); renderCalendar(); postApp({type:'refresh'}); });
  del.onclick=()=>{ ref.splice(idx,1); set(kTodo(dstr),ref); renderTodos(); postApp({type:'refresh'}); };

  // 정렬(텍스트만 드래그)
  txt.draggable=true;
  txt.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',String(idx)); });
  li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); const to=idx; if(from===to)return; const [m]=ref.splice(from,1); ref.splice(to,0,m); set(kTodo(dstr),ref); renderTodos(); postApp({type:'refresh'}); });

  if(emoji) li.append(cb,emoji,txt,colorBtn,del);
  else li.append(cb,txt,colorBtn,del);
  return li;
}
$.eventAddBtn.onclick=()=>{ 
  const title=$.eventTitle.value.trim(); 
  if(!title) return;
  
  const startDate=$.eventStartDate.value;
  const endDate=$.eventEndDate.value||startDate;
  const time=$.eventTime.value;
  const alarm=$.eventAlarm.checked;
  const repeat=$.eventRepeat.checked;
  
  const start=new Date(startDate);
  const end=new Date(endDate);
  
  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
    const dstr=fmtLocalDate(d);
    const list=get(kTodo(dstr)); 
    list.push({
      text:title,
      emoji:ST.eventEmoji,
      color:ST.eventColor||DEFAULT_COLOR,
      done:false,
      time:time,
      alarm:alarm,
      repeat:repeat
    });
    set(kTodo(dstr),list);
  }
  
  $.eventTitle.value=''; 
  $.eventTime.value='';
  $.eventAlarm.checked=false;
  $.eventRepeat.checked=false;
  ST.eventEmoji='';
  ST.eventColor='';
  $.emojiBtn.textContent='😊';
  renderEvents(); 
  renderCalendar();
  postApp({type:'refresh'});
};
$.eventTitle.onkeydown=(e)=>{ if(e.key==='Enter'){ e.preventDefault(); $.eventAddBtn.click(); } };
$.emojiBtn.onclick=()=>{ showEmojiPicker($.emojiBtn, (emoji)=>{ ST.eventEmoji=emoji; $.emojiBtn.textContent=emoji||'😊'; }); };
$.eventColorBtn.onclick=()=> showPalette($.eventColorBtn,(c)=>{ ST.eventColor=c; });

$.todoAdd.onclick=()=>{ 
  const text=$.todoInput.value.trim(); 
  if(!text) return;
  
  const startDate=$.todoStartDate.value||fmtLocalDate(ST.selected);
  const endDate=$.todoEndDate.value||startDate;
  
  const start=new Date(startDate);
  const end=new Date(endDate);
  
  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
    const dstr=fmtLocalDate(d);
    const list=get(kTodo(dstr)); 
    list.push({
      text:text,
      emoji:ST.todoEmoji,
      color:ST.todoColor||DEFAULT_COLOR,
      done:false
    });
    set(kTodo(dstr),list);
  }
  
  $.todoInput.value=''; 
  $.todoStartDate.value='';
  $.todoEndDate.value='';
  ST.todoEmoji='';
  ST.todoColor='';
  $.todoEmojiBtn.textContent='😊';
  renderTodos(); 
  renderCalendar();
  postApp({type:'refresh'});
};
$.todoInput.onkeydown=(e)=>{ if(e.key==='Enter'){ e.preventDefault(); $.todoAdd.click(); } };
$.todoEmojiBtn.onclick=()=>{ showEmojiPicker($.todoEmojiBtn, (emoji)=>{ ST.todoEmoji=emoji; $.todoEmojiBtn.textContent=emoji||'😊'; }); };
$.todoColorBtn.onclick=()=> showPalette($.todoColorBtn,(c)=>{ ST.todoColor=c; });

/* ── REMINDER ── */
const kReminder=()=>'memo2.reminders';
function renderReminders(){
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

$.reminderAddBtn.onclick=()=>{ 
  const text=$.reminderInput.value.trim(); 
  if(!text) return;
  
  const list=get(kReminder(),[]);
  list.push({
    text:text,
    emoji:ST.reminderEmoji,
    color:ST.reminderColor||DEFAULT_COLOR,
    done:false
  });
  set(kReminder(),list);
  
  $.reminderInput.value=''; 
  ST.reminderEmoji='';
  ST.reminderColor='';
  $.reminderEmojiBtn.textContent='😊';
  renderReminders();
  postApp({type:'refresh'});
};
$.reminderInput.onkeydown=(e)=>{ if(e.key==='Enter'){ e.preventDefault(); $.reminderAddBtn.click(); } };
$.reminderEmojiBtn.onclick=()=>{ showEmojiPicker($.reminderEmojiBtn, (emoji)=>{ ST.reminderEmoji=emoji; $.reminderEmojiBtn.textContent=emoji||'😊'; }); };
$.reminderColorBtn.onclick=()=> showPalette($.reminderColorBtn,(c)=>{ ST.reminderColor=c; });

/* ── 오른쪽 메모 ── */
function renderMemos(){
  const dstr=$.memoDate.value||fmtLocalDate(ST.selected);
  const list=get(kMemo(dstr));
  $.memoList.innerHTML=''; list.forEach((it,i)=> $.memoList.appendChild(memoItemEl(it,i,list,dstr)));
}
function memoItemEl(item,idx,ref,dstr){
  const li=el('li','memo-item'); li.append(el('span','pad',''));
  const text=el('span','memo-text',item.text); if(item.color) text.style.color=item.color;
  const colorBtn=el('button','color-btn','🎨'); colorBtn.type='button';
  const del=el('button','del-btn','🗑'); del.type='button';

  text.ondblclick=()=>{ const box=document.createElement('div'); box.style.display='grid'; box.style.gridTemplateColumns='1fr auto auto'; box.style.gap='6px';
    const ta=document.createElement('textarea'); ta.className='memo-edit'; ta.rows=3; ta.value=item.text;
    const save=el('button','btn','저장'), cancel=el('button','btn','취소');
    save.onclick=()=>{ item.text=ta.value.trim()||item.text; set(kMemo(dstr),ref); renderMemos(); postApp({type:'refresh'}); };
    cancel.onclick=()=> renderMemos();
    box.append(ta,save,cancel); li.replaceChild(box,text); ta.focus();
  };
  colorBtn.onclick=()=> showPalette(colorBtn,(c)=>{ item.color=c; set(kMemo(dstr),ref); renderMemos(); postApp({type:'refresh'}); });
  del.onclick=()=>{ ref.splice(idx,1); set(kMemo(dstr),ref); renderMemos(); postApp({type:'refresh'}); };

  // 정렬(텍스트만 드래그)
  text.draggable=true;
  text.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',String(idx)); });
  li.addEventListener('dragover',e=>e.preventDefault());
  li.addEventListener('drop',e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); const to=idx; if(from===to)return; const [m]=ref.splice(from,1); ref.splice(to,0,m); set(kMemo(dstr),ref); renderMemos(); postApp({type:'refresh'}); });

  li.append(text,colorBtn,del);
  return li;
}
$.memoAdd.onclick=()=>{ const txt=$.memoInput.value.replace(/\s+$/,''); if(!txt) return;
  const dstr=$.memoDate.value||fmtLocalDate(ST.selected);
  const list=get(kMemo(dstr)); list.push({text:txt}); set(kMemo(dstr),list); $.memoInput.value=''; renderMemos(); postApp({type:'refresh'});
};
$.memoInput.onkeydown=()=>{};

/* ── 공통 위젯 + 팝아웃 ── */
let z=10;
function makeWidget(title, bodyBuilder, rootClass){
  const w=el('section','widget'+(rootClass?` ${rootClass}`:'')); w.style.zIndex=++z;
  const head=el('div','widget__head'); head.style.cursor='grab';
  const t=el('div','widget__title',title);
  const btns=el('div'); const pop=el('button','widget__btn','↗'); const x=el('button','widget__btn','✕');
  btns.append(pop,x); head.append(t,btns);
  const body=el('div','widget__body'); body.appendChild(bodyBuilder(false, window));

  let sx=0,sy=0,ox=0,oy=0,dragging=false;
  const onMove=(e)=>{ if(!dragging) return; w.style.left=`${ox+(e.clientX-sx)}px`; w.style.top=`${oy+(e.clientY-sy)}px`; };
  const onUp=()=>{ dragging=false; window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); head.style.cursor='grab'; };
  head.addEventListener('mousedown',(e)=>{ dragging=true; head.style.cursor='grabbing'; sx=e.clientX; sy=e.clientY; const r=w.getBoundingClientRect(); ox=r.left; oy=r.top; w.style.zIndex=++z; window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp); });

  x.onclick=()=>w.remove();

  pop.onclick=()=>{
    const win=window.open('','_blank','width=420,height=480,resizable=yes');
    if(!win) return;
    // ★ 팝아웃 공통 스타일(스크롤 제거 + 미니달력 포함)
    win.document.write(`<!doctype html><meta charset="utf-8"><title>${title}</title>
      <style>
        html,body{margin:0;height:100%;overflow:hidden}
        body{background:#f6f7fb;font-family:system-ui,-apple-system,"Noto Sans KR",sans-serif}
        .wrap{padding:12px;box-sizing:border-box;height:100%;overflow:hidden}
        .btn{padding:8px 12px;border:1px solid #e9ecf2;border-radius:10px;background:#f6f8ff;cursor:pointer}
        .color-btn,.del-btn{width:28px;height:28px;padding:0;border:1px solid #e9ecf2;border-radius:8px;background:#fff;display:inline-grid;place-items:center;cursor:pointer}
        .color-pop{position:absolute;z-index:9999;background:#fff;border:1px solid #e9ecf2;border-radius:10px;padding:8px;display:grid;grid-template-columns:repeat(10,16px);gap:6px;box-shadow:0 6px 18px rgba(17,24,39,.08)}
        .color-pop .sw{width:16px;height:16px;border-radius:4px;border:1px solid #d6dae3;cursor:pointer}
        /* 타이머 */
        .timer__ring{position:relative;width:220px;height:220px;margin:4px auto 8px;display:flex;align-items:center;justify-content:center}
        .timer__display{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}
        .timer__eta{display:block;text-align:center;font-size:12px;color:#6b7280;background:#eef2ff;border-radius:999px;width:max-content;margin:0 auto 8px;padding:4px 10px}
        .timer__inputs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 8px}
        .timer__inputs input{width:100%;box-sizing:border-box}
        /* ★ 미니 달력 */
        .mini-cal__head{display:flex;gap:8px;align-items:center;margin-bottom:8px}
        .mini-cal__days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}
        .mini-cal__days span{font-size:12px;color:#64748b;text-align:center}
        .mini-cal__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .mini-day{position:relative;border:1px solid #e9ecf2;border-radius:10px;height:44px;padding:4px;overflow:hidden}
        .mini-day__num{font-size:12px;color:#334155}
        .mini-day--out .mini-day__num{color:#cbd5e1}
        .mini-day--sel{outline:2px solid #dbeafe}
        .mini-dots{position:absolute;left:6px;bottom:6px;display:flex;gap:3px}
        .mini-labels{position:absolute;left:6px;right:6px;bottom:6px;display:flex;flex-direction:column;gap:1px}
        .mini-label{display:flex;align-items:center;gap:4px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#475569}
        .mini-label.done{color:#9aa5b1;text-decoration:line-through}
        .dot{width:5px;height:5px;border-radius:50%}
      </style><div class="wrap"></div>`);
    win.document.querySelector('.wrap').appendChild(bodyBuilder(true, win));
  };

  w.append(head,body); $.host.appendChild(w); return w;
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

  function build(isPopup, targetWin){
    const selfId=Math.random().toString(36).slice(2);
    const bc=('BroadcastChannel' in targetWin)? new targetWin.BroadcastChannel(key): null;
    const send=(msg)=>{ if(bc) bc.postMessage({src:selfId,...msg}); localStorage.setItem(key,JSON.stringify({src:selfId,...msg,ts:Date.now()})); };
    const saveState=(snap)=> localStorage.setItem(stateKey, JSON.stringify(snap));

    const wrap=el('div');
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

    const inputs=el('div','timer__inputs');
    const ih=document.createElement('input'); ih.type='number'; ih.min=0; ih.placeholder='시';
    const im=document.createElement('input'); im.type='number'; im.min=0; im.placeholder='분';
    const is=document.createElement('input'); is.type='number'; is.min=0; is.placeholder='초';
    inputs.append(ih,im,is);

    const row=el('div'); const bStart=el('button','btn','시작'), bPause=el('button','btn','일시정지'), bReset=el('button','btn','리셋'); row.append(bStart,bPause,bReset);

    let totalMs=0,endPerf=0,raf=null,paused=false,remainMs=0;
    const fmt=(ms)=>{const s=Math.max(0,Math.ceil(ms/1000));const hh=String(Math.floor(s/3600)).padStart(2,'0');const mm=String(Math.floor((s%3600)/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');return `${hh}:${mm}:${ss}`;}
    const draw=(left)=>{ const p=totalMs>0?Math.min(1,Math.max(0,1-left/totalMs)):0; fg.setAttribute('stroke-dashoffset',String(C*(1-p))); disp.textContent=fmt(left); }
    const tick=()=>{ const left=Math.max(0,endPerf-performance.now()); draw(left); if(left<=0){ cancelAnimationFrame(raf); raf=null; alert('타이머 종료'); send({type:'reset'}); saveState({status:'idle'}); return; } raf=requestAnimationFrame(tick); }

    function apply(msg,remote=false){
      if(msg.type==='start'){
        totalMs=msg.totalMs; const dur=Math.max(0,msg.endEpoch-Date.now()); endPerf=performance.now()+dur; paused=false; remainMs=0;
        eta.textContent=`종료 ${fmtAmPm(new Date(msg.endEpoch))}`; bPause.textContent='일시정지';
        if(raf) cancelAnimationFrame(raf); draw(dur); raf=requestAnimationFrame(tick);
        if(!remote) send({type:'start',totalMs,endEpoch:msg.endEpoch});
        saveState({status:'running',totalMs,endEpoch:msg.endEpoch});
      }else if(msg.type==='pause'){
        if(raf){ cancelAnimationFrame(raf); raf=null; } paused=true; remainMs=msg.remainMs; eta.textContent='—'; bPause.textContent='재개'; draw(remainMs);
        if(!remote) send({type:'pause',remainMs});
        saveState({status:'paused',totalMs,remainMs});
      }else if(msg.type==='resume'){
        paused=false; endPerf=performance.now()+msg.remainMs; eta.textContent=`종료 ${fmtAmPm(new Date(Date.now()+msg.remainMs))}`; bPause.textContent='일시정지';
        if(raf) cancelAnimationFrame(raf); raf=requestAnimationFrame(tick);
        if(!remote) send({type:'resume',remainMs:msg.remainMs});
        saveState({status:'running',totalMs,endEpoch:Date.now()+msg.remainMs});
      }else if(msg.type==='reset'){
        if(raf) cancelAnimationFrame(raf); raf=null; paused=false; totalMs=0; endPerf=0; remainMs=0;
        fg.setAttribute('stroke-dashoffset',String(C)); disp.textContent='00:00:00'; eta.textContent='—'; bPause.textContent='일시정지';
        if(!remote) send({type:'reset'});
        saveState({status:'idle'});
      }
    }

    bStart.onclick=()=>{ const hh=+ih.value||0, mm=+im.value||0, ss=+is.value||0; totalMs=((hh*3600)+(mm*60)+ss)*1000; if(totalMs<=0) return;
      const duration=remainMs>0?remainMs:totalMs; apply({type:'start',totalMs,endEpoch:Date.now()+duration},false); };
    bPause.onclick=()=>{ if(raf){const left=Math.max(0,endPerf-performance.now()); apply({type:'pause',remainMs:left},false);} else if(paused&&remainMs>0){apply({type:'resume',remainMs},false);} };
    bReset.onclick=()=> apply({type:'reset'},false);

    if(bc) bc.onmessage=(e)=>{ if(e.data?.src===selfId) return; apply(e.data,true); };
    targetWin.addEventListener('storage',(e)=>{ if(e.key!==key||!e.newValue) return; const msg=JSON.parse(e.newValue); if(msg.src===selfId) return; apply(msg,true); });

    // 복원
    try{
      const snap=JSON.parse(localStorage.getItem(stateKey)||'null');
      if(snap){
        if(snap.status==='running'&&snap.endEpoch){ apply({type:'start',totalMs:snap.totalMs||0,endEpoch:snap.endEpoch},true); }
        else if(snap.status==='paused'&&typeof snap.remainMs==='number'){ totalMs=snap.totalMs||0; apply({type:'pause',remainMs:snap.remainMs},true); }
      }
    }catch{}

    wrap.append(ring,eta,inputs,row);
    return wrap;
  }
  return makeWidget('타이머', build, 'widget--timer');
}

/* ── 동기화 미니 달력/메모/투두 위젯 ── */
function widgetCalendar(){
  function build(isPopup, win){
    const doc=win.document;
    const W=doc.createElement('div');
    const head=doc.createElement('div'); head.className='mini-cal__head';
    const prev=doc.createElement('button'); prev.className='btn'; prev.textContent='◀';
    const title=doc.createElement('span'); const next=doc.createElement('button'); next.className='btn'; next.textContent='▶';
    const today=doc.createElement('button'); today.className='btn'; today.textContent='오늘';
    head.append(prev,title,next,today);
    const days=doc.createElement('div'); days.className='mini-cal__days';
    const grid=doc.createElement('div'); grid.className='mini-cal__grid';
    W.append(head,days,grid);

    ['일','월','화','수','목','금','토'].forEach(k=>{const s=doc.createElement('span'); s.textContent=k; days.appendChild(s);});

    let view=new Date(localStorage.getItem('memo2.selected')||fmtLocalDate(new Date())); view.setDate(1);
    function r(){
      title.textContent=ymLabel(view.getFullYear(), view.getMonth());
      grid.innerHTML='';
      const y=view.getFullYear(), m=view.getMonth();
      const first=new Date(y,m,1), start=first.getDay(), total=dim(y,m);
      const prevTotal=new Date(y,m,0).getDate(), cells=42;
      for(let i=0;i<cells;i++){
        const cell=doc.createElement('div'); cell.className='mini-day';
        let n,d,out=false;
        if(i<start){n=prevTotal-start+1+i; d=new Date(y,m-1,n); out=true;}
        else if(i>=start+total){n=i-(start+total)+1; d=new Date(y,m+1,n); out=true;}
        else{n=i-start+1; d=new Date(y,m,n);}
        const num=doc.createElement('div'); num.className='mini-day__num'; num.textContent=n;
        if(out) cell.classList.add('mini-day--out');
        if(fmtLocalDate(d)===localStorage.getItem('memo2.selected')) cell.classList.add('mini-day--sel');

        const dstr=fmtLocalDate(d);
        const todos=get(kTodo(dstr));
        if(todos.length){
          // 텍스트 2줄까지 표시
          const labels=doc.createElement('div'); labels.className='mini-labels';
          todos.slice(0,2).forEach(t=>{
            const row=doc.createElement('div'); row.className='mini-label'; if(t.done) row.classList.add('done');
            const chk=doc.createElement('input'); chk.type='checkbox'; chk.checked=!!t.done;
            chk.className='mini-checkbox';
            chk.onclick=(e)=>{
              e.stopPropagation();
              t.done=!t.done;
              set(kTodo(dstr),todos);
              postApp({type:'refresh'});
              r();
            };
            const tx=doc.createElement('span'); tx.textContent=t.text;
            if(t.done) {
              tx.style.color='#9aa5b1';
              tx.style.backgroundColor='transparent';
            } else {
              tx.style.color='#000';
              if(t.color==='rainbow'){
                tx.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
                tx.style.color='#fff';
              } else {
                tx.style.backgroundColor=t.color||'transparent';
              }
            }
            row.append(chk,tx); labels.append(row);
          });
          cell.append(labels);
        }

        cell.append(num);
        cell.onclick=()=>{ localStorage.setItem('memo2.selected', fmtLocalDate(d)); postApp({type:'select',date:fmtLocalDate(d)}); };
        grid.append(cell);
      }
    }
    prev.onclick=()=>{ view=new Date(view.getFullYear(), view.getMonth()-1, 1); r();};
    next.onclick=()=>{ view=new Date(view.getFullYear(), view.getMonth()+1, 1); r();};
    today.onclick=()=>{ view=new Date(); view.setDate(1); localStorage.setItem('memo2.selected', fmtLocalDate(new Date())); postApp({type:'select',date:fmtLocalDate(new Date())}); r();};
    win.addEventListener('storage',(e)=>{ if(e.key==='memo2.selected'||e.key?.startsWith('memo2.todos.')) r(); });
    if('BroadcastChannel' in win){ const bc=new win.BroadcastChannel(APP_CH); bc.onmessage=(m)=>{ if(m.data?.type==='select'||m.data?.type==='refresh') r(); }; }
    r();
    return W;
  }
  return makeWidget('달력', build, 'widget--calendar');
}
function widgetMemo(){
  function build(isPopup, win){
    const doc=win.document, W=doc.createElement('div');
    const top=doc.createElement('div'); top.style.display='grid'; top.style.gridTemplateColumns='1fr auto'; top.style.gap='8px';
    const ta=doc.createElement('textarea'); ta.rows=4; ta.placeholder='메모 입력 후 [저장]';
    const add=doc.createElement('button'); add.className='btn'; add.textContent='저장';
    top.append(ta,add);
    const ul=doc.createElement('ul'); ul.style.listStyle='none'; ul.style.padding='8px 0 0'; ul.style.margin='0'; ul.style.display='flex'; ul.style.flexDirection='column'; ul.style.gap='8px';
    W.append(top,ul);

    const getSel=()=> win.localStorage.getItem('memo2.selected')||fmtLocalDate(new Date());
    const load=()=> JSON.parse(win.localStorage.getItem(kMemo(getSel()))||'[]');
    const save=(arr)=>{ win.localStorage.setItem(kMemo(getSel()), JSON.stringify(arr)); if('BroadcastChannel' in win){new win.BroadcastChannel(APP_CH).postMessage({type:'refresh'})} };

    function render(){
      ul.innerHTML='';
      load().forEach((it,i)=>{
        const li=doc.createElement('li'); li.style.display='grid'; li.style.gridTemplateColumns='1fr auto auto'; li.style.gap='6px';
        const tx=doc.createElement('span'); tx.textContent=it.text; if(it.color) tx.style.color=it.color;
        const col=doc.createElement('button'); col.className='color-btn'; col.textContent='🎨';
        const del=doc.createElement('button'); del.className='del-btn'; del.textContent='🗑';
        col.onclick=()=> showPalette(col,(c)=>{ const a=load(); a[i].color=c; save(a); render(); });
        del.onclick=()=>{ const a=load(); a.splice(i,1); save(a); render(); };
        tx.ondblclick=()=>{ const ta2=doc.createElement('textarea'); ta2.value=it.text; const ok=doc.createElement('button'); ok.className='btn'; ok.textContent='저장';
          const box=doc.createElement('div'); box.style.display='grid'; box.style.gridTemplateColumns='1fr auto'; box.style.gap='6px';
          ok.onclick=()=>{ const a=load(); a[i].text=ta2.value.trim()||a[i].text; save(a); render(); };
          box.append(ta2,ok); li.replaceChildren(box,col,del);
        };
        li.append(tx,col,del); ul.append(li);
      });
    }
    add.onclick=()=>{ const v=ta.value.trim(); if(!v) return; const a=load(); a.push({text:v}); save(a); ta.value=''; render(); };
    win.addEventListener('storage',(e)=>{ if(e.key==='memo2.selected'||e.key?.startsWith('memo2.memos.')) render(); });
    if('BroadcastChannel' in win){ const bc=new win.BroadcastChannel(APP_CH); bc.onmessage=(m)=>{ if(m.data?.type) render(); }; }
    render(); return W;
  }
  return makeWidget('메모', build, 'widget--memo');
}
function widgetTodo(){
  function build(isPopup, win){
    const doc=win.document, W=doc.createElement('div');
    const ip=doc.createElement('input'); ip.placeholder='할 일 입력 후 Enter'; ip.style.width='100%'; ip.style.padding='10px'; ip.style.border='1px solid #e9ecf2'; ip.style.borderRadius='10px';
    const ul=doc.createElement('ul'); ul.style.listStyle='none'; ul.style.padding='8px 0 0'; ul.style.margin='0'; ul.style.display='flex'; ul.style.flexDirection='column'; ul.style.gap='8px';
    W.append(ip,ul);

    const getSel=()=> win.localStorage.getItem('memo2.selected')||fmtLocalDate(new Date());
    const load=()=> JSON.parse(win.localStorage.getItem(kTodo(getSel()))||'[]');
    const save=(arr)=>{ win.localStorage.setItem(kTodo(getSel()), JSON.stringify(arr)); if('BroadcastChannel' in win){new win.BroadcastChannel(APP_CH).postMessage({type:'refresh'})} };

    function render(){
      ul.innerHTML='';
      load().forEach((it,i)=>{
        const li=doc.createElement('li'); li.style.display='grid'; li.style.gridTemplateColumns='20px 1fr auto auto'; li.style.alignItems='center'; li.style.gap='8px';
        const cb=doc.createElement('input'); cb.type='checkbox'; cb.checked=!!it.done;
        const tx=doc.createElement('span'); tx.textContent=it.text;
        if(it.done){
          tx.style.color='#9aa5b1';
          tx.style.textDecoration='line-through';
          tx.style.backgroundColor='transparent';
          tx.style.background='transparent';
        } else {
          tx.style.color=it.color==='rainbow'?'#fff':'#000';
          if(it.color==='rainbow'){
            tx.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
            tx.style.backgroundColor='transparent';
          } else {
            tx.style.backgroundColor=it.color||'transparent';
            tx.style.background='';
          }
        }
        const col=doc.createElement('button'); col.className='color-btn'; col.textContent='🎨';
        const del=doc.createElement('button'); del.className='del-btn'; del.textContent='🗑';
        cb.onchange=()=>{ const a=load(); a[i].done=cb.checked; save(a); render(); };
        tx.onclick=()=>{ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change')); };
        col.onclick=()=> showPalette(col,(c)=>{ const a=load(); a[i].color=c; save(a); render(); });
        del.onclick=()=>{ const a=load(); a.splice(i,1); save(a); render(); };
        li.append(cb,tx,col,del); ul.append(li);
      });
    }
    ip.addEventListener('keydown',e=>{ if(e.key==='Enter'&&ip.value.trim()){ const a=load(); a.push({text:ip.value.trim(),done:false,color:DEFAULT_COLOR}); save(a); ip.value=''; render(); }});
    win.addEventListener('storage',(e)=>{ if(e.key==='memo2.selected'||e.key?.startsWith('memo2.todos.')) render(); });
    if('BroadcastChannel' in win){ const bc=new win.BroadcastChannel(APP_CH); bc.onmessage=(m)=>{ if(m.data?.type) render(); }; }
    render(); return W;
  }
  return makeWidget('ToDo', build, 'widget--todo');
}

/* ── 사용법 표시 ── */
const usageTexts = {
  calendar: `
    <p><strong>달력 위젯</strong>은 별도의 팝업 창에서 월간 달력을 보여줍니다.</p>
    <ul>
      <li>날짜를 클릭하면 우측 패널에서 일정과 메모를 추가할 수 있습니다</li>
      <li>각 날짜에 최대 5개까지 일정을 표시할 수 있습니다</li>
      <li>체크박스를 클릭하여 일정 완료/미완료 표시</li>
      <li>◀ ▶ 버튼으로 이전/다음 달로 이동</li>
      <li>"오늘" 버튼으로 현재 날짜로 바로 이동</li>
      <li>달력 오른쪽 하단 모서리를 드래그하여 크기 조절 가능</li>
      <li>위젯 창 모서리를 드래그하여 크기 조절 가능</li>
      <li>위젯 상단을 드래그하여 원하는 위치로 이동</li>
    </ul>
  `,
  memo: `
    <p><strong>메모 위젯</strong>을 사용하면 특정 날짜에 메모를 저장할 수 있습니다.</p>
    <ul>
      <li>날짜를 선택하고 메모를 입력한 후 "저장" 버튼 클릭</li>
      <li>여러 줄 입력 가능 (Enter로 줄바꿈)</li>
      <li>저장된 메모는 날짜별로 관리됩니다</li>
      <li>메모 우측의 🗑 버튼으로 삭제 가능</li>
      <li>모든 메모는 브라우저에 자동 저장됩니다</li>
    </ul>
  `,
  todo: `
    <p><strong>ToDo 위젯</strong>으로 할 일 목록을 관리하세요.</p>
    <ul>
      <li>할 일을 입력하고 Enter 또는 "추가" 버튼 클릭</li>
      <li>체크박스를 클릭하여 완료 표시</li>
      <li>🎨 버튼으로 배경 색상 지정 가능</li>
      <li>🗑 버튼으로 항목 삭제</li>
      <li><strong>항목을 더블클릭하여 내용 수정</strong> 가능</li>
      <li><strong>항목을 드래그하여 순서 변경</strong> 가능</li>
      <li>완료된 항목은 회색으로 표시되며 취소선이 그어집니다</li>
      <li>날짜별로 할 일을 관리할 수 있습니다</li>
    </ul>
  `,
  timer: `
    <p><strong>타이머 위젯</strong>으로 시간을 측정하세요.</p>
    <ul>
      <li>시간, 분, 초를 입력하여 카운트다운 타이머 설정</li>
      <li>"시작" 버튼으로 타이머 시작</li>
      <li>"일시정지"로 잠시 멈추고 "재개"로 다시 시작</li>
      <li>"리셋" 버튼으로 초기화</li>
      <li>타이머 종료 시 알림 표시</li>
    </ul>
  `,
  alarm: `
    <p><strong>알람 위젯</strong> 기능은 개발 예정입니다.</p>
    <p>특정 시간에 알림을 받을 수 있는 기능이 추가될 예정입니다.</p>
  `,
  stopwatch: `
    <p><strong>스탑워치 위젯</strong> 기능은 개발 예정입니다.</p>
    <p>정확한 시간 측정을 위한 스탑워치 기능이 추가될 예정입니다.</p>
  `
};

function showUsage(type) {
  const section = document.getElementById('usageSection');
  const textDiv = document.getElementById('usageText');
  if (section && textDiv && usageTexts[type]) {
    textDiv.innerHTML = usageTexts[type];
    section.style.display = 'block';
  }
}

function hideUsage() {
  const section = document.getElementById('usageSection');
  if (section) {
    section.style.display = 'none';
  }
}

/* ── 메뉴 ── */
document.querySelectorAll('.menu-btn').forEach(b=>{
  b.onclick=()=>{
    const t=b.dataset.widget;
    showUsage(t);
    if(t==='calendar') widgetCalendar();
    if(t==='memo') widgetMemo();
    if(t==='todo') widgetTodo();
    if(t==='timer') widgetTimer();
    if(t==='alarm') makeWidget('알람',()=>el('div',null,'알람 설정'));
    if(t==='stopwatch') makeWidget('스탑워치',()=>el('div',null,'스탑워치'));
  };
});

/* ── 네비 ── */
$.todayBtn.onclick=()=>{const t=new Date(); ST.viewYear=t.getFullYear(); ST.viewMonth=t.getMonth(); ST.selected=t; setGlobalSelected(t); renderCalendar(); renderRight();};
$.prev.onclick=()=>{const d=new Date(ST.viewYear,ST.viewMonth-1,1); ST.viewYear=d.getFullYear(); ST.viewMonth=d.getMonth(); renderCalendar();};
$.next.onclick=()=>{const d=new Date(ST.viewYear,ST.viewMonth+1,1); ST.viewYear=d.getFullYear(); ST.viewMonth=d.getMonth(); renderCalendar();};
$.ym.onclick=()=>{ showDatePicker(); };

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

/* ── 초기 렌더 + 동기화 리스너 ── */
renderCalendar(); renderRight(); renderReminders();
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
