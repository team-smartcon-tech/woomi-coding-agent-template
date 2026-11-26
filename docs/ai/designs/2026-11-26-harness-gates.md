# 설계: 문서 규칙을 검사로 옮긴다 — 5계층 하네스 자료 대조

상태: 확정 (2.32-draft 로 구현·머지, PR #42)
작성일: 2026-11-26
관련 작업: `2.32-draft` (CHANGELOG). 후속: [`2026-11-26-cloudflare-worker-scaffold.md`](2026-11-26-cloudflare-worker-scaffold.md)(2.33-draft)
원본 연구문서: [`회사 표준 AI 하네스 레퍼런스.md`](../../회사%20표준%20AI%20하네스%20업그레이드%20작업/회사%20표준%20AI%20하네스%20레퍼런스.md) — Gemini 생성 docx 를 Markdown 으로 옮긴 것(docx 는 커밋하지 않는다). 아래 "조사" 절은 이 문서를 받기 전의 본문 미보관 상태에서 쓴 것이라 그대로 둔다.

## 목표

외부 조사 자료 「회사 표준 AI 코딩 하네스 구성 항목 및 레퍼런스 총람」이 제시한 5계층(지침·런타임 훅·시크릿·DB·배포/거버넌스)을 이 템플릿과 대조해, **우리 저장소와 DB 에서 실제로 반복된 문제를 막는 것부터** 들인다.

## 비목표

- 자료가 나열한 도구를 전부 도입하는 것. 자료 스스로 일부 수치가 공급사 블로그·2차 해설 기반이라고 밝히고 있다.
- 이미 운영 중인 DB·저장소를 고치는 것. 이 문서는 템플릿만 다룬다. 프로젝트별 조치는 각 프로젝트가 `scripts/db-audit.sql` 을 돌려 판단한다.
- `AGENTS.md` 구조 개편. 별도 작업으로 나눈다.

## 맥락과 제약

### 조사한 것

| 대상 | 범위 | 방법 |
|---|---|---|
| 저장소 | 이 템플릿에서 분기했거나 같은 스택인 16곳, 커밋 약 8,000건 | 최근 이력 300건 깊이로 받아 파일·커밋 제목·설정을 집계 |
| DB | Supabase 프로젝트 23개 중 12개(+개발용 사본 1개) | 읽기 전용 카탈로그 쿼리(`scripts/db-audit.sql` 과 같은 쿼리). 행 데이터는 읽지 않았다 |

저장소 이름과 프로젝트별 숫자는 이 문서에 적지 않는다. 이 저장소는 public 이다.

### 쓰는 언어와 방식

- TypeScript/TSX 가 대부분이고 그다음이 **SQL**(파일 약 1,200개)이다. JavaScript/JSX 만 쓰는 저장소 1곳, C#/XAML 데스크톱 1곳, Python 은 보조 스크립트 수준.
- 16곳 중 13곳이 Cloudflare Worker(`wrangler`)를, 12곳이 pnpm 을 쓴다. DB 는 Supabase 다.
- 14곳에 `AGENTS.md` 가 있고 그중 10곳이 `.agents/` 문서 구조까지 쓴다. 분기 시점의 표준 버전은 2.5 ~ 2.31 로 흩어져 있다.
- 커밋 제목의 절반가량은 `feat:`/`fix:` 접두사를 쓰지 않는다(한글 접두사 `수정:`·`변경:` 포함).

### 반복된 문제 (합계)

| 영역 | 관찰 | 수 |
|---|---|---|
| DB | anon 이 실행 가능한 `security definer` 함수 | 66 (8개 DB) |
| DB | `(select …)` 로 감싸지 않은 `auth.uid()` 정책 | 87 / 728 |
| DB | `set search_path` 없는 함수 | 87 |
| DB | index 없는 FK | 183 / 500 |
| DB | 쓰기 정책 조건이 `true` | 39 (2개 DB) |
| DB | primary key 없는 테이블 | 19 |
| DB | `security_invoker` 없는 뷰 | 9 |
| DB | `timestamp`(시간대 없음) 컬럼 | 35 (1개 DB) |
| DB | 마이그레이션 이력 테이블 없음 / 파일 수와 원격 적용 수 큰 차이 | 2 / 3 |
| DB | RLS 가 꺼진 public 테이블 | **0** — 이 규칙은 지켜지고 있다 |
| 코드 | `alert()`·`confirm()` | 1,039 |
| 코드 | `toISOString().slice(0, 10)` 류 날짜 | 289 |
| 코드 | 화면 파일에서 테이블 직접 접근 | 107개 파일 (3곳) |
| 코드 | 환경변수를 한 곳에서 검증하는 모듈 | 찾지 못함 |
| 이력 | "1,000행에서 잘림" 수정 | 4곳 |
| 이력 | 수정 성격 커밋 중 엑셀·PDF·인쇄 / 인증·세션 / 중복·동시성 | 160 / 77 / 56 |
| 하네스 | `.githooks/` 없음 / CI 워크플로 `.disabled` | 5곳 / 2곳(9개 파일) |
| 하네스 | 값이 든 `.env.*` 추적 | 1곳 (공개용 anon key) |
| 하네스 | lockfile 이 둘 | 2곳 |
| 하네스 | 템플릿 표준 버전 번호를 제품 버전으로 이어 씀 | 2곳 |

읽는 법: 대부분은 **템플릿에 이미 적혀 있던 규칙의 위반**이다. 규칙이 없어서가 아니라, 어겨도 아무것도 실패하지 않아서 쌓였다. 유일하게 0 인 "RLS 꺼진 테이블"은 Supabase 대시보드가 경고를 띄우는 항목이다 — 기계가 알려 주는 규칙만 지켜졌다.

### 제약

- 팀은 전업 개발자가 아니다. 오탐이 잦은 검사는 `--no-verify` 나 워크플로 비활성화로 이어진다(위 "하네스" 행이 그 결과다).
- GitHub Free 플랜 조직의 private 저장소는 branch ruleset·CODEOWNERS 강제·Secret Scanning 을 쓸 수 없다(2.30-draft 에서 실측).
- 이 작업 환경에서 GitHub Actions 와 Claude Code 세션을 직접 돌려 볼 수 없었다.

## 선택지

| 선택지 | 장점 | 단점 | 판단 |
| --- | --- | --- | --- |
| A. 자료의 도구를 그대로 도입 (Gitleaks, TruffleHog, Squawk, Conftest, OSV-Scanner, Trivy …) | 검증된 규칙 수가 많다 | 한 번에 넣으면 오탐과 실패가 몰린다. CI 에서 돌려 보지 못한 설정이 들어간다. 일부는 조직 저장소에 라이선스·유료 플랜이 필요하다 | 보류 |
| B. 반복된 문제만 의존성 없는 스크립트로 검사 | 여기서 통과·실패를 둘 다 확인할 수 있다. 분기 프로젝트가 복사만 하면 돈다. 규칙마다 근거 숫자가 있다 | 정규식이라 범위가 좁다. 잠금 시간·살아 있는 키 검증은 못 한다 | **채택** |
| C. 문서만 보강 | 가장 싸다 | 위 표가 이 방식의 결과다 | 기각 |

## 결정

B 로 시작하고, A 의 도구는 계층마다 "다음에 붙일 것"으로 남긴다.

| 계층 | 자료의 제안 | 이번에 한 것 | 하지 않은 것과 이유 |
|---|---|---|---|
| 1. 지침 | `AGENTS.md` 는 지도(약 100줄), 경로별 규칙, 스킬 분리 | `.claude/rules/` 포인터 3개(DB·화면·환경변수), Copilot `applyTo` 1개. `BAD_EXAMPLES.md` 에 실제 사례 14건 | `AGENTS.md` 축소(305줄) — 장 번호를 가리키는 곳이 많아 별도 PR. `init.sh`·기능 목록 JSON — 우리 작업은 대부분 한 세션에 끝난다 |
| 2. 런타임 훅 | 값 파일 Read 차단, 파괴적 명령 차단, 감사 로그 | `Read` 매처 추가, `.dev.vars`, `cat .env` 류, 넓은 재귀 삭제(PowerShell 포함), `git clean`/`restore .`, MCP 쓰기 차단, 배포·원격 적용은 승인 프롬프트, 차단 기록 파일, 훅 배선 점검 | 모든 도구 호출의 감사 로그 — 차단·승인요청만 남긴다. 전부 남기면 아무도 읽지 않는다 |
| 3. 시크릿·하드코딩 | 타입 기반 env 검증, 4단계 스캔 | `env.server.ts`(Zod, 운영에서 필수), `env-check`, `secret-scan` 을 훅과 CI 가 공유 | Gitleaks/Betterleaks·TruffleHog — 다음 PR 에서 CI 실측 후. Push Protection — public 저장소만 가능 |
| 4. DB | Squawk, `supabase db lint`, Splinter, 최소 권한 | `db-lint`(13규칙, 새 마이그레이션만), `db-audit.sql`, 규칙 문서 3.7 | Squawk(잠금·하위호환) — `db-lint` 옆에 붙일 다음 후보. D1 — 쓰지 않는다 |
| 5. 배포·거버넌스 | `.dev.vars.example`, `.assetsignore`, health, PR 프리뷰, Secrets Store, Conftest, SCA, CODEOWNERS | `.gitignore`, `DEPLOYMENT.md` 4.1~4.3(env 한 곳, Worker 파일 목록, 유출 대응), `wrangler` `vars` 의 secret 검사 | 스캐폴드에 Worker 가 없어 파일은 넣지 않았다. CODEOWNERS·Conftest — Free private 저장소에서 강제되지 않는다. 대신 selftest 가 훅 배선을 본다. OSV-Scanner·Renovate — 범위 밖 |

## 불변조건과 계약

- 규칙 본문은 `AGENTS.md`·`.agents/*` 에만 둔다. `.claude/rules/`·`.github/instructions/` 는 포인터다.
- 시크릿 규칙은 `scripts/secret-scan.mjs` 한 곳에 있다. 훅과 CI 가 같은 파일을 부른다.
- `agent-guard` 는 차단(exit 2)과 승인 프롬프트(exit 0 + JSON)를 한 판정에서 섞지 않는다.
- 검사를 고칠 때는 막아야 할 형태와 통과해야 할 형태를 selftest 에 함께 넣는다.
- 검사가 보지 않는 것을 각 스크립트 머리말에 적는다. 형태 검사를 정합성 검증으로 보고하지 않는다.

## 위험과 롤백

| 위험 | 완화 |
|---|---|
| 훅 오탐으로 정상 작업이 막힌다 (`rm -rf <절대경로>`, `git checkout .`) | `.agent-guard.log` 로 오탐을 모아 규칙을 고친다. 급하면 사용자가 터미널에서 직접 실행한다 |
| 분기 프로젝트가 가져가면 `pr-checks` 의 전체 시크릿 스캔·`env-check` 가 기존 코드에서 실패한다 | 의도한 동작이다(쌓인 것을 한 번 정리). 소스 폴더가 다르면 `--roots` 를 준다 |
| `db-lint` 가 정규식이라 놓치거나 잘못 잡는다 | 새 파일만 보고, 예외는 이유와 함께 `db-lint-allow` 로 받는다 |
| `Read` 매처가 `.env.example` 까지 막는다 | 예시 파일은 통과한다(selftest) |

롤백: 이 변경은 스크립트·설정·문서뿐이다. PR 을 되돌리면 2.31-draft 상태가 된다. 스캐폴드의 `SESSION_SECRET` 처리만 동작이 바뀐다 — 운영에서 변수가 없으면 기동하지 않는다.

## 검증

한 것:

- `agent-guard --selftest` (기존 사례 + 새 사례 약 80건), stdin payload 로 차단·승인요청·통과를 각각 확인
- `secret-scan --selftest`, 이 저장소 전체 통과, 분기 저장소 10곳에 돌려 실제 발견 1건(추적 중인 `.env.*`)·오탐 0건
- `db-lint --selftest`, 분기 저장소 7곳의 실제 마이그레이션에 돌려 규칙별 건수 확인
- `env-check --selftest`, 이 저장소 통과, 분기 저장소 3곳에서 `env-drift`·`unsafe-default` 발견
- 임시 클론에서 `pre-commit` 이 시크릿·`.dev.vars`·`package-lock.json` 을 막고 일반 커밋은 통과시키는 것
- `pnpm format:check` · `typecheck` · `lint` · `test` · `build`

하지 못한 것:

- 실제 Claude Code 세션에서 `permissionDecision: "ask"` 프롬프트, `.claude/rules/` 의 `paths` 로딩, `mcp__.*` 매처 발화
- Codex 에서 `Read`·`mcp__.*` 매처 발화
- ~~바뀐 워크플로(`pr-checks`·`db-checks`)의 GitHub 러너 실행~~ → **확인했다(2026-11-26, 설계 작성 뒤).** PR #42 의 CI 와 `main` 11-26 11:12(KST) 푸시에서 `pr-checks`·`db-checks` 가 성공했다(`gh run list`: `main` push `db-checks` 45740849892 success, `pr-checks` 45740849887 success). 단 PR 의 첫 `db-checks` 실행(11:03 KST)은 실패했고 `0fca72e`(setup-node 의 pnpm 자동 캐시 끄기)로 고친 뒤 재실행에서 성공했다. 이 확인은 **그 시점의 워크플로**에 대한 것이다 — 2.33-draft 에서 더한 `pr-checks` 단계와 `deploy.yml` 은 아직 러너에서 돌려 보지 못했다.
- Supabase 프로젝트 23개 중 나머지 11개, 저장소 100여 곳 중 나머지

## 원본 3단계 도입 절차와의 대응

원본 연구문서 「회사 표준 하네스 3단계 도입 절차」 대비 현재 위치(2.33-draft 시점). 원본의 도구를 그대로 들이지 않고 의존성 없는 스크립트로 대체한 곳이 많다 — 그 판단은 위 "결정" 절.

| 원본 단계 | 원본이 요구한 것 | 지금 | 판정 |
|---|---|---|---|
| 1단계 즉시 차단 | `AGENTS.md`·`CLAUDE.md`·`.claude/settings.json` 훅(`.env`/`.dev.vars`/`rm` 차단, 감사 로그) | 2.32: `agent-guard` 확장, `.agent-guard.log`, `.claude/rules/` | 대부분 — 감사 로그는 PostToolUse 적재가 아니라 차단·승인요청 기록 |
| | Gitleaks/Betterleaks 프리커밋·PR 스캔, Push Protection | 2.32: 자체 `secret-scan.mjs`(훅·CI 공용). Gitleaks 와 Push Protection 은 안 붙임 | 부분 — 알려진 형태만 본다 |
| | Zod/t3-env 경계 검증 | 2.32 `env.server.ts` + `env-check`, 2.33 Worker 용으로 이전(`env.schema.ts`) | 완료 |
| | `.assetsignore`, `.gitignore` 위생 | 2.33: `public/.assetsignore`, `scripts/assets-check.mjs`. `.gitignore` 는 2.32 | 완료(`.assetsignore` 실효는 배포로 미확인) |
| 2단계 DB·Cloudflare | Squawk·`supabase db lint`·Splinter 를 PR 게이트로 | 2.32: 자체 `db-lint`(새 마이그레이션만)·`db-audit.sql`. Squawk·`supabase db lint` 는 안 붙임 | 일부 |
| | main 운영 / PR 프리뷰 분리 | 2.33: `deploy.yml`, 별도 프리뷰 Worker | 구현했으나 러너·계정 미실행 |
| | 민감 프리뷰 Cloudflare Access | 2.33: `DEPLOYMENT.md` 4.5 대시보드 절차만 | 문서만 |
| | D1 로컬 우선·논리 백업, Secrets Store BYOK AI Gateway, Rate Limit·DLP | 안 함 — 스캐폴드에 D1·LLM 호출이 없다 | 미착수 |
| 3단계 정책 코드화 | Conftest(Rego)로 하네스 설정·`wrangler.jsonc`·CODEOWNERS 검증 | 안 함(`env-check` 가 `wrangler.jsonc` 의 secret 이름만 본다) | 미착수 |
| | OSV-Scanner·Trivy·Renovate 공급망 게이트 | 안 함 | 미착수 |
| | JSON 기능 목록·`init.sh`·실행 계획 버전 관리·브라우저 E2E | 계획서는 `docs/ai/plans/` 에 버전 관리, 브라우저 검증은 절차 문서 | 일부 |
| | 정기 TruffleHog 전체 이력 감사, CODEOWNERS·last push approval·up-to-date branches | 안 함(Free 플랜 private 저장소는 CODEOWNERS 강제 불가) | 미착수 |

## 관련 문서·위키

- `.agents/examples/BAD_EXAMPLES.md` — 사례 14건
- `.agents/data/DB_SCHEMA.md` 3.5·3.7, `.agents/data/MIGRATION.md` 1장, `.agents/DEPLOYMENT.md` 4장
- `wiki/log.md` 2026-11-26
