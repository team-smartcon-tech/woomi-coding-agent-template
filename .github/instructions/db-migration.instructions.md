---
description: DB 스키마 변경 워크플로우
applyTo: "**/migrations/**,**/.agents/data/**,**/docs/DB-ERD/**"
---

# DB Migration Instructions

이 instruction은 shim이다. 실제 기준은 아래 문서를 따른다.

1. `docs/DB-ERD/README.md` — 작업 전 ERD 대조(필수). 체크리스트는 「DB 를 바꾸기 전에 ERD 로 검토한다」
2. `.agents/data/MIGRATION.md`
3. `.agents/data/DB_SCHEMA.md`
4. `.agents/data/API_CONTRACT.md`
5. 관련 repository/service/API 구현

핵심 금지:

- 문서 없이 schema/RLS/index 변경 금지
- Supabase migration 파일명 임의 생성 금지
- 사용자 승인 없는 production DB 변경 금지
- 근거 없는 index 자동 생성 금지

작업 후 ERD 검토 결과(문제 없음도 포함)와 migration, DB schema, API 계약, ERD 갱신 여부를 보고한다.
