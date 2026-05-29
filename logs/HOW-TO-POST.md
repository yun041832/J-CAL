# 새 글 올리는 법

1. `logs/posts/` 에 md 파일 생성  
   파일명: `YYYY-MM-DD-제목-영문.md`

2. frontmatter 작성:

```yaml
---
id: (이전 id + 1)
title: "글 제목"
date: "YYYY-MM-DD"  ← 과거 날짜 자유 설정 가능
category: "dev" 또는 "think" 또는 "exp"
description: "한 줄 요약"
---
```

3. `logs/index.json` 에 항목 추가 (날짜 내림차순 유지)

4. `git add . && git commit -m "logs: 글제목" && git push`
