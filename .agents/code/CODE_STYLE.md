# CODE_STYLE.md

## 1. 프론트엔드 코드 스타일

### 1.1 목표

- 프론트엔드 코드는 **변경하기 쉬운 코드**를 목표로 한다.
- 코드 리뷰 기준은 아래 4가지 품질 축을 기준으로 판단한다.
  - 가독성(Readability)
  - 예측 가능성(Predictability)
  - 응집도(Cohesion)
  - 결합도(Coupling)

### 1.2 4가지 기준 요약

- 가독성: 코드를 위에서 아래로 읽었을 때 동작 의도가 빠르게 이해되는가.
- 예측 가능성: 이름/입력/출력만 보고 컴포넌트와 함수 동작을 예측할 수 있는가.
- 응집도: 함께 수정되어야 할 코드가 물리적으로도 함께 위치하는가.
- 결합도: 변경 시 영향 범위가 좁고 예측 가능한가.

### 1.3 가독성 우선 규칙 (현재 단계 핵심)

#### A. 동시에 실행되지 않는 코드는 분리한다

- 역할이 다른 분기를 하나의 컴포넌트에 섞지 않는다.
- 권한/상태별 UI가 명확히 분리되는 경우 하위 컴포넌트로 분리한다.

```tsx
function SubmitButton() {
  const isViewer = useRole() === "viewer";
  return isViewer ? <ViewerSubmitButton /> : <AdminSubmitButton />;
}
```

#### B. 구현 상세를 추상화해 맥락을 줄인다

- 페이지에서 보호/리다이렉트/권한검사 같은 횡단 로직을 직접 펼치지 않는다.
- `AuthGuard`, 전용 Hook, Wrapper 컴포넌트로 분리한다.
- 페이지 컴포넌트는 "페이지 본연의 UI/행동"에 집중시킨다.

#### C. 로직 종류 기준으로 거대한 Hook을 만들지 않는다

- `usePageState`처럼 URL 쿼리/폼/API를 한곳에 과도하게 합치지 않는다.
- 쿼리 파라미터는 목적별 Hook으로 분리한다.
  - 예: `useCardIdQueryParam`, `useDateRangeQueryParam`

#### D. 복잡한 조건에는 이름을 붙인다

- 중첩 `filter/some/&&` 조건은 지역 상수로 의미를 드러낸다.
- 조건식이 1회 사용이더라도 이해 비용이 크면 이름을 부여한다.

```ts
const isSameCategory = category.id === targetCategory.id;
const isPriceInRange = product.prices.some(
  (price) => price >= minPrice && price <= maxPrice
);
return isSameCategory && isPriceInRange;
```

#### E. 매직 넘버를 금지한다

- 의미가 있는 숫자는 상수로 선언 후 사용한다.
- 상수명은 단위까지 포함한다. 예: `ANIMATION_DELAY_MS`.

#### F. 시점 이동을 최소화한다

- 핵심 판단 로직은 사용 지점 가까이에 둔다.
- 단순한 권한/상태 조건은 과한 추상화보다 "한눈에 보이는 표현"을 우선한다.
- 읽는 사람이 여러 파일/함수로 점프하지 않도록 구성한다.

#### G. 복잡한 삼항 연산자를 금지한다

- 중첩 삼항은 `if` 또는 즉시 실행 함수(IIFE)로 풀어쓴다.

```ts
const status = (() => {
  if (A조건 && B조건) return "BOTH";
  if (A조건) return "A";
  if (B조건) return "B";
  return "NONE";
})();
```

### 1.4 React Router v7 + 현재 구조 적용 규칙

- 페이지 조합 로직은 `src/view/page`에 둔다.
- 재사용 UI는 `src/view/components`로 분리한다.
- 라우팅 정의는 `src/routes` 및 `src/route.ts`에서만 수행한다.
- API 호출은 `src/lib/api` 계층을 통해서만 실행한다.
- DTO/도메인 타입은 `src/types`에서 우선 재사용한다.

### 1.5 프론트엔드 리뷰 체크리스트 (가독성)

- 하나의 컴포넌트가 서로 다른 시나리오를 과도하게 동시에 처리하지 않는가?
- 페이지에 인증/권한/리다이렉트 상세 로직이 과다하게 노출되지 않는가?
- 조건식/상수명이 의도를 명확히 설명하는가?
- 중첩 삼항/중첩 익명 함수로 인해 읽기 흐름이 깨지지 않는가?
- 변경 시 함께 수정될 코드가 가까운 위치에 모여 있는가?

