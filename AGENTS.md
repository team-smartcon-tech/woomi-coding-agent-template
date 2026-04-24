# AGENTS.md

이 문서는 `data-sense-be` 저장소의 에이전트 작업 기준서다.
핵심 목적은 **현재 코드베이스(NestJS + Cloudflare Worker + Drizzle)** 기준으로 안전하게 작업하고,
`news-sense-be` 계열의 스케줄러/뉴스 도메인 이식 시에도 일관된 기준으로 변경하도록 돕는 것이다.

- 최종 수정일: 2026-04-24

## 0. Project Overview

이 프로젝트는 NestJS 애플리케이션을 Cloudflare Worker 런타임에서 실행하고,
PostgreSQL(Supabase 포함 가능)과 Drizzle ORM을 통해 데이터 계층을 관리한다.

이 저장소는 다음 2가지 관점을 함께 가진다.

- 현재 기준: Worker + Drizzle 기반 백엔드 골격
- 이식 기준: `news-sense-be`의 스케줄링/수집/알림 도메인 확장

---

## 1. Tech Stack

### Backend / Runtime

- NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- Cloudflare Workers (`wrangler`)
- TypeScript 5

### Database

- PostgreSQL (`pg`)
- Drizzle ORM / Drizzle Kit

### Infra / DevOps

- Docker (이식 소스의 Node 22 dockerfile 기준)
- Wrangler deploy/dev

---

## 2. How to Run / Build / Test

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run start:dev
npm run start:cf:dev
```

### Build / Deploy

```bash
npm run build
npm run build:cf
npm run deploy:cf
```

### Test

```bash
npm run test
npm run test:e2e
npm run test:cov
```

### DB

```bash
npm run db:generate
npm run db:migrate
npm run db:push
```

---

## 3. Directory Structure (Summary)

```text
src/
  app.module.ts
  main.ts
  worker.ts
  database/
    db.module.ts
    schema.ts
  domains/
    identity/
      auth/
      users/
  observability/
    metrics/
.agents/
  ARCHITECTURE.md
  STACK.md
  WORKFLOW.md
  code/
    CODE_STYLE.md
    PROJECT_STRUCTURE.md
    TESTING.md
    ERROR_HANDLING.md
    NEST_GUIDE.md
    NEST_CF_WORKER.md
  data/
    DB_SCHEMA.md
    DOMAIN_MODEL.md
    API_CONTRACT.md
  ui/
    DESIGN.md
    COMPONENTS.md
    UX_RULES.md
