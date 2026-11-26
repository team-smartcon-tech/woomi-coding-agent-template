# 설계: 스캐폴드를 Cloudflare Worker 하나로 배포한다

상태: 확정 (2026-11-26 사용자 승인) · 구현 2.33-draft(미배포 — 아래 "검증 결과")
작성일: 2026-11-26
관련 작업: 하네스 업그레이드 2차 — [`2026-11-26-harness-gates.md`](2026-11-26-harness-gates.md)(2.32-draft)의 후속. 원본 연구문서 「회사 표준 AI 하네스 레퍼런스」 5계층·도입 2단계

## 목표

이 템플릿을 **Cloudflare 배포까지 포함한 출발점**으로 만든다. `apps/web`(React Router v7)을 Node 서버 대신 Cloudflare Worker 하나로 빌드·실행·배포하게 바꾸고, 원본 5계층이 요구하는 파일(`wrangler.jsonc`, `.dev.vars.example`, `.assetsignore`, `_headers`, `GET /api/health`)과 배포 파이프라인을 **실물로** 넣는다.

왜: 분기했거나 같은 스택인 저장소 16곳 중 13곳이 Worker 를 쓰는데, 템플릿에는 Worker 가 없어서 2.32-draft 의 5계층은 문서(`DEPLOYMENT.md` 4.2)로만 남았다. 문서만 있는 규칙은 지켜지지 않았다는 것이 2.32 조사의 결론이다. 파일이 실제로 있어야 `env-check`·`secret-scan` 이 검사할 대상을 갖고, 분기 프로젝트가 복사만으로 같은 형태를 얻는다.

## 비목표

- Hono API Worker 를 따로 두는 구성(선택지 B). 작은 앱의 기본형은 통합 Worker 하나다(`DEPLOYMENT.md` 2장).
- Secrets Store·AI Gateway. 스캐폴드에 LLM 호출이 없다. 이후 업그레이드 항목으로 남긴다.
- D1·KV·R2 바인딩 예시. DB 는 Supabase 다. 바인딩 자리만 `wrangler.jsonc` 주석으로 안내한다.
- Cloudflare Access 설정 자체. 대시보드 작업이라 저장소에 넣을 수 없다 — 문서에 절차만 쓴다.
- 업그레이드 3·4번(Gitleaks·기준선, Squawk·`supabase db lint`, 정책 코드화·공급망·CODEOWNERS). 별도 작업.

반목표(기술적으로 돌아가도 실패인 것):

- 배포 워크플로가 들어갔지만 Cloudflare 계정 없이 열린 분기 저장소의 PR 이 전부 빨갛게 되는 것. 계정 정보가 없으면 배포 단계는 **건너뜀으로 보이고 통과**해야 한다.
- `SESSION_SECRET` 이 없을 때 알려진 기본값으로 조용히 뜨는 것(2.32 에서 막은 것)이 Worker 로 옮기며 되살아나는 것.
- 비개발자 온보딩(`/onboard`)의 `pnpm dev` → 화면 확인 경로가 깨지는 것.

## 맥락과 제약

현재 상태(2026-11-26, `main` `3dbd372`):

- `apps/web` — React Router v7(`ssr: true`), Vite 6, `react-router-serve`(Node)로 실행. 루트 `pnpm dev`·`build`·`start` 가 이 패키지를 부른다.
- 환경변수 입구는 `apps/web/app/shared/config/env.server.ts` 하나. 모듈을 읽을 때 `process.env` 를 Zod 로 검증하고, 운영(`NODE_ENV=production`)에서 `SESSION_SECRET` 이 없으면 throw 한다. `node:crypto` 의 `randomBytes` 로 로컬 임시 값을 만든다.
- `session.server.ts` 가 모듈 최상위에서 `env.SESSION_SECRET` 으로 `createCookieSessionStorage` 를 만든다.
- `eslint.config.mjs` 가 `env.server.ts` 밖의 `process.env` 를 막는다.
- `scripts/env-check.mjs` 는 코드가 읽는 변수 ↔ `.env.example`·`.dev.vars.example` ↔ `wrangler` 설정을 대조하고, `vars` 에 든 secret(`wrangler-var-secret`)을 잡는다.
- `.gitignore` 는 이미 `.wrangler/`, `.dev.vars*`(예시 제외)를 막는다.
- CI: `pr-checks`(포맷·타입·린트·테스트·빌드·시크릿·env·훅), `db-checks`, `tag-version`. 저장소는 public, GitHub Free.
- `pnpm dev` 를 직접 안내하는 곳: `README.md`, `apps/web/README.md`, `.claude/commands/onboard.md`, `docs/브라우저-검증-절차.md`.

