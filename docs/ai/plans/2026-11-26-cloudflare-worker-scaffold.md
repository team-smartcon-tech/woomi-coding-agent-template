# Cloudflare Worker 스캐폴드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 사용자 보고는 한국어로 한다.

**Goal:** `apps/web`(React Router v7)을 Node 서버 대신 Cloudflare Worker 하나로 개발·빌드·배포하게 바꾸고, 5계층 파일과 배포 파이프라인을 실물로 넣는다.

**Architecture:** Cloudflare Vite 플러그인을 `ssr` 환경에 붙여 React Router 서버 빌드를 Worker 로 만든다. 환경변수는 순수 모듈(`env.schema.ts`)이 판정하고 `env.server.ts` 한 곳만 `cloudflare:workers` 의 `env` 를 읽는다. 세션 저장소는 첫 사용 때 만들어 secret 누락이 health 를 죽이지 않게 한다.

**Tech Stack:** React Router 7, Vite, `@cloudflare/vite-plugin`, `wrangler`, Zod, Vitest, GitHub Actions(`cloudflare/wrangler-action`).

**Spec:** [`docs/ai/designs/2026-11-26-cloudflare-worker-scaffold.md`](../designs/2026-11-26-cloudflare-worker-scaffold.md)

## 확인된 플랫폼 동작 (2026-11-26, Cloudflare 공식 문서 — Context7)

- Vite 플러그인은 `CLOUDFLARE_ENV` 로 **dev·build 시점에** 환경을 고른다. 빌드가 평탄화된 출력 설정(`wrangler.json`)을 만들고, `wrangler deploy`·`vite preview` 는 그것을 쓴다. 배포 때 `--env`/`CLOUDFLARE_ENV` 는 효과가 없다.
- `CLOUDFLARE_ENV` 없이 dev/build 하면 최상위 환경이 쓰인다.
- `wrangler versions upload --preview-alias <alias>` → `<alias>-<worker-name>.<subdomain>.workers.dev`. 별칭은 업로드할 때만 만든다.
- `import { env } from "cloudflare:workers"` 는 모듈 최상위에서도 동작한다.
- React Router 통합: `cloudflare({ viteEnvironment: { name: "ssr" } })`, 진입점 `workers/app.ts` 가 `createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE)` 에 `{ cloudflare: { env, ctx } }` 를 넘긴다. 공식 템플릿은 `app/entry.server.tsx` 를 둔다.

## Global Constraints

- 최상위 `vars.APP_ENV = "production"`. `env.preview.vars.APP_ENV = "preview"`, `env.development.vars.APP_ENV = "development"`.
- secret 은 `wrangler.jsonc` 에 쓰지 않는다. 로컬 값은 `apps/web/.dev.vars`, 예시는 `apps/web/.dev.vars.example`.
- 서버 환경변수는 `env.server.ts` 한 곳에서만 읽는다(`process.env`·`cloudflare:workers` 둘 다).
- `SESSION_SECRET` 은 32자 이상. `APP_ENV` 가 `production`·`preview` 인데 없으면 세션 요청 500, health 503.
- `/api/health` 응답: `200 { status: "ok", env }` 또는 `503 { status: "not_ready" }`. 변수 이름·값·버전 없음.
- 루트 명령 이름 `dev`·`build`·`start` 유지, 포트 5173 유지. 신규 `deploy:dry`, `cf-typegen`, `assets:check`.
- Cloudflare 계정 정보(`CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`)가 없으면 배포 잡은 건너뛰고 통과.
- 에이전트는 `wrangler deploy`·`versions upload`·`secret put` 을 실행하지 않는다(`AGENTS.md` §6). `--dry-run` 만.
- 버전 조합은 Cloudflare 공식 React Router 템플릿(C3)을 따른다. 기존 의존성을 올리면 CHANGELOG 에 이유를 적는다.

## Review Focus

