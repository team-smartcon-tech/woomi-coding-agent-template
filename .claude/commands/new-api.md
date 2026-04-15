---
description: 새 API 엔드포인트 구현 워크플로우
---

# /new-api

`AGENTS.md` §5.2를 따라 다음 순서로 진행한다:

1. `.agents/ARCHITECTURE.md` — 어느 서비스/레이어에 속하는지 확인.
2. `.agents/data/API_CONTRACT.md` — 요청/응답 스펙 정의 또는 참조.
3. `.agents/data/DOMAIN_MODEL.md` — 엔티티 관계 확인.
4. `.agents/data/DB_SCHEMA.md` — DB 변경 필요 여부 판단. 필요 시 `db-migration` 스킬 호출.
5. `.agents/code/CODE_STYLE.md` + `ERROR_HANDLING.md`로 구현.