### 1.6 예측 가능성 규칙

#### A. 이름이 같으면 동작도 같아야 한다

- 라이브러리 API와 내부 래퍼의 이름을 동일하게 두지 않는다.
- 부가 동작(인증 헤더 주입, 로깅, 리트라이 등)이 있으면 이름으로 드러낸다.
  - 예: `http.get` 대신 `httpService.getWithAuth`

#### B. 같은 종류의 함수는 반환 타입을 통일한다

- 같은 역할의 Hook/API 유틸은 팀 공통 반환 형태를 유지한다.
  - 예: API Query Hook은 모두 `query` 객체 반환
- 유효성 검사 함수는 일관된 반환 타입을 사용한다.
  - 권장: `type ValidationResult = { ok: true } | { ok: false; reason: string }`

```ts
type ValidationResult = { ok: true } | { ok: false; reason: string };
```

- boolean 반환과 객체 반환을 혼용하지 않는다.

#### C. 숨은 로직을 금지한다

- 함수 이름/파라미터/반환 값으로 예측할 수 없는 부가 동작을 넣지 않는다.
  - 예: `fetchBalance()` 내부에서 암시적 로깅 수행 금지
- 로깅/추적/알림 같은 부가 로직은 호출 지점 또는 별도 오케스트레이션 계층으로 분리한다.

### 1.7 프론트엔드 리뷰 체크리스트 (예측 가능성)

- 내부 래퍼 함수명이 라이브러리 함수명과 혼동되지 않는가?
- 같은 계열 Hook/유틸의 반환 타입이 프로젝트 전반에서 일관적인가?
- 유효성 검사 함수의 반환 타입 규칙이 통일되어 있는가?
- 함수 시그니처에 드러나지 않는 숨은 부가 동작이 없는가?

### 1.8 응집도 규칙

#### A. 함께 수정되는 파일은 같은 디렉토리에 둔다

- 파일을 "종류별"로만 분류하지 않고, "함께 변경되는 기능 단위"로 묶는다.
- 현재 구조에서는 `src/view/page`를 기준으로 관련 UI/상태/API를 근접 배치한다.
- 특정 기능을 제거할 때 연관 파일이 함께 삭제될 수 있도록 배치한다.

#### B. 매직 넘버를 응집도 관점에서도 금지한다

- 비즈니스/애니메이션/대기시간 숫자는 상수로 분리해 변경 지점을 단일화한다.
- 함께 바뀌어야 할 로직(예: 애니메이션 시간과 후속 동작)이 따로 놀지 않게 한다.

```ts
const ANIMATION_DELAY_MS = 300;
```

#### C. 폼 응집도는 변경 단위 기준으로 선택한다

- 필드 단위 응집:
  - 필드별 검증이 독립적이거나 재사용이 중요할 때 선택한다.
  - 예: 이메일 형식 검증, 아이디 중복 확인, 추천코드 검증
- 폼 전체 단위 응집:
  - 필드 간 의존성이 높고 폼 전체 흐름이 하나의 기능일 때 선택한다.
  - 예: 결제 폼, 단계형(Wizard) 폼, 비밀번호/비밀번호 확인 연동

- 팀 기본값:
  - 단순/독립 필드 중심 폼은 필드 단위 응집을 우선한다.
  - 필드 간 상호작용이 강한 폼은 Zod 스키마 기반 폼 전체 응집을 우선한다.

### 1.9 프론트엔드 리뷰 체크리스트 (응집도)

- 기능 삭제 시 관련 파일을 디렉토리 단위로 함께 제거할 수 있는가?
- 매직 넘버가 상수로 추출되어 함께 수정되어야 할 로직이 분리되지 않았는가?
- 폼이 필드 단위/폼 전체 단위 중 현재 변경 단위에 맞는 설계를 선택했는가?
- 필드 간 의존성이 높은데 검증 로직이 여러 곳에 흩어져 있지 않은가?

### 1.10 결합도 규칙

#### A. 책임을 하나씩 관리한다

- 하나의 Hook/컴포넌트가 페이지의 모든 상태를 한 번에 관리하지 않도록 분리한다.
- URL 쿼리 파라미터는 목적별 Hook으로 나눠 영향 범위를 축소한다.
  - 예: `useCardIdQueryParam`, `useDateRangeQueryParam`
