# DEPLOYMENT.md

이 문서는 Woomi 프로젝트의 배포 환경, secret, Cloudflare/Wrangler 운영 규칙을 정리한다.

배포는 코드 변경보다 위험하다. 에이전트는 사용자 승인 없이 자동 배포하지 않는다.

---

## 1. Environments

모든 프로젝트는 최소 세 환경을 구분한다.

| 환경 | 목적 | 배포 대상 | 원칙 |
|---|---|---|---|
| local | 개발자 로컬 실행 | local dev server | 실제 운영 secret 사용 금지 |
| dev/staging | 배포 전 검증 | Cloudflare dev/staging | 운영 데이터와 분리 |
| production | 실제 사용자 서비스 | Cloudflare production | 배포 전 승인 필요 |

환경별로 분리해야 하는 것:

- Worker/Page name
- Supabase project 또는 DB URL
- R2 bucket
- KV namespace
- Queue
- Service Binding target
- Cron trigger 필요 여부
- secret 값

---

## 2. Cloudflare Deployment Model

Cloudflare 프로젝트는 `wrangler.jsonc`를 기준으로 배포한다.

모노레포는 저장소 통합 전략이지 단일 배포 단위를 뜻하지 않는다. 프론트엔드와 백엔드가 같은 레포에 있어도 Cloudflare 배포는 하나의 Worker로 합칠 수도 있고, 여러 Worker로 분리 배포한 뒤 Service Binding으로 연결할 수도 있다.

선택 기준:

| 프로젝트 유형 | 권장 배포 방식 | 기준 |
|---|---|---|
| 작은 앱, MVP, 내부 도구 | 하나의 Worker 통합 배포 | 프론트, API, assets가 작고 도메인이 적은 경우 |
| 중대형 앱, 도메인이 많은 서비스 | gateway-worker + domain workers 분리 배포 | API 책임이 많고 RAG/AI/파일/권한 같은 리소스 경계가 필요한 경우 |
| 이미 service binding으로 나뉜 기존 프로젝트 | 분리 배포 유지 | 모노레포로 합치더라도 실행/배포 단위는 유지 |

배포 형태 예:

```txt
통합 배포:
apps/web
apps/worker
-> one Cloudflare Worker
   - static assets
   - /api/*
   - DB/storage access

분리 배포:
Browser
  -> gateway-worker
      -> ASSETS
      -> API_SERVICE
      -> RAG_SERVICE
      -> FILE_SERVICE
```

분리 배포에서는 Worker 간 내부 호출에 Service Binding을 우선 사용한다. gateway-worker는 다른 Worker의 내부 코드를 직접 import하지 않는다.

필수 항목:

```txt
Worker/Page name:
Wrangler config path:
Main entry:
Compatibility date:
Compatibility flags:
Assets binding:
Service bindings:
KV namespaces:
R2 buckets:
Queues:
Cron triggers:
Workers AI binding:
Observability:
```

프로젝트별 실제 구조는 `wrangler.jsonc`와 `README.md`에 명시한다.

---

## 3. Wrangler Environment Rules

Wrangler의 `env.dev` 또는 `env.staging`은 top-level 설정을 모두 자동 상속하지 않는다.

다음 항목은 환경별로 다시 선언해야 한다.

```txt
vars
kv_namespaces
r2_buckets
services
ai
assets
observability
triggers
build
```

규칙:

- production 기본값은 top-level에 둔다.
- dev/staging은 `env.dev`, `env.staging`에 명시한다.
- dev/staging이 production 리소스를 바라보지 않게 한다.
- dev build가 production `.env`를 박지 않도록 build command를 환경별로 분리한다.
- Cloudflare Vite 플러그인을 쓰는 Worker 는 환경을 **빌드할 때** `CLOUDFLARE_ENV` 로 고른다. `deploy`·`versions upload` 는 빌드가 만든 출력 설정을 읽으므로 `--env` 를 넘기지 않는다(`.github/workflows/deploy.yml` 이 이 방식이다). 이 스캐폴드는 최상위가 운영이고 `env.preview`·`env.development` 가 덮는다.
- service binding은 환경별 대상 Worker를 분리한다.

