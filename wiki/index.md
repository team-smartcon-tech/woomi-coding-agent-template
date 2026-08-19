# 색인

이 위키에 무엇이 있는지의 목록. 자료를 넣을 때마다 갱신됩니다.

- 원본 20건
- 정리본 20개

## 정리본

### 일하는 방식

- [진입 규칙](notes/agents-entry.md) — 모든 에이전트가 먼저 읽는 규칙과 Task Routing
- [바이브코딩 가이드](notes/vibe-coding-guide.md) — 비개발자의 템플릿 도입과 세 도구 역할 분담
- [작업 흐름](notes/workflow.md) — 절차가 중요한 작업의 순서와 승인 경계
- [팀 위키](notes/team-wiki.md) — 이 폴더 구조 자체

### 안전

- [절대 금지·필수 규칙](notes/non-negotiable-rules.md) — 완화할 수 없는 보안·배포·데이터 손실 규칙
- [도구 사용 기준](notes/tooling.md) — MCP·외부 도구의 승인 경계와 secret 규칙

### 아키텍처와 코드

- [계층 아키텍처](notes/layered-architecture.md) — 도메인 우선 모놀리스와 레이어·런타임 경계
- [기술 스택](notes/stack.md) — 표준 기술 선택과 상태·데이터 역할 분담
- [프로젝트 구조](notes/project-structure.md) — 파일 위치와 import 경계
- [API 계층 규칙](notes/api-layers.md) — route/service/repository 책임과 응답 계약
- [코드 스타일](notes/code-style.md) — TypeScript 스타일과 상태 관리 우선순위
- [에러 처리](notes/error-handling.md) — 표준 error shape·code·로깅
- [테스트와 검증](notes/testing.md) — 테스트 우선순위와 표준 검증 명령

### 데이터

- [DB 스키마 가드레일](notes/db-schema-guardrails.md) — 네이밍·타입·constraint·RLS·index 규칙
- [마이그레이션](notes/migration.md) — 변경 절차·안전 패턴·rollback
- [API 계약과 도메인 모델](notes/api-contract.md) — 진행 중 채워 가는 두 문서

### UI

- [디자인 원칙](notes/design-principles.md) — 정보 밀도 우선·화면 비율·안티패턴
- [UX 규칙](notes/ux-rules.md) — 일곱 상태·폼·권한·파괴적 작업
- [공통 컴포넌트](notes/components.md) — 제공 컴포넌트와 사용 기준

### 배포

- [배포](notes/deployment.md) — 환경 분리·secret·CI/CD·rollback

## 원본

저장소 규칙 문서를 가리키는 출처 기록 19건. 진짜 원본은 각 파일이 가리키는 `.agents/*`·`AGENTS.md`에 있다. 마지막 1건만 저장소 밖 자료이고, 그 본문은 보관하지 않았다.

- [AGENTS.md](sources/agents-md.md)
- [.agents/VIBE_CODING_GUIDE.md](sources/vibe-coding-guide.md)
- [.agents/WORKFLOW.md](sources/workflow.md)
- [.agents/ARCHITECTURE.md](sources/architecture.md)
- [.agents/STACK.md](sources/stack.md)
- [.agents/TOOLING.md](sources/tooling.md)
- [.agents/DEPLOYMENT.md](sources/deployment.md)
- [.agents/code/PROJECT_STRUCTURE.md](sources/project-structure.md)
- [.agents/code/API.md](sources/api.md)
- [.agents/code/CODE_STYLE.md](sources/code-style.md)
- [.agents/code/ERROR_HANDLING.md](sources/error-handling.md)
- [.agents/code/TESTING.md](sources/testing.md)
- [.agents/data/DB_SCHEMA.md](sources/db-schema.md)
- [.agents/data/MIGRATION.md](sources/migration.md)
- [.agents/data/API_CONTRACT.md](sources/api-contract.md)
- [.agents/data/DOMAIN_MODEL.md](sources/domain-model.md)
- [.agents/ui/DESIGN.md](sources/design.md)
- [.agents/ui/UX_RULES.md](sources/ux-rules.md)
- [.agents/ui/COMPONENTS.md](sources/components.md)
- [llm-wiki (도슨티 바이브코딩 표준 과정)](sources/2026-08-19-llm-wiki.md) — 저장소 밖 자료, 본문 미보관