- "한 곳에서 다 관리하면 편하다"보다 "수정 영향이 좁다"를 우선한다.

#### B. 공통화보다 변경 영향 범위를 먼저 평가한다

- 중복 코드가 보이더라도 페이지별 요구사항이 달라질 가능성이 크면 공통화하지 않는다.
- 공통 Hook/컴포넌트로 묶기 전 아래를 확인한다.
  - 현재 동작이 완전히 동일한가?
  - 향후 옵션/분기 증가 가능성이 낮은가?
  - 수정 시 영향 범위를 팀이 감당할 수 있는가?
- 위 조건이 불명확하면 중복을 허용한다.

#### C. Props Drilling을 줄인다

- 데이터 전달만을 위한 중간 컴포넌트가 늘어나면 결합도가 상승한 것으로 판단한다.
- 우선순위:
1. `children` 기반 Composition으로 중간 전달 제거
2. 구조적으로 불가할 때만 Context API 도입

- Context API는 최후 수단으로 사용한다.
  - 컴포넌트 역할을 드러내는 props까지 무조건 Context로 이동하지 않는다.

### 1.11 프론트엔드 리뷰 체크리스트 (결합도)

- 하나의 Hook이 과도한 범위(여러 쿼리/상태/동작)를 동시에 관리하지 않는가?
- 공통화된 코드 변경이 다수 화면에 예상 밖 영향을 주지 않는가?
- 공통화 조건이 불충분한데도 성급히 추상화하지 않았는가?
- props 전달이 단순 중계(드릴링)로만 이어지는 구간이 없는가?
- Composition으로 해결 가능한데 Context를 과도하게 사용하지 않았는가?

### 1.12 출처

- 본 프론트엔드 지침(가독성/예측 가능성/응집도/결합도 항목)은 아래 자료를 팀 표준에 맞게 요약/재구성했다.
  - Frontend Fundamentals: https://frontend-fundamentals.com/code-quality/code/

### 1.13 코드 품질 여러 각도로 보기 (중요)

- 위 4가지 기준(가독성/예측 가능성/응집도/결합도)을 한 번에 완벽히 충족하기는 어렵다.
- 공통화/추상화를 강화하면 응집도는 높아질 수 있지만, 가독성은 낮아질 수 있다.
- 중복 코드를 허용하면 결합도는 낮아질 수 있지만, 응집도는 낮아질 수 있다.
- 따라서 프론트엔드 개발자와 에이전트는 현재 맥락(요구사항 변화 가능성, 영향 범위, 유지보수 비용)을 기준으로 우선 가치를 선택해야 한다.
- 에이전트는 단일 규칙을 기계적으로 적용하지 말고, 변경 이후 유지보수 용이성이 가장 높은 방향을 선택하고 그 판단 근거를 간단히 설명해야 한다.

### 1.14 컴포넌트 작성 규칙 (React)

#### A. 컴포넌트 종류에 맞는 디렉토리에 배치한다

- 페이지 단위 컴포넌트는 `views/pages/`(또는 프로젝트 표준의 `src/view/page`)에 배치한다.
- 레이아웃 단위 컴포넌트는 `views/layouts/`(또는 `src/view/layout`)에 배치한다.
- 재사용 컴포넌트 단위는 `views/components/`(또는 `src/view/components`)에 배치한다.
- 디렉토리 기준은 `AGENT.md`와 `PROJECT_STRUCTURE.md`를 우선 따른다.

#### B. 컴포넌트가 과도하게 커지면 하위 컴포넌트로 분리한다

- 컴포넌트 LOC가 커져 읽기/리뷰가 어려워지면 하위 컴포넌트로 분리한다.
- 부모와 하위 컴포넌트의 추적성을 위해 아래 구조를 표준으로 사용한다.

```shell
.
└── listbox/
    ├── listBox.tsx
    └── children/
        ├── listBoxItem.tsx
        ├── listBoxGroup.tsx
        └── ...
```

- 부모 컴포넌트는 폴더 루트에 두고, 직계 하위 컴포넌트는 `children/`에 둔다.

#### C. `useEffect`는 최소한으로 사용한다

- `useEffect`는 외부 시스템 동기화(네트워크, DOM API, 구독/해제) 목적에만 사용한다.
- 파생 가능한 값 계산, 단순 상태 동기화, 이벤트 처리 로직은 `useMemo`, 계산 함수, 이벤트 핸들러로 우선 처리한다.
- 의존성 배열을 생략하거나 규칙을 우회하지 않는다.