1. `.dev.vars` 없이 `pnpm dev` — 지금처럼 로그인 화면이 떠야 한다 (Task 2 Step 6).
2. `CLOUDFLARE_ENV` 없이 `pnpm build` 한 결과 — 운영 규칙(secret 필수)을 받아야 한다 (Task 2 Step 7).
3. 로컬 http 에서 로그인 — `secure` 쿠키가 아니어야 세션이 유지된다; 배포 환경은 `secure` (Task 1 `parseEnv` 테스트).
4. 계정 정보 없는 저장소·fork PR — 배포 잡 "건너뜀", PR 초록 (Task 4 Step 4).
5. 변경 이력 화면·버전 배지 — Worker 에서도 같은 값, 클라이언트 자산엔 본문 없음 (Task 1 `parseVersion` 테스트, Task 3 자산 검사).

## 파일 구조

| 파일 | 책임 | Task |
|---|---|---|
| `apps/web/app/shared/config/env.schema.ts` (신규) | 순수 판정: 스키마, `parseEnv`, `resolveSessionSecret`, `isReady` | 1 |
| `apps/web/app/shared/config/env.schema.test.ts` (신규) | 위 테스트 | 1 |
| `apps/web/app/shared/config/env.server.ts` | `cloudflare:workers` env 를 읽어 `getEnv()` 캐시 | 1 |
| `apps/web/app/features/auth/model/session.server.ts` | 세션 저장소를 첫 사용 때 생성 | 1 |
| `apps/web/app/shared/lib/version.server.ts` | `?raw` import + `parseVersion` | 1 |
| `apps/web/app/shared/lib/version.test.ts` (신규) | `parseVersion` 테스트 | 1 |
| `eslint.config.mjs` | `cloudflare:workers` import 제한 | 1 |
| `apps/web/package.json`, `vite.config.ts`, `wrangler.jsonc`(신규), `workers/app.ts`(신규), `app/entry.server.tsx`(신규), `tsconfig.json`, `.dev.vars.example`(신규), `.env.example`(삭제), 루트 `package.json` | Worker 런타임 전환 | 2 |
| `apps/web/app/routes/api.health.ts`(신규), `routes.ts`, `public/_headers`(신규), `public/.assetsignore`(신규), `scripts/assets-check.mjs`(신규) | health·자산 위생 | 3 |
| `.github/workflows/pr-checks.yml`, `.github/workflows/deploy.yml`(신규) | CI·배포 | 4 |
| 문서 다수, `CHANGELOG.md`, `wiki/` | 문서 | 5 |

---

### Task 1: 환경변수·세션·버전 모듈을 Worker 에서 돌 수 있게 바꾼다

런타임 전환(Task 2) 전에 Node·Worker 양쪽에서 테스트되는 순수 부분을 먼저 만든다. 이 Task 가 끝나도 앱은 아직 Node 로 뜨지 않을 수 있다(`env.server.ts` 가 `cloudflare:workers` 를 읽으므로). Task 2 와 같은 PR 에 들어간다.

**Files:**
- Create: `apps/web/app/shared/config/env.schema.ts`, `env.schema.test.ts`, `apps/web/app/shared/lib/version.test.ts`
- Modify: `apps/web/app/shared/config/env.server.ts`, `apps/web/app/features/auth/model/session.server.ts`, `apps/web/app/shared/lib/version.server.ts`, `eslint.config.mjs:91-110`

**Interfaces:**
- Produces (`env.schema.ts`, `cloudflare:workers` 를 import 하지 않는다):
  - `type AppEnvName = "development" | "preview" | "production"`
  - `type AppEnv = { APP_ENV: AppEnvName; isDeployed: boolean; SESSION_SECRET: string | null }`
  - `parseEnv(raw: Record<string, unknown>): AppEnv` — `APP_ENV` 없으면 `"production"`(닫힌 쪽). 스키마 위반은 `Error("환경변수가 올바르지 않습니다 — …")`.
  - `class MissingSecretError extends Error`
  - `resolveSessionSecret(e: AppEnv, makeLocal: () => string): string` — 값이 있으면 그대로, 없고 `!isDeployed` 면 `makeLocal()`, 없고 배포면 `MissingSecretError`.
  - `isReady(e: AppEnv): boolean`
