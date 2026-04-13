# PROJECT_STRUCTURE.md

## 1. 프론트엔드 프로젝트 구조

### 1.1 루트 디렉토리 원칙

- 프론트엔드 루트 디렉토리 표준은 `src/`로 고정한다.
- 프로젝트/템플릿 특성상 필요한 경우에만 `app/`을 대안 명칭으로 사용할 수 있다.
- 문서/코드 리뷰/가이드에서는 기본적으로 `src/` 기준으로 설명한다.

---

### 1.2 파일 구조 (원본 트리)

```shell
src # 또는 app로 명명한다
  view # UI 요소를 담는 폴더
    components # 버튼, 리스트박스 등 컴포넌트 단위
      form.tsx
      button.tsx
      listBox.tsx
      ...
    layout # 레이아웃 구성을 담아둔 파일
      sidebarLayout.tsx
      ...
    page # 페이지 단위의 구성을 담아둔 파일
      signUpPage.tsx
      dashboardPage.tsx
      ...
  routes # 세부 라우팅 관리
    ...
  route.ts # 실제 라우팅 관리 (React Router v7방식)
  lib # 각종 API 호출, 유틸함수등을 저장
    api # 
      httpClient.ts
      user
        userApi.ts
        ...
    utils # 유틸함수 등
  types # 데이터 타입 정의
    userDto.ts
    ...
vite.config.ts # Vite 구성파일
wrangler.jsonc # wrangler 구성파일로, CloudFlare 배포와 관련있음.
workers # CloudFlare Workers 의 설정을 담음
  app.ts
```

---

### 1.3 파일 구조 (주석 포함 트리)

```shell
.
├── src/                                 # 프론트엔드 표준 루트 디렉토리 (필요 시 app 대안 사용 가능)
│   ├── view/                            # UI 계층
│   │   ├── components/                  # 버튼/리스트박스 등 재사용 가능한 UI 컴포넌트 단위
│   │   │   ├── form.tsx
│   │   │   ├── button.tsx
│   │   │   ├── listBox.tsx
│   │   │   └── ...
│   │   ├── layout/                      # 페이지 골격/레이아웃 단위
│   │   │   ├── sidebarLayout.tsx
│   │   │   └── ...
│   │   └── page/                        # 페이지 단위 화면 조합
│   │       ├── signUpPage.tsx
│   │       ├── dashboardPage.tsx
│   │       └── ...
│   ├── routes/                          # 세부 라우트 모듈 관리
│   │   └── ...
│   ├── route.ts                         # React Router v7 라우팅 엔트리/정의
│   ├── lib/                             # API 호출 및 공통 유틸 계층
│   │   ├── api/                         # API 클라이언트 계층
│   │   │   ├── httpClient.ts            # 공통 HTTP 클라이언트 설정
│   │   │   └── user/
│   │   │       ├── userApi.ts           # 사용자 도메인 API 함수
│   │   │       └── ...
│   │   └── utils/                       # 공통 유틸 함수
│   │       └── ...
│   └── types/                           # DTO/도메인 타입 정의
│       ├── userDto.ts
│       └── ...
├── vite.config.ts                       # Vite 빌드/개발 서버 설정
├── wrangler.jsonc                       # Cloudflare Workers 배포/바인딩 설정
└── workers/
    └── app.ts                           # Cloudflare Worker 엔트리 설정
```

---

### 1.4 디렉토리별 책임 설명

- `src/view/components`
재사용 가능한 UI 단위를 관리한다. 버튼, 폼, 리스트박스 등 화면 공통 요소를 배치한다.

- `src/view/layout`
레이아웃 골격을 관리한다. 사이드바/헤더/콘텐츠 영역 등 페이지 구조를 정의한다.

- `src/view/page`
페이지 단위 화면 조합을 관리한다. 라우트에 연결될 화면을 구성한다.

- `src/routes`, `src/route.ts`
React Router v7 기반 라우팅을 정의한다. `routes/`는 세부 모듈, `route.ts`는 라우팅 진입/통합 지점으로 사용한다.

- `src/lib/api`, `src/lib/api/httpClient.ts`
API 클라이언트 계층을 관리한다. `httpClient.ts`에서 공통 요청 정책을 설정하고 도메인 API 모듈에서 재사용한다.

- `src/lib/utils`
공통 유틸 함수를 관리한다. 특정 도메인에 종속되지 않는 범용 함수를 배치한다.

- `src/types`
DTO/도메인 타입을 정의한다. API 응답/요청 및 화면 모델의 타입 기준점을 제공한다.

- `vite.config.ts`
프론트엔드 번들링 및 개발 서버 설정을 관리한다.

- `wrangler.jsonc`
Cloudflare Workers 배포/실행/바인딩 설정을 관리한다.

- `workers/app.ts`
Cloudflare Worker 엔트리 또는 Worker 연동 설정 지점을 관리한다.

---

## 프론트엔드 구조 사용 규칙

1. 새 UI는 `view` 하위 책임(`components`/`layout`/`page`)에 맞춰 배치한다.
2. API 호출은 반드시 `lib/api` 계층을 통해 수행한다.
3. 타입은 `types`에서 우선 재사용하고, 중복 타입 선언을 지양한다.
4. 라우팅 변경은 `routes` 및 `route.ts`에서만 관리한다.

---

## 2. 백엔드 프로젝트 구조

