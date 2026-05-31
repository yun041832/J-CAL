/* js/routine.js — Routine 페이지 (memo2_app.js에서 이동, 1단계: 원본 유지) */
(function () {
  'use strict';

  const JCal = window.JCal || {};
  const el = JCal.el || function (t, c, txt) {
    const x = document.createElement(t);
    if (c) x.className = c;
    if (txt != null) x.textContent = txt;
    return x;
  };
  const fmtLocalDate = JCal.fmtLocalDate || function (d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };
  const WEEKDAY_LABELS_EN = JCal.WEEKDAY_LABELS_EN || ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS_EN = JCal.MONTHS_EN || ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function formatYearMonth(y, m) { return MONTHS_EN[m] + ' ' + y; }

  const ROUTINES_KEY = 'memo2.routines';

  function readRoutinesLocal() {
    try {
      const saved = localStorage.getItem(ROUTINES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  function setRoutinesLocal(routines) {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  }

  function getDefaultSampleRoutines() {
    return [
      { id: 1, text: '루틴 1', checked: false, startDate: '2026-01-01', endDate: '2026-12-31', repeatDays: [1, 3, 5], color: '#10b981' },
      { id: 2, text: '루틴 2', checked: false, startDate: '2026-01-01', endDate: '2026-12-31', repeatDays: [0, 2, 4, 6], color: '#5C8DFF' },
      { id: 3, text: '루틴 3', checked: false, startDate: '2026-01-01', endDate: '2026-12-31', repeatDays: [1, 2, 3, 4, 5], color: '#f59e0b' },
    ];
  }

  function getRoutines() {
    let routines = readRoutinesLocal();
    if (!routines.length) {
      routines = getDefaultSampleRoutines();
      setRoutinesLocal(routines);
    }
    return routines.slice();
  }

  function setRoutines(routines) {
    const arr = Array.isArray(routines) ? routines.slice() : [];
    setRoutinesLocal(arr);
  }

  function hideInsightPages() {
    document.getElementById('insightPage')?.classList.add('hidden');
    document.getElementById('insightWritePage')?.classList.add('hidden');
  }

  function showRoutinePage() {
    localStorage.setItem('memo2.lastPage', 'routine');
    document.getElementById('homeIntroSection')?.classList.add('hidden');
    document.getElementById('calendarPage')?.classList.add('hidden');
    document.getElementById('memoPage')?.classList.add('hidden');
    document.getElementById('memoWritePage')?.classList.add('hidden');
    document.getElementById('routinePage')?.classList.remove('hidden');
    document.getElementById('dailyPage')?.classList.add('hidden');
    document.getElementById('timerPage')?.classList.add('hidden');
    document.getElementById('logsPage')?.classList.add('hidden');
    hideInsightPages();
    document.querySelector('.right')?.classList.add('hidden');
    initRoutinePage();
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
        toggleReorderBtn.style.background='#5C8DFF';
        toggleReorderBtn.style.borderColor='#5C8DFF';
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
  yearMonth.textContent=formatYearMonth(today.getFullYear(), today.getMonth());
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
  const weekdays=WEEKDAY_LABELS_EN;
  
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
  
  // 루틴 불러오기
  let routines = getRoutines();
  
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
        item.style.borderTop='3px solid #5C8DFF';
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
        setRoutines(routines);
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
      setRoutines(routines);
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
      const dayNames=WEEKDAY_LABELS_EN;
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
      setRoutines(routines);
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
      const dayNames=WEEKDAY_LABELS_EN;
      const selectedNames=repeatDays.sort((a,b)=>a-b).map(d=>dayNames[d]);
      repeatBtn.textContent=`${selectedNames.join(', ')} 중 ${repeatDays.length}일`;
      repeatBtn.style.background='#e0ecff';
      repeatBtn.style.color='#4A7AEE';
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
  colorBtn.textContent='🎨 Choose color';
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
  
  const cancelBtn=el('button','btn','Cancel');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','Save');
  saveBtn.onclick=()=>{
    const text=nameInput.value.trim();
    if(!text){
      alert('루틴 이름을 입력하세요.');
      return;
    }
    
    let routines = getRoutines();
    
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
    
    setRoutines(routines);
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
  
  const dayNames=WEEKDAY_LABELS_EN;
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
  
  const cancelBtn=el('button','btn','Cancel');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','Confirm');
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
      btn.style.borderColor='#5C8DFF';
      btn.style.background='#EEF2FF';
    }
    
    btn.onclick=()=>{
      selectedEmoji=emoji;
      // 모든 버튼 초기화
      emojiGrid.querySelectorAll('button').forEach(b=>{
        b.style.borderColor='transparent';
        b.style.background='var(--card)';
      });
      // 선택된 버튼 강조
      btn.style.borderColor='#5C8DFF';
      btn.style.background='#EEF2FF';
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
  
  const cancelBtn=el('button','btn','Cancel');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','Confirm');
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
  
  const title=el('h3','modal-title','Choose color');
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
    '#5C8DFF','#0ea5e9','#06b6d4','#14b8a6','#64748b','#475569'
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
      btn.style.boxShadow='0 0 0 2px #5C8DFF';
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
      btn.style.boxShadow='0 0 0 2px #5C8DFF';
    };
    
    colorGrid.appendChild(btn);
  });
  
  const footer=el('div');
  footer.style.display='flex';
  footer.style.gap='8px';
  footer.style.justifyContent='flex-end';
  
  const cancelBtn=el('button','btn','Cancel');
  cancelBtn.onclick=()=> modal.remove();
  
  const saveBtn=el('button','btn-confirm','Confirm');
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

  const routineApi = {
    showRoutinePage,
    initRoutinePage,
    renderRoutineWeekCalendar,
    renderRoutineList,
    addNewRoutine,
    showRoutineModal,
    showRepeatDayModal,
    showEmojiModal,
    showColorPickerModal,
  };

  Object.assign(window.JCal || (window.JCal = {}), routineApi);

  window.showRoutinePage = showRoutinePage;
  window.initRoutinePage = initRoutinePage;
  window.renderRoutineWeekCalendar = renderRoutineWeekCalendar;
  window.renderRoutineList = renderRoutineList;
  window.addNewRoutine = addNewRoutine;
  window.showRoutineModal = showRoutineModal;
  window.showRepeatDayModal = showRepeatDayModal;
  window.showEmojiModal = showEmojiModal;
  window.showColorPickerModal = showColorPickerModal;
})();