- Produces (`env.server.ts`): `getEnv(): AppEnv`(격리 단위 캐시), `getSessionSecret(): string`(로컬 임시 값은 `crypto.getRandomValues` 32바이트 hex, 격리 단위로 한 번).
- Produces (`version.server.ts`): `parseVersion(changelog: string): string`, `getVersionInfo(): { version: string; changelog: string }`(시그니처 유지).
- Produces (`session.server.ts`): 기존 export 시그니처 전부 유지.

- [ ] **Step 1: 실패하는 테스트 작성** — `env.schema.test.ts`

```ts
describe("parseEnv", () => {
  it("APP_ENV 가 없으면 production 으로 본다", () => {
    expect(parseEnv({}).APP_ENV).toBe("production")
    expect(parseEnv({}).isDeployed).toBe(true)
  })
  it("development 는 배포 환경이 아니다", () => {
    expect(parseEnv({ APP_ENV: "development" }).isDeployed).toBe(false)
  })
  it("preview 는 배포 환경이다", () => {
    expect(parseEnv({ APP_ENV: "preview" }).isDeployed).toBe(true)
  })
  it("32자 미만 SESSION_SECRET 은 거부한다", () => {
    expect(() => parseEnv({ APP_ENV: "development", SESSION_SECRET: "short" })).toThrow(/SESSION_SECRET/)
  })
  it("모르는 APP_ENV 는 거부한다", () => {
    expect(() => parseEnv({ APP_ENV: "staging" })).toThrow(/APP_ENV/)
  })
})
describe("resolveSessionSecret", () => {
  const s = "a".repeat(32)
  it("값이 있으면 그대로", () => {
    expect(resolveSessionSecret(parseEnv({ SESSION_SECRET: s }), () => "x")).toBe(s)
  })
  it("로컬에서 없으면 임시 값", () => {
    expect(resolveSessionSecret(parseEnv({ APP_ENV: "development" }), () => "tmp")).toBe("tmp")
  })
  it("배포 환경에서 없으면 MissingSecretError", () => {
    expect(() => resolveSessionSecret(parseEnv({ APP_ENV: "preview" }), () => "tmp")).toThrow(MissingSecretError)
  })
})
describe("isReady", () => {
  it("배포 환경 + secret 없음 → false", () => expect(isReady(parseEnv({}))).toBe(false))
  it("로컬 + secret 없음 → true", () => expect(isReady(parseEnv({ APP_ENV: "development" }))).toBe(true))
})
```

`version.test.ts`:

```ts
it("최상단 ## [x] 헤딩에서 버전을 뽑는다", () => {
  expect(parseVersion("# CHANGELOG\n\n## [2.33-draft] - 2026-11-26\n\n## [2.32-draft]")).toBe("2.33-draft")
})
it("헤딩이 없으면 빈 문자열", () => expect(parseVersion("")).toBe(""))
```

- [ ] **Step 2: 실패 확인** — `pnpm --filter web test` → 새 두 파일이 import 실패로 FAIL.

- [ ] **Step 3: `env.schema.ts` 구현** — Zod 스키마(`APP_ENV` enum, `SESSION_SECRET` `min(32)` optional). 빈 문자열 `SESSION_SECRET` 은 없는 것으로 본다(`.dev.vars.example` 을 그대로 복사한 경우).

- [ ] **Step 4: `env.server.ts` 교체** — `import { env } from "cloudflare:workers"` 로 `parseEnv` 를 한 번 호출해 캐시하는 `getEnv()`, `getSessionSecret()`. `node:crypto`·`process.env` 제거. 머리말 주석은 "유일한 입구" 계약과 세 곳 동기화(스키마·`.dev.vars.example`·`wrangler secret`)로 고친다.