제약:

- 이 템플릿 저장소에는 Cloudflare 계정 정보(GitHub Secrets)가 없다. 실제 배포는 여기서 돌려 볼 수 없다.
- 팀은 전업 개발자가 아니다. 로컬 실행 명령이 늘거나 바뀌면 온보딩이 깨진다.
- `AGENTS.md` §6: 배포·`wrangler secret put` 은 사용자 승인 대상이고, `agent-guard` 가 승인 프롬프트로 올린다.

## 선택지

| 선택지 | 장점 | 단점 | 판단 |
| --- | --- | --- | --- |
| A. `apps/web` 자체를 Worker 하나로 (Cloudflare Vite 플러그인) | 화면·`/api/*`·정적 자산이 한 Worker. 5계층 파일이 전부 실물로 생긴다. `DEPLOYMENT.md` 2장의 작은 앱 권장과 같다 | Node 실행 경로가 사라져 env·세션 모듈과 실행 명령, 테스트 환경을 바꿔야 한다 | **채택** (사용자 선택) |
| B. `apps/web` 유지 + Hono `apps/worker` 추가 | `STACK.md` 의 Hono 기준과 맞다 | 작업량 약 두 배. 화면은 계속 Node 라 `.assetsignore`·`_headers` 절반이 적용되지 않는다 | 기각 |
| C. Node 유지 + `templates/cloudflare/` 예시 파일 | 가장 싸다 | CI 에서 돌지 않는다. "문서만 있는 규칙" 을 반복한다 | 기각 |

## 결정

### 1. 빌드·실행

- `apps/web` 에 `@cloudflare/vite-plugin` 과 `wrangler` 를 devDependency 로 넣고, React Router 공식 Cloudflare 구성을 따른다. `@react-router/node`·`@react-router/serve` 는 뺀다.
- Worker 진입점은 `apps/web/workers/app.ts`(React Router 공식 템플릿 경로). 요청 처리 전에 `/api/health` 를 따로 받지 않고 **React Router 리소스 라우트**(`routes/api.health.ts`)로 둔다 — 라우트 목록 한 곳에서 보이게.
- 명령은 이름을 유지하고 내용만 바꾼다. 온보딩 문서의 `pnpm dev` 는 그대로 동작해야 한다.

| 루트 명령 | 바뀐 뒤 |
|---|---|
| `pnpm dev` | Vite + Cloudflare 플러그인(workerd). 포트 5173 유지 |
| `pnpm build` | Worker 와 정적 자산 빌드 |
| `pnpm start` | 빌드 결과를 로컬 workerd 로 실행(`vite preview` 또는 `wrangler dev` — 빌더가 공식 문서 기준으로 고른다) |
| `pnpm deploy:dry` (신규) | `wrangler deploy --dry-run`. 계정 없이 번들·설정 검증 |
| `pnpm cf-typegen` (신규) | `wrangler types` 로 `Env` 타입 생성 |

### 2. 환경변수·secret