예:

```jsonc
{
  "name": "my-app",
  "services": [
    { "binding": "API", "service": "my-api" }
  ],
  "env": {
    "dev": {
      "name": "my-app-dev",
      "services": [
        { "binding": "API", "service": "my-api-dev" }
      ]
    }
  }
}
```

---

## 4. Vars, Secrets, Env Files

구분:

| 종류 | 예 | 저장 위치 |
|---|---|---|
| public build env | `VITE_PUBLIC_*` | `.env.development`, `.env.production`, CI vars |
| Worker vars | 모델명, feature flag, public URL | `wrangler.jsonc` `vars` |
| Worker secrets | service role key, JWT secret, API key | Cloudflare Worker Secrets |
| local sample | 필요한 key 목록 | Node 서버는 `.env.example`, Worker(이 스캐폴드)는 `apps/web/.dev.vars.example` |
| Worker local secrets | 로컬 실행용 값 | `.dev.vars` (커밋 금지) |

금지:

- secret을 코드에 하드코딩
- `.env` 실제 값을 커밋
- 프론트엔드에 service role key 노출
- production secret을 dev/staging에 재사용
- Supabase URL/anon key를 여러 파일에 흩뿌리기
- secret 계열 이름(`*_SECRET`, `*_SERVICE_ROLE_KEY`, `*_TOKEN`, `*_API_KEY`)을 `wrangler.jsonc` 의 `vars` 에 넣기 — `vars` 는 평문으로 커밋된다
- secret 을 읽다가 값이 없으면 문자열 기본값으로 대체하기 (`?? "dev-secret"`)
- 브라우저로 나가는 접두사(`VITE_`, `NEXT_PUBLIC_`)에 secret 붙이기
- 에이전트가 `.env`·`.dev.vars` 를 열어 보게 하기 — 필요한 이름은 예시 파일에서 본다

### 4.1 환경변수는 한 곳에서 읽는다

서버 코드는 환경변수를 한 모듈에서 Zod 로 읽는다. 스캐폴드의 기준 구현은 `apps/web/app/shared/config/env.server.ts`(`getEnv()`·`getSessionSecret()`, Worker 의 `cloudflare:workers` `env` 를 읽는다)이고 순수 판정 로직은 `env.schema.ts` 에 있다. 이 모듈 밖에서 `process.env` 와 `cloudflare:workers` 의 `env` 를 읽으면 ESLint 가 막는다.

**Worker 에는 "기동 실패" 가 없다.** 값이 없다고 배포가 멈추지 않으므로, 필수 secret(`SESSION_SECRET`, 32자 이상)이 없는 상태는 **그 값을 처음 쓰는 요청**에서 드러난다.

| `APP_ENV` | `SESSION_SECRET` 없음 |
|---|---|
| `production`·`preview` | 세션을 쓰는 요청 500, `GET /api/health` 503 |
| `development` | 격리 단위(isolate)마다 임시 무작위 값 — 로컬 개발이 `.dev.vars` 없이 뜬다 |

`APP_ENV` 는 `wrangler.jsonc` 의 공개 값이다(최상위 `production`). 환경 선택을 빠뜨린 배포가 운영 규칙(secret 필수)을 받도록 닫힌 쪽이 기본이다. Worker 에서 `NODE_ENV` 는 빌드 시 치환값이라 배포 환경을 구분하지 못하므로 쓰지 않는다.

변수를 추가할 때 고치는 곳은 셋이다.

1. 스키마(`env.schema.ts` 와 `env.server.ts`)
2. 예시 파일(`apps/web/.dev.vars.example`) — 이름과 한 줄 설명만, 값은 비운다
3. 배포 환경의 secret (`wrangler secret put …`) — 사용자 승인 후, **Worker 마다**(운영·프리뷰)

1·2 가 어긋나면 `pnpm env:check`(`scripts/env-check.mjs`)가 PR 에서 실패한다. **3 은 기계가 확인하지 못한다.** 다만 `SESSION_SECRET` 은 배포 직후 health 가 503 으로 드러낸다(8.3). 새 변수의 secret 등록은 6장 배포 전 확인에 적는다.

