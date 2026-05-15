# Jay Calendar Patch Apply Script
# 2025-12-07 업데이트 적용 스크립트

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Jay Calendar Patch v0.8.2" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$currentPath = $PSScriptRoot
Write-Host "현재 경로: $currentPath" -ForegroundColor Green
Write-Host ""

# 파일 존재 확인
$files = @("index.html", "memo2_app.js", "memo2_style_patch.css")
$allExist = $true

Write-Host "파일 확인 중..." -ForegroundColor Yellow
foreach ($file in $files) {
    $filePath = Join-Path $currentPath $file
    if (Test-Path $filePath) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (없음)" -ForegroundColor Red
        $allExist = $false
    }
}
Write-Host ""

if (-not $allExist) {
    Write-Host "일부 파일이 없습니다. 올바른 폴더에서 실행하세요." -ForegroundColor Red
    Read-Host "아무 키나 눌러 종료..."
    exit
}

# 백업 생성
Write-Host "백업 생성 중..." -ForegroundColor Yellow
$backupFolder = Join-Path $currentPath "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

foreach ($file in $files) {
    $source = Join-Path $currentPath $file
    $dest = Join-Path $backupFolder $file
    Copy-Item $source $dest
    Write-Host "  ✓ $file 백업 완료" -ForegroundColor Green
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  적용된 변경사항" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "1. 달력 체크박스 제거 (일정 표시만)" -ForegroundColor White
Write-Host "2. 일정등록 체크박스 제거" -ForegroundColor White
Write-Host "3. 달력 기본 4줄 표시" -ForegroundColor White
Write-Host "4. 세로 늘릴 때 더 많은 일정 표시" -ForegroundColor White
Write-Host "5. 색상없음 옵션 추가" -ForegroundColor White
Write-Host "6. REMINDER 섹션 추가" -ForegroundColor White
Write-Host "7. 사용법 섹션 표시" -ForegroundColor White
Write-Host "8. 캐시 버전 업데이트 (v=20251207)" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  다음 단계" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "1. 웹 서버에 파일 업로드 (FileZilla)" -ForegroundColor White
Write-Host "2. 브라우저에서 Ctrl+Shift+R로 강제 새로고침" -ForegroundColor White
Write-Host "3. 변경사항 확인" -ForegroundColor White
Write-Host ""

# 브라우저 열기 옵션
Write-Host "apply_patch.html을 브라우저로 여시겠습니까? (Y/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    $patchFile = Join-Path $currentPath "apply_patch.html"
    Start-Process $patchFile
    Write-Host "apply_patch.html을 열었습니다." -ForegroundColor Green
}

Write-Host ""
Write-Host "패치 적용 완료! 백업 위치: $backupFolder" -ForegroundColor Green
Write-Host ""
Read-Host "아무 키나 눌러 종료..."
