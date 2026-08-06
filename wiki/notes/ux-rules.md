# UX 규칙

모든 주요 화면이 고려해야 할 상태와 사용자 흐름. AI 에이전트는 happy path만 구현하지 않는다.

## 일곱 가지 상태

모든 주요 화면·기능은 **loading, empty, error, success, forbidden, not found, offline/network failure**를 고려한다.

- **Loading** — action 직후 피드백. 저장/삭제/업로드 중 중복 제출 차단. skeleton은 실제 레이아웃과 유사하게.
- **Empty** — 데이터 없음 사실 + 다음 action + 권한 때문인지 실제 없음인지 구분.
- **Error** — user-safe 문구. 기술적 provider error 노출 금지. 재시도 가능하면 retry 제공. 권한 오류와 서버 오류 구분 — [에러 처리](error-handling.md).

## 폼

필수 입력 표시, 필드 근처 validation, 의미 있는 값(숫자/금액/면적/기간)의 단위·정밀도 보존. 유효하지 않은 값은 조용히 보정하지 말고 명확히 거부한다. 서버 validation error는 form error로 매핑한다.

## 권한

메뉴 숨김과 API 권한 검사는 **둘 다** 필요하다. "로그인이 필요합니다"와 "접근 권한이 없습니다"를 구분한다.

## 선택과 일괄 작업

목록·표에서 여러 행을 다루는 화면은 개별 조작만 제공하지 않는다. 각 행에 선택 체크박스, 헤더에 전체 선택/해제(일부 선택은 indeterminate 표시)를 두고, 선택이 있으면 선택 개수와 일괄 작업 툴바를 노출한다 — [공통 컴포넌트](components.md)의 SheetGrid 규칙과 짝.

## 파괴적 작업

확인 dialog에 변경 내용/되돌림 가능 여부/영향 범위/확인·취소 action을 포함한다. 대량 작업은 dry-run·preview 우선. preview 데이터는 확정 전 실제 저장 금지.

## 금지

stack trace, provider raw error, secret, 내부 구현 정보를 UI에 노출하지 않는다. private 파일은 인증 없이 접근 가능한 URL을 바로 노출하지 않는다 — [절대 금지·필수 규칙](non-negotiable-rules.md).

## AI 체크리스트

UI 작업 후 Loading/Empty/Error/Permission/Mobile/16:9/safe area/파괴적 작업 확인/API 실패 항목을 확인한다.

## 함께 보기

- [디자인 원칙](design-principles.md)
- [공통 컴포넌트](components.md)
- [에러 처리](error-handling.md)
- [진입 규칙](agents-entry.md)

## 출처

- [원본 · .agents/ui/UX_RULES.md](../sources/ux-rules.md)
