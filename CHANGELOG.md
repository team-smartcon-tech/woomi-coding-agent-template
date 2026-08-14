# CHANGELOG

이 저장소(`woomi-coding-agent-template`)의 표준 버전별 변경 기록이다.

**규칙**: 저장소의 공통 규칙, `.agents/*` 문서, `apps/*` 스캐폴드/코드, 훅에 영향을 주는 변경이 생기면 같은 작업에서 이 파일에 항목을 추가하고, `AGENTS.md`와 `README.md`의 "표준 버전"·"최종 수정일"을 함께 갱신한다. 자세한 기준은 [`AGENTS.md`](./AGENTS.md) 10장(Versioning & Changelog)을 따른다.

버전 형식은 `MAJOR.MINOR-단계`다. 새 기능·스캐폴드·규칙 추가는 MINOR를, 호환이 깨지는 표준 변경은 MAJOR를 올리며, 정식 확정 전에는 `-draft`를 유지한다.

---

## [2.13-draft] - 2026-08-14

**신규 사용자 온보딩.** 이 저장소를 처음 여는 비개발자를 **첫 커밋 1개까지** 데려가는 `/onboard` 명령을 넣었다. 온보딩 문서가 없어서 만든 것이 아니다 — `QUICKSTART.md`에 이미 AI 주도 프롬프트가 있다. 실제 결손은 비개발자 경로의 단절 3개였고, 그중 둘은 문서로 메울 수 없는 종류다.

| 단절 | 실태 |
|---|---|
| `QUICKSTART.md` 2장에 `git init` 없음 | ZIP 폴더에는 `.git`이 없어 `git config core.hooksPath`가 실패한다. `README.md`에는 있어 두 문서가 어긋나 있었다 |
| GitHub 저장소 만드는 안내 0회 | `git remote add`·`gh auth`·`gh repo create`가 저장소 전체에 없는데, `README.md`·`QUICKSTART.md`는 저장소가 이미 있다고 전제한다 |
| 차단은 있는데 출구가 없음 | `git init` 기본 브랜치가 `main`이라 첫 푸시가 반드시 차단되고 "PR을 통해 병합하세요"가 뜨는데, PR 만드는 법이 비개발자용 문서에 없다. 유일한 설명인 `.agents/WORKFLOW.md`는 스스로 "개발자 대상"을 선언한다 |

비개발자에게 브랜치·PR 개념을 글로 설명하면 따라오지 못한다. 에이전트가 옆에서 직접 실행하고 결과를 보여주는 형태만 작동한다.

### 추가

- **`/onboard` 명령**(`.claude/commands/onboard.md`) — 환경 확인(`git init`·훅 활성화·`--selftest`) → 차단 메시지 사전 설명 → `AGENTS.md` 0장 9개 항목 인터뷰 → 작업 브랜치 생성 → `apps/web`의 사이드바 이름 교체 → `pnpm dev`로 눈으로 확인 → 커밋 1개. **종료 조건은 로컬 커밋이지 PR이 아니다** — 공식 도입 경로(ZIP)에는 원격 저장소가 없어 PR을 넣으면 GitHub 계정 장벽이 온보딩 안으로 들어온다. 저장소 생성은 종료 후 안내로 분리했다. Claude Code 전용이며 `.codex/`·`.github/`에 미러하지 않는다(위키 명령 4종과 같은 선례).
- **`.claude/settings.json`에 `permissions.allow`** — 로컬 git 작업과 읽기 전용 `gh` 조회를 등재해 권한 프롬프트 연타를 없앴다. `git push`·`gh repo create`·`gh pr create`는 **의도적으로 뺐다.** 그 프롬프트가 저장소 밖으로 나가는 작업의 마지막 확인 지점이다.

### 변경

