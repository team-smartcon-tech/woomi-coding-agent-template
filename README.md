# data-sense-be

NestJS 애플리케이션을 **Cloudflare Worker 런타임**에서 구동하고,
**PostgreSQL + Drizzle ORM** 조합을 검증하기 위한 백엔드 리포지토리다.

## 핵심 구조

- Worker 엔트리: `src/worker.ts`
- Database: `src/database/*`
- Identity(Auth/Users): `src/domains/identity/*`
- Observability: `src/observability/*`

## 핵심 설정 포인트

### 1) Cloudflare Worker (`wrangler.jsonc`)

- `main`: `src/worker.ts`
- `compatibility_flags`: `nodejs_compat`
- `alias`: Worker 비호환 Nest transport/websocket 계열 모듈을 `src/empty-module.ts`로 매핑

### 2) Drizzle (`drizzle.config.ts`)

- `schema`: `./src/database/schema.ts`
- `out`: `./src/database/migrations`
- `dialect`: `postgresql`
- `dbCredentials.url`: `process.env.DATABASE_URL`

### 3) 사용자 인증/권한

- 로그인/리프레시: `src/domains/identity/auth/*`
- 유저 관리: `src/domains/identity/users/*`
- JWT 기반 Guard/Role Guard 포함

## 시작하기

```bash
npm install
```

`.env` 또는 Worker 바인딩에 최소 환경변수를 설정한다.

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

## 자주 쓰는 명령

### 실행/배포

```bash
npm run start:dev
npm run start:cf:dev
npm run start:cf:dev:remote
npm run build:cf
npm run deploy:cf
```

### Drizzle

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

### 검증

```bash
npm run build
npm run test
```

### 유틸 (비밀번호 해시 생성)

```bash
npm run gen:hash -- 10 yourPassword
```

또는 인자 없이 실행 후 프롬프트 입력:

```bash
npm run gen:hash
```

## 권장 순서

1. `npm run db:generate`
2. `npm run db:migrate` (또는 환경에 따라 `npm run db:push`)
3. `npm run start:cf:dev`
4. API 호출로 동작 확인
5. 필요 시 `npm run deploy:cf`