### 2.1 루트 디렉토리 원칙

- 백엔드 루트 디렉토리 표준은 `src/`로 고정한다.
- HTTP 서버는 Hono 앱(`src/app.ts`)을 기준으로 구성한다.
- Cloudflare Workers 엔트리(fetch 핸들러)는 `src/index.ts`에서 관리한다.

---

### 2.2 파일 구조 (원본 트리)

```shell
src
  controllers # 도메인별 컨트롤러(요청/응답 흐름) 구성
    user
      userController.ts
      ...
    routings.ts # 전체적인 라우팅 구조를 표현함
  types # 프로젝트 내 표준 데이터타입 구성
    dto
      userDto.ts
      ...  
    env.ts # 프로젝트의 표준 환경변수 타입 설정
  lib
    utils
      commonUtils.ts # 주요 공용 유틸함수 (ex: csv 읽기 등)
      ...
    db
      dbConnection.ts # DB 연결관련 코드
  middlewares # 미들웨어 구성
    auth.ts
    ...
  app.ts # hono의 앱 구조 작성
  index.ts # Cloudflare Workers 설정 관련 코드 (fetch 등)
vite.config.ts # vite 구성 파일
worker-configuration.d.ts # worker 타입 구성 파일 (wrangler types --env-interface CloudflareBindings 타입 구성으로 생성 가능)
wranger.jsonc # wrangler 구성 파일
.env.example # 환경변수 필드 샘플파일
sql # SQL의 주요 구성과 관련된 파일
  functions # DB 함수 쿼리 모음
    select_logs.sql
    ...
  schema # DB 스키마 파일 (백업용)
    public_schema_260410.sql
    ...
  statements # 직접 실행하기 위한 SQL 쿼리문들
    select_users.sql
    ...
```

---

### 2.3 파일 구조 (주석 포함 트리)

```shell
.
├── src/
│   ├── controllers/                     # 도메인별 컨트롤러 및 라우팅 조합
│   │   ├── user/
│   │   │   ├── userController.ts
│   │   │   └── ...
│   │   └── routings.ts                  # 전체 라우팅 구조 정의
│   ├── types/                           # 프로젝트 표준 타입 계층
│   │   ├── dto/
│   │   │   ├── userDto.ts
│   │   │   └── ...
│   │   └── env.ts                       # 표준 환경변수 타입 정의
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── commonUtils.ts           # 공용 유틸 함수 (예: CSV 읽기)
│   │   │   └── ...
│   │   └── db/
│   │       └── dbConnection.ts          # DB 연결 관련 코드
│   ├── middlewares/                     # 인증/검증 등 미들웨어 계층
│   │   ├── auth.ts
│   │   └── ...
│   ├── app.ts                           # Hono 앱 인스턴스/미들웨어/라우트 결합
│   └── index.ts                         # Cloudflare Workers fetch 엔트리
├── vite.config.ts                       # Vite 번들 구성 파일
├── worker-configuration.d.ts            # Worker 바인딩 타입 선언 파일
├── wranger.jsonc                        # Wrangler 구성 파일
├── .env.example                         # 환경변수 키 샘플
└── sql/                                 # SQL 리소스 디렉토리
    ├── functions/                       # DB 함수/프로시저 쿼리 모음
    │   ├── select_logs.sql
    │   └── ...
    ├── schema/                          # 스키마 백업 SQL
    │   ├── public_schema_260410.sql
    │   └── ...
    └── statements/                      # 직접 실행용 SQL 구문 모음
        ├── select_users.sql
        └── ...
```

---

### 2.4 디렉토리별 책임 설명

- `src/controllers`
도메인별 HTTP 요청/응답 처리 로직을 배치한다. `routings.ts`에서 전체 라우팅 구조를 조합한다.

- `src/types/dto`, `src/types/env.ts`
DTO 및 환경변수 타입을 표준화한다. 런타임 스키마와 함께 타입 정합성 기준점으로 사용한다.

- `src/lib/utils`
공용 유틸 함수를 관리한다. 비즈니스 로직에 종속되지 않는 범용 헬퍼를 배치한다.

- `src/lib/db/dbConnection.ts`
DB 연결 초기화 및 클라이언트 생성 로직을 관리한다.

- `src/middlewares`
인증/인가/검증/로깅 등 횡단 관심사를 처리한다.

- `src/app.ts`, `src/index.ts`
`app.ts`는 Hono 앱 조합 지점, `index.ts`는 Workers 런타임 엔트리로 사용한다.

- `worker-configuration.d.ts`
Wrangler 기반 Worker 바인딩 타입 선언을 관리한다.

- `.env.example`
필수 환경변수 키를 템플릿으로 제공한다.

- `sql/functions`, `sql/schema`, `sql/statements`
DB 함수 쿼리, 스키마 백업 SQL, 수동 실행용 SQL을 분리 관리한다.

---

## 백엔드 구조 사용 규칙

1. 도메인 요청 처리는 `controllers` 하위에서 관리하고, 라우팅 조합은 `routings.ts`에 모은다.
2. DB 연결 생성/초기화 코드는 `lib/db`로 한정한다.
3. 인증/검증/로깅 등 공통 횡단 로직은 `middlewares`에서 처리한다.
4. SQL 파일은 목적별(`functions`/`schema`/`statements`)로 분리해 저장한다.
