# STACK.md

## 목적

이 문서는 프로젝트의 표준 기술스택을 명시한다.
에이전트와 개발자는 아래 스택을 기본값으로 사용하며, 별도 합의 없이 임의 변경하지 않는다.

---

## 1. 배포 / WAS

- 배포 대상: Cloudflare Workers
- 배포 도구: Wrangler
- 운영 구조: WAS는 Cloudflare Workers 런타임에서 동작하도록 구성한다.

### 규칙

- 서버 애플리케이션은 Workers 환경 제약을 고려해 작성한다.
- 배포/실행/환경설정은 Wrangler 기반 워크플로우를 기본으로 한다.

---

## 2. DB

- DBMS: PostgreSQL
- 운영 인스턴스: Supabase
- 연결 방식: SupabaseJS를 DB Driver로 사용하여 DB를 호출한다.

### 규칙

- DB 접근은 Supabase 인스턴스를 기준으로 한다.
- DB 호출 코드는 SupabaseJS 클라이언트를 표준 인터페이스로 사용한다.

---

## 3. Frontend Stack

### Framework

- React Router v7

### UI

- React
- Tailwind CSS
- lucide

### 상태관리

- Zustand

### 런타임 스키마 검사

- zod

### 번들링

- Vite

### 규칙

- 프론트엔드 프레임워크는 React Router v7을 기본으로 한다.
- Cloudflare Workers 호환성이 검증된 React Router v7 템플릿을 우선 사용한다.
- UI 구현은 React + Tailwind CSS 조합을 기본으로 한다.
- 아이콘 시스템은 lucide를 우선 사용한다.
- 클라이언트 상태관리는 Zustand를 기본으로 한다.
- 런타임 입력/응답 검증은 zod 스키마를 사용한다.
- 프론트엔드 빌드 도구는 Vite를 사용한다.

---

## 4. Backend Stack

### Framework

- Hono

### 번들링

- Vite

### 규칙

- 백엔드 HTTP 프레임워크는 Hono를 기본으로 한다.
- 백엔드 번들링/빌드 파이프라인은 Vite를 기본으로 한다.

---

## 5. 변경 관리 원칙

- 본 문서에 명시된 기술스택은 프로젝트 표준으로 간주한다.
- 스택 변경이 필요한 경우, 사유와 영향 범위를 문서화한 뒤 합의 후 반영한다.