- [ ] **Step 5: `session.server.ts`** — 모듈 최상위 `createCookieSessionStorage` 를 `getStorage()`(첫 호출에 생성·캐시)로 옮긴다. `secrets: [getSessionSecret()]`, `secure: getEnv().isDeployed`. `MissingSecretError` 는 잡지 않는다 — 500 으로 올라간다.

- [ ] **Step 6: `version.server.ts`** — `node:fs`·`node:path` 제거, 저장소 루트 `CHANGELOG.md` 를 `?raw` 로 import, `parseVersion` export. 머리말의 "`?raw` 를 피한다" 문단은 "`.server.ts` 안에서만 `?raw` 를 쓴다 — 서버 번들에만 들어가고, Task 3 의 자산 검사가 클라이언트 자산을 확인한다" 로 바꾼다. Vite `server.fs.allow` 가 저장소 루트를 막으면 `vite.config.ts` 에 루트를 허용한다(Task 2 에서 확인).

- [ ] **Step 7: ESLint** — `no-restricted-imports` 로 `cloudflare:workers` 의 `env` import 를 `**/env.server.ts`·`apps/web/workers/**` 밖에서 막는다. 메시지: "`cloudflare:workers` 의 env 를 직접 읽지 않는다. ~/shared/config/env.server 를 쓴다(.agents/DEPLOYMENT.md 4장)."

- [ ] **Step 8: 테스트 통과 확인** — `pnpm --filter web test` → 새 테스트 포함 전부 PASS. `pnpm lint` PASS(다른 파일에 `cloudflare:workers` 를 하나 임시로 넣으면 FAIL 하는지 보고 되돌린다).

- [ ] **Step 9: 커밋** — `refactor(web): 환경변수·세션·버전 모듈을 Worker 런타임에 맞춘다`

### Task 2: `apps/web` 을 Worker 로 실행·빌드한다

**Files:**
- Modify: `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/tsconfig.json`, 루트 `package.json`
- Create: `apps/web/wrangler.jsonc`, `apps/web/workers/app.ts`, `apps/web/app/entry.server.tsx`, `apps/web/.dev.vars.example`
- Delete: `apps/web/.env.example`

**Interfaces:**
- Consumes: Task 1 의 `getEnv`, `isReady`.
- Produces: `context.cloudflare.env`·`ctx` 를 받는 로드 컨텍스트 타입(공식 템플릿의 `AppLoadContext` 선언), `pnpm deploy:dry`, `pnpm cf-typegen`.

- [ ] **Step 1: 의존성** — `apps/web`: `@cloudflare/vite-plugin`, `wrangler`, `@cloudflare/workers-types` 또는 `wrangler types` 산출물 추가; `@react-router/node`·`@react-router/serve` 제거. React Router·Vite 버전은 C3 React Router 템플릿이 요구하는 하한으로 맞춘다(필요하면 React Router `future` 플래그 포함). `pnpm install`.

- [ ] **Step 2: `wrangler.jsonc`** — `name: "woomi-web"`, `main: "./workers/app.ts"`, `compatibility_date`(작업일), `observability.enabled: true`, `vars.APP_ENV: "production"`, `env.preview.vars.APP_ENV: "preview"`, `env.development.vars.APP_ENV: "development"`. D1·KV·R2 바인딩은 주석 예시만. secret 자리는 주석으로 "`wrangler secret put SESSION_SECRET` — 여기에 쓰지 않는다".

- [ ] **Step 3: `vite.config.ts`** — `defineConfig(({ command, isPreview }) => …)`. `command === "serve" && !isPreview` 이면 `process.env.CLOUDFLARE_ENV ??= "development"` 를 플러그인 생성 **전에** 둔다(Windows 셸에서도 `pnpm dev` 하나로 개발 환경을 고르기 위해 — npm script 의 `VAR=x` 구문은 cmd 에서 안 된다). 플러그인 순서: `cloudflare({ viteEnvironment: { name: "ssr" } })`, `tailwindcss()`, `reactRouter()`, `tsconfigPaths()`. 포트 5173 유지.

