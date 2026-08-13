# 기록

넣은 자료를 시간순으로 남깁니다. **덧붙이기만 하고 지우지 않습니다.**

나중에 "이건 왜 넣었더라"를 답하는 자리입니다.

---

## 2026-08-06 · 만들기 · 위키 볼트 생성

- 왜 만들었나: 바이브코딩 교육에서 받은 llm-wiki의 Obsidian 구조를 이 저장소에 맞게 적용하려고. `.agents/*` 규칙을 그래프로 탐색 가능하게 하고, 팀이 배운 것을 축적할 자리를 만들려고
- 구조: llm-wiki의 sources/wiki/log/index 구조를 계승하되, `wiki/wiki/` 중복을 피해 정리본 폴더를 `notes/`로 조정. 저장소 규칙 문서는 복사하지 않고 출처 기록이 실제 파일을 가리키게 함
- 명령: 루트 `.claude/commands/`에 `wiki-add-source`, `wiki-ask`, `wiki-log-today`, `wiki-check` 추가

## 2026-08-06 · 넣기 · AGENTS.md와 .agents/* 규칙 문서 19건

- 왜 모았나: 저장소 규칙을 위키 그래프로 연결해 온보딩과 "왜 이렇게 정했나" 검색에 쓰려고
- 원본: [색인](index.md)의 원본 목록 19건 (AGENTS.md, .agents/ 하위 규칙 문서)
- 새로 만든 페이지: [진입 규칙](notes/agents-entry.md), [바이브코딩 가이드](notes/vibe-coding-guide.md), [작업 흐름](notes/workflow.md), [절대 금지·필수 규칙](notes/non-negotiable-rules.md), [계층 아키텍처](notes/layered-architecture.md), [기술 스택](notes/stack.md), [프로젝트 구조](notes/project-structure.md), [API 계층 규칙](notes/api-layers.md), [코드 스타일](notes/code-style.md), [에러 처리](notes/error-handling.md), [테스트와 검증](notes/testing.md), [DB 스키마 가드레일](notes/db-schema-guardrails.md), [마이그레이션](notes/migration.md), [API 계약과 도메인 모델](notes/api-contract.md), [디자인 원칙](notes/design-principles.md), [UX 규칙](notes/ux-rules.md), [공통 컴포넌트](notes/components.md), [도구 사용 기준](notes/tooling.md), [배포](notes/deployment.md), [팀 위키](notes/team-wiki.md)

## 2026-08-13 · 정하기·배우기 · CLAUDE.md 경량화 + 위키 능동 사용

- 한 것: `CLAUDE.md`를 karpathy-skills 원칙으로 경량화(6장→4섹션, `AGENTS.md`와 겹치는 내용은 번호+제목 포인터로). `wiki/` 볼트가 있는 프로젝트에서 에이전트가 능동적으로 위키를 쓰도록 `AGENTS.md` §1에 지침을 넣음. PR #19 머지 → `v2.12-draft` 태그 자동 부착(2.11→2.12-draft).
- 정한 것과 이유:
  - 도구별 문서(`CLAUDE.md` 등)에는 `AGENTS.md`와 겹치는 규칙을 두지 않고 포인터만 둔다 — 규칙 1차 소스를 `AGENTS.md` 하나로 유지하려고(`AGENTS.md` §5의 적용).
  - 위키 사용 여부 게이트 = `wiki/` 폴더 존재. 별도 설정 토글을 만들지 않는다 — 안 쓰면 폴더를 지우면 되므로 machinery를 최소화하려고.
  - `CLAUDE.md`의 `AGENTS.md` 섹션 참조는 번호와 제목을 함께 적는다 — 섹션이 재번호돼도 제목으로 찾히게.
- 막혔다 푼 것:
  - 세션 초에 `wiki/`와 위키 명령이 안 보였다 → 로컬 HEAD가 위키 커밋 이전(`ad194b7`)이어서였고, 브랜치를 ff해 해결.
  - `gh pr merge`가 Claude Code auto-mode 분류기에 막혔다 → 사용자가 `!` 프리픽스로 직접 실행해 머지 완료.
- 갱신한 정리본: [팀 위키](notes/team-wiki.md), [진입 규칙](notes/agents-entry.md). 새 페이지 없음(갱신 위주).
