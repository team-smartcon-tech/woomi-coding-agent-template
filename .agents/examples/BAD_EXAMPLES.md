# BAD_EXAMPLES.md

이 문서는 프로젝트에서 피해야 할 실패 사례와 금지 패턴을 진행 중에 모으는 문서다.

프로젝트 시작 시 억지로 예시를 채우지 않는다. 실제 버그, 회귀, 보안 위험, 반복 실수가 확인되면 추가한다.

---

## 작성 시점

- 같은 실수가 반복될 때
- 보안, 권한, 데이터 손실, 배포 사고 위험이 발견될 때
- AI가 자주 잘못 생성하는 코드 패턴이 확인될 때
- 기존 구현 중 더 이상 따라 하면 안 되는 패턴이 생길 때

---

## 작성할 내용

```txt
Anti-pattern:
File or context:
Why it is bad:
Risk:
Use this instead:
Related rules:
Notes:
```

---

## Examples

아래는 2026-11 에 이 템플릿에서 분기했거나 같은 스택으로 만든 저장소 16곳(커밋 약 8,000건)과 Supabase DB 12개를 조사해 **두 곳 이상에서 반복된 것**만 올린 것이다. 숫자는 그 조사 시점의 합계다. 조사 방법과 한계는 [`docs/ai/designs/2026-11-26-harness-gates.md`](../../docs/ai/designs/2026-11-26-harness-gates.md).

각 항목 끝의 **검사**는 이 실수를 기계가 잡는 자리다. "없음"이면 리뷰와 이 문서가 유일한 방어선이다.

### B-01. 정책에서 `auth.uid()` 를 그대로 쓴다

```sql
-- 나쁨: 행마다 함수를 다시 부른다
using (created_by = auth.uid())
-- 좋음: 한 번 계산해 재사용한다
using (created_by = (select auth.uid()))
```

- 왜: 결과는 같아 테스트로는 안 보이고, 행이 늘면 목록 조회가 느려진다. 정책 728개 중 87개.
- 검사: `scripts/db-lint.mjs` `policy-bare-auth`

### B-02. `security definer` 함수를 `public` 에 두고 실행 권한을 그대로 둔다

- 왜: PostgreSQL 은 새 함수의 실행 권한을 모든 역할에 준다. `public` 스키마 함수는 API 로 노출되므로 로그인하지 않은 사용자가 RLS 를 우회하는 함수를 부를 수 있다. anon 이 실행 가능한 definer 함수 66개(8개 DB).
- 대신: definer 함수는 노출되지 않는 스키마(`private`)에 두고 `set search_path = ''` 를 붙인다. `public` 에 둬야 하면 `revoke execute … from public, anon` 을 같은 파일에 쓴다. 형태는 [`TRANSACTION.md`](../data/TRANSACTION.md) 의 RPC 템플릿.
- 검사: `db-lint` `definer-in-public` · `definer-search-path` · `definer-anon-execute`

### B-03. 쓰기 정책의 조건이 `true`

```sql
create policy "all" on public.reports for all to authenticated using (true) with check (true);
```

- 왜: RLS 가 켜져 있어 advisor 는 조용하지만, 로그인한 누구나 남의 행을 고치고 지운다. 39개(2개 DB — 한 곳은 개발용 사본에서 확인).
- 대신: 소유자·현장·역할 조건을 쓴다. 서버(Worker)만 쓰는 테이블이면 정책을 두지 않는다 — RLS 가 켜져 있고 정책이 없으면 service role 만 접근한다.
- 검사: `db-lint` `policy-always-true`

### B-04. 원격 DB 를 대시보드·MCP 로 직접 고친다

- 왜: 저장소의 `supabase/migrations/` 와 원격 이력이 갈라진다. 조사한 12개 중 2개는 마이그레이션 이력 테이블 자체가 없었고, 3개는 저장소 파일 수와 원격 적용 수가 크게 달랐다(예: 파일 129개 / 원격 7건 — 저장소와 DB 는 이름으로 짝지었다). 이 상태에서는 새 환경을 만들 수 없고 `db-checks` 의 재현 검사가 의미를 잃는다.
- 대신: 변경은 `supabase migration new` 로 파일을 만들어 CLI 로 적용한다. 급해서 직접 고쳤으면 같은 날 같은 SQL 을 마이그레이션 파일로 남긴다.
- 검사: `scripts/agent-guard.cjs` 가 MCP `apply_migration` 과 쓰기 `execute_sql` 을 차단하고 `supabase db push` 는 승인 프롬프트로 올린다. 대시보드에서 직접 고치는 것은 못 막는다 — `scripts/db-audit.sql` 로 주기적으로 본다.

### B-05. 화면 컴포넌트에서 테이블을 직접 읽고 쓴다

```tsx
// 나쁨: features/…/ui/report-list.tsx
const { data } = await supabase.from("reports").select("*")
```

- 왜: 권한 판단이 RLS 하나에만 걸리고(B-03 과 겹치면 무방비), 같은 쿼리가 화면마다 복사된다. 3개 저장소 107개 화면 파일.
- 대신: route → service → repository ([`API.md`](../code/API.md)). 화면은 API client 만 부른다.
- 검사: 없음(리뷰). `.claude/rules/ui.md` 가 화면 파일을 열 때 이 규칙을 띄운다.

### B-06. 목록이 1,000행에서 조용히 잘린다