- [ ] **Step 4: 진입점** — `workers/app.ts`, `app/entry.server.tsx` 는 공식 템플릿 그대로(`renderToReadableStream`, `isbot`). 진입점에 앱 로직을 넣지 않는다.

- [ ] **Step 5: 명령** — `apps/web/package.json`: `dev: "react-router dev"`(유지), `build: "react-router build"`, `start: "vite preview"`, `deploy:dry: "wrangler deploy --dry-run"`, `cf-typegen: "wrangler types"`, `typecheck` 에 `wrangler types &&` 앞붙임. 루트 `package.json` 에 `deploy:dry`·`cf-typegen` 위임 추가. `.dev.vars.example`: 기존 `.env.example` 의 `SESSION_SECRET` 설명을 옮기고 "로컬은 비워 둬도 된다" 를 유지.

- [ ] **Step 6: 개발 서버 확인 (`.dev.vars` 없이)** — `apps/web/.dev.vars` 가 없는 상태에서 `pnpm dev` → `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/login` 이 `200`. 브라우저로 로그인 → 대시보드, 사이드바 버전 배지가 CHANGELOG 최상단 버전과 같다. 변경 이력 화면이 본문을 보인다. 이어서 `.dev.vars` 에 32자 `SESSION_SECRET` 을 두고 dev 서버를 다시 띄워 로그인 → 값을 바꿔 다시 띄우면 로그인 화면으로 돌아간다(세션 서명에 그 값이 실제로 쓰인다는 확인).

- [ ] **Step 7: 운영 규칙 확인** — `.dev.vars` 없이 `pnpm build && pnpm start` → `/login` POST(로그인)가 500. `.dev.vars` 에 32자 `SESSION_SECRET` 을 두고 다시 `pnpm build && pnpm start` → 로그인 성공. 두 결과를 PR 본문에 적는다.

- [ ] **Step 8: 정적 검사** — `pnpm format:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm deploy:dry && pnpm env:check` 전부 통과. 이어서 `wrangler.jsonc` 의 `vars` 에 `SESSION_SECRET: "x"` 를 임시로 넣어 `pnpm env:check` 가 `wrangler-var-secret` 으로 FAIL 하는지 보고 되돌린다.

- [ ] **Step 9: 커밋** — `feat(web): 스캐폴드를 Cloudflare Worker 로 실행·빌드한다`

### Task 3: health 라우트와 정적 자산 위생

**Files:**
- Create: `apps/web/app/routes/api.health.ts`, `apps/web/public/_headers`, `apps/web/public/.assetsignore`, `scripts/assets-check.mjs`
- Modify: `apps/web/app/routes.ts`, 루트 `package.json`(`assets:check`)

**Interfaces:**
- Consumes: Task 1 `getEnv`, `isReady`.
- Produces: `GET /api/health`; `node scripts/assets-check.mjs [--dir apps/web/build/client] [--selftest]` — 금지 파일(`wrangler.json*`, `package.json`, `.dev.vars*`, `*.md`) 또는 CHANGELOG 최상단 `## [` 헤딩 줄 전체가 든 파일이 있으면 exit 1, 위반을 파일별로 출력.

- [ ] **Step 1: 실패하는 selftest** — `assets-check.mjs --selftest` 사례: 깨끗한 목록 통과 / `package.json` 포함 실패 / `.dev.vars` 포함 실패 / JS 파일 본문에 `## [2.33-draft] - 2026-11-26` 포함 실패 / `.assetsignore`·`_headers` 자체는 통과. 순수 판정 함수 `check(files: {path, text}[], changelogHeading: string): string[]` 를 export 하고 selftest 가 그것을 부른다(저장소의 다른 검사 스크립트와 같은 형태).