### 4.2 스캐폴드의 실제 파일

`apps/web` 이 Worker 하나로 실행·빌드된다. 아래 파일이 실제로 있다.

| 파일 | 내용 |
|---|---|
| `apps/web/wrangler.jsonc` | Worker `woomi-web`. 최상위 `vars.APP_ENV="production"`, `env.preview`(**별도 Worker `woomi-web-preview`**, `APP_ENV="preview"`), `env.development`(로컬 전용). 바인딩과 공개 값만 — token·secret 을 적지 않는다 |
| `apps/web/workers/app.ts` | Worker 진입점. React Router 요청 처리기만 부르고 **로드 컨텍스트를 넘기지 않는다**(React Router 8 의 Cloudflare 공식 템플릿 그대로). loader 에서 `ctx.waitUntil` 이나 바인딩이 필요해지면 이 파일을 고친다 |
| `apps/web/.dev.vars.example` | 로컬 secret 의 이름 목록. 실제 `apps/web/.dev.vars` 는 `.gitignore` 가 막는다 |
| `apps/web/types.env` | `wrangler types` 가 `.dev.vars` 의 secret 이름을 `Env` 에 넣지 않게 하는 빈 파일(`--env-file`). 값을 넣지 않는다 |
| `apps/web/worker-configuration.d.ts` | `pnpm cf-typegen` 산출물을 커밋한 것. `wrangler.jsonc` 를 고치면 다시 만든다 — `pr-checks` 가 어긋남을 잡는다 |
| `apps/web/public/.assetsignore` | 정적 자산과 같이 올라가면 안 되는 것 — `wrangler.jsonc`, `package.json`, `*.md`, `.dev.vars*` |
| `apps/web/public/_headers` | 정적 자산 캐시 정책과 기본 보안 헤더. CSP 는 프로젝트가 정한다 |
| `apps/web/app/routes/api.health.ts` | `GET /api/health`. 필수 secret 이 갖춰졌으면 `200 {"status":"ok","env":…}`, 아니면 `503 {"status":"not_ready"}`. `Cache-Control: no-store`. 변수 이름·값·버전을 응답에 넣지 않는다(로그인 없이 읽힌다). 이유는 Worker 로그에만 남는다 |
| `scripts/assets-check.mjs` | `pnpm assets:check`. 빌드 결과 `apps/web/build/client` 에 금지 파일이 있거나 CHANGELOG 최상단 헤딩 줄이 새면 실패한다. CHANGELOG 에서 헤딩을 못 찾아도 실패한다. 서버 번들은 보지 않는다 |

로컬 명령(루트에서): `pnpm dev`(5173, `.dev.vars` 없이 뜬다) · `pnpm build` · `pnpm start`(`vite preview` — 빌드 결과를 로컬 workerd 로 실행, **운영 규칙이라 `SESSION_SECRET` 이 필요하다**) · `pnpm deploy:dry`(계정 없이 번들·설정 검증) · `pnpm cf-typegen` · `pnpm assets:check`. Node 는 **22.22 이상**(React Router 8 요구, `.nvmrc` 는 24).

**`.dev.vars` 가 있는 채로 만든 `build/` 는 배포·공유하지 않는다.** `vite preview` 를 위해 플러그인이 빌드할 때 `.dev.vars` 를 `build/server/.dev.vars` 로 복사한다 — secret 이 빌드 결과에 굳는다(그래서 빌드 *뒤에* `.dev.vars` 를 만들면 `pnpm start` 가 계속 500 이다). CI 빌드에는 `.dev.vars` 가 없다. 로컬에서 배포용 빌드를 만들어야 하면 `.dev.vars` 를 치우고 다시 빌드한다.

### 4.3 secret 이 저장소에 올라갔을 때

지우는 커밋으로 끝내지 않는다. 원격에 한 번 올라간 값은 이력과 포크에 남는다.