- 로컬 값 파일은 `.env` 에서 `apps/web/.dev.vars` 로 바꾼다. `apps/web/.env.example` 은 지우고 `apps/web/.dev.vars.example` 을 둔다. 배포 값은 `wrangler secret put`(승인 대상).
- `env.server.ts` 는 **유일한 입구라는 계약을 유지**한다. 읽는 곳만 `process.env` → Worker `env` 로 바꾼다. 방식은 `cloudflare:workers` 의 `env` import(모듈 최상위에서 바인딩 접근)를 우선 검토하고, 그것이 Vite 플러그인·테스트에서 안 되면 요청마다 `context.cloudflare.env` 를 받아 한 번 검증해 캐시하는 함수로 바꾼다. 어느 쪽이든 Zod 스키마는 그대로다.
- 운영 판정은 `NODE_ENV` 대신 wrangler `vars` 의 공개 값 `APP_ENV`(`development`·`preview`·`production`)로 한다. Worker 에서 `NODE_ENV` 는 빌드 시 치환값이라 배포 환경을 구분하지 못한다.
- **`APP_ENV` 는 닫힌 쪽으로 실패한다.** `wrangler.jsonc` 최상위 `vars.APP_ENV` 는 `production` 이다. 환경 선택을 빠뜨린 배포는 운영 규칙(secret 필수)을 받는다. 로컬은 `env.development`(`APP_ENV=development`)를 두고 `pnpm dev` 가 그 환경을 고른다(Cloudflare Vite 플러그인은 `CLOUDFLARE_ENV` 로 환경을 고른다 — 빌더가 공식 문서로 확인). 그래서 `.dev.vars` 를 만들지 않아도 `pnpm dev` 가 지금처럼 뜬다(온보딩 유지).
- `APP_ENV` 가 `production`·`preview` 인데 `SESSION_SECRET` 이 없으면 **세션을 쓰는 요청은 500 을 내고 기록**한다(Worker 에는 "기동 실패" 가 없다). 로컬 임시 값은 `crypto.getRandomValues` 로 만든다(`node:crypto` 제거).
- `version.server.ts` 는 실행 시 `node:fs` 로 `CHANGELOG.md` 를 찾는다. Worker 에는 저장소 파일이 없으므로 **`.server.ts` 안에서 `?raw` import** 로 서버 번들에만 넣는다. 그 파일이 `?raw` 를 피한 이유는 클라이언트·정적 자산 노출이었고, `.server.ts` 모듈은 클라이언트 번들에서 빠진다. 대신 정적 자산 검사(3절)가 클라이언트 자산에 CHANGELOG 본문이 없는지도 본다. 변경 이력 화면은 지금처럼 로그인 가드 뒤에 둔다.
- ESLint: `process.env` 금지는 유지하고, `cloudflare:workers` 의 `env` import 도 `env.server.ts` 밖에서 막는다.
- `env-check` 가 `wrangler.jsonc` 를 읽어 `vars` ↔ 스키마 ↔ `.dev.vars.example` 을 대조하는지 확인하고, 안 되면 보강한다.

### 3. 저장소에 생기는 파일

| 파일 | 내용 |
|---|---|
| `apps/web/wrangler.jsonc` | `name`, `main`, `compatibility_date`, `compatibility_flags`(`nodejs_compat` 은 필요할 때만), `assets`, `observability`, 최상위 `vars.APP_ENV="production"`, `env.preview`(`APP_ENV=preview`, 별도 Worker `<name>-preview`), `env.development`(`APP_ENV=development`, 로컬 전용). secret 은 적지 않는다. D1·KV·R2 바인딩 자리는 주석 |
| `apps/web/.dev.vars.example` | `SESSION_SECRET=` 과 만드는 법 한 줄 |
| `apps/web/public/.assetsignore` 또는 정적 자산 루트의 `.assetsignore` | `wrangler.jsonc`, `package.json`, `*.md`, `.dev.vars*`, `scripts/` — 빌드 결과에서 실제로 빠지는지 확인한다 |
| `apps/web/public/_headers` | 정적 자산 캐시 정책(해시 파일 장기 캐시)과 기본 보안 헤더(`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`). CSP 는 Report-Only 로 시작 — 막는 CSP 는 프로젝트가 정한다 |
| `apps/web/app/routes/api.health.ts` | 필수 secret 이 갖춰졌으면 `200 { status: "ok", env: APP_ENV }`, 빠졌으면 `503 { status: "not_ready" }`. 빠진 변수 이름·값·버전은 응답에 넣지 않는다(로그인 없이 읽힌다). 상세는 Worker 로그에만 남긴다 |

### 4. CI·배포