- 왜: Supabase 는 한 번에 최대 1,000행만 돌려준다. 오류가 아니라 정상 응답이라 데이터가 그만큼 쌓일 때까지 아무도 모른다. "1,000행에서 잘려…" 수정 커밋이 서로 다른 4개 저장소에서 나왔고, 그중 하나는 잘린 목록을 기준으로 계정을 지울 수 있었다.
- 대신: 전체가 필요한 조회는 `.range()` 로 끝까지 읽거나 DB 에서 집계한다. 목록 화면은 처음부터 페이지 단위로 만든다. "전부 가져와서 화면에서 거른다"를 기본값으로 두지 않는다.
- 검사: 없음(리뷰)

### B-07. 날짜를 `toISOString().slice(0, 10)` 로 만든다

```ts
const today = new Date().toISOString().slice(0, 10) // 한국 시간 00:00~08:59 에는 어제 날짜
```

- 왜: `toISOString()` 은 UTC 다. 오전 9시 전에 쓴 작업일보·출역이 전날로 들어간다. 289곳, 날짜·시간대 수정 커밋 41건.
- 대신: 날짜 계산은 `shared/lib` 의 한 함수로 모으고 `Asia/Seoul` 을 명시한다. DB 컬럼은 `timestamptz` (한 DB 에서 `timestamp` 컬럼 35개).
- 검사: `db-lint` `timestamp-without-tz` (DB 쪽만). 코드 쪽은 없음.

### B-08. `alert()` / `confirm()` 으로 확인을 받는다

- 왜: 브라우저 자동화가 네이티브 대화상자를 보지 못해 [브라우저 검증](../../docs/브라우저-검증-절차.md)이 그 자리에서 멈추고, 삭제 확인 문구를 화면마다 다르게 쓰게 된다. 1,039곳.
- 대신: `shared/ui/confirm-panel.tsx` 와 [`UX_RULES.md`](../ui/UX_RULES.md) 의 확인·피드백 규칙.
- 검사: 없음(리뷰). `.claude/rules/ui.md`

### B-09. 환경변수를 곳곳에서 직접 읽고 기본값으로 받는다

```ts
const secret = process.env.SESSION_SECRET ?? "dev-secret" // 운영에서 변수를 빠뜨려도 뜬다
```

- 왜: 빠뜨린 변수가 배포 후 그 코드가 실행될 때에야 드러나거나, 알려진 기본값으로 조용히 돈다. 16곳 어디에서도 환경변수를 한 곳에서 검증하는 모듈을 찾지 못했고, 이 템플릿의 스캐폴드도 위 형태였다.
- 대신: `apps/web/app/shared/config/env.server.ts` 처럼 한 파일에서 Zod 로 읽고, 없으면 기동을 멈춘다.
- 검사: `scripts/env-check.mjs` (`env-drift` · `unsafe-default` · `public-secret` · `wrangler-var-secret`), ESLint `no-restricted-properties`

### B-10. 값이 든 `.env` 를 커밋하거나 에이전트가 읽게 둔다

- 왜: 커밋된 값은 지워도 이력에 남는다. 에이전트가 읽은 값은 대화·로그·커밋 메시지로 새어 나갈 수 있다. 한 저장소가 `.env.production` 등 3개를 추적하고 있었다(들어 있던 것은 공개용 anon key 였다).
- 대신: `.env.example`(Worker 는 `apps/web/.dev.vars.example`)에 이름만 둔다. 이미 올라간 secret 은 지우는 것으로 끝내지 않고 **폐기·재발급**한다([`DEPLOYMENT.md`](../DEPLOYMENT.md) 4장).
- 검사: `scripts/secret-scan.mjs` (pre-commit + CI), `agent-guard` 의 Read·`cat` 차단

### B-11. 안전장치를 끄고 그대로 둔다

- 왜: 16곳 중 5곳에 `.githooks/` 가 없었고, 2곳은 CI 워크플로 파일 9개가 `.disabled` 였다. 급할 때 끈 장치는 다시 켜지지 않는다.
- 대신: 검사가 틀렸으면 검사를 고친다. 끄려면 이유와 다시 켜는 조건을 `AGENTS.md` 11장(Project Override)에 적는다.
- 검사: `agent-guard --selftest` 가 훅 정의 파일에 가드 호출이 남아 있는지 본다. CI 를 끄는 것은 못 막는다.

### B-12. 템플릿의 표준 버전 번호를 제품 버전으로 이어 쓴다

- 왜: [`AGENTS.md`](../../AGENTS.md) 10장이 이미 금지하지만, 분기한 저장소 두 곳이 `2.67-draft`·`2.171` 까지 올려 쓰고 있었다. 템플릿이 같은 번호에 닿으면 구분할 수 없다.
- 대신: 머리말에 "제품 버전"과 "기반 템플릿 표준"을 나눠 적는다.
- 검사: 없음

### B-13. lockfile 이 둘이다

- 왜: `pnpm-lock.yaml` 과 `package-lock.json` 이 같이 있으면 PC 마다 다른 버전이 설치돼 "내 PC 에서는 된다"가 생긴다. 둘 다 있는 저장소 2곳, 템플릿과 달리 npm lockfile 만 있는 곳 3곳.
- 검사: `.githooks/pre-commit`, `pr-checks`

### B-14. 표·엑셀·인쇄 출력을 화면마다 새로 만든다

- 왜: 수정 성격 커밋 약 1,800건을 제목 키워드로 묶으면 가장 큰 묶음(160건)이 엑셀·PDF·인쇄였다. 열 너비, 쪽 나눔, 합계 행을 화면마다 따로 맞추다가 같은 버그를 여러 번 고친다.
- 대신: 출력은 공통 모듈 하나로 모으고, 새 출력 화면은 그 모듈에 형식을 추가하는 방식으로 만든다. 프로젝트에 공통 모듈이 생기면 [`COMPONENTS.md`](../ui/COMPONENTS.md) 에 등록한다.
- 검사: 없음