- **`AGENTS.md` 6장 git 승인 경계 재정의.** "사용자 승인 없는 `git commit`/`push`/`pull` 금지"를 작업 성격으로 나눴다. 저장소 안에서 끝나는 작업(`git init`·브랜치·`add`·`commit`)은 사전 승인으로 보고, 밖으로 나가는 작업(`push`·`pull`·PR·저장소 생성)은 되돌리기 어렵다는 사실을 한 줄로 알린 뒤 진행한다. **우회 옵션(`--no-verify`·`-n`·`--force`)과 `git reset --hard` 금지는 그대로다.** `scripts/agent-guard.cjs`의 하드 차단 6종과 `.githooks/` 2종도 손대지 않았다 — 이들은 원래 되돌릴 수 없는 것만 골라 막는다. 10장의 태그 푸시는 예외에서 제외했다.
- **`CLAUDE.md`** — `.claude/settings.local.json` allowlist 금지 규칙은 유지하되, 금지 이유가 "리뷰에 안 보이는 곳에서 승인이 사라지는 것"이므로 추적되는 `.claude/settings.json`에 명시 등재하는 것은 해당하지 않음을 구분해 적었다. 처음 온 사용자의 첫 질문을 `/onboard`로 유도하는 지침도 추가 — `CLAUDE.md`는 세션 시작 시 자동으로 읽히므로 `SessionStart` 훅 없이 같은 효과를 낸다.
- **`QUICKSTART.md` 2장에 `git init` 추가** — `README.md`와 어긋나 있던 것을 맞췄다. ZIP으로 시작한 사용자가 2단계에서 막히던 버그다.
- **`README.md` 시작하기 3단계** — Claude Code 사용자는 `/onboard` 한 줄로 시작할 수 있음을 안내. 세 도구 대등 서술은 유지하고, "`/onboard`는 Claude Code에서만 동작한다"는 사실 진술만 넣었다.

---

## [2.12-draft] - 2026-08-13

**`CLAUDE.md` 경량화.** [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)의 "프로젝트 특정 규칙만 남기고 열거·일반론·중복은 뺀다" 원칙을 적용했다. `CLAUDE.md`가 `AGENTS.md`와 겹치던 내용을 포인터로 대체하고, Claude Code에만 있는 것만 남겼다. 규칙 내용 자체는 바뀌지 않았다(`AGENTS.md`가 그대로 보유).

### 변경

- **`CLAUDE.md` 6개 장 → 4개 섹션으로 축소.** 삭제한 중복: 읽는 순서(`AGENTS.md` §1과 동일), 명령·스킬 파일 열거(디렉터리에서 직접 확인), Work Rules 승인 목록(`AGENTS.md` §6), 변경·CHANGELOG 규칙(`AGENTS.md` §10). 유지한 Claude 전용 항목: hooks 설정(`.claude/settings.json`·`scripts/agent-guard.cjs`·git hooks 활성화), `.claude/settings.local.json` allowlist 금지, commands/skills 위치와 충돌 우선순위. 겹치는 규칙은 `AGENTS.md` 해당 장으로 포인터 처리.
- **위키 능동 사용 지침 추가**(`AGENTS.md` §1, `README.md`, `wiki/README.md`). `wiki/` 볼트가 있는 프로젝트에서는 에이전트가 시키지 않아도 작업 전 위키를 찾고, 의미 있는 결정·해결·재사용 자료가 나오면 먼저 위키에 남기자고 제안·기록한다. 게이트("왜 모으는지 먼저 묻기, 출처 아는 자료만")는 유지한다. 사용 여부는 `wiki/` 존재로 판정 — 쓰지 않는 프로젝트는 `wiki/`를 지운다.

---

## [2.11-draft] - 2026-08-06

**팀 지식 위키 도입.** llm-wiki(도슨티 바이브코딩 표준 과정 자료)의 Obsidian 구조를 이 저장소에 맞게 적용했다. 사람은 Obsidian vault로, AI는 Claude Code로 같은 파일을 읽고 쓴다.

### 추가

- **`wiki/` 지식 위키 볼트** — `sources/`(출처 기록 19건, 읽기 전용) + `notes/`(정리본 20개) + `index.md`/`log.md` + 볼트 규칙 `wiki/CLAUDE.md` + Obsidian 그래프 설정. `AGENTS.md`·`.agents/*` 규칙 전체를 정리본으로 이식해 그래프로 탐색할 수 있다. 저장소 규칙 문서가 원본일 때는 내용을 복사하지 않고 출처 기록이 실제 `.agents/*` 파일을 가리킨다 — 원본 이중화를 막기 위해서다. 규칙이 어긋나면 `.agents/*`가 이기고(8장 충돌 우선순위), 위키는 온보딩·검색·팀 학습 축적용 레이어로 동작한다. llm-wiki 원본의 `wiki/wiki/` 경로 중복을 피해 정리본 폴더만 `notes/`로 바꿨다.
- **위키 명령 4종**(`.claude/commands/`) — `/wiki-add-source`(자료 넣기, 왜 모으는지 먼저 질문), `/wiki-ask`(위키에서만 찾아 출처와 함께 답), `/wiki-log-today`(하루 정리 5분), `/wiki-check`(출처 없는 문장·끊긴 링크·`.agents/*` 원본과 어긋난 낡은 정리본 점검). llm-wiki 원본 명령을 계승하되 기존 명령과 충돌하지 않게 `wiki-` 접두사를 붙였다.