- `pr-checks` 에 `pnpm deploy:dry` 단계를 더한다. 계정 정보가 필요 없다.
- 새 워크플로 `deploy.yml`:
  - **프리뷰는 운영 Worker 의 버전이 아니라 별도 Worker(`env.preview`)다.** 운영 Worker 의 버전으로 올리면 PR 코드가 운영 `SESSION_SECRET` 을 쓰게 되어 `DEPLOYMENT.md` 4장의 "production secret 을 dev/staging 에 재사용 금지" 를 어긴다. 프리뷰 Worker 는 자기 secret 을 따로 가진다.
  - PR → `preview` 환경으로 빌드해 프리뷰 Worker 에 `wrangler versions upload --preview-alias pr-<번호>`. `main` push → 운영 환경으로 빌드해 `wrangler deploy`. Vite 플러그인은 환경을 **빌드할 때** 고르므로 배포 명령의 `--env` 가 아니라 빌드 단계에서 고른다(빌더가 공식 문서로 확인).
  - 첫 배포 순서(문서에 적는다): 프리뷰·운영 Worker 를 한 번 배포 → `wrangler secret put SESSION_SECRET`(각 Worker, 사용자 승인) → health 재확인. 그 전까지 health 는 503 이고 배포 잡은 "secret 미등록" 으로 실패한다 — 계정이 있는 저장소에서 secret 을 빠뜨린 것은 실패로 보여야 한다.
  - `cloudflare/wrangler-action` 사용. `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID` 가 저장소 secret 에 **없으면 잡을 건너뛰고 요약에 "배포 건너뜀 — 계정 정보 없음" 을 남긴다.** 실패로 만들지 않는다.
  - fork 에서 온 PR 은 secret 이 없으므로 자연히 건너뛴다. `pull_request_target` 은 쓰지 않는다.
  - 배포 후 `/api/health` 를 호출해 200 을 확인한다. 503 이면 "secret 미등록" 으로 실패한다.
- Workers Builds(Cloudflare 쪽 Git 연동)는 쓰지 않는다. 배포 기록과 검사를 GitHub Actions 한 곳에 둔다. `DEPLOYMENT.md` 8.2 의 예외 규정은 유지.

### 5. 문서

- `DEPLOYMENT.md` 4.2 를 "갖출 파일" 에서 "스캐폴드의 실제 파일" 로, 7장 배포 명령, 8장 CI 를 `deploy.yml` 기준으로 갱신. 프리뷰 URL 에 Cloudflare Access 를 거는 절차를 대시보드 단계로 적는다.
- `README.md`, `apps/web/README.md`, `.claude/commands/onboard.md`, `docs/브라우저-검증-절차.md` 의 실행 안내(`.env` → `.dev.vars`).
- `AGENTS.md` 2장 라우팅 표(환경변수 행), 7장 명령.
- `CHANGELOG.md` 2.33-draft, `wiki/log.md`·관련 정리본.
- 선행 설계 `2026-11-26-harness-gates.md` 정리: 상태를 확정으로, 원본 연구문서 위치, 검증 절의 CI 실측(11-26 11:12 KST main `db-checks` 성공), 원본 3단계 도입 절차와의 대응표.

## 불변조건과 계약

- 서버 환경변수는 `env.server.ts` 한 곳에서만 읽는다.
- secret 은 `wrangler.jsonc` 에 쓰지 않는다(`env-check` 의 `wrangler-var-secret` 이 잡는다).
- 운영·프리뷰에서 `SESSION_SECRET` 없이 세션을 서명하지 않는다.
- Cloudflare 계정 정보가 없는 저장소에서도 모든 PR 검사가 통과할 수 있다.
- `/api/health` 응답에 secret·DB 값·내부 오류 원문을 넣지 않는다.
- 배포 명령은 로컬 에이전트가 실행하지 않는다. CI 가 하거나 사용자가 승인한다(`AGENTS.md` §6).

## 위험과 롤백

| 위험 | 완화 |
|---|---|
| `cloudflare:workers` env import 가 Vitest(Node)에서 해석되지 않아 기존 테스트가 깨진다 | `env.server.ts` 를 테스트에서 대체하거나 `@cloudflare/vitest-pool-workers` 를 쓴다. 빌더가 기존 테스트가 전부 그대로 도는 쪽을 고른다 |
| React Router·Vite 버전이 Cloudflare 플러그인 요구와 안 맞는다 | 공식 템플릿의 버전 조합을 따른다. 올려야 하면 그 이유를 CHANGELOG 에 적는다 |
| 이미 Node 로 돌던 분기 프로젝트가 가져가면 실행 방식이 바뀐다 | CHANGELOG "분기한 프로젝트가 가져갈 때" 에 바뀌는 명령·파일을 표로 적는다. Node 로 계속 쓸 프로젝트는 이 변경을 가져가지 않는다 |
| 배포 워크플로를 여기서 실제로 돌려 볼 수 없다 | `deploy:dry` 는 PR CI 에서 실측한다. 실제 배포는 계정이 있는 저장소에서 처음 돌릴 때 확인 항목으로 남긴다 |
| `.assetsignore` 위치가 틀려 무시 규칙이 적용되지 않는다 | 빌드 결과 자산 목록에 `wrangler.jsonc` 등이 없는지 확인하는 검사를 둔다 |

