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

## 2026-08-14 · 정하기·만들기 · 신규 사용자 온보딩(`/onboard`)과 git 승인 경계 재정의

- 한 것: 처음 온 비개발자를 첫 커밋까지 데려가는 `/onboard` 명령 추가. `AGENTS.md` §6의 git 승인 규칙을 작업 성격으로 나눔. `.claude/settings.json`에 로컬 git 작업 allowlist 신설. `QUICKSTART.md`의 `git init` 누락 수정. (2.12 → 2.13-draft)
- 정한 것과 이유:
  - **온보딩 종료 조건은 PR이 아니라 로컬 커밋 1개.** 공식 도입 경로가 ZIP 다운로드라 원격 저장소가 없다 — PR을 넣으면 GitHub 계정 만들기가 온보딩 안으로 들어와 온보딩이 GitHub 강좌가 된다. 단 브랜치 생성은 포함한다. 안 하면 `main`에서 커밋하게 되고 첫 푸시에서 반드시 차단당한다.
  - **`SessionStart` 훅을 만들지 않는다.** `CLAUDE.md`는 세션 시작 시 자동으로 읽히므로, 거기 한 줄 넣으면 훅 없이 같은 효과가 난다. 사용자가 "이거 뭐하는 폴더냐"고만 물어도 에이전트가 `/onboard`로 유도한다.
  - **git 승인 경계를 "승인 여부"가 아니라 "되돌릴 수 있느냐"로 나눈다.** 로컬 작업은 사전 승인, 저장소 밖으로 나가는 것만 한 줄 안내. 커밋을 매번 승인받게 하면 오히려 커밋을 미루게 되어 작업 유실 위험이 커진다.
  - **`scripts/agent-guard.cjs`와 `.githooks/`는 손대지 않는다.** 조사해 보니 하드 차단은 원래 되돌릴 수 없는 것(main 푸시, `--no-verify`, `reset --hard` 등)만 골라 막고 있었다. 평범한 `git commit`과 피처 브랜치 푸시는 처음부터 통과했다 — 마찰의 정체는 차단이 아니라 승인 규칙과 권한 프롬프트였다.
  - **allowlist는 `.claude/settings.local.json`이 아니라 추적되는 `.claude/settings.json`에 넣는다.** `CLAUDE.md`의 금지 규칙은 유지 — 금지 이유가 "리뷰에 안 보이는 곳에서 승인이 사라지는 것"이므로, PR에서 보이는 곳에 명시하면 그 이유에 저촉되지 않는다.
  - **실습 과제로 `dashboard.tsx`의 숫자를 쓰지 않는다.** 같은 값이 21~26행과 63~86행 두 곳에 있고 실제 렌더링은 아래쪽이다. 비개발자가 위를 고치면 화면이 안 바뀌어 첫날에 신뢰를 잃는다. 대신 `_app.tsx`의 사이드바 브랜드명을 쓴다 — 모든 화면에 보인다.
- 막혔다 푼 것:
  - "온보딩 문서가 없다"고 보고 새로 쓰려 했으나, `QUICKSTART.md`에 이미 AI 주도 프롬프트 A/B가 있었다 → 실제 결손은 문서가 아니라 **비개발자 경로의 단절 3개**(`git init` 누락 / GitHub 저장소 만드는 안내 0회 / 차단은 있는데 PR 만드는 법이 없음)였다. 조사 없이 만들었으면 있는 것을 또 만들 뻔했다.
  - `AGENTS.md` §6을 고치자 `.agents/WORKFLOW.md`와 위키 정리본 3개에 옛 규칙이 남아 모순이 생겼다 → 같은 작업에서 전부 동기화. 규칙을 고칠 때 어디가 그 규칙을 복제하고 있는지 먼저 grep해야 한다.
- 갱신한 정리본: [절대 금지·필수 규칙](notes/non-negotiable-rules.md), [작업 흐름](notes/workflow.md), [도구 사용 기준](notes/tooling.md). 새 페이지 없음.

## 2026-08-19 · 고치기 · `/wiki-check` 지적 3건 반영 (검증 명령 어긋남·필수 규칙 누락·출처 귀속)