### 변경

- 루트 `.gitignore`에 `llm-wiki/` 추가 — 교육 원본은 자체 git 저장소라 중첩 커밋을 막고 로컬 참고용으로만 둔다.
- `AGENTS.md` 4장 Directory Baseline과 `README.md` 문서 지도·명령 안내에 `wiki/`와 위키 명령 반영.

---

## [2.10-draft] - 2026-07-30

**표준 버전 태그 자동화.** 10장의 수동 태그 절차를 GitHub Actions 로 대체한다. 그 수동 절차는 이미 실패한 이력이 있다 — 태그가 `v2.4`·`v2.6`·`v2.7` 뿐이고 `v2.5-draft`·`v2.8-draft`·`v2.9-draft` 가 빠져 있었다.

### 추가

- **`.github/workflows/tag-version.yml`** — `main` 푸시마다 `CHANGELOG.md` 최상단 버전을 읽어 `v<표준 버전>` 태그를 붙인다. 10장의 수동 절차를 대체한다. 그 수동 절차는 이미 실패한 이력이 있다 — 태그가 `v2.4`·`v2.6`·`v2.7` 뿐이고 **`v2.5-draft` 가 빠져 있었다.**
  - 태그가 이미 있으면 아무것도 하지 않고 성공으로 끝난다. 버전이 그대로인 일반 머지에 실패 표시가 생기지 않아, 비개발자에게 CI 실패를 해석하게 만들지 않는다.
  - 이 저장소의 기본 `GITHUB_TOKEN` 권한이 `read` 라서 `permissions: contents: write` 를 명시한다. 없으면 태그 푸시가 403 이다.
  - 연속 머지에서 같은 태그를 두 번 밀지 않도록 `concurrency` 로 직렬화한다.
  - `main` branch ruleset(Require a pull request / Block force pushes / Restrict deletions, bypass 없음)은 `target: branch` 이므로 태그 생성을 막지 않는다. 단 **태그 ruleset 에 `Restrict creations` 를 켜면 이 워크플로우가 막힌다** — 10장에 명시했다.

### 삭제

- **Stop 훅의 태그 리마인더** — 워크플로우가 대신한다. 남겨두면 오히려 틀린 알림을 낸다. CI 가 붙인 태그는 로컬에서 `git fetch --tags` 전까지 `git tag` 에 안 보여, 훅이 "태그가 없다"고 잘못 알린다. Actions 를 못 쓰는 프로젝트를 위한 수동 명령은 10장에 남겼다.

### 변경

- `AGENTS.md` 10장의 태그 절차를 자동화 기준으로 재작성. 4장 디렉터리 표에 `workflows/tag-version.yml` 반영.

---

## [2.9-draft] - 2026-07-30

컨텍스트 엔지니어링 감사의 P2 — **중복 삭제와 색인 정리**. 동작 변경은 Stop 훅 발화 조건 하나뿐이다.

### 삭제

- **`.agents/skills/` 전체(6개, 123줄)** — 저장소 어디에서도 이 경로를 참조하지 않고(인바운드 참조 0건), 어떤 하네스도 여기서 스킬을 로드하지 않는다. `component-generator`·`db-migration` 은 `.claude/skills/` 사본과 **바이트 동일**이었고, `source-command-*` 4개는 `.claude/commands/` 본문에 "이 스킬은 마이그레이션된 커맨드를 실행할 때 쓴다"는 래퍼 문장만 덧붙인 것이었다. 고유 정보 손실 0. 상시 로드 토큰은 줄지 않지만 하네스 동기화 표면이 4벌 → 3벌로 줄어든다.
- **`CLAUDE.md` 4장의 훅 "기본 목적" 불릿 3개** — 훅은 프롬프트가 설명하든 안 하든 발화한다. `CLAUDE.md` 는 매 세션 자동 주입되므로 이 저장소에서 **상시 로드 토큰을 실제로 줄이는 유일한 항목**이다. `git config core.hooksPath` 명령은 에이전트가 읽는 유일한 활성화 지시라 유지했다.