#### D. 상태 관리 우선순위

- 기본값은 컴포넌트 로컬 상태(`useState`)를 사용한다.
- 자식 간 공유가 필요하면 먼저 가까운 공통 부모로 state를 올린다.
- 여러 화면/기능에서 공유되는 전역 상태만 Zustand store로 분리한다.
- Zustand store는 도메인 단위로 작게 나누고, selector 기반 구독으로 불필요한 리렌더링을 줄인다.

#### E. 추가 권장 규칙

- 프레젠테이션 컴포넌트와 데이터 접근 로직을 분리한다.
- 컴포넌트 props는 최소화하고 의미가 드러나는 이름을 사용한다.
- 비동기 요청/에러/로딩 상태는 UI에서 명시적으로 드러낸다.
- 재사용 가능성이 낮은 추상화는 성급히 공통화하지 않는다.

### 1.15 프론트엔드-백엔드 통신 규칙

#### A. 공통 `fetch` 래핑 함수를 단일 진입점으로 사용한다

- `fetch`는 공통 래퍼 함수(예: `golgudoFetch<T>`)로 감싸서 사용한다.
- 공통 래퍼에서 아래를 일괄 처리한다.
  - API base path 결합
  - 공통 헤더(`Content-Type`, `Authorization`)
  - 토큰 재발급/재시도(예: 401 처리)
  - 응답 파싱(JSON/204/no-content)
  - 공통 에러 객체(`GolgudoAPIError`) 생성

- 목적:
  - 호출부마다 반복되는 파라미터/보일러플레이트를 줄인다.
  - 인증/에러 처리 규칙을 한 곳에서 일관되게 유지한다.

#### B. 도메인별 API 함수는 `subitems` 계층에서 정의한다

- 엔드포인트별 호출 함수는 `services/.../api/subitems/*.ts`에 모은다.
- 각 함수는 래핑 함수만 호출하고, 요청 body/응답 타입 제네릭만 명시한다.
- 도메인 API 함수 네이밍은 동작을 드러내는 동사형을 사용한다.
  - 예: `selectProject`, `insertProject`, `updateProject`, `deleteProject`

표준 패턴:

```ts
export async function selectProject(siteId: string) {
  return golgudoFetch<ProjectBody>(`/project/${siteId}`, { method: "GET" });
}
```

#### C. UI/유틸 계층은 도메인 API 함수만 사용한다

- 컴포넌트/유틸(`utils/*`)에서 `fetch`를 직접 호출하지 않는다.
- `ezgolguSettingsStorage.ts`처럼 유틸 파일은 `subitems` API를 불러와 조합한다.
- 유틸 계층 책임:
  - API 입력/출력과 UI 도메인 모델 매핑
  - 비즈니스 흐름 조합(예: 조회 후 insert/update 분기)
  - 에러를 UI 친화 메시지로 변환

#### D. 타입/에러 규칙

- API 함수는 가능하면 제네릭 응답 타입을 명시한다.
- 서버 에러는 공통 에러 타입으로 던지고, 호출부에서 상태코드 기반 분기 처리한다.
- 404 같은 기대 가능한 오류는 호출부에서 제어 흐름으로 처리할 수 있어야 한다.

#### E. 금지사항

- 컴포넌트에서 토큰 발급/재시도 로직을 직접 구현하지 않는다.
- API base path를 각 호출부에서 문자열로 중복 선언하지 않는다.
- 동일 도메인에서 `fetch` 직접 호출과 래퍼 호출을 혼용하지 않는다.

### 1.16 프론트엔드-백엔드 통신 체크리스트

- 공통 `fetch` 래퍼 함수가 단일 진입점인가?
- 도메인별 엔드포인트 함수가 `subitems` 계층에 모여 있는가?
- UI/유틸이 `fetch` 직접 호출 없이 도메인 API 함수만 사용하는가?
- 응답 타입 제네릭과 공통 에러 타입이 일관되게 적용되는가?

---

## 2. 백엔드 코드 스타일

### 2.1 기본 원칙

- TypeScript를 기준으로 작성한다.
- Cloudflare Workers + Hono 런타임 제약을 우선 고려한다.
- 기존 패턴(네이밍/구조/응답 형식)을 우선 재사용한다.

### 2.2 진입점/앱 구성 규칙