- [ ] **Step 2: 실패 확인** — `node scripts/assets-check.mjs --selftest` → 구현 전 FAIL.

- [ ] **Step 3: 구현** — 위 Interfaces 대로. 머리말에 "보지 않는 것: 서버 번들, 소스맵 업로드 여부" 를 적는다.

- [ ] **Step 4: health 라우트** — `routes.ts` 에 `route("api/health", "routes/api.health.ts")` 를 `layout` 밖에 둔다(로그인 불필요). loader 만: `isReady(getEnv())` 면 `Response.json({ status: "ok", env: e.APP_ENV })`, 아니면 `Response.json({ status: "not_ready" }, { status: 503 })` + `console.error` 로 빠진 변수 이름 기록. 응답 헤더 `Cache-Control: no-store`.

- [ ] **Step 5: `_headers`·`.assetsignore`** — `_headers`: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`; `/*` → `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Content-Security-Policy-Report-Only: default-src 'self'`. `.assetsignore`: `*.md`, `package.json`, `wrangler.json*`, `.dev.vars*`, `scripts/`.

- [ ] **Step 6: 확인** — `node scripts/assets-check.mjs --selftest` PASS. `pnpm build && pnpm assets:check` PASS. `apps/web/public/` 에 `package.json` 사본을 임시로 넣고 빌드 → `assets:check` FAIL 확인 후 제거. `pnpm dev` 에서 `curl -i http://localhost:5173/api/health` → `200`, 본문 `{"status":"ok","env":"development"}`. Task 2 Step 7 의 secret 없는 운영 빌드에서 → `503`, 본문에 `SESSION_SECRET` 문자열 없음.

- [ ] **Step 7: 커밋** — `feat(web): health 라우트와 정적 자산 위생 검사를 넣는다`

### Task 4: PR 검사와 배포 워크플로

**Files:**
- Modify: `.github/workflows/pr-checks.yml`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `pnpm deploy:dry`, `pnpm assets:check`, `/api/health`.

- [ ] **Step 1: `pr-checks`** — "빌드" 다음에 `정적 자산 검사`(`pnpm assets:check`)와 `배포 설정 검사`(`pnpm deploy:dry`) 단계를 더한다. "훅 자체 점검" 옆에 `node scripts/assets-check.mjs --selftest`.

- [ ] **Step 2: `deploy.yml`** — 트리거: `pull_request`(main 대상), `push`(main). `concurrency: deploy-${{ github.ref }}`, `permissions: contents: read, pull-requests: write`. 첫 단계에서 `env.CLOUDFLARE_API_TOKEN` 과 `CLOUDFLARE_ACCOUNT_ID` 가 비었는지 보고 `has_account` 출력. 비었으면 `$GITHUB_STEP_SUMMARY` 에 "배포 건너뜀 — Cloudflare 계정 정보 없음" 을 쓰고 나머지 단계를 `if: steps.<id>.outputs.has_account == 'true'` 로 건너뛴다. `pull_request_target` 은 쓰지 않는다.
  - PR: `CLOUDFLARE_ENV=preview pnpm build` → `cloudflare/wrangler-action` 으로 `versions upload --preview-alias pr-${{ github.event.pull_request.number }}`(작업 디렉터리 `apps/web`).
  - main: `pnpm build`(최상위 = production) → `wrangler deploy`.
  - 배포 뒤: wrangler-action 출력(`deployment-url` 또는 `command-output` 에서 URL 추출)으로 `curl -fsS <url>/api/health`. 503 이면 "secret 미등록 — DEPLOYMENT.md 첫 배포 순서 참고" 를 출력하고 실패.
  - action 버전은 고정 태그(`@v3` 이상 최신 메이저, 저장소의 다른 action 과 같은 방식)로.

- [ ] **Step 3: 로컬 문법 확인** — `actionlint` 가 설치돼 있으면 `actionlint .github/workflows/deploy.yml .github/workflows/pr-checks.yml` → 출력 없음. 없으면 "건너뜀(actionlint 없음)" 으로 기록하고 Step 4 의 실제 CI 결과로 대신한다.

- [ ] **Step 4: PR CI 에서 확인 (push 는 사용자 승인 후)** — 이 저장소(계정 정보 없음)의 PR 에서 `deploy` 잡이 성공으로 끝나고 요약에 "배포 건너뜀" 이 있는지, `pr-checks` 의 새 두 단계가 실제로 돌았는지(`gh run view --json jobs` 의 step 이름·결과) 확인. 스킵된 것을 통과로 세지 않도록 step 결과를 그대로 PR 본문에 옮긴다.

- [ ] **Step 5: 커밋** — `ci: Worker 배포 워크플로와 배포 설정·자산 검사를 넣는다`

### Task 5: 문서·CHANGELOG·위키

**Files:**
- Modify: `.agents/DEPLOYMENT.md`(4.1·4.2·7·8장, 첫 배포 순서, Access 절차), `AGENTS.md`(2장 환경변수 행·7장 명령), `README.md`, `apps/web/README.md`, `.claude/commands/onboard.md`, `docs/브라우저-검증-절차.md`, `.claude/rules/env.md`, `CHANGELOG.md`, `docs/ai/designs/2026-11-26-harness-gates.md`, `docs/ai/designs/2026-11-26-cloudflare-worker-scaffold.md`(상태·검증 결과), `wiki/log.md`, `wiki/rules/deployment.md`

- [ ] **Step 1: 옛 안내 찾기** — `grep -rn "\.env\.example\|react-router-serve\|NODE_ENV\|process\.env" --include=*.md . | grep -v node_modules | grep -v CHANGELOG` 결과를 전부 처리하거나 "그대로 둠(이유)" 으로 표시.

- [ ] **Step 2: DEPLOYMENT.md** — 4.2 를 "스캐폴드의 실제 파일" 표로. 첫 배포 순서(배포 → 각 Worker 에 `wrangler secret put SESSION_SECRET`(승인) → health 재확인). 프리뷰는 별도 Worker `woomi-web-preview` 이고 secret 을 따로 둔다는 것과 이유(4장 재사용 금지). Access 는 대시보드 절차만. 8장에 `deploy.yml` 동작과 계정 정보 없을 때 건너뜀.

- [ ] **Step 3: CHANGELOG `2.33-draft`** — 추가·변경·수정·확인하지 못한 것(실제 배포·Access)·"분기한 프로젝트가 가져갈 때"(바뀌는 명령·파일 표: `.env`→`.dev.vars`, `NODE_ENV`→`APP_ENV`, `pnpm start` 의미, 필요한 GitHub secret 2개). 버전·최종 수정일은 `AGENTS.md` §10 대로.

- [ ] **Step 4: 선행 설계 정리** — `2026-11-26-harness-gates.md`: 상태 확정, 원본 연구문서 링크, 검증 절 "하지 못한 것" 중 워크플로 러너 실행을 "PR #42 CI·main 11-26 11:12(KST) `db-checks` 성공" 으로, 원본 3단계 도입 절차 대응표(1단계: 대부분, 2단계: DB 일부 + 이번 Worker, 3단계: 미착수) 추가.

- [ ] **Step 5: 위키** — `wiki/log.md` 에 2026-11-26 항목(한 것·정한 것과 이유·확인 못 한 것·역할/모델 표), `wiki/rules/deployment.md` 갱신, `wiki/index.md` 한 줄.

- [ ] **Step 6: 확인** — `pnpm format:check` PASS, Step 1 grep 재실행 결과에 처리 안 된 줄 없음.

- [ ] **Step 7: 커밋** — `docs: Worker 스캐폴드 기준으로 배포·실행 문서를 고친다 (2.33-draft)`
