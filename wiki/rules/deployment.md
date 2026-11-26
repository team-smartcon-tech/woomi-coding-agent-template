---
type: rule
updated: 2026-11-27
tags: [area/배포]
---

# 배포

배포 환경·secret·Cloudflare/Wrangler 운영 규칙. "배포는 코드 변경보다 위험하다. 에이전트는 사용자 승인 없이 자동 배포하지 않는다."

## 환경 분리

모든 프로젝트는 최소 세 환경(local / dev·staging / production)을 구분하고, Worker명·DB URL·R2·KV·Queue·Service Binding·secret을 환경별로 분리한다.

Wrangler의 `env.dev`/`env.staging`은 top-level 설정을 **자동 상속하지 않는다** — vars·kv_namespaces·r2_buckets·services 등을 환경별로 다시 선언한다. dev/staging이 production 리소스를 바라보게 두지 않는다.

## Worker 구성

`wrangler.jsonc` 기준으로 배포한다. 규모·도메인 수에 따라 단일 Worker 통합 또는 여러 Worker 분리를 선택하고, Worker 간 내부 호출은 외부 URL `fetch`보다 Service Binding을 우선한다 — [계층 아키텍처](layered-architecture.md).

R2는 production/dev bucket을 분리하고, private 파일은 인증 없이 signed URL을 발급하지 않는다. 경로는 `{feature}/{ownerId or siteId}/{uuid}.{ext}` 우선.

## 배포 전 확인

`git status`/`git fetch`/`git status -sb` → `pnpm lint/typecheck/test/build` → dry-run(`pnpm --filter <worker-package> run deploy:dry`). 미커밋·untracked·ahead/behind·검증 실패·dry-run 실패·production secret 누락·dev가 prod 리소스 참조·문서와 `package.json` 불일치면 배포를 보류한다.

이 스캐폴드(3.0-draft 부터)에는 `pnpm deploy:dry`(계정 없이 번들·설정 검증)와 `pnpm assets:check`(정적 자산에 금지 파일·CHANGELOG 헤딩이 새지 않았는지)가 있다. 없는 명령을 만들어 채우지 않는다. 건너뛴 검증은 배포 보고에 명시한다 — [테스트와 검증](testing.md), [기술 스택](stack.md).

배포 명령 컨벤션: `pnpm deploy`(production) / `deploy:dry` / `deploy:dev` / `deploy:dev:dry`. 명령 이름은 `package.json`과 `README.md`에서 일치해야 한다. 이 스캐폴드에 실제로 있는 것은 `deploy:dry` 뿐이고 배포는 `deploy.yml` 이 한다.

## Secret

secret 하드코딩, `.env` 실제 값 커밋, 프론트엔드에 service role key 노출, production secret의 dev/staging 재사용 금지. Worker secret은 Cloudflare Worker Secrets(`wrangler secret put ...`)에 저장하고 환경마다 다른 값을 둔다 — [절대 금지·필수 규칙](non-negotiable-rules.md). **이 스캐폴드에서는 `--env` 가 아니라 `--name woomi-web` / `--name woomi-web-preview` 로 Worker 를 직접 지정한다** — 로컬 빌드 뒤에는 `--env` 가 무시되어 운영 secret 을 덮어쓴다(아래 "스캐폴드의 Worker 배포"). `--env` 로 나누는 방식은 Vite 플러그인을 쓰지 않는 Worker 프로젝트에만 맞다.

환경변수는 한 모듈에서 Zod 로 읽는다(스캐폴드 기준: `apps/web/app/shared/config/env.server.ts`, 로직은 `env.schema.ts`). **Worker 에는 기동 실패가 없어서** 운영·프리뷰(`APP_ENV`)에서 `SESSION_SECRET` 이 없으면 처음 쓰는 요청이 실패한다 — 세션 500, `GET /api/health` 503. 변수를 추가하면 스키마·예시 파일(`.dev.vars.example`)·배포 secret 세 곳을 고치는데, 앞의 둘은 `pnpm env:check` 가 PR 에서 대조하고 **셋째는 기계가 확인하지 못한다**. secret 계열 이름을 `wrangler` 의 `vars` 에 넣는 것, secret 을 문자열 기본값으로 대체하는 것도 같은 검사가 잡는다(2.32-draft).

