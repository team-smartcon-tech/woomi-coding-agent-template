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
