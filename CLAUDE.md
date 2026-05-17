# CLAUDE.md

이 저장소의 에이전트 규칙은 루트 **[`AGENTS.md`](./AGENTS.md)를 1차 소스**로 삼는다.

Claude Code는 작업 시작 전 반드시 다음 순서로 문서를 참고한다:

1. [`AGENTS.md`](./AGENTS.md) — 진입점, 문서 우선순위, 행동 원칙
2. [`.agents/ARCHITECTURE.md`](./.agents/ARCHITECTURE.md) — 시스템 구조
3. 작업 유형에 따른 문서 (`AGENTS.md` §5 Task Routing)
4. 해당 작업에 대응하는 Command/Skill 확인
   - Commands: [`.claude/commands/`](./.claude/commands/)
   - Skills: [`.claude/skills/`](./.claude/skills/)

## 하네스 계층

이 저장소는 4계층 하네스(Commands → Skills → Rules → Hooks)를 갖춘다.
세 도구(Claude Code / Codex CLI / GitHub Copilot)에서 **동일 워크플로우가 작동**하도록 미러링되어 있다.
전체 매핑 표는 [`AGENTS.md` §12 Harness Layers](./AGENTS.md#12-harness-layers) 참고.

## 훅 활성화

최초 클론 시 한 번 실행:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

Claude Code 자동 훅은 [`.claude/settings.json`](./.claude/settings.json)에 정의되어 있다(민감 파일 차단, `main` 푸시 차단, `.agents/` 편집 리마인더).

## Claude MD Management

비개발자가 이 템플릿을 복사해 Claude Code와 함께 운영할 때는 Anthropic의 Claude MD Management 플러그인을 함께 사용하는 것을 권장한다.

- 설치/운영 안내: [`.agents/VIBE_CODING_GUIDE.md`](./.agents/VIBE_CODING_GUIDE.md)
- 품질 점검 요청: `audit my CLAUDE.md files`
- 작업 후 기억 갱신: `/revise-claude-md`

공통 규칙은 `CLAUDE.md`에만 남기지 말고 `AGENTS.md` 또는 `.agents/` 문서에도 반영한다. 그래야 Codex와 GitHub Copilot도 같은 기준을 따른다.
