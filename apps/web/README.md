# Woomi 관리자 스캐폴드 (web)

React Router 8 기반 **관리자 SaaS 스캐폴드**이며, **Cloudflare Worker 하나**로 실행·배포한다. 비개발자도 바로 실행해 미리 보면서 "어디에 무엇을 넣을지" 감을 잡도록 만든 범용 뼈대다. 도메인은 중립 placeholder(항목/구성원)이며, 실제 도메인에 맞게 교체해 사용한다.

---

## 실행

저장소 루트에서 실행한다.

```bash
pnpm install
pnpm dev
```

브라우저에서 http://localhost:5173 를 연다. 비밀값 파일(`.dev.vars`) 없이도 뜬다(개발 환경은 임시 세션 키를 쓴다).

Node 는 **22.22 이상**이 필요하다(React Router 8 요구, `.nvmrc` 는 24).

기타 스크립트:

```bash
pnpm build       # 프로덕션 빌드
pnpm start       # 빌드 결과를 로컬 Worker 런타임으로 실행 (운영 규칙 — SESSION_SECRET 필요, apps/web/.dev.vars.example 참고)
pnpm typecheck   # 타입 검사
pnpm deploy:dry  # 배포 직전 번들·설정 검증 (계정 불필요, 실제 배포 아님)
pnpm assets:check # 빌드 뒤 정적 자산에 금지 파일이 새지 않았는지
pnpm cf-typegen  # wrangler.jsonc 를 고친 뒤 worker-configuration.d.ts 재생성
```

---

## 스택

- **React Router 8** (Framework Mode, SSR) — **Cloudflare Worker**(`@cloudflare/vite-plugin`, `wrangler`)로 실행·빌드
- **TanStack Query** — 서버 상태/캐시 (로딩·에러 상태 시연)
- **Zustand** — 클라이언트 UI 상태 (사이드바 접힘, 모바일 드로어)
- **React Hook Form + Zod** — 폼과 검증
- **Tailwind CSS v4** — 시맨틱 토큰 기반 스타일

스택 상세와 선택 기준은 [`../../.agents/STACK.md`](../../.agents/STACK.md)를 참고한다.

---

## 화면 지도

| 경로 | 파일 | 목적 |
| --- | --- | --- |
| `/login` | `app/routes/login.tsx` | 로그인 (앱 셸 밖 독립 화면) |
| `/` | `app/routes/dashboard.tsx` | 대시보드 — KPI와 최근 활동 |
| `/items` | `app/routes/items.tsx` | 항목 목록 — 검색·필터, 상태 미리보기 |
| `/items/:itemId` | `app/routes/item-detail.tsx` | 항목 상세 — 정보와 삭제 확인 |
| `/members` | `app/routes/members.tsx` | 구성원 — 역할·권한 관리 |
| `/settings` | `app/routes/settings.tsx` | 설정 — 프로필, 알림, 위험 구역 |
| `/logout` | `app/routes/logout.tsx` | 로그아웃 (세션 파기 후 로그인으로) |
| `/forbidden` | `app/routes/forbidden.tsx` | 접근 거부 화면 |
| `*` | `app/routes/$.tsx` | 404 (없는 주소) |

인증된 화면은 공통 셸 `app/routes/_app.tsx`(사이드바 + 상단바) 안에서 렌더된다. 셸 loader가 `requireUser`로 로그인 여부를 확인하고, 미인증이면 `/login?redirectTo=...`로 리다이렉트한다.

---

## 로그인 / 인증

쿠키 세션 기반의 데모 인증이 미리 구성되어 있다. React Router v7의 loader/action으로 동작한다.

- 로그인: `/login`의 `action`이 입력을 Zod로 검증하고 데모 자격증명(`features/auth/model/credentials.server.ts`)과 대조한 뒤, 성공하면 서명된 쿠키 세션(`features/auth/model/session.server.ts`)을 만들고 원래 가려던 경로로 이동한다.
- 가드: 인증이 필요한 route loader에서 `requireUser(request)`를 호출한다. 미인증이면 로그인으로 리다이렉트된다.
- 로그아웃: 상단바 우측 로그아웃 버튼이 `/logout`으로 POST하여 세션을 파기한다.

데모 계정 (로그인 화면에도 표시됨):