### 변경

- **Stop 훅의 CHANGELOG 리마인더가 대상 파일만 보도록 제한.** 지금까지는 무관한 임시 파일 하나만 있어도 매 턴 발화해, 정작 필요할 때 무시되는 소음이 되고 있었다. 이제 `AGENTS.md` 10장이 갱신을 요구하는 대상(`AGENTS.md`·`CLAUDE.md`·`CODEX.md`·`README.md`·`QUICKSTART.md`, `.agents/`·`.claude/`·`.codex/`·`.github/`·`.githooks/`, `apps/`·`packages/`·`scripts/`, 루트 설정 파일)만 본다. `.userdocs/` 와 빌드 산출물은 제외한다. 판정 로직은 `scripts/agent-guard.cjs stop-changelog` 로 옮겨 자체 점검에 포함했다(태그 검사 훅은 그대로 인라인).
- **`AGENTS.md` 6장이 안전 규칙의 상위집합이 되도록 4항목 흡수** — 운영 secret 변경, 외부 서비스 데이터 생성/수정/삭제(결제·알림·고객 데이터 포함), destructive filesystem command, secret 값을 대화·보고·문서에 출력. 그동안 이 항목들은 `.agents/TOOLING.md` 3장과 `CLAUDE.md` 5장에만 있어, 항상 읽히는 목록에는 빠져 있었다. **원본 목록은 지우지 않는다** — MCP 작업 중인 에이전트가 여는 바로 그 문서에 남아 있어야 하고, 상위집합이므로 drift 가 모순이 되지 않는다.
- **`.agents/code/NEST_GUIDE.md` 2장 "Mandatory Reading Order" → "함께 볼 문서"** + 읽기 범위는 `AGENTS.md` 1장을 따른다고 명시. "작은 작업에서 모든 문서를 읽지 않는다"(1장)와 정면 충돌해, 매번 8장 충돌 우선순위로 해소해야 했다.

### 수정

- **`AGENTS.md` 2장 라우팅 표에 테스트 행 추가** — `.agents/code/TESTING.md`(140줄)가 3장 문서 지도에만 있고 라우팅 표 12행에는 없어, 문서화된 도달 경로가 없었다.
- **`AGENTS.md` 3장에 `NEST_GUIDE.md`·`NEST_CF_WORKER.md` 등재**(214줄) — `.agents/STACK.md` 8장을 경유하는 2-hop 외에 도달 경로가 없었다.
- **`QUICKSTART.md` 장 번호 오류** — "10장 Project Override" → 11장. 10장은 Versioning & Changelog 다.

---

## [2.8-draft] - 2026-07-30

컨텍스트 엔지니어링 감사의 P1 — **문서가 지시하지만 저장소에 존재하지 않던 것**을 정정한다. 에이전트가 없는 명령·없는 디렉터리·없는 설정 파일을 찾느라 매 턴 실패 호출을 반복하던 비용을 없애는 것이 목적이다.

### 추가

- **`vitest` + `apps/web/app/shared/lib/markdown.test.ts`(9건)** — 66줄 자체 제작 마크다운 새니타이저가 헤더에서 "raw HTML/스크립트는 절대 통과하지 못한다"를 약속하며 `dangerouslySetInnerHTML` 로 들어가는데 테스트가 없었다. 검증 항목: raw HTML·`<img onerror>` 이스케이프, `javascript:`·`data:` href 무력화, href 속성을 깨는 quote 이스케이프, `noopener` 유지, 제목 레벨 오프셋(h3 시작), blockquote, 목록, `&` 중복 이스케이프 방지. 설정 파일 없이 기존 `vite.config.ts` 로 동작하므로 `vitest.config.ts` 는 추가하지 않았다.
- 루트·`apps/web` 에 `test` 스크립트. `AGENTS.md` 7장이 지시하는 `pnpm test` 가 이제 실제로 존재한다.

### 수정