1. **폐기·재발급이 먼저다.** 해당 서비스 콘솔에서 키를 폐기하고 새 값으로 교체한다(사용자 승인).
2. 노출 시점부터 폐기까지 그 키의 사용 기록을 확인한다.
3. 이력에서 지우는 일(`git filter-repo` 후 강제 푸시)은 사용자가 직접 한다. 에이전트는 강제 푸시를 하지 않는다(`AGENTS.md` 6장).

검사 자리: 로컬 `.githooks/pre-commit` 과 CI `pr-checks` 가 같은 `scripts/secret-scan.mjs` 를 돈다. 이 검사는 알려진 형태만 보고, 키가 살아 있는지는 확인하지 않는다. public 저장소는 GitHub Secret Scanning·Push Protection 을 저장소 설정에서 켠다. private 저장소는 플랜에 따라 쓸 수 없으므로 CI 검사가 유일한 서버 쪽 장치다.

### 4.4 첫 배포 순서

Worker 를 처음 배포하는 저장소는 이 순서를 따른다. 에이전트는 `wrangler deploy`·`wrangler secret put` 을 실행하지 않는다(`AGENTS.md` 6장) — 사용자가 승인하거나 직접 한다.

1. **배포한다** — `deploy.yml`(8.3)이나 사용자가 승인한 `wrangler deploy`. 운영 Worker `woomi-web` 과 프리뷰 Worker `woomi-web-preview` 가 각각 생긴다. 이 시점 health 는 503 이고 `deploy.yml` 의 health 단계가 "secret 미등록" 으로 **실패한다 — 정상 경로다.**
2. **각 Worker 에 secret 을 올린다**(사용자 승인). 값은 32자 이상 무작위 문자열이고, **운영과 프리뷰는 서로 다른 값**이다.
3. **health 를 다시 확인한다** — 200 `{"status":"ok",…}` 이어야 한다. `deploy.yml` 을 다시 돌려도 된다.

```bash
cd apps/web
wrangler secret put SESSION_SECRET                 # 운영 Worker (woomi-web)
wrangler secret put SESSION_SECRET --env preview   # 프리뷰 Worker (woomi-web-preview)
```

프리뷰가 별도 Worker 인 이유: 운영 Worker 의 버전으로 올리면 PR 코드가 운영 `SESSION_SECRET` 을 쓰게 된다. 4장의 "production secret 을 dev/staging 에 재사용 금지" 를 어기는 구조라, 프리뷰는 자기 secret 을 따로 가진다.

위 순서와 `--env preview` 가 가리키는 Worker 이름은 실제 Cloudflare 계정에서 실행해 확인하지 **못했다**. 처음 실행한 사람이 결과를 이 절에 반영한다.

### 4.5 프리뷰에 Cloudflare Access 걸기

프리뷰 주소(`pr-<번호>-woomi-web-preview.<계정>.workers.dev` 꼴)는 URL 만 알면 열린다. 로그인 데모 계정이 화면에 적혀 있으므로, 실제 데이터를 붙이는 프로젝트는 프리뷰를 Access 로 잠근다. 저장소에서는 설정할 수 없는 **대시보드 작업**이다.

1. Cloudflare 대시보드 → Workers & Pages → `woomi-web-preview` → Settings → Domains & Routes 에서 `workers.dev` 와 Preview URLs 의 Cloudflare Access 를 켠다(또는 Zero Trust → Access → Applications 에서 같은 호스트를 자체 호스팅 앱으로 등록).
2. 허용 정책을 정한다(회사 이메일 도메인 등).
3. 브라우저로 프리뷰 URL 을 열어 로그인 요구가 뜨는지 확인한다.

**알려진 충돌:** Access 가 걸린 프리뷰에는 `deploy.yml` 의 health 단계(`curl`)도 로그인 없이 못 들어간다 → 200 이 아닌 응답으로 PR 이 실패한다. Access 를 걸 때 Service Token 을 두거나 health 단계를 조정해야 한다. 이 템플릿은 어느 쪽도 넣지 않았다.

Access 화면의 이름과 위치는 바뀔 수 있고, 이 절은 실제 계정에서 따라 해 보지 못했다.

---

## 5. Bindings

### 5.1 Service Bindings

Worker 간 내부 호출은 Cloudflare Service Binding을 우선한다.

규칙:

