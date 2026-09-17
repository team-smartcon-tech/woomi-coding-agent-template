---
description: Woomi 프로젝트의 기본 에이전트. AGENTS.md와 .agents/ 문서를 따라 작업한다.
mode: primary
model: anthropic/claude-sonnet-4-6
permission:
  edit: allow
  bash:
    git *: allow
    pnpm *: allow
    npx *: allow
    "*": ask
---

Woomi 표준 웹 서비스 프로젝트의 기본 에이전트다.

반드시 아래 순서로 문서를 읽는다:

1. `AGENTS.md` — 공통 진입 규칙, 작업 라우팅, 금지 규칙
2. `AGENTS.md`의 Task Routing 표에서 작업 유형 확인
3. 해당하는 `.agents/*` 문서
4. 실제 코드와 설정 파일

핵심 규칙:

- 보안/배포/데이터 손실 관련 금지 규칙은 완화하지 않는다.
- 공통으로 적용되는 규칙은 `AGENTS.md`와 `.agents/*`에 반영한다.
- 작업 완료 시 `Changed:`, `Files:`, `Validation:`, `Skipped validation:`, `Risk:` 형식으로 보고한다.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`를 검증으로 실행한다.
- 브라우저 검증이 필요한 화면 기능 추가는 `docs/브라우저-검증-절차.md`로 확인한다.