- **`AGENTS.md` 7장 Quality Gates** — 이 스캐폴드가 제공하는 스크립트는 `typecheck`·`test`·`build` 뿐임을 명시. `pnpm lint` 와 `deploy:dry` 는 없어서 검증 턴마다 실패 호출이 발생했다.
- **`AGENTS.md` 4장 Directory Baseline** — `packages/`·`docs/`·`supabase/` 에 "아직 없음", `apps/` 에 "apps/web 만 있음", `.github/` 에 "CI 워크플로우는 아직 없음" 표기. 이 사실이 지금까지 `QUICKSTART.md` 프롬프트 본문 한 곳에만 있었다.
- **`AGENTS.md` 2장 라우팅** — 배포 행의 `wrangler.jsonc`·`.github/workflows/*` 에 "(있는 경우)" 추가. 둘 다 저장소에 없다.
- **`AGENTS.md` 10장** — 태그 푸시도 **사용자 승인 후** 하도록 명시. 10장의 "반드시 태그를 푸시한다"가 6장의 "승인 없는 `git push` 금지"와 문구상 충돌했다.
- **`.agents/code/CODE_STYLE.md`** — "2-space indent를 사용한다" 등 3줄을 "포맷터 설정이 있으면 그것을, 없으면 주변 파일 스타일에 맞춘다" 1줄로. 저장소에 `.prettierrc`·`eslint.config`·`biome.json` 이 하나도 없어 없는 설정 파일을 가리키는 지시였고, 실제 파일도 서로 다르다(`vite.config.ts` 는 2-space·double quote·no semicolon, `markdown.ts` 는 4-space·single quote·semicolon).
- **`.agents/STACK.md` 7장 Tooling** — ESLint·Prettier·GitHub Actions·Wrangler 를 "프로젝트에서 도입한 경우"로 강등하고 `Vitest` 를 표준으로 올림. ESLint 는 설치하지 않는다 — `tsconfig.base.json` 의 strict 타입 검사가 이 규모(앱 코드 약 1,100줄)를 커버하고, 비개발자에게 lint 실패 해석 부담을 새로 지우지 않기 위해서다.
- **`CODEX.md` 4장** — "민감 파일 수정 차단"을 단정하던 목록을 실제 상태로 교체. `Bash` 매처의 `main` push 차단은 확인되었지만 `Write`/`Edit` 매처는 Codex 버전에 따라 발화가 보장되지 않는다. 없는 보호를 광고하는 것이 실제 위험이다.
- **`README.md`** — 도구별 자동 장치 차이를 명시(Copilot 훅 없음, Codex 부분 동작, `.githooks/` 는 세 도구 공통).

---

## [2.7-draft] - 2026-07-30

컨텍스트 엔지니어링 감사(`.userdocs/우미건설 코딩 에이전트 템플릿 컨텍스트 엔지니어링 평가 보고서.md`)에서 확정된 **안전 결함**을 먼저 처리한 릴리스다. 감사 결론: 문서 구조(프로그레시브 디스클로저, 지연 로드 90.5%, SKILL.md 500줄 초과 0건)는 이미 기준을 충족했고, 실제 결함은 훅 쪽에 몰려 있었다.

### 수정

- **`.githooks/*` 가 한 번도 실행되지 않고 있었다.** `core.hooksPath` 를 켜라는 안내가 문서 5곳에 있었을 뿐, 켜는 장치가 없어 `.env` 커밋 차단과 `main` 직접 푸시 차단이 모두 무효였다. 루트 `package.json` 에 `prepare` 를 넣어 `pnpm install` 시 자동으로 켜지게 했다. Git 저장소가 아닌 ZIP 사본에서 `pnpm install` 전체가 실패하지 않도록 `|| exit 0` 를 붙인다.
- **`pre-push` 판정을 현재 브랜치(HEAD)에서 푸시 대상 ref(stdin)로 교체.** HEAD 로 판정하면 두 가지가 동시에 틀렸다 — `main` 에서 태그를 푸시하는 10장 절차가 막히고(문서가 "반드시" 하라는 명령을 훅이 차단), 반대로 `git push origin HEAD:main` 은 통과했다. 이제 `refs/heads/main` 을 대상으로 하는 푸시만 막고 태그 푸시는 통과하며, `--all`·`--mirror`·브랜치 삭제(`:main`)도 함께 걸린다.
- **`pre-commit` 이 `.env.example` 을 차단하던 모순 해소.** `.gitignore` 의 `!.env.example`(예시 파일은 추적) 및 `.agents/DEPLOYMENT.md` 의 표준 지시와 충돌했다. `.env.*.example` 도 함께 허용한다.
- **PreToolUse 훅이 `git push`(refspec 없이) 를 통과시키던 문제 해소.** 기존 규칙은 명령 문자열에 `main` 이라는 글자가 있을 때만 막아, `main` 브랜치에서의 `git push`·`git push origin HEAD`·`git push --all` 이 전부 통과했다.
- **민감 파일 차단이 `app/lib/secrets.ts` 같은 소스 코드까지 막던 문제 해소.** 경로에 `secret` 이 있으면 무조건 차단했다. 이제 값이 들어 있는 파일(`.env` 계열, `*.pem|key|p12|pfx|jks`, `secrets.json` 계열, `secrets/` 디렉터리)만 막는다.