| 이메일 | 비밀번호 | 역할 |
| --- | --- | --- |
| `admin@woomi.dev` | `admin1234` | 관리자 |
| `manager@woomi.dev` | `manager1234` | 매니저 |
| `member@woomi.dev` | `member1234` | 구성원 |

계정은 `entities/member`의 시드 데이터이며, 로그인 후 **구성원**(`/members`) 화면에서 관리하도록 안내된다. 실제 서비스에서는 아래를 교체한다.

- `credentials.server.ts`의 평문 데모 비밀번호 → 백엔드 인증(해시 저장/검증).
- `entities/member`의 시드 → 실제 DB/API.
- 세션 시크릿 → `SESSION_SECRET`(32자 이상). 로컬은 `apps/web/.dev.vars`(예시: `.dev.vars.example`, 커밋 금지), 배포는 `wrangler secret put`. 개발 환경에서 없으면 임시 무작위 값이라 서버를 다시 띄우면 세션이 풀린다. **운영·프리뷰에서 없으면 세션 요청이 500, `GET /api/health` 가 503** 이다 — 배포 순서는 [`.agents/DEPLOYMENT.md`](../../.agents/DEPLOYMENT.md) 4.4.
- **`.dev.vars` 가 있는 채로 만든 `build/` 는 배포·공유하지 않는다.** 빌드가 그 파일을 `build/server/` 로 복사한다.
- Worker 진입점(`workers/app.ts`)은 로드 컨텍스트를 넘기지 않는다. loader 에서 `ctx.waitUntil` 이나 바인딩이 필요해지면 그 파일을 고친다.

---

## 상태 미리보기

`/items` 화면 상단의 세그먼트 컨트롤로 **정상 / 로딩 / 빈 상태 / 오류** 를 즉시 전환하며 확인할 수 있다. 목록 화면은 happy path만 만들지 않고 loading / empty / error / (검색 무결과) 상태를 모두 갖춘다. 새 목록 화면을 만들 때 이 네 가지 상태를 참고한다.

---

## 어디에 무엇을 넣나

- **점선 가이드 블록**(`Placeholder`)은 "여기에 무엇을 배치할지" 알려주는 안내다. 실제 차트·위젯·목록으로 교체한다.
- **샘플 데이터**는 `app/entities/item`의 mock이다. 실제 API 호출과 loader로 교체하고, 응답은 Zod로 검증한다.
- **새 기능**은 `app/features/*`에 추가한다. 폼·인증·필터처럼 화면 단위 기능 로직이 들어간다.
- 화면 상단·본문의 **스캐폴드 안내 배너/문구**는 실제 콘텐츠로 대체하면서 제거한다.

---

## 폴더 구조

```
app/
  routes/     # 라우트(화면). react-router의 loader/컴포넌트
  features/   # 화면 단위 기능 (auth 등). 폼·검증·플로우
  entities/   # 도메인 모델·mock·도메인 UI (item 등)
  shared/     # 공통 UI·유틸·설정·스토어
    ui/       # 재사용 컴포넌트 (Button, Card, Table ...)
    lib/      # cn, format 등 유틸
    config/   # nav 등 설정
    store/    # zustand 스토어
```

구조 규칙과 배치 기준은 [`../../.agents/ARCHITECTURE.md`](../../.agents/ARCHITECTURE.md)와 [`../../.agents/code/PROJECT_STRUCTURE.md`](../../.agents/code/PROJECT_STRUCTURE.md)를 따른다. 공통 컴포넌트 목록은 [`../../.agents/ui/COMPONENTS.md`](../../.agents/ui/COMPONENTS.md)에 정리돼 있다.

---

## 커스터마이즈

- **색상 / 테마**: `app/app.css`의 `@theme` 시맨틱 토큰을 수정한다. 컴포넌트는 `bg-primary`, `text-muted-foreground` 같은 토큰만 사용하므로 토큰 값만 바꾸면 전체 톤이 바뀐다. 하드코딩 색상은 쓰지 않는다.
- **네비게이션**: `app/shared/config/nav.ts`의 `navItems`를 수정한다. 사이드바·모바일 드로어가 이 목록을 렌더한다.
- **브랜드명 / 메타**: `app/root.tsx`의 `meta`, 셸의 브랜드 텍스트를 수정한다.