롤백: PR 을 되돌리면 Node 실행으로 돌아간다. 원격에 배포된 Worker 는 이 저장소에 없다.

## 검증

완료 조건(각각 "그 동작이 없었으면 결과가 달라지는" 입력으로 확인한다):

- `.dev.vars` 없이 `pnpm dev` 로 로그인 → 대시보드가 뜬다. `.dev.vars` 에 `SESSION_SECRET` 을 두고 값을 바꾸면 기존 세션이 풀린다.
- 운영 환경 빌드를 로컬 workerd 로 띄웠을 때: `SESSION_SECRET` 이 없으면 로그인 요청 500·health 503, 있으면 200·200. 환경을 고르지 않은 빌드도 운영 규칙을 받는다.
- 사이드바 버전 배지와 변경 이력 화면이 Worker 에서 지금과 같은 값을 보인다.
- 빌드 결과 정적 자산에 `wrangler.jsonc`·`package.json`·`.dev.vars*`·CHANGELOG 본문이 없다. 일부러 하나를 자산 폴더에 넣으면 검사가 실패한다.
- `wrangler.jsonc` 의 `vars` 에 secret 이름을 넣으면 `env-check` 가 실패한다.
- `pnpm deploy:dry` 가 로컬과 PR CI 에서 통과한다.
- `deploy.yml` 이 계정 정보 없는 이 저장소의 PR 에서 "건너뜀" 으로 끝나고 PR 이 통과한다.
- 기존 `format:check`·`typecheck`·`lint`·`test`·`build`·`agent-guard --selftest` 통과.

검증하지 못할 것으로 미리 적어 두는 것: 실제 프리뷰·운영 배포, Cloudflare Access 동작.

### 검증 결과 (2.33-draft 구현 뒤)

출처: `.superpowers/sdd/2026-11-26-cloudflare-worker-scaffold/task-1~4-report.md`(구현자 보고). 아래 "확인함"은 그 보고가 실행한 명령과 결과를 근거로 한 것이다.

확인함:

- `.dev.vars` 없이 `pnpm dev` → 로그인 302, 대시보드 200, 사이드바 버전이 CHANGELOG 최상단과 일치, 변경 이력 응답. `.dev.vars` 의 `SESSION_SECRET` 을 A→B 로 바꿔 재기동하면 옛 쿠키가 `/login` 으로 리다이렉트된다.
- 운영 빌드(`pnpm build && pnpm start`): `.dev.vars` 없이 `/login` 500(`MissingSecretError`)·`/api/health` 503, 본문에 `SESSION_SECRET` 문자열 없음. 있으면 로그인 302·`/` 200. 개발 서버의 `/api/health` 는 200 `{"status":"ok","env":"development"}`. 환경 선택 없이 만든 빌드도 운영 규칙을 받는다(최상위가 production).
- `pnpm format:check`·`typecheck`·`lint`·`test`(26)·`build`·`deploy:dry`(번들 업로드, `env.APP_ENV "production"`)·`env:check`·`assets:check`(41개 파일)·`assets-check`/`env-check`/`secret-scan`/`agent-guard` 각 `--selftest`.
- 그 동작이 없었으면 결과가 달라지는 입력으로 확인한 것: `wrangler.jsonc` `vars` 에 `SESSION_SECRET` → `env-check` 실패(되돌림). `public/package.json` 을 넣은 빌드 → `assets:check` 가 `[forbidden-file]` 로 실패. `assets-check` 의 `check` 를 비워 `--selftest` 가 실패하는 것(RED). `.dev.vars` 를 둔 채 `pnpm typecheck` 해도 `worker-configuration.d.ts` 가 바뀌지 않는다(`--env-file types.env`) — 수정 전에는 `SESSION_SECRET` 이 `Env` 에 들어갔다.
- 두 워크플로 YAML 문법(`yaml-lint`). `actionlint` 는 없어서 건너뜀.

확인하지 못함(미검증):

- **실제 프리뷰·운영 배포, Cloudflare Access.** 계정 정보가 없다.
- **`deploy.yml` 의 GitHub 러너 실행** — "계정 정보 없음 → 건너뜀" 경로, `wrangler-action` 출력 이름, 프리뷰 URL 추출, health 단계. PR 을 올려 `deploy` 잡이 건너뜀으로 통과하는지 보는 것이 남았다.
- `pr-checks` 의 새 단계가 Linux 러너에서 통과하는지(특히 `worker-configuration.d.ts` 어긋남 검사 — 로컬은 Windows 라 줄바꿈 차이 가능성, 그리고 `deploy:dry` 가 인증 없이 되는지).
- `_headers` 의 실제 응답 적용(`vite preview` 가 규칙을 읽는 것까지만), `.assetsignore` 가 업로드에서 파일을 빼는지.
- `.dev.vars.<환경>`(`-e`)이 타입 생성에 섞이는지.