### 추가

- `scripts/agent-guard.cjs` — Claude Code / Codex **공용** PreToolUse 가드. 판정 로직을 한 곳에 모은다. 기존에는 같은 정규식이 `.claude/settings.json` 과 `.codex/hooks.json` 에 인라인으로 복붙돼 있었고, JSON + 셸 이스케이프가 겹쳐 조용히 어긋난 것이 위 `git push` 누락의 원인이다. `node scripts/agent-guard.cjs --selftest` 로 판정 규칙 24건을 검증한다(main 푸시 형태, 태그 푸시 허용, 훅 우회 옵션, `git push -n` = `--dry-run` 오탐 방지 포함).
- `pre-commit` 시크릿 패턴에 **Supabase `sb_secret_`** 와 **JWT(`eyJ….eyJ….…`)** 추가. `README.md`·`QUICKSTART.md` 가 스스로 "못 막는다"고 인정했던 구멍이다. 대신 `pnpm-lock.yaml`·`build/`·`dist/`·`coverage/` 는 오탐만 만들어 검사에서 제외한다.
- `AGENTS.md` 6장에 **안전 훅 우회 옵션 금지**(`--no-verify`, `-n`, `--force`) 규칙. 한 플래그로 `pre-commit`·`pre-push` 가 동시에 무력화되는데 레포 어디에도 언급이 없었다.
- **GitHub 저장소 branch ruleset 안내**(`README.md`, `QUICKSTART.md`) — Require a pull request, Block force pushes, bypass 없음. 기존 `main` 보호는 전부 클라이언트 측이라 기본 OFF·`--no-verify` 우회 가능·Copilot 은 훅 0개였다. 세 하네스에 동일하게 걸리는 유일한 우회 불가 통제다.
- `CLAUDE.md` 5장에 `.claude/settings.local.json` allowlist 금지 규칙. 이 파일은 `.gitignore` 대상이라 6장이 승인 대상으로 지정한 `git`·`wrangler`·`supabase`·`deploy` 명령이 조용히 사전 승인되고 PR 리뷰에도 보이지 않는다.

### 변경

- `README.md` "안전장치가 막아주는 것 / 못 막는 것" 표를 실제 커버리지에 맞춰 갱신. 새 패턴을 반영하되 **커버하지 못하는 경로**(채팅창에 붙여넣은 값, `wrangler.jsonc` 의 `vars`, 이미 커밋 이력에 들어간 값)를 명시해 과대 광고하지 않는다.
- `.githooks/README.md` — 각 훅의 판정 기준과 `--no-verify` 한계, `core.hooksPath` 확인 방법을 명시.

---

## [2.6-draft] - 2026-07-29

### 추가
- **시스템 버전·변경 이력 노출**(앱 셸 좌측 하단) — 운영자가 배포된 버전을 화면에서 확인하고 변경 이력을 바로 열어볼 수 있게 한다. 문의 대응·회귀 추적의 출발점이라 스캐폴드 기본 기능으로 넣었다.
  - `apps/web/app/shared/ui/version-info.tsx` — 사이드바 최하단 버전 배지 + 변경 이력 패널(ESC 닫기, 패널 내부 스크롤, collapsed 시 아이콘만).
  - `apps/web/app/shared/lib/version.server.ts` — `CHANGELOG.md` 를 실행 위치 무관하게 찾아 읽고 캐시. **버전 문자열은 최상단 `## [x.y-단계]` 헤딩에서 파생**해 별도 상수와 어긋나지 않게 한다.
  - `apps/web/app/routes/changelog.tsx` — 데이터 전용 리소스 라우트. `requireUser` 가드를 거치므로 비로그인 접근이 막힌다. **변경 이력은 수정된 취약점 경로가 남기 마련이라 클라이언트 번들(`?raw`)·정적 자산에 두지 않는다** — 그 경로는 로그인 없이 읽힌다.
  - `apps/web/app/routes/_app.tsx` loader 가 버전만 내려주고(캐시된 문자열 1개), 본문은 열 때 fetch 한다.