- `src/index.ts`는 Worker 진입점 역할만 담당한다.
- `src/app.ts`는 Hono 인스턴스 생성 및 라우팅/미들웨어 결합만 담당한다.
- `index.ts`에서 `createApp()`으로 만든 앱을 `fetch`에 연결한다.

표준 패턴:

```ts
// src/index.ts
import { createApp } from "./app";
import type { EnvBindings } from "./types/env";

const app = createApp();

export default {
    fetch(request: Request, env: EnvBindings, ctx: ExecutionContext) {
        return app.fetch(request, env, ctx);
    },
};
```

```ts
// src/app.ts
import { Hono } from "hono";
import { Routings } from "./controllers/routings";
import { HealthController } from "./controllers/health/healthController";
import { MiddlewareAuth } from "./middlewares/auth";
import type { EnvBindings } from "./types/env";

export function createApp() {
    const app = new Hono<{ Bindings: EnvBindings }>();

    app.get("/", (c) => c.json({ status: "ok" }));

    // Health endpoint는 운영 모니터링을 위해 인증 미들웨어를 타지 않도록 /api 밖에 둔다.
    HealthController.initialize(app);
    MiddlewareAuth.initialize(app);
    Routings.initialize(app);

    return app;
}
```

### 2.3 네이밍/모듈 스타일

- 파일명은 역할 중심으로 명확히 작성한다.
  - 예: `healthController.ts`, `projectControllers.ts`, `auth.ts`, `dbConnection.ts`
- 컨트롤러/유틸/설정 모듈은 `export namespace` 패턴을 기본으로 사용한다.
- namespace 이름은 PascalCase를 사용한다.
  - 예: `ProjectController`, `MiddlewareAuth`, `SupabaseConnection`

표준 패턴:

```ts
export namespace ProjectSetting {
    export type ProjectType = {
        // ...
    };
}
```

### 2.4 Controllers 작성 규칙

- 컨트롤러는 `export namespace XxxController` 형태로 정의한다.
- 각 컨트롤러의 실행(라우트 등록) 함수명은 `initialize(app)`로 통일한다.
- 함수 시그니처는 아래 타입 패턴을 따른다.

```ts
export namespace ProjectController {
    export function initialize(app: Hono<{ Bindings: EnvBindings }>) {
        // ...
    }
}
```

- 요청 본문/파라미터 검증은 zod 스키마를 사용한다.
  - `const schema = z.object(...)`
  - `type SchemaType = z.infer<typeof schema>`

### 2.5 엔드포인트 주석 규칙 (필수)

- 모든 HTTP 엔드포인트(`app.get/post/patch/delete`) 바로 위에 사용 목적 주석을 반드시 작성한다.
- 주석은 "왜 이 엔드포인트가 필요한지"를 한 줄로 설명한다.

표준 예시:

```ts
// 전체 프로젝트 목록을 조회한다.
app.get("/projects", async (c) => {
    // ...
});

// 특정 프로젝트의 건물 구성 정보를 조회한다.
app.get("/project/:id", async (c) => {
    // ...
});
```

### 2.6 타입/Env 바인딩 규칙

- 환경변수/바인딩 타입은 `src/types/env.ts`에서 단일 관리한다.
- Hono 앱 타입은 `Hono<{ Bindings: EnvBindings }>`를 표준으로 사용한다.
- 타입 전용 import는 `import type`을 우선 사용한다.

### 2.7 미들웨어/라우팅 결합 순서 규칙

- `createApp()` 내부에서 아래 순서를 기본으로 유지한다.
1. 공용 엔드포인트(예: `/`, `/health`) 등록
2. 인증 미들웨어 초기화
3. 도메인 라우팅 초기화

- 예외적으로 인증 제외가 필요한 엔드포인트는 목적 주석으로 이유를 명시한다.

### 2.8 응답/에러 처리 스타일

- 성공/실패 모두 `c.json()` 또는 `c.text()`로 명확히 응답한다.
- HTTP 상태 코드는 의도에 맞게 명시한다 (`200`, `201`, `400`, `401`, `404`, `409`, `500`).
- 입력 오류와 DB/RPC 오류를 분리해 메시지를 반환한다.

### 2.9 import 스타일

- import 순서는 아래를 기본으로 한다.
1. 외부 라이브러리
2. 내부 모듈 (상대경로)
3. 타입 import (`import type`)가 필요한 경우 그룹 내에서 분리

- 사용하지 않는 import는 허용하지 않는다.