- 왜 고쳤나: `/wiki-check` 점검에서 나온 9개 항목 중, 에이전트가 실제로 오작동할 수 있는 것부터 셋을 골라 고쳤다. 나머지(고아 페이지 3개, 원본 규칙 영역 누락 3건, `.agents/*` 4개 미수록)는 아직 남아 있다.
- 고친 것:
  - **검증 명령 어긋남** — [테스트와 검증](notes/testing.md)과 [배포](notes/deployment.md)가 `pnpm lint`·`deploy:dry`를 표준·필수 단계로 제시하고 있었다. 이 스캐폴드에는 둘 다 없다(루트 `package.json`은 `typecheck`·`test`·`build`만 제공, ESLint 설정 파일 없음). [기술 스택](notes/stack.md)은 정반대로 적고 있어 위키 안에서 모순이었다. 두 페이지에 실제 상태 단서를 넣고 세 페이지를 상호 링크로 묶었다.
  - **필수 규칙 1항목 복원** — [절대 금지·필수 규칙](notes/non-negotiable-rules.md)의 필수 목록이 `AGENTS.md` §6의 7개 중 6개만 담고 있었다. "반복되는 UX 패턴·공통 화면 정책은 `.agents/ui/UX_RULES.md`에 기록한다"가 빠져 있었다.
  - **출처 귀속 2건** — [팀 위키](notes/team-wiki.md)의 출처가 링크가 아닌 산문이었고(그래프에 선이 안 그려짐), [진입 규칙](notes/agents-entry.md)의 「이 프로젝트에서 정한 것」이 `AGENTS.md`에 없는 내용을 `AGENTS.md` 출처로 달고 있었다.
- 정한 것과 이유:
  - **`sources/`에 저장소 밖 자료 기록을 처음 만들었다** — [llm-wiki](sources/2026-08-19-llm-wiki.md). 본문을 받아 두지 않았으므로 "본문 미보관·대조 불가"를 기록 자체에 적었다. 출처를 지우거나 산문으로 남기는 대신 링크가 되게 한 이유는, 대조할 수 없다는 사실이 다음 점검에서 보여야 하기 때문이다. 본문을 확보하면 `/wiki-add-source`로 채운다.
  - **정리본이 원본을 바로잡는 쪽으로 썼다** — `lint` 어긋남의 1차 원인은 원본(`.agents/code/TESTING.md`, `.agents/DEPLOYMENT.md`)이 CTPA 레퍼런스 기준 4종을 적어 둔 것이다. 원본은 고치지 않고(`wiki/CLAUDE.md` 규칙), 정리본에 실제 상태를 덧붙였다. 근거는 `.agents/STACK.md` §7과 루트 `package.json`이라 위키 안에서 출처가 추적된다.
  - **`.agents/*`를 고치지 않았다** — 2.13-draft에서 추가된 `/onboard`가 `.agents/VIBE_CODING_GUIDE.md`에도 없다. 1차 결손이 원본 쪽이므로 위키를 먼저 고치면 규칙이 갈라진다. 원본을 고치는 작업은 `CHANGELOG.md`·표준 버전 갱신을 함께 요구하므로 따로 다룬다.
- 갱신한 정리본: [테스트와 검증](notes/testing.md), [배포](notes/deployment.md), [기술 스택](notes/stack.md), [절대 금지·필수 규칙](notes/non-negotiable-rules.md), [팀 위키](notes/team-wiki.md), [진입 규칙](notes/agents-entry.md). 새 원본 기록 1건([llm-wiki](sources/2026-08-19-llm-wiki.md)). 새 정리본 없음.

## 2026-08-19 · 넣기·고치기 · 위키 커버리지 완성과 남은 점검 지적 정리

