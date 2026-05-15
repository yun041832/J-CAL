# Jay 캘린더 패치 노트 v0.8.2 (2025-12-07)

## 📋 변경사항 요약

### ✅ 완료된 수정사항

1. **달력 체크박스 제거**
   - 달력 내 일정 항목에서 체크박스 완전 제거
   - 일정은 표시만 되고 체크 불가
   - 파일: `memo2_app.js` (line 100-127)

2. **일정등록 섹션 체크박스 제거**
   - 일정등록(구 선택 날짜) 섹션에서 체크박스 제거
   - 일정 추가/수정/삭제만 가능
   - 파일: `memo2_app.js` (eventItemEl 함수)

3. **달력 기본 4줄 표시**
   - 초기 표시 줄 수: 6줄 → 4줄
   - `linesHint: 4`로 변경
   - 파일: `memo2_app.js` (line 11)

4. **동적 줄 수 계산**
   - 달력 세로 크기 조절 시 더 많은 일정 표시
   - `calcCellHeight()`, `calcMaxLines()` 함수 추가
   - 칸 높이 자동 계산 및 항목 수 조정
   - 파일: `memo2_app.js` (line 65-75)

5. **색상없음 옵션 추가**
   - 컬러 팔레트 최상단에 "없음" 버튼 추가
   - 배경색을 제거하고 투명하게 설정
   - 파일: `memo2_app.js` (showPalette 함수)

6. **REMINDER 섹션 추가**
   - 체크박스 있는 독립적인 리마인더 기능
   - 이모지, 색상 선택 가능
   - LocalStorage 저장 (`memo2.reminders`)
   - 파일: `index.html`, `memo2_app.js`, `memo2_style_patch.css`

7. **사용법 섹션 표시**
   - 기본적으로 표시되도록 변경 (`display:none` 제거)
   - 파일: `index.html` (line 50)

8. **버전 캐시 처리**
   - CSS/JS 파일 버전 업데이트: v=20251205 → v=20251207
   - 브라우저 캐시 무효화

## 🔧 기술적 변경사항

### JavaScript (memo2_app.js)
```javascript
// 초기값 변경
linesHint: 6 → 4

// 새 함수 추가
- calcCellHeight(): 달력 칸 높이 동적 계산
- calcMaxLines(): 표시 가능한 최대 줄 수 계산
- renderReminders(): REMINDER 렌더링
- reminderItemEl(): REMINDER 항목 생성

// 체크박스 제거
- 달력: row.append(chk,content) → row.append(content)
- 일정: 체크박스 관련 코드 완전 제거
```

### HTML (index.html)
```html
<!-- 버전 업데이트 -->
?v=20251205 → ?v=20251207

<!-- 사용법 섹션 -->
style="display:none;" → 제거

<!-- REMINDER 섹션 추가 -->
<div class="card">
  <div class="card__header">🔔 REMINDER</div>
  ...
</div>
```

### CSS (memo2_style_patch.css)
```css
/* 체크박스 스타일 제거 */
.label-checkbox { 삭제 }

/* REMINDER 스타일 추가 */
.reminder__input-group { ... }
.reminder__list { ... }
.reminder-item { ... }
```

## 🐛 알려진 이슈 및 해결방법

### 이슈: 변경사항이 반영되지 않음
**원인:** 브라우저 캐시
**해결방법:**
1. `Ctrl + Shift + R` (Windows) 강제 새로고침
2. `Ctrl + F5` 하드 리로드
3. 개발자 도구(F12) → 네트워크 탭 → "캐시 사용 안 함" 체크
4. `apply_patch.html` 파일 실행하여 안내 확인

## 📁 수정된 파일 목록

- ✏️ `index.html` - HTML 구조, 버전 업데이트
- ✏️ `memo2_app.js` - 핵심 로직 변경
- ✏️ `memo2_style_patch.css` - 스타일 업데이트
- ➕ `apply_patch.html` - 패치 안내 페이지 (신규)
- ➕ `PATCH_NOTES.md` - 이 문서 (신규)

## 🔄 향후 업데이트 시 주의사항

1. **버전 번호 관리**
   - HTML 파일에서 CSS/JS 버전 번호 변경 필수
   - 형식: `?v=YYYYMMDD` (예: `?v=20251207`)

2. **캐시 무효화**
   - 매 배포 시 버전 번호 업데이트
   - 사용자에게 강제 새로고침 안내

3. **패치 파일 활용**
   - 큰 변경 시 `apply_patch.html` 업데이트
   - 변경사항 명확히 문서화

## 📞 문제 발생 시

1. 브라우저 콘솔 확인 (F12)
2. `apply_patch.html` 실행하여 캐시 정리
3. 여전히 문제 시 브라우저 데이터 완전 삭제
   - Chrome: 설정 → 개인정보 및 보안 → 인터넷 사용 기록 삭제
   - 시간 범위: 전체 기간
   - 캐시된 이미지 및 파일 체크

## ✨ 다음 업데이트 예정 기능

- [ ] 다크 모드 지원
- [ ] 일정 카테고리 분류
- [ ] 월간/주간 뷰 토글
- [ ] 일정 검색 기능
- [ ] 반복 일정 고급 설정
- [ ] 데이터 내보내기/가져오기
