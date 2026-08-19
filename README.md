# Woomi 코딩 에이전트 템플릿

**AI에게 "우리 팀 방식"을 미리 알려주는 설명서 묶음입니다.** 새 프로젝트를 시작할 때 이걸 먼저 복사해 두면, Claude Code·Codex·GitHub Copilot이 모두 같은 규칙을 읽고 같은 방향으로 일합니다.

- 표준 버전: `2.14-draft`
- 최종 수정일: 2026-08-19
- 기본 대상: React Router v7 + Hono/Cloudflare Worker + Supabase PostgreSQL 프로젝트

---

## 코딩을 몰라도 괜찮습니다

바이브 코딩(AI에게 말로 시켜서 프로그램을 만드는 방식)의 가장 흔한 실패는 이렇습니다.

> AI가 매번 다른 방식으로 코드를 짜서, 나중에 아무도 손을 못 대는 상태가 된다.

AI는 아는 게 많지만 **이 프로젝트의 사정**은 모릅니다. 그래서 매번 자기 방식대로 만듭니다. 이 템플릿은 그 사정을 미리 문서로 적어둔 것입니다. AI가 작업을 시작할 때 이 문서를 먼저 읽으므로, 열 번을 시켜도 비슷한 결과가 나옵니다.

**당신이 하는 일**은 세 가지입니다.

1. 이 파일들을 프로젝트 폴더에 복사한다
2. 안전장치를 한 번 켠다 (명령 한 줄)
3. 준비된 프롬프트를 AI에게 붙여넣는다 — 이후는 AI가 질문하고, 당신은 답만 고른다

---

## 무엇을 받게 되나요

| 받는 것 | 쉽게 말하면 |
|---|---|
| `AGENTS.md`, `.agents/` 문서 | AI가 읽는 **프로젝트 사용설명서**. 폴더 구조, 화면 규칙, 데이터 규칙이 적혀 있습니다 |
| `.claude/`, `.codex/`, `.github/` | 도구별 **자주 쓰는 명령 모음**. "새 화면 만들어줘"를 명령 한 번으로 |
| `.githooks/` | **안전장치**. 비밀키가 실수로 올라가거나 `main`에 바로 푸시되는 걸 막습니다 |
| `apps/web` | 바로 실행되는 **관리자 화면 뼈대**. 로그인·목록·상세·설정 화면이 이미 들어 있습니다 |
| `QUICKSTART.md` | 복사-붙여넣기용 **시작 프롬프트 2종** |

---

## 시작하기

### 1단계 — ZIP으로 받아서 폴더 이름 바꾸기 (정석)

1. GitHub 저장소 페이지에서 **Code → Download ZIP** (또는 사내 앱마켓 ZIP)을 받습니다.
2. 압축을 풉니다.
3. 풀린 폴더 이름을 **내 프로젝트 이름으로 바꿉니다.** (예: `woomi-coding-agent-template-main` → `my-shop-admin`)
4. 그 폴더를 편집기나 AI 도구로 엽니다.

> **`git clone`은 권장하지 않습니다.** clone하면 폴더가 이 템플릿 저장소에 그대로 연결된 상태가 되어, 내 작업을 커밋·푸시하려 할 때 남의 저장소로 향합니다. ZIP은 그 연결이 없는 깨끗한 폴더라서 혼란이 없습니다. (Git에 익숙해서 연결을 직접 끊을 수 있다면 clone 후 `.git` 폴더를 지우고 쓰셔도 됩니다.)

새 프로젝트에 얹을 때는 압축을 푼 폴더에서 아래를 기존 프로젝트 폴더 맨 위로 복사합니다.

```text
AGENTS.md  CLAUDE.md  CODEX.md  .agents/  .claude/  .codex/  .github/  .githooks/
```

> **이미 코드가 있는 프로젝트라면**: 같은 이름의 파일·폴더(특히 `.github/`, `.claude/`, `AGENTS.md`)가 있으면 통째로 덮어쓰지 말고 **백업 후 합치세요.** 기존 설정이 사라질 수 있습니다.

### 2단계 — 안전장치 켜기 (권장)