- **`Markdown` 공용 컴포넌트**(`apps/web/app/shared/ui/markdown.tsx`) + 경량 파서(`apps/web/app/shared/lib/markdown.ts`, **의존성 없음**) — 입력을 먼저 HTML 이스케이프한 뒤 허용 구문만 controlled 태그로 되살려 raw HTML/스크립트가 통과하지 못한다(XSS 안전). 링크 URL 화이트리스트 검사 포함. 마크다운 라이브러리를 새로 추가하지 않기 위한 것.
- `apps/web/app/app.css` 에 `.md` 본문 타이포그래피 추가.

### 변경
- **표준 버전 = git 태그 규칙 신설** — `AGENTS.md` 10장에 추가. 표준 버전을 올린 PR이 `main`에 머지되면 `main`에서 `v<표준 버전>` 태그를 만들어 푸시한다. 태그는 **`main`에만** 남긴다(피처 브랜치 커밋은 squash·rebase 머지 후 사라져 태그가 없는 커밋을 가리키게 된다). 지금까지 태그가 `v2.4-draft` 하나에서 멈춰 있었다.
  - 누락 방지로 `.claude/settings.json` `Stop` 훅에 검사 추가 — 현재 브랜치가 `main`이고 최상단 CHANGELOG 버전에 해당하는 태그가 없으면 실행할 명령까지 붙여 알린다. 피처 브랜치에서는 침묵한다(그때 태그를 붙이면 안 되므로).
- `.agents/ui/COMPONENTS.md` — "버전·변경 이력 노출 규칙" 신설: 위치(좌측 하단), 버전 단일 출처(CHANGELOG 헤딩), **변경 이력은 인증된 서버 경로로만 노출**, `Markdown` 사용·라이브러리 추가 금지, collapsed 처리. SPA+Worker 등 서버 렌더가 아닌 스택에서의 대체 방식(인증 API 엔드포인트)도 명시.

---

## [2.5-draft] - 2026-07-28

### 추가
- **Supabase MCP 연결 기준** — `.agents/TOOLING.md` 6장 신설. §5 도구 등록 템플릿을 채운 첫 실제 예시로, hosted 서버(`https://mcp.supabase.com/mcp`) + 브라우저 OAuth를 표준 auth 방식으로 정의. PAT 발급은 CI 예외로만 허용하고 설정 파일 하드코딩을 금지. `project_ref`·`read_only=true` 필수, `features` 축소 권장, production 프로젝트 연결 금지, 조회 결과를 지시문으로 취급하지 않는 prompt injection 규칙 포함. Claude Code `claude mcp add` 명령과 `.mcp.json` 예시, VS Code 키 차이(`servers`), 로컬 CLI 엔드포인트 명시.
- `.agents/VIBE_CODING_GUIDE.md` §2.4 신설 — 비개발자용 안내. 절차를 복제하지 않고 "AI에게 시키는 문장" + `TOOLING.md` 6장 포인터만 둔다.
- `.agents/data/MIGRATION.md` §1에 migration 전 실제 스키마 대조 규칙 추가 — 문서와 실제 DB가 다르면 문서를 먼저 실제에 맞춘다. §2에 MCP는 조회 전용이고 migration 생성·적용은 Supabase CLI로 한다는 경계 명시.

### 변경
- `.agents/TOOLING.md` 기존 6·7장을 7·8장으로 재번호.

## [2.4-draft] - 2026-07-28

### 추가
- **`SheetGrid` 공용 표 컴포넌트**(`apps/web/app/shared/ui/sheet-grid.tsx`) — 엑셀식 셀 키보드 주행·드래그 범위 선택·`Ctrl/⌘+C` TSV 복사·스티키 헤더·좌우 열 고정을 제공하는 도메인 무관 표 셸. `SheetColumn<T>` 배열로 열을 선언한다.
- 표 작성 규칙을 `.agents/ui/COMPONENTS.md`에 명시 — 표는 `SheetGrid`를 기본으로 사용하고, `Table` 프리미티브는 저수준 정적 표에만 쓴다.
- **목록 선택·일괄 작업 지침** — `.agents/ui/UX_RULES.md` §14(Selection And Bulk Actions) 신설: 행/전체 선택 체크박스(indeterminate 포함), 일괄 작업 툴바, 여러 항목 일괄 등록·일괄 수정, 실행 전 preview. AI 체크리스트에 선택·일괄 항목 추가. `COMPONENTS.md` 표 규칙에 선택 열·일괄 작업 구성 반영.