- 왜 했나: 앞선 점검에서 "남은 것"으로 미뤄 둔 항목을 전부 닫으려고. 위키가 저장소 규칙 지도를 자칭하는데 `.agents/*` 4개가 아예 빠져 있어, 위키만 보면 지도가 완전한 것으로 읽히는 상태였다.
- 넣은 것: `.agents/*` 미수록 4건. 새 원본 기록 4개([NEST_GUIDE](sources/nest-guide.md), [NEST_CF_WORKER](sources/nest-cf-worker.md), [GOOD_EXAMPLES](sources/good-examples.md), [BAD_EXAMPLES](sources/bad-examples.md))와 새 정리본 2개([NestJS 프로젝트 규칙](notes/nestjs.md), [좋은 예시와 금지 예시](notes/examples.md)). **이제 `.agents/*` + `AGENTS.md` 23개가 23/23 수록됐다.**
- 고친 것:
  - **원본 규칙 영역 누락 3건** — [UX 규칙](notes/ux-rules.md)에 원본 16장 중 빠져 있던 7장(파일 업로드·이동과 현재 위치·키보드와 단축키·패널과 밀도·피드백·모바일·UX 문서화)을 넣고 선택·일괄 작업과 AI 체크리스트를 원본에 맞췄다. [공통 컴포넌트](notes/components.md)에 빠져 있던 컴포넌트 6개(Select·Checkbox·Field·PageHeader·StatCard·Placeholder)와 마크다운 렌더 규칙을 넣었다. [작업 흐름](notes/workflow.md)에 문서 업데이트 표와 최종 보고 형식을 넣었다.
  - **고아 페이지** — [README](README.md) 표의 `index.md`·`log.md`·`CLAUDE.md`가 백틱이라 그래프에 선이 안 그려졌다. 링크로 바꾸고 [색인](index.md)에서 README와 기록을 걸었다. **이제 혼자 떨어진 페이지 0개.**
  - **외부 자료 기록 형식** — [llm-wiki](sources/2026-08-19-llm-wiki.md)의 `원본:`이 산문이라 다른 23건과 형식이 갈렸다. `원본:`은 자료 이름, `본문: 미보관 — 대조 불가`를 별 필드로 분리했다.
  - **색인 문장의 순서 의존** — "마지막 1건만 저장소 밖 자료"가 목록을 재정렬하면 틀려진다. 목록에서 `(외부)`로 표시하는 방식으로 바꿨다.
- 정한 것과 이유:
  - **`sources/`의 `정리한 노트:` 줄은 갱신한다고 규칙에 명시했다** — [`wiki/CLAUDE.md`](CLAUDE.md). "읽기만 한다"(3단계)와 "양쪽 다 건다"(5단계)가 정면으로 충돌하던 자리다. "읽기만 한다"가 막으려는 건 자료 본문·원본 경로·목적을 고쳐 기록을 흐리는 것이고, 저 줄은 어느 정리본이 이 원본에서 나왔는지의 링크 색인이다. 갱신하지 않으면 한쪽만 걸린 링크가 구조적으로 남는다. 이 판정에 따라 [AGENTS.md 출처 기록](sources/agents-md.md)의 색인 줄에 팀 위키를 추가했다.
  - **볼트 밖 링크의 한계를 규칙에 적었다** — 볼트가 `wiki/`라서 `../../AGENTS.md` 류는 옵시디언에서 열리지 않는다. 고칠 수 있는 결함이 아니라 구조의 결과이므로, 정리본의 `## 출처`는 `sources/` 기록을 가리키는 것을 기본으로 하고 직접 링크는 예외로 둔다고 명시했다.
  - **NestJS 규칙을 한 정리본으로 묶었다** — 원본이 두 개(`NEST_GUIDE`, `NEST_CF_WORKER`)지만 적용 조건이 하나로 이어지고, 후자는 전자의 8장이 가리키는 add-on이다. [API 계약과 도메인 모델](notes/api-contract.md)이 원본 두 개를 묶은 것과 같은 방식.
  - **조건부 규칙임을 정리본 첫 줄에 박았다** — 이 스캐폴드는 React Router + Hono다. 조건 확인 없이 NestJS 규칙을 적용하면 [기술 스택](notes/stack.md)과 충돌한다. 위키에서 검색해 읽는 사람이 그 사실을 첫 줄에서 보게 했다.
- 갱신한 정리본: [UX 규칙](notes/ux-rules.md), [공통 컴포넌트](notes/components.md), [작업 흐름](notes/workflow.md), 그리고 새 정리본 2개와 짝을 맞추려고 `함께 보기`를 보강한 10개([진입 규칙](notes/agents-entry.md), [계층 아키텍처](notes/layered-architecture.md), [기술 스택](notes/stack.md), [API 계층 규칙](notes/api-layers.md), [프로젝트 구조](notes/project-structure.md), [코드 스타일](notes/code-style.md), [테스트와 검증](notes/testing.md), [마이그레이션](notes/migration.md), [팀 위키](notes/team-wiki.md), [DB 스키마 가드레일](notes/db-schema-guardrails.md), [API 계약과 도메인 모델](notes/api-contract.md)).