### 2.10 라우팅 오케스트레이션 규칙

- 상황별로 다른 미들웨어를 적용할 수 있도록 `src/controllers/routings.ts`에서 라우팅 조합을 관리한다.
- 라우팅 실행 진입은 `Routings.initialize(app)`로 통일한다.
- `routings.ts`는 도메인별 컨트롤러의 `initialize(app)`를 호출해 하위 Hono 인스턴스에 조립한 뒤 `app.route(...)`로 마운트한다.

표준 패턴:

```ts
export namespace Routings {
    export function initialize(app: Hono<{ Bindings: EnvBindings }>) {
        const api = new Hono<{ Bindings: EnvBindings }>();

        ProjectController.initialize(api);
        RoomsController.initialize(api);

        app.route("/api", api);
    }
}
```

### 2.11 DB 연결 및 Supabase 규칙

- Supabase 클라이언트 생성은 `src/lib/dbConnection.ts` 래핑 함수를 통해서만 수행한다.
- 래핑 함수의 목적은 URL/KEY/auth 옵션 반복 입력을 제거해 코드 길이와 실수를 줄이는 것이다.
- 컨트롤러/서비스에서 `createClient(...)`를 직접 호출하지 않는다.

표준 패턴:

```ts
const sbc = SupabaseConnection.getConnection(c.env);
```

- 익명 키가 필요한 경우에만 `createAnonClient(...)`를 사용한다.

#### Relation/Column/RPC 관리 규칙

- 테이블/릴레이션 명은 `SBRelations` enum으로 관리한다.
- 컬럼 참조는 문자열 하드코딩 대신 `SBUtils.column(...)`, `SBUtils.columns(...)`를 사용한다.
- DB 함수(RPC)명은 `SBFunctions` enum으로 관리한다.
- `SBFunctionPayload<T extends SBFunctions>`의 구체 payload 타입은 현재 단계에서 작성하지 않는다.

표준 패턴:

```ts
await sbc
    .from(SBRelations.GolgudoRooms)
    .select(SBUtils.columns(SBRelations.GolgudoRooms))
    .eq(SBUtils.column(SBRelations.GolgudoRooms, "id"), roomId);

await sbc.rpc(SBFunctions.SelectRoomsVoid, {
    site_id_param: siteId,
});
```

#### 복잡 쿼리/업서트 처리 규칙

- SupabaseJS만으로 join/UPSERT(SELECT + INSERT/UPDATE 동반) 등의 표현이 복잡한 경우, DB 함수를 우선 사용한다.
- 해당 함수 생성 SQL은 루트 경로 `psql/functions/`에 `.sql` 파일로 저장한다.
- SQL 파일 작성만으로는 동작하지 않으므로, 쿼리문을 DB에 직접 실행해 반영해야 한다.
- 에이전트는 이 경우 작업 결과 회신 시 반드시 아래 사실을 사용자에게 명시한다.
  - "SQL 함수를 파일로 작성했으며, DB 반영을 위해 직접 실행이 필요함"

### 2.12 빌드 설정 스타일

- `vite.config.ts`는 Worker 빌드에 필요한 plugin과 build input을 명시한다.
- 백엔드 Worker 엔트리 입력은 `src/index.ts`를 기준으로 유지한다.

---

## 3. 백엔드 코드 작성 체크리스트

- `index.ts`는 진입점 역할만 수행하는가?
- `app.ts`가 Hono 생성/초기화만 담당하는가?
- 컨트롤러가 namespace + `initialize(app)` 패턴을 따르는가?
- 라우팅 결합이 `Routings.initialize(app)`로 관리되는가?
- DB 클라이언트 생성을 `SupabaseConnection` 래핑 함수로만 처리하는가?
- 테이블/컬럼/RPC 이름을 `SBRelations`/`SBUtils`/`SBFunctions`로 관리하는가?
- 모든 엔드포인트 위에 사용 목적 주석이 있는가?
- zod 검증과 타입 추론(`z.infer`)을 적용했는가?
- `EnvBindings` 타입이 일관되게 사용되는가?

---

## NestJS Add-on Rules

NestJS 프로젝트에서는 아래를 추가 준수한다.

- Controller는 HTTP 입출력/인증만 담당
- Service에 비즈니스 로직 집중
- Module은 조립 경계만 담당
- Entity는 데이터 구조만 담당
- `src/...` alias import를 우선하고 순환참조를 피한다
