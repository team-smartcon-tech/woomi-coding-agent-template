# GitHub Copilot Instructions

이 저장소의 에이전트 규칙은 루트 `AGENTS.md`를 **1차 소스**로 삼는다.
Copilot은 작업 시작 전 반드시 다음 순서로 문서를 참고한다:

1. `AGENTS.md` (진입점)
2. `.agents/ARCHITECTURE.md`
3. 작업 유형별 문서 (`AGENTS.md` §5 Task Routing 참고)

재사용 가능한 워크플로우는 `.github/prompts/*.prompt.md`,
시나리오별 스킬은 `.github/instructions/*.instructions.md`에 있다.