secret 이 저장소에 올라갔으면 지우는 커밋으로 끝내지 않는다 — 폐기·재발급이 먼저다. 시크릿 스캔은 로컬 훅과 CI 가 같은 `scripts/secret-scan.mjs` 를 돈다. 훅은 꺼져 있을 수 있어서다(분기 저장소 16곳 중 5곳에 `.githooks/` 가 없었다).

## 스캐폴드의 Worker 배포 (3.0-draft)

`apps/web` 이 Cloudflare Worker 하나다(`wrangler.jsonc`: 운영 `woomi-web`, 프리뷰 `woomi-web-preview`). 규칙의 핵심만 적는다 — 파일 표·첫 배포 순서·Access 절차는 원본 [`DEPLOYMENT.md`](../sources/deployment.md) 4.2·4.4·4.5 에 있다.

- **프리뷰는 별도 Worker 이고 secret 도 따로 둔다.** 운영 Worker 의 버전으로 올리면 PR 코드가 운영 `SESSION_SECRET` 을 쓰게 되어 "production secret 재사용 금지" 를 어긴다.
- **환경은 빌드 때 `CLOUDFLARE_ENV` 로 고른다.** 최상위 `APP_ENV` 가 `production` 이라 환경을 빠뜨린 배포는 운영 규칙(secret 필수)을 받는다.
- **첫 배포는 실패하는 것이 정상 경로다.** 운영 배포(health 503) → 프리뷰 Worker 생성(PR 경로는 `versions upload` 뿐이라 없는 Worker 에는 업로드 오류로 실패한다. `wrangler secret put … --name woomi-web-preview` 의 초안 생성 확인으로 만든다, 승인) → 각 Worker 에 secret → health 200 확인.
- **secret 은 `--name woomi-web` / `--name woomi-web-preview` 로 지정한다.** 로컬 빌드 뒤에는 `--env preview` 가 무시되어 운영 secret 을 덮어쓴다. `--name` 과 `--env` 는 같이 쓰지 않는다. 버전만 올린 Worker 는 `wrangler versions secret put` (wrangler 4.168.0 소스 읽기 근거, 실행 확인 아님).
- `deploy.yml` 은 `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID` 가 없으면 "배포 건너뜀" 으로 통과한다 — 통과가 아니라 **미검증**이다.
- `.dev.vars` 가 있는 채로 만든 `build/` 는 secret 을 품는다. 배포·공유하지 않는다.
- 확인하지 못한 것: 실제 배포·Access, `deploy.yml` 의 배포 경로(계정 정보 없음 → 건너뜀 경로만 PR #43 러너에서 확인), `_headers`(정적 자산 응답용 — SSR 화면은 `entry.server.tsx` 가 같은 헤더를 건다)·`.assetsignore` 의 Cloudflare 쪽 동작. Access 를 걸면 `deploy.yml` 의 health 단계도 막힌다.

## CI/CD

기본값은 GitHub Actions(`main → production`). Cloudflare Git Integration/Workers Builds는 개인·프로토타입·소규모에 한해 예외 허용하되, 예외라도 PR 리뷰·검증·환경별 secret 분리·production 승인·문서화는 생략할 수 없다. GitHub Actions와 Cloudflare 자동 배포를 동시 활성해 중복 배포되는 상태로 merge하지 않는다.

## Rollback

rollback도 승인 없이 실행하지 않는다 — 영향 범위·되돌릴 대상을 보고한 뒤 승인받는다. DB가 얽힌 rollback은 [마이그레이션](migration.md)의 rollback 계획을 먼저 확인한다(코드 rollback만으로 복구가 안 될 수 있다).

## 함께 보기

- [절대 금지·필수 규칙](non-negotiable-rules.md)
- [작업 흐름](workflow.md)
- [테스트와 검증](testing.md)
- [기술 스택](stack.md)
- [마이그레이션](migration.md)
- [도구 사용 기준](tooling.md)
- [진입 규칙](agents-entry.md)

## 출처

- [원본 · .agents/DEPLOYMENT.md](../sources/deployment.md)