- 내부 Worker 코드를 직접 import하지 않는다.
- 외부 URL `fetch`보다 Service Binding을 우선한다.
- binding 이름은 역할이 드러나게 작성한다.
- dev/staging/prod 대상 Worker를 분리한다.

예:

```txt
API_SERVICE -> api-worker
RAG_SERVICE -> rag-worker
AUTH_SERVICE -> auth-worker
```

### 5.2 R2

파일 업로드나 비공개 파일 저장이 필요하면 R2 bucket을 기본 storage로 설계한다.

규칙:

- production과 dev/staging bucket을 분리한다.
- binding 이름은 도메인 또는 목적이 드러나게 한다.
- private 파일은 인증 없이 signed URL을 발급하지 않는다.
- 파일 경로는 `{feature}/{ownerId or siteId}/{uuid}.{ext}` 형태를 우선한다.

### 5.3 KV / Queues / Cron / AI

리소스별로 환경 분리를 명시한다.

```txt
KV:
Queue:
Cron:
Workers AI:
```

Cron은 production과 dev/staging에서 모두 필요한지 확인한다. dev/staging cron이 운영 데이터에 영향을 주면 비활성화한다.

---

## 6. Required Checks Before Deploy

배포 안내 또는 실행 전에 반드시 확인한다.

