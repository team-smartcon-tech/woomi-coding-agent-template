# CHANGELOG

이 저장소(`woomi-coding-agent-template`)의 표준 버전별 변경 기록이다.

**규칙**: 저장소의 공통 규칙, `.agents/*` 문서, `apps/*` 스캐폴드/코드, 훅에 영향을 주는 변경이 생기면 같은 작업에서 이 파일에 항목을 추가하고, `AGENTS.md`와 `README.md`의 "표준 버전"·"최종 수정일"을 함께 갱신한다. 자세한 기준은 [`AGENTS.md`](./AGENTS.md) 10장(Versioning & Changelog)을 따른다.

버전 형식은 `MAJOR.MINOR-단계`다. 새 기능·스캐폴드·규칙 추가는 MINOR를, 호환이 깨지는 표준 변경은 MAJOR를 올리며, 정식 확정 전에는 `-draft`를 유지한다.

---

## [2.4-draft] - 2026-07-28

### 추가
- **`SheetGrid` 공용 표 컴포넌트**(`apps/web/app/shared/ui/sheet-grid.tsx`) — 엑셀식 셀 키보드 주행·드래그 범위 선택·`Ctrl/⌘+C` TSV 복사·스티키 헤더·좌우 열 고정을 제공하는 도메인 무관 표 셸. `SheetColumn<T>` 배열로 열을 선언한다.
- 표 작성 규칙을 `.agents/ui/COMPONENTS.md`에 명시 — 표는 `SheetGrid`를 기본으로 사용하고, `Table` 프리미티브는 저수준 정적 표에만 쓴다.
- **목록 선택·일괄 작업 지침** — `.agents/ui/UX_RULES.md` §14(Selection And Bulk Actions) 신설: 행/전체 선택 체크박스(indeterminate 포함), 일괄 작업 툴바, 여러 항목 일괄 등록·일괄 수정, 실행 전 preview. AI 체크리스트에 선택·일괄 항목 추가. `COMPONENTS.md` 표 규칙에 선택 열·일괄 작업 구성 반영.

### 변경
- 스캐폴드 `/items` 목록 표를 `Table` 프리미티브에서 `SheetGrid`로 전환(예시 겸 기본 패턴 시연).
- 스캐폴드 `/items`에 선택 체크박스(행/전체 선택·indeterminate)와 일괄 작업 툴바(상태 일괄 변경·일괄 삭제, 실행 전 confirm) 추가 — §14 지침 시연.
- 공용 `Checkbox`가 `ref`를 받아 `indeterminate`(부분 선택)를 설정할 수 있도록 확장.
- `README.md` 시작 절차를 ZIP 다운로드 기준으로 변경 — 압축 해제 → 폴더명 변경 → `git init`. `git clone`은 origin이 템플릿 저장소로 남아 혼란을 유발하므로 비권장으로 명시.

## [2.3-draft] - 2026-07-14

### 추가
- 데스크톱 웹 화면을 항상 16:9 기준(기본 1920×1080, 추가 1600×900·1366×768)으로 설계·검수하는 규칙.
- 모바일 화면에서 iPhone 19.5:9와 Galaxy 19.5:9~20:9 비율, 세로·가로 방향, safe area와 동적 viewport를 확인하는 규칙.

## [2.2-draft] - 2026-07-06

### 추가
- **쿠키 세션 기반 데모 로그인 흐름** — React Router v7 loader/action으로 동작. `/login` action이 Zod 검증 + 데모 자격증명 대조 후 서명 쿠키 세션 발급, `/logout` 세션 파기, 인증 필요한 화면은 loader의 `requireUser`로 가드.
- 더미 계정 시드(`entities/member`)와 서버 전용 자격증명(`features/auth/model/credentials.server.ts`). 관리자 계정 `admin@woomi.dev / admin1234` 포함, 로그인 화면에 데모 계정 안내 표시.
- 상단바에 로그인 사용자 표시 + 로그아웃 버튼, 대시보드 인사말.

### 변경
- `/members`가 시드 계정과 연동되어 현재 로그인 사용자를 표시하고, "로그인 계정은 구성원 화면에서 관리"하도록 안내.
- 로그인 폼을 React Hook Form 클라이언트 제출에서 React Router `Form` + 서버 action 검증으로 전환.
- `apps/web/README.md`에 로그인/인증 섹션과 `/logout` 화면 추가.

## [2.1-draft] - 2026-07-06

### 추가
- `apps/web` 실행 가능한 **관리자 SaaS 스캐폴드** — React Router v7 Framework Mode(SSR) + TanStack Query + Zustand + React Hook Form + Zod + Tailwind CSS v4. 로그인, 대시보드, 항목 목록/상세, 구성원, 설정 화면과 loading/empty/error/403/404 상태 포함. 비개발자가 화면을 미리 보며 "어디에 무엇을 넣을지" 정하도록 도메인 중립 placeholder로 구성.
- 공통 UI 컴포넌트 17종 (`apps/web/app/shared/ui/*`, `apps/web/app/entities/item`).
- `CHANGELOG.md`와 버전 기록 규칙 도입 — `AGENTS.md` 10장, `CLAUDE.md`/`CODEX.md` Updating Rules, Claude Stop 리마인드 훅(`.claude/settings.json`).

### 변경
- `.agents/ui/COMPONENTS.md`에 제공 공통 컴포넌트 등록.
- 루트 `README.md`에 "미리 보는 웹 스캐폴드" 안내와 문서 지도에 `CHANGELOG.md` 추가.
- `.gitignore`에 `.react-router/`(React Router typegen 산출물) 추가.

## [2.0-draft] - 2026-05-28

- AI 에이전트 표준 템플릿 문서 세트 기준선(`AGENTS.md`, `.agents/*`, 도구별 문서 `CLAUDE.md`/`CODEX.md`, 훅). 이후 QUICKSTART 프롬프트, 컴포넌트 생성·DB 마이그레이션 스킬 문서 등이 보강되었으나 별도 버전 스탬프 없이 반영되었다(이 CHANGELOG 도입 이전).