설계와 달라진 것:

- **React Router 7→8.5, Vite 6→8, React 19.0→19.3 으로 올랐다** — "버전 조합은 C3 템플릿을 따른다" 에 따른 것이고 이유는 CHANGELOG 에 적었다. Node 22.22 이상 필요.
- 로드 컨텍스트(`AppLoadContext`·`context.cloudflare`)는 만들지 않았다. React Router 8 의 C3 템플릿이 컨텍스트를 넘기지 않고, env 는 `cloudflare:workers` 한 곳에서만 읽는다. `ctx.waitUntil` 이 필요해지면 진입점을 고친다.
- Vitest 는 `cloudflare()` 플러그인이 시작을 깨서 `process.env.VITEST` 일 때 그 플러그인만 뺀다. `env.schema.ts` 로 순수 로직을 나눠 Node 에서 테스트한다.
- `pnpm start` 는 `vite preview`. 이 방식은 빌드 때 `.dev.vars` 를 `build/server/.dev.vars` 로 복사하므로 secret 이 든 빌드를 배포·공유하지 않는다.
- 설계 3절의 `.assetsignore` 위치 가정대로 `public/` 에 두었다. 빌드 결과 `build/client` 에도 복사된다.
- Access 가 걸린 프리뷰는 `deploy.yml` 의 health 단계도 막는다 — 설계에 없던 충돌이라 `DEPLOYMENT.md` 4.5 에 적었다.

## 빌더에게 맡기는 것

- `pnpm start` 를 `vite preview` 로 할지 `wrangler dev` 로 할지.
- `compatibility_date` 값, `nodejs_compat` 필요 여부.
- Vitest 처리 방식(위 위험 1).
- `_headers` 의 구체 값, 정적 자산 검사 스크립트를 `env-check` 에 넣을지 별도로 둘지.

## 검토에서 나온 질문과 정리

빌더 관점 검토(2026-11-26, 별도 에이전트)가 계획 전에 답이 필요하다고 한 네 가지와 정한 방식. **(작성자 판단)** 은 사용자가 따로 정하지 않은 것이다.

| 질문 | 정한 것 | 근거 |
|---|---|---|
| 프리뷰는 운영 Worker 의 버전인가 별도 Worker 인가 | 별도 Worker | `DEPLOYMENT.md` 4장 secret 재사용 금지 — 규칙이 이미 답한다 |
| `APP_ENV` 가 빠지면 어느 쪽으로 실패하나 | 운영 쪽. 로컬은 `env.development` 를 명령이 고른다 **(작성자 판단)** | 반목표 2(기본값으로 조용히 뜸)와 3(온보딩 깨짐)을 둘 다 피하는 유일한 조합 |
| health 도 secret 검사를 받나 | 받는다. 503 + 이름 없는 상태값 **(작성자 판단)** | secret 빠진 배포를 CI 가 잡게 한다. 응답은 공개이므로 변수 이름을 넣지 않는다 |
| `version.server.ts` 의 파일 읽기 | `.server.ts` 안 `?raw` + 정적 자산 검사 **(작성자 판단)** | 원래 우려(클라이언트·정적 노출)는 서버 전용 모듈과 검사로 막힌다 |

검토자가 Cloudflare 동작(프리뷰 alias, 빌드 시 환경 선택)을 기억에 기대어 적었다고 밝혔으므로, 계획 단계에서 공식 문서로 먼저 확인한다.

## 관련 문서·위키

- `.agents/DEPLOYMENT.md` 2·4·7·8장, `.agents/STACK.md`
- [`2026-11-26-harness-gates.md`](2026-11-26-harness-gates.md)
- 원본 연구문서: [`회사 표준 AI 하네스 레퍼런스.md`](../../회사%20표준%20AI%20하네스%20업그레이드%20작업/회사%20표준%20AI%20하네스%20레퍼런스.md) — Gemini 생성 docx 를 Markdown 으로 옮긴 것. docx 는 커밋하지 않는다
