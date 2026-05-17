# woomi-coding-agent-template

팀의 바이브 코딩을 일관된 기준으로 운영하기 위한 **에이전트 규약 템플릿 저장소**입니다.
이 템플릿은 **웹 서비스 제작 프로젝트**를 기본 대상으로 설계되었습니다.

- 최종 수정일: 2026-04-14

이 프로젝트는 `AGENTS.md`와 `.agents/` 하위 문서를 통해,
에이전트와 개발자가 동일한 구조/스타일/워크플로우를 따르도록 돕습니다.

## 왜 이 프로젝트가 필요한가

- 프로젝트마다 달라지는 규칙 때문에 코드 품질 기준이 흔들리는 문제를 줄입니다.
- 코드 생성 에이전트가 문맥 없이 임의 패턴을 만드는 문제를 방지합니다.
- 팀 온보딩 시 "어떻게 만들어야 하는지"를 문서로 빠르게 공유합니다.

## 핵심 문서

- [`AGENTS.md`](./AGENTS.md): 에이전트 진입 규칙, 문서 우선순위, 행동 원칙
- [`.agents/VIBE_CODING_GUIDE.md`](./.agents/VIBE_CODING_GUIDE.md): 비개발자를 위한 바이브 코딩 템플릿 적용 가이드
- [`.agents/ARCHITECTURE.md`](./.agents/ARCHITECTURE.md): 시스템 구조 및 서비스 경계
- [`.agents/STACK.md`](./.agents/STACK.md): 표준 기술스택
- [`.agents/code/PROJECT_STRUCTURE.md`](./.agents/code/PROJECT_STRUCTURE.md): 프론트/백엔드 파일 구조 규칙
- [`.agents/code/CODE_STYLE.md`](./.agents/code/CODE_STYLE.md): 코드 스타일 및 작성 가이드

## 하네스 계층 (Harness Layers)

이 템플릿은 `.userdocs/harness-engineering/` 가이드의 4계층 하네스를 기본 장착합니다. Claude Code·Codex CLI·GitHub Copilot 세 에이전트에서 동일한 워크플로우가 작동하도록 미러링되어 있습니다.

- **Commands** — `.claude/commands/`, `.codex/prompts/`, `.github/prompts/`
- **Skills** — `.claude/skills/`, `.codex/skills/`, `.github/instructions/`
- **Rules** — `AGENTS.md`, `.agents/`
- **Hooks** — `.claude/settings.json`, `.githooks/`

자세한 매핑은 `AGENTS.md` §12 참고.

비개발자가 이 템플릿을 복사해 처음 적용할 때는 [`.agents/VIBE_CODING_GUIDE.md`](./.agents/VIBE_CODING_GUIDE.md)를 먼저 읽고, 프로젝트 이름·기술스택·디자인 규칙을 자기 프로젝트에 맞게 채우는 것을 권장합니다.

## 디렉토리 개요

```shell
.
├── AGENTS.md
├── .agents/
│   ├── ARCHITECTURE.md
│   ├── VIBE_CODING_GUIDE.md
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
- 각자 사용하는 프로젝트 루트로 아래 파일/폴더를 복사합니다.
  - `AGENTS.md`
  - `CLAUDE.md`
  - `.agents/` 전체
  - `.claude/` 전체
  - `.codex/` 전체
  - `.github/` 전체
  - `.githooks/` 전체
  - 필요 시 `README.md`

예시 명령 (macOS / Linux):

```bash
git clone https://github.com/<your-org>/woomi-coding-agent-template.git
cd woomi-coding-agent-template

# 대상 프로젝트 루트로 파일 복사
cp AGENTS.md /path/to/your-project/
cp CLAUDE.md /path/to/your-project/
cp -R .agents /path/to/your-project/
cp -R .claude /path/to/your-project/
cp -R .codex /path/to/your-project/
cp -R .github /path/to/your-project/
cp -R .githooks /path/to/your-project/
```

예시 명령 (Windows PowerShell):

```powershell
git clone https://github.com/<your-org>/woomi-coding-agent-template.git
Set-Location woomi-coding-agent-template

# 대상 프로젝트 루트로 파일 복사
Copy-Item .\AGENTS.md C:\path\to\your-project\
Copy-Item .\CLAUDE.md C:\path\to\your-project\
Copy-Item .\.agents -Destination C:\path\to\your-project\ -Recurse
Copy-Item .\.claude -Destination C:\path\to\your-project\ -Recurse
Copy-Item .\.codex -Destination C:\path\to\your-project\ -Recurse
Copy-Item .\.github -Destination C:\path\to\your-project\ -Recurse
Copy-Item .\.githooks -Destination C:\path\to\your-project\ -Recurse
```

### 2) 프로젝트 맞춤값으로 초기 세팅

- `STACK.md`에 실제 기술스택을 반영합니다.
- `ARCHITECTURE.md`에 서비스 경계/통신 규칙을 반영합니다.
- `PROJECT_STRUCTURE.md`, `CODE_STYLE.md`를 현재 코드베이스 구조에 맞게 조정합니다.
- Git 훅을 활성화합니다: `git config core.hooksPath .githooks && chmod +x .githooks/*` (Windows Git Bash/WSL 기준)

### 3) 팀 개발 프로세스에 연결

- 에이전트 작업 전에 `AGENTS.md` → `ARCHITECTURE.md` → 작업 유형별 문서를 읽도록 합니다.
- 코드 리뷰 시 `CODE_STYLE.md`와 `PROJECT_STRUCTURE.md` 기준으로 검토합니다.
- 규약이 바뀌면 관련 문서를 함께 업데이트해 일관성을 유지합니다.

### 4) 권장 운영 방식

- 프로젝트 시작 시점에 1회 세팅 후, 스프린트 단위로 문서 갱신 여부를 점검합니다.
- 새 팀원이 합류하면 이 문서를 온보딩 체크리스트로 사용합니다.

## 목표

이 저장소의 목표는 "코드를 잘 쓰는 방법"을 추상적으로 말하는 것이 아니라,
팀이 반복적으로 사용할 수 있는 **실행 가능한 표준 규칙**을 제공하는 것입니다.
