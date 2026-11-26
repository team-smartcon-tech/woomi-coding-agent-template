---
paths:
  - "supabase/**/*.sql"
  - "**/migrations/**/*.sql"
---

# DB 마이그레이션을 고칠 때

이 파일은 포인터다. 기준은 [`.agents/data/DB_SCHEMA.md`](../../.agents/data/DB_SCHEMA.md) 3.5·3.7 과 [`.agents/data/MIGRATION.md`](../../.agents/data/MIGRATION.md) 다. 아래는 실제 DB 에서 가장 많이 반복된 것만 추린 것이다([`BAD_EXAMPLES.md`](../../.agents/examples/BAD_EXAMPLES.md) B-01~B-04).

- 새 `public` 테이블은 **같은 파일에서** RLS 를 켜고 primary key 를 둔다.
- 정책 안의 `auth.uid()` 는 `(select auth.uid())` 로 감싼다.
- 쓰기 정책 조건을 `true` 로 두지 않는다. 서버만 쓰는 테이블이면 정책을 만들지 않는다.
- `security definer` 함수는 `public` 에 두지 않는다. 함수에는 `set search_path = ''` 를 붙인다.
- 시간 컬럼은 `timestamptz`.
- `drop table`·`drop column`·`truncate` 는 사용자 승인을 받고 `-- destructive-approved:` 주석을 남긴다.
- 원격 DB 에 MCP 나 대시보드로 직접 적용하지 않는다. 파일을 만들고 CLI 로 적용한다.

고친 뒤 `node scripts/db-lint.mjs <파일>` 을 돌린다. PR 에서는 `db-checks` 가 같은 검사를 돈다.