AGENTS.md
```

---

## 4. Agent Reading Order (IMPORTANT)

1. `AGENTS.md` (이 문서)
2. `src/app.module.ts`, `src/worker.ts`, `src/database/*`
3. `.agents/ARCHITECTURE.md`
4. 작업 유형별 `.agents/*` 문서
5. 작업 시작 전 `.claude/commands/`·`.claude/skills/`·`.codex/prompts/`·`.codex/skills/`·`.github/prompts/`·`.github/instructions/` 확인

---

## 5. Task Routing Rules (CRITICAL)

### 5.1 새로운 화면 / UI 생성

1. `.agents/ARCHITECTURE.md`
2. `.agents/ui/DESIGN.md`
3. `.agents/ui/COMPONENTS.md`
4. `.agents/code/CODE_STYLE.md`

### 5.2 API / Backend 로직 구현

1. `.agents/ARCHITECTURE.md`
2. `.agents/data/DB_SCHEMA.md`
3. `.agents/code/CODE_STYLE.md`
4. `.agents/code/ERROR_HANDLING.md`

### 5.3 공통 컴포넌트 생성

1. `.agents/ui/COMPONENTS.md`
2. `.agents/ui/DESIGN.md`
3. `.agents/code/CODE_STYLE.md`

### 5.4 데이터 구조 / DB 변경

1. `.agents/data/DB_SCHEMA.md`
2. `.agents/data/DOMAIN_MODEL.md`
3. `.agents/code/PROJECT_STRUCTURE.md`
4. `.agents/code/TESTING.md`

---

## 6. Core Development Rules (MUST FOLLOW)

### 6.1 구조 준수

- 기존 디렉토리/레이어를 임의로 재배치하지 않는다.
- 새 모듈 도입 시 `app.module.ts` 조립 규칙을 따른다.

### 6.2 재사용 우선

- 기존 서비스/유틸/스키마를 먼저 확인한다.
- 중복 구현을 금지한다.

### 6.3 Worker/Nest 호환성

- `wrangler.jsonc`의 Worker 실행 핵심 설정(`alias`, `nodejs_compat`)은 근거 없이 제거하지 않는다.
- `src/worker.ts`의 요청 라우팅과 에러 매핑 규칙을 깨지 않는다.

### 6.4 DB 변경 규칙

- `src/database/schema.ts` 변경 시 Drizzle 명령(`db:generate`, `db:migrate` 또는 `db:push`)을 함께 수행한다.
- `DATABASE_URL`/SSL 설정을 무시한 하드코딩을 금지한다.

### 6.5 이식 작업 규칙 (news-sense-be 계열)

- 스케줄링 변경은 `task + schedule + scheduler`를 한 단위로 검토한다.
- 컨트롤러/서비스 수정 시 등록(register)과 정리(cleanup/remove) 경로를 함께 수정한다.
- 문서와 코드가 다르면 실제 코드(`src/*`, `package.json`, `nest-cli.json`)를 우선한다.

---

## 7. Forbidden Actions (DO NOT)

- 근거 없이 라이브러리 추가
- 기존 구조를 무시한 파일 생성
- Worker 호환 설정(`wrangler.jsonc`) 임의 제거
- DB 스키마 문서/마이그레이션 절차 없이 변경
- 스케줄 등록 로직만 수정하고 해제/정리 로직 누락

---

## 8. Output Requirements

### 8.1 코드 생성 시

- 파일 경로 명시
- 전체 코드 또는 적용 가능한 완결된 패치 제공
- 필요한 import 포함

### 8.2 수정 작업 시

- 변경 전/후 요약
- 영향 범위(모듈/환경변수/명령) 설명

### 8.3 DB/스케줄 작업 시

- 실행한 Drizzle/테스트 명령 명시
- 런타임 영향(Worker dev/prod, cron 등록 흐름) 설명

---

## 9. Conflict Resolution Priority

문서 간 충돌 발생 시 우선순위:

1. 실제 코드 및 설정 파일 (`src/*`, `package.json`, `wrangler.jsonc`, `drizzle.config.ts`)
2. `AGENTS.md`
3. `.agents/ARCHITECTURE.md`
4. `.agents` 하위 영역 문서
5. 예시 문서

---

## 10. General Guidelines

- 기존 패턴을 먼저 분석한다.
- 추측 구현 대신 코드/설정 근거 기반으로 작업한다.
- 불확실한 가정은 명시한다.
- 최소 변경으로 목적을 달성한다.

---

## 11. Agent Behavior Summary

1. 작업 유형 분류
2. 필수 문서/코드 선확인
3. 기존 패턴 분석
4. 규칙 준수 구현
5. 결과/영향 범위 보고

---

## 12. Harness Layers

이 저장소는 `.userdocs/harness-engineering/` 가이드를 따르는 4계층 하네스를 갖춘다.

| 계층 | Claude Code | Codex CLI | GitHub Copilot |
|---|---|---|---|
| Commands | `.claude/commands/` | `.codex/prompts/` | `.github/prompts/` |
| Skills | `.claude/skills/` | `.codex/skills/` | `.github/instructions/` |
| Rules | `AGENTS.md`, `.agents/` | `AGENTS.md`, `.agents/` | `AGENTS.md`, `.agents/` |
| Hooks | `.claude/settings.json` + `.githooks/` | `.githooks/` | `.githooks/` |

에이전트는 작업 시작 전 해당하는 Command/Skill 존재 여부를 먼저 확인한다.

---

## 13. NestJS Stack Routing (ADD-ON)

프로젝트 스택이 NestJS일 경우 아래 문서를 추가로 필수 참조한다.

1. `.agents/code/NEST_GUIDE.md`
2. `.agents/code/PROJECT_STRUCTURE.md`
3. `.agents/code/CODE_STYLE.md`
4. `.agents/code/TESTING.md`

특히 controller/service/module/entity 책임 분리를 우선한다.

---

## 14. NestJS + Cloudflare Worker Guide (ADD-ON)

NestJS를 Cloudflare Worker 런타임에서 운용하거나 Supabase + Drizzle 구성이 포함된 작업이면 아래를 추가 확인한다.

1. `.agents/code/NEST_CF_WORKER.md`
2. `.agents/code/NEST_GUIDE.md`
3. `.agents/code/PROJECT_STRUCTURE.md`
4. `.agents/code/CODE_STYLE.md`
5. `.agents/code/TESTING.md`

구현 전 우선 검토 항목:

- `wrangler.jsonc`의 alias/호환 설정
- `drizzle.config.ts`의 `DATABASE_URL`/SSL/경로 설정
- `src/database/schema.ts` 작성 규칙
- `package.json`의 Cloudflare/Drizzle 실행 명령

