# woomi-coding-agent-template

팀의 바이브 코딩을 일관된 기준으로 운영하기 위한 **에이전트 규약 템플릿 저장소**입니다.
이 템플릿은 **웹 서비스 제작 프로젝트**를 기본 대상으로 설계되었습니다.

- 최종 수정일: 2026-04-15

이 프로젝트는 `AGENTS.md`와 `.agents/` 하위 문서를 통해,
에이전트와 개발자가 동일한 구조/스타일/워크플로우를 따르도록 돕습니다.

## 왜 이 프로젝트가 필요한가

- 프로젝트마다 달라지는 규칙 때문에 코드 품질 기준이 흔들리는 문제를 줄입니다.
- 코드 생성 에이전트가 문맥 없이 임의 패턴을 만드는 문제를 방지합니다.
- 팀 온보딩 시 "어떻게 만들어야 하는지"를 문서로 빠르게 공유합니다.

## 핵심 문서

- [`AGENTS.md`](./AGENTS.md): 에이전트 진입 규칙, 문서 우선순위, 행동 원칙 (**1차 소스**)
- [`CLAUDE.md`](./CLAUDE.md): Claude Code 전용 진입 포인터 (→ AGENTS.md 라우팅)
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md): GitHub Copilot 전용 진입 포인터
- [`.agents/ARCHITECTURE.md`](./.agents/ARCHITECTURE.md): 시스템 구조 및 서비스 경계
- [`.agents/STACK.md`](./.agents/STACK.md): 표준 기술스택
- [`.agents/code/PROJECT_STRUCTURE.md`](./.agents/code/PROJECT_STRUCTURE.md): 프론트/백엔드 파일 구조 규칙
- [`.agents/code/CODE_STYLE.md`](./.agents/code/CODE_STYLE.md): 코드 스타일 및 작성 가이드

> Codex CLI는 `AGENTS.md`를 Rules로 자동 로드하므로 별도 진입 파일이 필요 없습니다.

## 하네스 계층 (Harness Layers)

이 템플릿은 `.userdocs/harness-engineering/` 가이드의 4계층 하네스를 기본 장착합니다. Claude Code·Codex CLI·GitHub Copilot 세 에이전트에서 동일한 워크플로우가 작동하도록 미러링되어 있습니다.

- **Commands** — `.claude/commands/`, `.codex/prompts/`, `.github/prompts/`
- **Skills** — `.claude/skills/`, `.codex/skills/`, `.github/instructions/`
- **Rules** — `AGENTS.md`, `.agents/`
- **Hooks** — `.claude/settings.json`, `.githooks/`

자세한 매핑은 `AGENTS.md` §12 참고.

## 디렉토리 개요

```shell
.
├── AGENTS.md
├── .agents/
│   ├── ARCHITECTURE.md
│   ├── STACK.md
│   ├── WORKFLOW.md
│   ├── data/
│   ├── ui/
│   ├── code/
│   └── examples/
├── .claude/
│   ├── commands/
│   ├── skills/
│   └── settings.json
├── .codex/
│   ├── prompts/
│   └── skills/
├── .github/
│   ├── copilot-instructions.md
│   ├── prompts/
│   └── instructions/
└── .githooks/
    ├── pre-commit
    └── pre-push
```

## 사용 방법

### 1) GitHub에서 템플릿 내려받기

- 이 저장소를 `clone`하거나 ZIP으로 다운로드합니다.
- 대상 프로젝트 루트로 아래 파일/폴더를 복사합니다.

**필수 (Rules + 하네스)**
  - `AGENTS.md`, `CLAUDE.md`
  - `.agents/` 전체
  - `.claude/`, `.codex/`, `.github/`, `.githooks/` (사용하는 도구에 해당하는 것만 복사해도 됨)

**선택**
  - `.gitignore`, `README.md`

예시 명령 (macOS / Linux):

```bash
git clone https://github.com/<your-org>/woomi-coding-agent-template.git
cd woomi-coding-agent-template

# 대상 프로젝트 루트로 복사 (TARGET 경로 교체)
TARGET=/path/to/your-project
cp AGENTS.md CLAUDE.md .gitignore "$TARGET"/
cp -R .agents .claude .codex .github .githooks "$TARGET"/
```

예시 명령 (Windows PowerShell):

```powershell
git clone https://github.com/<your-org>/woomi-coding-agent-template.git
Set-Location woomi-coding-agent-template

# 대상 프로젝트 루트로 복사 ($Target 경로 교체)
$Target = "C:\path\to\your-project"
Copy-Item .\AGENTS.md, .\CLAUDE.md, .\.gitignore $Target
Copy-Item .\.agents, .\.claude, .\.codex, .\.github, .\.githooks -Destination $Target -Recurse
```

### 2) 프로젝트 맞춤값으로 초기 세팅

- `STACK.md`에 실제 기술스택을 반영합니다.
- `ARCHITECTURE.md`에 서비스 경계/통신 규칙을 반영합니다.
- `PROJECT_STRUCTURE.md`, `CODE_STYLE.md`를 현재 코드베이스 구조에 맞게 조정합니다.
- Git 훅을 활성화합니다: `git config core.hooksPath .githooks && chmod +x .githooks/*` (Windows Git Bash/WSL 기준)

### 3) 팀 개발 프로세스에 연결

- 에이전트 작업 전에 `AGENTS.md` → `ARCHITECTURE.md` → 작업 유형별 문서를 읽도록 합니다.
- 반복 작업은 슬래시 명령으로 수행합니다: `/commit`, `/review-pr`, `/new-feature`, `/new-api`.
- 복잡한 시나리오는 Skill을 호출합니다: `db-migration`, `component-generator`.
- 코드 리뷰 시 `CODE_STYLE.md`와 `PROJECT_STRUCTURE.md` 기준으로 검토합니다.
- 규약이 바뀌면 관련 문서 + 대응하는 Command/Skill도 함께 업데이트해 일관성을 유지합니다.

### 4) 권장 운영 방식

- 프로젝트 시작 시점에 1회 세팅 후, 스프린트 단위로 문서 갱신 여부를 점검합니다.
- 새 팀원이 합류하면 이 문서를 온보딩 체크리스트로 사용합니다.

## 목표

이 저장소의 목표는 "코드를 잘 쓰는 방법"을 추상적으로 말하는 것이 아니라,
팀이 반복적으로 사용할 수 있는 **실행 가능한 표준 규칙**을 제공하는 것입니다.