```bash
git status
git fetch
git status -sb
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Cloudflare Worker dry-run(이 스캐폴드는 `pnpm deploy:dry` 를 제공한다. 계정 정보 없이 번들·설정만 검증하며 실제 배포는 하지 않는다):

```bash
pnpm deploy:dry
pnpm --filter <worker-package> run deploy:dry   # 패키지를 지정할 때
```

또는 프로젝트별 명령:

```bash
pnpm cf:deploy:dry
```

배포를 보류해야 하는 상태:

- 미커밋 변경 있음
- untracked 파일 있음
- remote 대비 ahead/behind 있음
- lint/typecheck/test/build 실패
- dry-run 실패
- production secret 누락
- dev/staging이 production 리소스를 바라봄
- 문서와 `package.json` 명령이 불일치

사용자에게 상태를 명시적으로 알리고 배포를 보류한다.

---

## 7. Deploy Commands

프로젝트는 아래 convention을 우선 사용한다.

```bash
pnpm deploy          # production 배포
pnpm deploy:dry      # production dry-run
pnpm deploy:dev      # dev/staging 배포
pnpm deploy:dev:dry  # dev/staging dry-run
```

Cloudflare prefix를 쓰는 프로젝트는 아래도 허용한다.

```bash
pnpm cf:deploy
pnpm cf:deploy:dry
pnpm cf:deploy:dev
pnpm cf:deploy:dev:dry
```

명령 이름은 `package.json`과 `README.md`에서 일치해야 한다.

**이 스캐폴드에 있는 것은 `deploy:dry` 뿐이다.** 실제 배포(`wrangler deploy`·`versions upload`)는 `deploy.yml`(8.3)이 하고, 로컬에서는 사용자가 승인한 경우에만 한다. 위 convention 의 나머지(`deploy`·`deploy:dev` 등)는 프로젝트가 필요해 도입할 때 맞춘다.

---

## 8. CI/CD

회사 표준 CI/CD 기본값은 GitHub Actions다.

Cloudflare Git Integration, Workers Builds, Pages Git Deploy는 개인 프로젝트, 프로토타입, 단순한 소규모 앱에서 예외로 허용할 수 있다. production 배포는 GitHub Actions를 우선한다.

### 8.1 GitHub Actions Standard

신규 프로젝트의 기본 브랜치 전략은 `main -> production`이다.

기본 전략:

| 브랜치/이벤트 | 대상 | 용도 |
|---|---|---|
| `main` | production | 실제 사용자 서비스 배포 |
| `develop` 또는 `dev` | dev/staging | 배포 전 검증 환경 |
| `feature/*` 또는 PR | preview/check only | 리뷰, lint/test/build 검증 |

기존 프로젝트가 `deploy` 브랜치를 production 배포용으로 사용 중이면 예외로 허용한다. 단, `AGENTS.md` 또는 이 문서의 Project Override에 명시해야 한다.

CI/CD를 사용하는 경우 다음을 명시한다.

```txt
Production branch: main
Dev/Staging branch:
Preview/PR trigger:
GitHub Environment for dev:
GitHub Environment for production:
Required reviewers:
```

GitHub Actions에서 secret을 동기화하는 경우:

- GitHub Environment별 secret을 분리한다.
- wrangler CLI 인증 secret과 Worker runtime secret을 구분한다.
- 배포 로그에 secret 값이 찍히지 않게 한다.
- dev/prod 배포가 같은 Worker name/R2 bucket을 쓰지 않게 한다.

### 8.2 Cloudflare CI/CD Exception

Cloudflare Git Integration, Workers Builds, Pages Git Deploy를 사용할 수 있는 경우:

- 개인 프로젝트 또는 프로토타입
- 단일 Worker/Pages로 충분한 소규모 앱
- monorepo 조건부 배포가 단순한 앱
- production 승인과 검증 흐름을 별도로 문서화한 경우

예외를 사용하더라도 생략하면 안 되는 것:

- PR 리뷰 또는 변경 승인
- lint/typecheck/test/build 검증
- 환경별 secret 분리
- production 배포 승인
- `README.md`와 `DEPLOYMENT.md` 문서화
- dev/prod Worker name, R2 bucket, KV, Service Binding 분리

금지:

- 중대형 또는 멀티 Worker production 프로젝트를 Cloudflare 대시보드 설정만으로 운영
- 대시보드에만 존재하는 빌드/배포 규칙
- 검증 없이 `main` push만으로 production 자동 배포
- GitHub Actions와 Cloudflare 자동 배포를 동시에 켜서 중복 배포가 발생하는 상태

### 8.3 deploy.yml — 이 스캐폴드의 배포 워크플로

`.github/workflows/deploy.yml`. PR(main 대상)과 main push 에서 돈다. `pull_request_target` 은 쓰지 않는다 — 포크의 코드를 저장소 secret 이 있는 권한으로 돌리게 되기 때문이다.

| 이벤트 | 빌드 | 동작 |
|---|---|---|
| PR | `CLOUDFLARE_ENV=preview` | 프리뷰 Worker(`woomi-web-preview`)에 `versions upload --preview-alias pr-<번호>`. 운영 트래픽은 옮기지 않는다 |
| main push | 최상위(production) | 운영 Worker 에 `wrangler deploy` |

두 경우 모두 이어서 `/api/health` 를 호출한다. **503 이면 "secret 미등록" 으로 실패**하고, 200 이 아니면 실패한다.

**Cloudflare 계정 정보가 없으면 건너뛰고 통과한다.** 저장소 secret `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID` 둘 중 하나라도 비어 있으면 잡 요약에 "배포 건너뜀 — Cloudflare 계정 정보 없음" 을 남기고 나머지 단계를 건너뛴다. 계정을 연결하지 않은 파생 저장소와 포크 PR 이 배포 때문에 막히지 않게 하려는 것이다. **건너뜀은 통과가 아니라 미검증이다** — 요약 문구로 구분한다. 토큰은 계정 확인 단계와 `wrangler-action` 의 `with:` 에만 둔다(잡 전체 `env` 에 두면 `pnpm install`·빌드의 의존성 스크립트에 노출된다).

필요한 GitHub secret 은 위 둘이다. 토큰 권한은 필요한 최소로 준다.

`pr-checks` 에도 배포 관련 검사가 있다(계정 불필요): `pnpm deploy:dry`, `pnpm assets:check`, `worker-configuration.d.ts` 어긋남 검사.

`deploy.yml` 은 GitHub 러너에서 **아직 실행해 보지 못했다.** 프리뷰 URL 을 `wrangler-action` 출력에서 뽑는 부분은 실제 출력 형식에 기대고 있어 첫 실행에서 확인해야 한다.

---

## 9. Rollback

rollback은 "이전 코드로 되돌리기"만 뜻하지 않는다. 배포 대상, DB migration, secret, binding, storage 변경 여부에 따라 복구 방법이 달라진다.

AI 에이전트는 rollback을 사용자 승인 없이 실행하지 않는다. 먼저 영향 범위와 되돌릴 대상을 보고한 뒤 승인을 받는다.

### 9.1 Rollback Plan

프로젝트마다 아래 항목을 채운다.

```txt
Rollback command/process:
Previous deployment id:
Cloudflare rollback method:
Data rollback needed:
DB migration rollback:
Secret rollback:
Binding rollback:
R2/KV/Queue rollback:
Expected downtime:
Owner:
```

예:

```txt
Rollback command/process:
  Worker: wrangler rollback --name <worker-name> --env production
  Pages: Cloudflare dashboard에서 이전 production deployment로 rollback

Previous deployment id:
  GitHub Actions run id 또는 Cloudflare deployment/version id

Cloudflare rollback method:
  Worker version rollback
  Pages deployment rollback

Data rollback needed:
  no / yes, reason:

DB migration rollback:
  no / yes, migration file:

Secret rollback:
  no / yes, changed secret names:

Binding rollback:
  no / yes, changed bindings:

R2/KV/Queue rollback:
  no / yes, affected resources:

Expected downtime:
  none / short / unknown

Owner:
  deployment owner name
```

### 9.2 Rollback Types

| 유형 | 되돌릴 대상 | 주의점 |
|---|---|---|
| code rollback | Worker/Pages deployment | 가장 단순하지만 DB/API 계약이 바뀐 경우 불충분할 수 있음 |
| config rollback | `wrangler.jsonc`, vars, routes, compatibility flags | 이전 deployment와 현재 binding 구성이 맞는지 확인 필요 |
| secret rollback | Worker secrets, GitHub Environment secrets | secret 값은 git diff에 남지 않으므로 별도 기록 필요 |
| DB rollback | migration, RPC, RLS, seed/backfill | 데이터 손실 위험이 있으므로 `.agents/data/MIGRATION.md` 확인 필수 |
| storage rollback | R2 object, KV value, Queue message | 파일 삭제/덮어쓰기 여부를 먼저 확인 |
| traffic rollback | gradual deployment 비율 조정 | Worker 버전/트래픽 분배 상태 확인 필요 |

### 9.3 Rollback 전 확인

```bash
git status
git fetch
git status -sb
```

확인할 것:

- 어떤 배포가 문제를 만들었는가?
- 문제 배포의 commit SHA, GitHub Actions run id, Cloudflare deployment/version id는 무엇인가?
- 이전 정상 배포 id를 알고 있는가?
- DB migration, secret, binding, R2/KV/Queue 변경이 포함되었는가?
- rollback이 자동으로 production traffic에 반영되는가?
- rollback 후 검증할 URL과 health check는 무엇인가?

rollback을 보류해야 하는 상태:

- 이전 정상 deployment id가 불명확함
- DB migration rollback 계획 없음
- secret 또는 binding 변경 내역을 모름
- rollback 대상 Worker/Page를 확신할 수 없음
- 사용자의 명시 승인 없음

### 9.4 Rollback 후 확인

rollback 후에는 다음을 확인한다.

```txt
Production URL:
Health check:
Critical API:
Auth/session:
Main user flow:
Cloudflare deployment/version:
Error logs:
```

DB migration이 포함된 배포는 코드 rollback만으로 복구되지 않을 수 있다. 이 경우 `.agents/data/MIGRATION.md`의 rollback 계획을 먼저 확인한다.

Cloudflare Worker rollback은 이전 Worker version을 활성 deployment로 바꾸는 방식이다. 중간에 KV, D1, R2, secret, binding 같은 플랫폼 리소스가 변경되었으면 코드만 되돌려도 이전 상태와 동일하지 않을 수 있다.

---

## 10. Deployment Report

배포 전 또는 배포 후 사용자에게 다음을 보고한다.

```txt
Target environment:
Git status:
Ahead/behind:
Checks run:
Dry-run result:
Bindings changed:
Secrets changed:
DB migration included:
Deploy command:
Rollback note:
```

검증하지 못한 항목은 "검증하지 못함"이라고 명시한다.