> **Claude Code를 쓴다면 이 단계는 건너뛰어도 됩니다.** 폴더를 열고 `/onboard`를 입력하면 아래 명령을 AI가 대신 실행합니다. → [3단계](#3단계--ai에게-맡기기)

프로젝트 폴더에서 한 번만 실행합니다. ZIP으로 시작했다면 Git 저장소가 아직 없으므로 `git init`을 먼저 실행합니다.

```text
git init
git config core.hooksPath .githooks
```

Git Bash나 WSL을 쓴다면 실행 권한도 함께 줍니다. Windows PowerShell만 쓴다면 이 줄은 필요 없습니다.

```text
chmod +x .githooks/*
```

**이걸 켜지 않으면 아래 안전장치가 전혀 작동하지 않습니다.** (`pnpm install`을 실행하면 루트 `package.json`의 `prepare`가 자동으로 켜줍니다.)

그리고 **GitHub 저장소 쪽도 한 번 잠가 두세요.** 위 설정은 내 컴퓨터에만 걸립니다. GitHub 저장소 → Settings → Branches → Add branch ruleset → 대상 `main`:

- ☑ Require a pull request before merging
- ☑ Block force pushes
- Bypass list는 비워 둡니다

세 도구(Claude Code·Codex·Copilot)에 똑같이 적용되는 **유일한 우회 불가 장치**입니다.

### 3단계 — AI에게 맡기기

**Claude Code를 쓴다면 여기서 끝입니다.** 1단계로 준비한 폴더를 열고 첫 대화에 이렇게만 입력하세요.

```text
/onboard
```

AI가 `git init`부터 안전장치 켜기, 프로젝트 정보 받기, 화면 한 곳 바꾸기, 첫 작업 기록(커밋) 남기기까지 **직접 실행하며** 데려갑니다. 10~15분 걸리고, 당신은 질문에 답만 하면 됩니다.

> **`/onboard`는 Claude Code에서만 동작합니다.** Codex·Copilot을 쓴다면 아래 `QUICKSTART.md` 프롬프트를 직접 복사해 붙여넣으세요.

**직접 프롬프트를 붙여넣는 방법**은 [`QUICKSTART.md`](./QUICKSTART.md)를 열어 상황에 맞는 것을 통째로 복사해 AI 첫 대화에 넣으면 됩니다.

| 내 상황 | 쓸 프롬프트 |
|---|---|
| 이미 돌아가는 코드가 있고 거기에 얹는다 | 프롬프트 A — 기존 프로젝트에 적용 |
| 거의 빈 폴더에서 처음부터 시작한다 | 프롬프트 B — 새 프로젝트 시작 |

AI가 단계마다 멈춰서 선택지(A/B/C)를 물어봅니다. 당신은 답만 고르면 됩니다.

---

## 화면을 먼저 눈으로 보기

`apps/web`에 **실행 가능한 관리자 화면 뼈대**가 들어 있습니다. 로그인, 대시보드, 목록, 상세, 구성원, 설정 화면과 함께 로딩 중·데이터 없음·오류·권한 없음(403)·주소 없음(404) 상태까지 미리 만들어 두었습니다.

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

> 이 명령은 컴퓨터에 **Node.js와 pnpm이 설치되어 있어야** 작동합니다. 안 깔려 있으면 AI에게 "개발 환경 설치를 도와줘"라고 하세요.

`/items` 화면 위쪽 버튼으로 정상·로딩·빈 상태·오류를 즉시 바꿔볼 수 있습니다. 점선으로 표시된 `Placeholder` 자리와 샘플 데이터를 실제 내용으로 바꿔가며 시작하세요.

- 화면 지도와 수정 방법: [`apps/web/README.md`](./apps/web/README.md)
- 쓸 수 있는 화면 부품 목록: [`.agents/ui/COMPONENTS.md`](./.agents/ui/COMPONENTS.md)

---

## 안전장치가 막아주는 것 / 못 막는 것

솔직하게 적습니다. **자동 장치는 절반만 막아줍니다.**

| | 내용 |
|---|---|
| ✅ 막아줍니다 | `.env` 파일 커밋 |
| ✅ 막아줍니다 | 흔한 형태의 비밀키가 코드에 섞여 들어가는 것 — AWS `AKIA…`, GitHub `ghp_…`, Supabase `sb_secret_…`, JWT(`eyJ….eyJ….…`), PEM 개인키 |
| ✅ 막아줍니다 | `main` 브랜치에 바로 푸시하는 것 (PR을 거치도록). 태그 푸시는 통과합니다 |
| ⚠️ **못 막습니다** | 커밋에 담기지 않은 경로 — 채팅창에 붙여넣은 값, `wrangler.jsonc`의 `vars`, 이미 커밋 이력에 들어간 값 |
| ⚠️ **못 막습니다** | 위 형태에 해당하지 않는 비밀번호·접속 문자열 — 사람이 직접 봐야 합니다 |
| ⚠️ **못 막습니다** | 2단계를 건너뛴 경우 — 내 컴퓨터에서는 위 셋 다 작동하지 않습니다 (GitHub ruleset을 켜 두면 `main` 푸시만은 서버에서 막힙니다) |

그래서 **비밀값(API 키, 비밀번호)은 채팅창이나 코드에 붙여넣지 마세요.** `.env` 파일에만 넣고, 그 파일이 커밋에 안 섞였는지는 사람이 직접 확인해야 합니다.

**도구별로 자동 장치가 다릅니다.** GitHub Copilot에는 위험 동작을 막는 장치가 따로 없고, Codex는 `main` 푸시 차단만 확인되었습니다(민감 파일 차단은 버전에 따라 작동하지 않을 수 있습니다). 둘 중 하나라도 쓴다면 2단계를 **꼭** 먼저 켜세요. `.githooks/`는 세 도구에 똑같이 걸립니다.

---

## 이건 하지 마세요

- 실제 비밀키가 들어간 `.env` 커밋
- service role key를 화면(프론트엔드) 코드에 노출
- 승인 없는 자동 배포
- 안내 없는 `git push`, `git pull` (GitHub로 올리고 내리는 것)
- 운영 데이터베이스에 데이터를 지우는 변경을 자동 실행
- **템플릿 규칙을 실제 코드보다 우선시하기** — 충돌하면 항상 실제 코드가 이깁니다

마지막 항목이 특히 중요합니다. AI가 "표준에 맞춰 코드를 고치자"고 하면, 반대로 **"문서를 코드에 맞춰 고쳐줘"** 라고 바로잡으세요. 단 보안·배포·데이터 손실 관련 규칙만큼은 어떤 경우에도 완화하지 않습니다.

---

## 자주 하는 질문

**Q. 개발을 전혀 몰라도 쓸 수 있나요?**
시작은 됩니다. `QUICKSTART.md`의 프롬프트를 붙여넣으면 AI가 온보딩을 주도합니다. 다만 화면을 실행해 보려면 Node.js·pnpm 설치가 필요하고, 그 단계는 AI에게 도움을 청하는 게 빠릅니다.

**Q. 제 기존 코드가 망가지지 않나요?**
프롬프트 A는 AI에게 "이번 작업에서는 기존 코드를 절대 수정하지 말고 읽고 제안만 하라"고 지시합니다. 실제 변경은 당신이 "진행"이라고 답한 뒤에만 일어납니다.

**Q. AI가 알아서 커밋하고 배포해 버리면요?**
**커밋은 알아서 합니다 — 그게 맞습니다.** 커밋은 내 컴퓨터 안에 저장점을 남기는 것이라 되돌릴 수 있고, 오히려 미루는 쪽이 작업을 잃기 쉽습니다. 하지만 **GitHub로 올리는 것(push)과 배포는 다릅니다.** 이건 되돌리기 어려워서 실행 직전에 알려 주도록 지시되어 있고, 배포는 승인 없이 아예 하지 않습니다. AI가 아무 말 없이 GitHub에 올리거나 "그냥 알아서 배포할게요"라고 하면 멈추게 하세요.

**Q. 여기 있는 규칙을 꼭 다 따라야 하나요?**
아닙니다. 이건 **출발점**이지 절대 규칙이 아닙니다. 프로젝트에 맞게 고쳐 쓰는 것이 정상입니다.

**Q. 되돌리기를 부탁해도 되나요?**
"깨끗하게 되돌려줘" 같은 말은 작업물을 영구 삭제할 수 있습니다(`git reset --hard`). AI가 이런 걸 하려 하면 막도록 되어 있고, 당신도 함부로 요청하지 마세요.

**Q. 쓸 수 있는 명령이 뭐가 있나요?**
Claude Code 기준 처음 시작할 때 쓰는 `/onboard` 1개, `/new-feature`(새 화면), `/new-api`(새 서버 기능), `/review-pr`(코드 검토), `/commit`(커밋 정리) 4개, 지식 위키용 `/wiki-add-source`·`/wiki-ask`·`/wiki-log-today`·`/wiki-check` 4개, 그리고 자연어로 말하면 작동하는 스킬 2개(공통 부품 만들기, DB 구조 변경)입니다. Codex는 `.codex/prompts/`, Copilot은 `.github/prompts/`에 같은 워크플로우가 있습니다. **`/deploy`, `/test` 같은 다른 명령은 없으니 AI가 지어내면 의심하세요.**

---

## 문서 지도

먼저 읽을 것부터 순서대로 놓았습니다.

| 파일 | 역할 |
|---|---|
| [`QUICKSTART.md`](./QUICKSTART.md) | **비개발자 1순위.** 복사-붙여넣기 시작 프롬프트 2종 |
| [`.agents/VIBE_CODING_GUIDE.md`](./.agents/VIBE_CODING_GUIDE.md) | 비개발자용 10분 운영 가이드 |
| [`apps/web/README.md`](./apps/web/README.md) | 관리자 화면 뼈대의 화면 지도와 수정 방법 |
| `AGENTS.md` | **모든 AI가 가장 먼저 읽는 공통 규칙** (1차 소스) |
| `CLAUDE.md` / `CODEX.md` | Claude Code / Codex 전용 보충 규칙 |
| `.agents/ARCHITECTURE.md` | 표준 구조와 레이어 경계 |
| `.agents/STACK.md` | 표준 기술스택 |
| `.agents/WORKFLOW.md` | 작업·PR·push·리뷰 흐름 |
| `.agents/DEPLOYMENT.md` | Cloudflare/Wrangler/GitHub Actions 배포 기준 |
| `.agents/TOOLING.md` | MCP, 브라우저 자동화, 외부 도구 사용 기준 |
| `.agents/code/*` | 코드 구조, API, 테스트, 에러 처리 기준 |
| `.agents/data/*` | 도메인 모델, DB 스키마, API 계약, 마이그레이션 기록 |
| `.agents/ui/*` | 디자인, UX, 컴포넌트 기준 |
| `.agents/examples/*` | 좋은 예시와 금지 예시 |
| [`wiki/`](./wiki/README.md) | 팀 지식 위키 (Obsidian 볼트). 규칙을 그래프로 탐색하고 배운 것을 축적. 폴더가 있으면 에이전트가 작업 중 알아서 찾고 남긴다(안 쓰면 폴더 삭제) |
| `.userdocs/*` | 템플릿 설계 기록. 모든 프로젝트에 복사할 필요는 없음 |
| `CHANGELOG.md` | 표준 버전별 변경 기록 |

---

## 개발자·AI 에이전트용

### 핵심 원칙

`AGENTS.md`가 1차 소스다. Claude Code, Codex, GitHub Copilot 전용 문서와 명령은 모두 `AGENTS.md`와 `.agents/` 하위 문서를 보조한다. 도구별 문서에만 중요한 규칙을 숨기지 않는다.

표준 제공 문서는 고정된 절대 규칙이 아니라 **새 프로젝트의 출발 템플릿**이다. 실제 코드, 프레임워크, 배포 방식, API 계약, 디자인 시스템을 확인한 뒤 프로젝트에 맞게 수정한다.

기준 레퍼런스: CTPA Hono Worker layered architecture.

### 에이전트 읽기 순서

1. `AGENTS.md`
2. `AGENTS.md`의 `Task Routing` 표에서 작업 유형 확인
3. 필요한 `.agents/*` 문서만 확인
4. 실제 코드와 설정 파일 확인
5. 해당 도구의 command/prompt/skill 확인

`WORKFLOW.md`는 상시 필독 문서가 아니라, 큰 기능·PR/push·리뷰·배포·DB/API 계약 변경처럼 절차가 중요한 작업에서 읽는다.

도구별 추가 문서:

- Claude Code: `CLAUDE.md`, `.claude/commands/`, `.claude/skills/`
- Codex: `CODEX.md`, `.codex/prompts/`, `.codex/skills/`
- GitHub Copilot: `.github/prompts/`, `.github/instructions/`

### 하네스 계층

| 계층 | 역할 | 위치 |
|---|---|---|
| Commands/Prompts | 반복 작업 명령 | `.claude/commands/`, `.codex/prompts/`, `.github/prompts/` |
| Skills | 복잡 작업 체크리스트 | `.claude/skills/`, `.codex/skills/`, `.github/instructions/` |
| Rules | 공통 규칙 | `AGENTS.md`, `.agents/` |
| Hooks | 위험 행동 차단 | `.claude/settings.json`, `.codex/hooks.json`, `.githooks/` |

### 디렉토리 구조

```txt
.
├── AGENTS.md
├── CLAUDE.md
├── CODEX.md
├── QUICKSTART.md
├── .agents/
│   ├── ARCHITECTURE.md
│   ├── STACK.md
│   ├── WORKFLOW.md
│   ├── DEPLOYMENT.md
│   ├── TOOLING.md
│   ├── VIBE_CODING_GUIDE.md
│   ├── code/
│   ├── data/
│   ├── ui/
│   └── examples/
├── .claude/
│   ├── commands/
│   ├── skills/
│   └── settings.json
├── .codex/
│   ├── prompts/
│   ├── skills/
│   └── hooks.json
├── .github/
│   ├── prompts/
│   └── instructions/
├── .githooks/
├── .userdocs/              # 참고 문서와 설계 기록
└── apps/web/               # 실행 가능한 관리자 화면 스캐폴드
```

### 직접 적용하는 절차

`QUICKSTART.md`의 프롬프트를 쓰지 않고 손으로 밟을 경우:

1. 저장소를 ZIP으로 내려받아 압축을 풀고 폴더명을 프로젝트명으로 바꾼다. (`git clone`은 origin이 템플릿 저장소로 남으므로 쓰지 않는다. 굳이 clone했다면 `.git`을 삭제하고 `git init`으로 새로 시작한다.)
2. `AGENTS.md`의 `Project Overview`를 채운다.
3. `.agents/STACK.md`에서 실제 기술스택과 다른 부분을 수정한다.
4. `.agents/ARCHITECTURE.md`에서 실제 앱/Worker/도메인 구조를 수정한다.
5. `.agents/code/*`, `.agents/ui/*` 문서를 실제 프로젝트 규칙에 맞게 조정한다.
6. `.agents/data/*`, `.agents/examples/*`는 실제 구현이 생기면서 채운다.
7. Git hook을 사용할 경우 `git config core.hooksPath .githooks`를 실행한다.

Windows에서도 Git Bash 또는 WSL을 쓰면 같은 명령을 사용할 수 있다. Windows PowerShell에서 한국어 문서를 확인할 때는 UTF-8 인코딩을 명시한다.

```powershell
Get-Content -Raw -Encoding UTF8 AGENTS.md
Get-Content -Raw -Encoding UTF8 .agents\WORKFLOW.md
```

### 운영 방식

이 템플릿은 한 번 작성하고 끝나는 문서가 아니다. 프로젝트에서 반복 실수가 발견되면 `.agents/examples/BAD_EXAMPLES.md`에 남기고, 좋은 패턴이 굳어지면 `.agents/examples/GOOD_EXAMPLES.md`에 남긴다. 스택, 배포, DB, API 계약이 바뀌면 관련 `.agents/*` 문서를 같은 작업에서 갱신한다. 표준 버전과 최종 수정일 갱신 기준은 `AGENTS.md` 10장(Versioning & Changelog)을 따른다.
