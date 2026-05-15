# 자동 배포 스크립트
Write-Host "변경사항을 GitHub에 배포합니다..." -ForegroundColor Green

git add .
$message = Read-Host "커밋 메시지를 입력하세요 (Enter = 자동 메시지)"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "자동 배포 $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

git commit -m $message
git push

Write-Host "배포 완료! 1-2분 후 jaycalendar.com에서 확인하세요." -ForegroundColor Cyan