### 변경
- 스캐폴드 `/items` 목록 표를 `Table` 프리미티브에서 `SheetGrid`로 전환(예시 겸 기본 패턴 시연).
- 스캐폴드 `/items`에 선택 체크박스(행/전체 선택·indeterminate)와 일괄 작업 툴바(상태 일괄 변경·일괄 삭제, 실행 전 confirm) 추가 — §14 지침 시연.
- 공용 `Checkbox`가 `ref`를 받아 `indeterminate`(부분 선택)를 설정할 수 있도록 확장.
- `README.md` 시작 절차를 ZIP 다운로드 기준으로 변경 — 압축 해제 → 폴더명 변경 → `git init`. `git clone`은 origin이 템플릿 저장소로 남아 혼란을 유발하므로 비권장으로 명시.

## [2.3-draft] - 2026-07-14

### 추가
- 데스크톱 웹 화면을 항상 16:9 기준(기본 1920×1080, 추가 1600×900·1366×768)으로 설계·검수하는 규칙.
- 모바일 화면에서 iPhone 19.5:9와 Galaxy 19.5:9~20:9 비율, 세로·가로 방향, safe area와 동적 viewport를 확인하는 규칙.

## [2.2-draft] - 2026-07-06

### 추가
- **쿠키 세션 기반 데모 로그인 흐름** — React Router v7 loader/action으로 동작. `/login` action이 Zod 검증 + 데모 자격증명 대조 후 서명 쿠키 세션 발급, `/logout` 세션 파기, 인증 필요한 화면은 loader의 `requireUser`로 가드.
- 더미 계정 시드(`entities/member`)와 서버 전용 자격증명(`features/auth/model/credentials.server.ts`). 관리자 계정 `admin@woomi.dev / admin1234` 포함, 로그인 화면에 데모 계정 안내 표시.
- 상단바에 로그인 사용자 표시 + 로그아웃 버튼, 대시보드 인사말.

### 변경
- `/members`가 시드 계정과 연동되어 현재 로그인 사용자를 표시하고, "로그인 계정은 구성원 화면에서 관리"하도록 안내.
- 로그인 폼을 React Hook Form 클라이언트 제출에서 React Router `Form` + 서버 action 검증으로 전환.
- `apps/web/README.md`에 로그인/인증 섹션과 `/logout` 화면 추가.

## [2.1-draft] - 2026-07-06

### 추가
- `apps/web` 실행 가능한 **관리자 SaaS 스캐폴드** — React Router v7 Framework Mode(SSR) + TanStack Query + Zustand + React Hook Form + Zod + Tailwind CSS v4. 로그인, 대시보드, 항목 목록/상세, 구성원, 설정 화면과 loading/empty/error/403/404 상태 포함. 비개발자가 화면을 미리 보며 "어디에 무엇을 넣을지" 정하도록 도메인 중립 placeholder로 구성.
- 공통 UI 컴포넌트 17종 (`apps/web/app/shared/ui/*`, `apps/web/app/entities/item`).
- `CHANGELOG.md`와 버전 기록 규칙 도입 — `AGENTS.md` 10장, `CLAUDE.md`/`CODEX.md` Updating Rules, Claude Stop 리마인드 훅(`.claude/settings.json`).

### 변경
- `.agents/ui/COMPONENTS.md`에 제공 공통 컴포넌트 등록.
- 루트 `README.md`에 "미리 보는 웹 스캐폴드" 안내와 문서 지도에 `CHANGELOG.md` 추가.
- `.gitignore`에 `.react-router/`(React Router typegen 산출물) 추가.

## [2.0-draft] - 2026-05-28

- AI 에이전트 표준 템플릿 문서 세트 기준선(`AGENTS.md`, `.agents/*`, 도구별 문서 `CLAUDE.md`/`CODEX.md`, 훅). 이후 QUICKSTART 프롬프트, 컴포넌트 생성·DB 마이그레이션 스킬 문서 등이 보강되었으나 별도 버전 스탬프 없이 반영되었다(이 CHANGELOG 도입 이전).
