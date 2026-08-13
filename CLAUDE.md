# CLAUDE.md

Claude Code 전용 보충 규칙. 공통 규칙의 1차 소스는 [`AGENTS.md`](./AGENTS.md)다.

읽는 순서(§1 How To Read), 작업 라우팅(§2 Task Routing), 승인 없는 작업 금지(§6 Non-Negotiable Rules), 충돌 우선순위(§8 Conflict Resolution Priority), 버전·CHANGELOG(§10 Versioning & Changelog)는 `AGENTS.md`를 따른다. 이 문서는 그것을 다시 쓰지 않고, **Claude Code에만 있는 것**만 담는다.

---

## Commands & Skills

반복 작업은 [`.claude/commands/`](./.claude/commands/), 복잡한 작업은 [`.claude/skills/`](./.claude/skills/)를 먼저 확인한다. 목록은 디렉터리에서 직접 본다. 명령 문서가 `AGENTS.md`와 충돌하면 `AGENTS.md`가 이기고, 명령 문서 갱신을 제안한다.

---

## Hooks

Claude Code hooks는 [`.claude/settings.json`](./.claude/settings.json)에 정의하고, 판정 로직은 [`scripts/agent-guard.cjs`](./scripts/agent-guard.cjs)에 있다. `node scripts/agent-guard.cjs --selftest`로 규칙을 확인한다.

Git hook은 도구와 무관하게 Git 레벨에서 동작한다. 프로젝트 루트에서 활성화한다.

```bash
git config core.hooksPath .githooks
```

---

## Claude 전용 안전 규칙

`.claude/settings.local.json`에 `git`, `wrangler`, `supabase`, `deploy` 계열 명령을 allowlist로 추가하지 않는다. 이 파일은 `.gitignore` 대상이라 `AGENTS.md` §6(Non-Negotiable Rules) 승인 규칙이 조용히 사전 승인되고 PR 리뷰에도 보이지 않는다.

---

## 규칙을 바꿀 때

공통으로 적용될 규칙은 이 문서가 아니라 `AGENTS.md`·`.agents/*`에 반영한다. 그래야 Claude Code, Codex, Copilot이 같은 기준으로 일한다. 저장소의 규칙·문서·스캐폴드·훅을 바꾸면 `AGENTS.md` §10(Versioning & Changelog)에 따라 `CHANGELOG.md`와 표준 버전·최종 수정일을 갱신한다.
