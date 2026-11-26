> 원본: Gemini 가 생성한 조사 문서(docx)를 2026-11-26 Markdown 으로 옮겼다. 본문·표·참고자료 목록만 옮겼고 내용은 고치지 않았다.
> 문장 끝의 숫자는 원본의 각주 번호다(참고자료 목록 순서와 다를 수 있다). 수치·버전·규제 번호는 검증하지 않았다 — 인용 전에 1차 출처로 확인한다.


# 회사 표준 AI 코딩 하네스 구성 항목 및 레퍼런스 총람

회사 표준 AI 코딩 하네스에 탑재할 항목과 공식·실무 레퍼런스는 역할에 따라 다섯 개 계층으로 정리된다. 첫째는 도구 간 지침 표준(AGENTS.md, CLAUDE.md, .cursor/rules/*.mdc, .github/copilot-instructions.md)과 장기 실행·아키텍처 검증 아티팩트(Anthropic의 init.sh·JSON 기능 목록·브라우저 E2E, OpenAI의 실행 계획·경계 파싱·구조 린터, Martin Fowler의 피드포워드/피드백 센서) 계층이다1. 둘째는 .claude/settings.json(PreToolUse, PostToolUse), Cursor hooks.json, Codex 훅을 이용한 결정론적 런타임 차단 및 감사 로그 계층이다7. 셋째는 바이브코딩 시 하드코딩과 환경 드리프트를 막는 타입 기반 경계 검증(Zod, t3-env, envalid, Pydantic Settings) 및 4단계 비밀정보 스캔(Gitleaks/Betterleaks, TruffleHog, GitHub Secret Scanning & Push Protection, OWASP Secrets Management·CWE-798) 계층이다11. 넷째는 PostgreSQL 마이그레이션 린터(Squawk, MigrationPilot), 라이브 스키마·RLS 보안 점검(supabase db lint, Postgres Language Server의 Splinter), OWASP DB 하드닝, Cloudflare D1·Hyperdrive·Time Travel 제어로 구성된 DB 관리 계층이다16. 다섯째는 Cloudflare-GitHub 배포 위생(wrangler.jsonc, .dev.vars.example, .assetsignore, _headers, /api/health, wrangler-action@v4, Worker Previews + Access, Secrets Store, AI Gateway)과 정책 코드화·공급망·거버넌스(Conftest/OPA, OSV-Scanner, Trivy, Renovate, CODEOWNERS, OpenSSF Scorecard, OWASP Agentic Top 10 2026·AST10·NIST SP 800-218A) 계층이다23.

표준 하네스 설계에서 가장 중요한 원칙은 프롬프트 지침(안내문)과 기계적 강제 장치(잠금장치)를 분리하는 것이다1. Claude Code 공식 문서를 해설한 자료에 따르면 CLAUDE.md는 시스템 프롬프트가 아니라 그 뒤에 사용자 메시지로 전달되는 참고 자료이므로 엄격한 준수가 보장되지 않으며, OpenAI 역시 2026년 2월 Codex 사례 보고에서 방대한 단일 지침서가 컨텍스트 고갈·규칙 부패·기계적 검증 불가를 유발해 실패했다고 밝혔다2. 다만 본 보고서에 인용된 벤치마크와 도구 비교 수치 중 일부는 공급사 엔지니어링 블로그(LangChain, MigrationPilot), 외부 비교 블로그(devsecops.ae, haxset.com, requesty.ai), 2차 기술 해설에 기반하며, DB 관리 레퍼런스는 PostgreSQL·Supabase 및 Cloudflare D1·Hyperdrive를 중심으로 수집되어 MySQL·ORM 전용 마이그레이션 린터나 Terraform 기반 Cloudflare IaC 규격은 추가 내부 조사가 필요하다15.


## 회사 표준 하네스 5계층 레퍼런스 매트릭스

조직 내 모든 저장소 템플릿에 기본 내장할 표준 항목과 출처 레퍼런스의 전체 구성은 다음과 같다.

| 계층 | 표준 하네스 항목 및 파일 | 핵심 통제 목적 | 주요 근거 레퍼런스 및 표준 |
|---|---|---|---|
| 1계층: 지침·상태·구조 | AGENTS.md, CLAUDE.md, .claude/rules/, .cursor/rules/*.mdc, .github/copilot-instructions.md, SKILL.md | 도구 간 지침 드리프트 방지, 컨텍스트 비대화 억제, 경로별 규칙 스코핑 | AGENTS.md 오픈 표준, OpenAI Codex Harness Engineering, Anthropic Claude Code 문서 해설2 |
| 1계층: 장기 실행·검증 | docs/, 실행 계획 문서, init.sh, JSON 기능 목록(tests.json), claude-progress.txt, 브라우저 E2E(MCP), 커스텀 구조 린터 | 세션 간 작업 연속성 확보, 조기 완료 선언 방지, 도메인 경계 강제 | Anthropic Effective Harnesses for Long-Running Agents, OpenAI Harness Engineering, Martin Fowler1 |
| 2계층: 런타임 훅 | .claude/settings.json (PreToolUse, PostToolUse), Cursor hooks.json, Codex 훅, audit.log | .env·.dev.vars 모델 노출 차단, 위험 셸 명령 차단, 행위 감사 추적 | Anthropic Claude Code Hooks 문서, Cursor Hooks 문서, Codex·Claude 훅 비교 분석7 |
| 3계층: 하드코딩·시크릿 | Zod / t3-env / envalid / Pydantic Settings, .env.example, Gitleaks/Betterleaks, TruffleHog, GitHub Push Protection | CWE-798 하드코딩 차단, NEXT_PUBLIC_/VITE_ 노출 방지, 4단계 비밀정보 스캔 | OWASP Secrets Management, CWE-798, GitGuardian 2026 인용 자료, DevSecOps 4-Gate 모델2 |
| 4계층: DB 관리 | Squawk / MigrationPilot, supabase db lint / pgTAP, Splinter RLS 규칙, D1 마이그레이션·Time Travel, OWASP DB 하드닝 | 테이블 락 장애 방지, RLS 누락·우회 차단, 최소 권한 계정 분리, 에지 DB 복구 | Squawk, Supabase CLI, Postgres Language Server(Splinter), OWASP DB Security, Cloudflare D1 문서17 |
| 5계층: Cloudflare-GitHub 배포 | wrangler.jsonc, .dev.vars.example, .assetsignore, _headers, /api/health, wrangler-action@v4, Access, Secrets Store, AI Gateway | 환경 분리(PR 프리뷰 vs main 운영), 정적 번들 메타데이터 유출 차단, LLM 키·비용·DLP 통제 | Cloudflare Workers Builds·Previews·Secrets Store·AI Gateway 공식 문서, GitHub Actions23 |
| 5계층: 정책·공급망·거버넌스 | Conftest(Rego) / OPA, OSV-Scanner, Trivy, Renovate, CODEOWNERS, Branch Protection | 설정 파일 정책 자동 감사, 의존성·컨테이너 취약점 차단, 에이전트 보안 컴플라이언스 | OWASP Agentic Top 10 2026, OWASP AST10, NIST SP 800-218A, OpenSSF Scorecard27 |


## 1계층: 멀티 툴 지침 표준과 장기 실행·아키텍처 불변식

모델 성능이 상향 평준화되면서 에이전트의 실무 성과는 모델 주변에 구축한 검증·트레이싱·컨텍스트 체계에 의해 크게 갈린다32. LangChain은 자사 엔지니어링 블로그에서 모델을 바꾸지 않고 자가 검증, 트레이싱, 컨텍스트 최적화를 적용한 하네스 개선만으로 Terminal Bench 순위를 상위 30위권에서 상위 5위권으로 끌어올렸다고 발표했으며33, 여러 2차 기술 블로그는 동일 사례의 Terminal Bench 2.0 점수가 52.8%에서 66.5%로 상승했다고 전했다44. 반대로 규칙을 단일 대용량 문서에 몰아넣으면 컨텍스트 윈도우를 잠식하고, 모든 항목을 중요하게 표기해 에이전트가 지역 패턴 매칭에 빠지며, 문서가 급속히 부패하고, 기계적 검증이 불가능해진다6. OpenAI는 이 문제를 해결하기 위해 1,000페이지 분량의 매뉴얼 대신 지도 역할을 하는 지침 파일을 채택하고6, 2차 기술 해설에 따르면 AGENTS.md를 약 100줄 수준으로 압축하고 서브컴포넌트 전반에 88개의 분산 AGENTS.md와 CI 상호 링크 검증 대상인 docs/ 디렉터리를 운용했다6.

Claude Code 운영에서도 컨텍스트 위생 규칙을 명확히 구분해야 한다. 공식 문서를 정리한 해설에 따르면 CLAUDE.md는 일반 로딩 경로에서 최대 4MiB까지 통째로 읽히지만 길수록 지시 누락이 늘어나므로 파일당 200줄 미만을 목표로 삼아야 하며, 에이전트가 스스로 기록하는 MEMORY.md에는 첫 200줄 또는 25KB 중 먼저 도달하는 쪽이라는 실제 상한이 걸려 있다2. 또한 실행 폴더와 상위 폴더의 CLAUDE.md가 모두 이어 붙여지므로 충돌하는 규칙을 두면 Claude가 임의로 한쪽을 택할 수 있다2. 따라서 매 세션 필수적인 빌드·테스트 명령과 프로젝트 불변식만 CLAUDE.md에 남기고, 파일·폴더별 제약은 .claude/rules/의 paths 규칙으로, 다단계 절차는 이름과 설명만 상시 노출되고 본문은 호출 시 로드되는 SKILL.md 스킬로 분리하며, 세션 시작 시 /context로 로드 여부를 확인해야 한다2.

팀 내에서 Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Windsurf 등 여러 도구를 혼용할 때는 지침 파일 간 불일치가 발생하지 않도록 공통 표준인 AGENTS.md(2차 기술 요약에 따르면 2025년 8월 OpenAI·Google·Cursor·Factory 등의 협업으로 오픈 표준화됨)를 단일 원천(Single Source of Truth)으로 삼고 도구별 파일은 자동 변환하거나 고유 스코핑 기능에만 한정해 두어야 한다3. 실무 참조 프로젝트인 agency-agents는 Markdown 원천 명세를 convert.sh와 install.sh로 타깃 도구 형식에 맞게 변환·배포하고 lint-agents.sh로 프론트매터와 권장 섹션을 검증하는 파이프라인을 제시하며47, generate-ai-instructions.sh 패턴 역시 단일 원천에서 .github/copilot-instructions.md와 AGENTS.md를 생성한다48. 표준 규칙 팩 레퍼런스인 AI Rulebook은 이를 완료 보고 형식을 고정(Changed, Also fixed, Checks, Not done)하는 scope.mdc, 입력 검증·시크릿 보호를 다루는 code.mdc, 미실행 테스트의 통과 보고 및 테스트 약화를 금지하는 tests.mdc, 문서 밀도를 유지하는 docs.mdc, 무단 커밋·푸시·히스토리 재작성을 금지하는 git.mdc, 요청 시 전체 패스를 수행하는 review.mdc로 모듈화한다49.

| 도구 및 표준 | 표준 파일 경로 | 스코핑·로딩 메커니즘 | 회사 표준 하네스 배치 원칙 |
|---|---|---|---|
| 오픈 공통 표준 (Codex·Windsurf·Cline·Cursor 등) | AGENTS.md, Codex ~/.codex/config.toml | 저장소 루트 및 하위 디렉터리 계층 로딩32 | 약 100줄 내외 지도 역할; 빌드·테스트 명령, 아키텍처 경계, 공통 규칙의 SSOT3 |
| Claude Code | CLAUDE.md, .claude/rules/*.md, SKILL.md | CLAUDE.md는 사용자 메시지로 전달(권고 200줄 미만); MEMORY.md는 200줄/25KB 상한; .claude/rules/는 paths 매칭 시만 로드2 | AGENTS.md 임포트 및 필수 불변식만 유지; 다단계 절차는 SKILL.md로 분리2 |
| Cursor | .cursor/rules/*.mdc | YAML 프론트매터(description, globs, alwaysApply) 기반 조건부·수동(@) 활성화3 | 동일 규칙 중복 복사 금지; 결제·원장 등 민감 경로 globs 제약에만 사용3 |
| GitHub Copilot | .github/copilot-instructions.md, .github/instructions/*.instructions.md | 저장소 전체 지침 + 프론트매터 applyTo 경로 패턴 매칭4 | 계약 테스트·외부 API 모킹 강제(tests/contract/** 등) 경로별 지침 배치4 |
| 기타 도구 | GEMINI.md, .windsurfrules, .devin/rules/*.md, CONVENTIONS.md | 각 런타임별 컨벤션 파일 자동 또는 변환 스크립트를 통해 배포3 | AGENTS.md 마스터 명세로부터 convert.sh 등으로 자동 생성해 드리프트 차단47 |

단일 세션을 넘어서는 장기 코딩 작업에는 Anthropic이 2025년 11월 발표한 초기화·코딩 에이전트 분리 패턴과 OpenAI의 아키텍처 불변식 기법을 결합해야 한다5. Anthropic은 마크다운보다 모델이 임의로 덮어쓰기 어려운 구조화 JSON 파일(tests.json 등)로 기능 목록을 관리하고, claude-progress.txt 및 init.sh로 세션 시작·종료 프로토콜을 표준화할 것을 제시했다5. 또한 코드 리뷰만으로 놓치는 회귀 버그를 잡기 위해 세션 시작 시점과 구현 후 모두 브라우저 기반 E2E 검증(Puppeteer MCP 또는 Computer Use)을 실행해야 하지만, Puppeteer MCP 환경에서는 브라우저 네이티브 alert 모달을 에이전트가 인지하지 못하는 한계가 보고되었으므로 네이티브 모달에 의존하는 UI는 피해야 한다5.

| 장기 실행 실패 모드 | 초기화 단계 하네스 구성 (Initializer) | 세션별 실행 규약 (Coding Agent) |
|---|---|---|
| 전체 프로젝트 조기 완료 선언 | 입력 명세를 기반으로 엔드투엔드 기능 목록을 구조화 JSON 파일(tests.json 등)로 생성5 | 세션 시작 시 기능 목록을 읽고 단일 기능만 선택해 착수5 |
| 미문서화 버그·세션 간 상태 유실 | 초기 Git 저장소와 claude-progress.txt 진행 기록 파일 생성5 | progress 파일·git log 확인 및 개발 서버 기본 테스트로 시작하고, Git 커밋과 진행 업데이트로 종료5 |
| 불충분한 검증 후 조기 완료 표기 | E2E 기능 검증 기준 목록 수립5 | 세션 시작 및 구현 후 브라우저 기반 E2E 검증을 통과한 뒤에만 passing 표기5 |
| 매 세션 앱 구동 방법 재탐색 | 개발 서버를 실행하는 표준 init.sh 스크립트 제공5 | 세션 시작 시 init.sh를 읽어 즉시 서버 기동 및 상태 확인5 |

아키텍처 일관성 유지를 위해서는 OpenAI가 적용한 불변식 강제와 엔트로피 관리가 필요하다6. 복잡한 작업의 실행 계획(execution plans), 의사결정 로그, 알려진 기술 부채는 외부 메모에 두지 말고 저장소 내부에 버전 관리 아티팩트로 함께 체크인해야 한다6. 비즈니스 도메인마다 고정된 계층과 허용된 의존성 방향만 통과시키는 커스텀 린터 및 구조 테스트를 배치하고, 경계에서 데이터 형태를 파싱하도록 요구하며(OpenAI 사례에서는 라이브러리 미지정 시 모델이 Zod를 자주 선택함), 에이전트가 gh CLI와 로컬 스크립트로 PR을 열고 자가 리뷰 및 에이전트 상호 리뷰를 반복하는 루프(Ralph Wiggum Loop)를 구축할 수 있다6. 단, 에이전트가 저장소 내 기존 비최적 패턴까지 복제해 "AI 슬롭"이 누적되는 문제(OpenAI 팀이 초기 매주 금요일, 즉 주간 업무의 20%를 수동 정리에 썼던 원인)를 줄이려면 주기적 리팩토링·유지보수성 센서(Martin Fowler의 연산적·추론적 피드백)를 정례화해야 한다1. 아울러 OpenAI 개발자 포럼에 보고된 한 실사용 사례에서는 Codex의 멀티에이전트 위임 시 하위 작업이 완료된 후 상위 작업이 재개되지 않거나 불필요한 상태 확인 폴링이 반복되어 비용과 지연이 발생한 문제가 지적되었으므로, 병렬 서브에이전트를 쓰는 팀은 완료 이벤트 전달과 독립 실행 여부를 모니터링하는 감시 규칙을 두어야 한다56.


## 2계층: 결정론적 런타임 훅과 감사·샌드박스 가드레일

에이전트에게 "비밀 파일을 읽지 말라"거나 "삭제 명령을 쓰지 말라"고 프롬프트로 지시하는 방식은 모델이 잊거나 우회할 수 있다9. 이를 보완하려면 도구 실행 직전(PreToolUse)과 직후(PostToolUse), 프롬프트 제출(UserPromptSubmit), 세션 시작·종료(SessionStart, Stop) 시점에 외부 스크립트나 HTTP 핸들러를 자동 실행하는 런타임 훅과 권한 차단 설정(permissions.deny)을 프로젝트 표준 설정 파일(.claude/settings.json, Cursor hooks.json)에 배포해야 한다2. 국내 실무 시연에서 확인된 것처럼 Claude Code의 PreToolUse 훅은 --allowedTools 설정보다 한 단계 더 안쪽에서 작동하므로, Bash나 Write가 허용된 세션이라도 훅이 차단하면 명령이 실행되지 않는다9.

PreToolUse 차단 프로토콜은 두 가지 방식 중 하나를 일관되게 선택해 구현한다. 첫째는 종료 코드 방식으로, 스크립트가 0을 반환하면 허용하고 2를 반환하면 실행을 즉시 차단한 뒤 표준에러(stderr) 메시지를 모델에게 전달해 대안을 찾게 하며, 그 외 코드는 에러로 처리한다9. 둘째는 구조화 JSON 방식으로, 종료 코드 0과 함께 표준출력(stdout)으로 hookSpecificOutput 내 permissionDecision: "deny"와 permissionDecisionReason을 반환한다9. 주의할 점은 종료 코드 2를 반환하면 Claude Code가 stdout의 JSON 출력을 무시하므로 두 방식을 절대 한 훅에 섞어 쓰지 말아야 하며, Claude Code 내 /hooks 명령은 읽기 전용 조회만 가능하므로 훅 변경은 .claude/settings.json 파일 수정과 Git 리뷰로만 통제해야 한다37.

| 훅 이벤트 / 도구 | 적용 대상(Matcher) | 표준 하네스 강제 동작 | 구현 시 유의사항 및 한계 |
|---|---|---|---|
| PreToolUse (비밀 파일 차단) | Read, Edit, Write, Bash | .env(및 Cloudflare .dev.vars 확장 적용), 개인키 파일 접근 시 exit 2 또는 permissionDecision: "deny" 반환9 | 비밀값이 모델 컨텍스트로 유입되어 외부 API 로그에 남는 것 자체를 사전 차단9 |
| PreToolUse (파괴적 명령 차단) | Bash, DB/인프라 MCP 도구 | rm, del, 강제 푸시, d1_database_delete 같은 고위험 도구 호출 검사 및 차단9 | rm -rf만 막고 단일 파일 rm은 통과시키는 정규식 빈틈이 발생할 수 있음59 |
| PostToolUse (감사·자동 포맷) | Write, Edit, Bash | 타임스탬프·도구명·인자를 audit.log에 적재하고, 코드 포맷터·린터 자동 실행9 | 차단된 호출은 PostToolUse에 남지 않으므로 세션 로그 외 별도 감사 체계 필요9 |
| 멀티 툴 호환 (Codex·Cursor) | 셸, 파일 편집, MCP 도구 | Codex는 셸·파일 편집·MCP 도구에 PreToolUse 적용; Cursor는 hooks.json 또는 Claude 설정 임포트 사용7 | Cursor에서 .claude/settings.json을 공유하려면 Third-Party Imports 설정 활성화 및 유효한 JSON 유지 필요61 |

런타임 훅 역시 만능은 아니다. 개인 실무 블로그 사례에서 보고되었듯 초기 8개 정규식 기반 차단 구조는 새로운 우회 패턴을 사후에야 발견해 추가하는 한계를 가지므로, 차단·오탐 로그를 분석해 규칙을 보강하는 개선 루프(IMPROVE 루프)를 운영해야 한다59. 더 높은 격리가 필요한 기업 워크로드에는 Anthropic의 엔터프라이즈 플랫폼 및 메모리 문서가 제시하는 심층 방어 항목—민감 파일과 내부 패키지를 호스트와 분리하는 자체 호스팅 샌드박스(Self-hosted sandbox), 사설망 MCP 서버 접근용 MCP 터널, 자격증명을 에이전트 코드에서 분리하는 볼트(Vault), 그리고 메모리 저장소 사용 시 경로 탈출(../, ..\, %2e%2e%2f)을 막기 위한 정규 경로 검증(pathlib.Path.resolve() 및 relative_to())—을 결합해야 한다62.


## 3계층: 바이브코딩 하드코딩 방지 및 비밀정보 4단계 차단 체계

바이브코딩으로 생성된 코드는 개발 속도가 빠른 만큼 취약점과 비밀키 유출 위험을 키운다. 국내 기술 블로그에 인용된 Apiiro의 2025년 9월 분석에서는 AI 생성 코드가 2025년 6월 기준 연구 대상 저장소 전체에서 월 10,000건 이상의 신규 보안 취약점을 도입한 것으로 집계되었으며32, 또 다른 실무 해설이 인용한 GitGuardian 2026 비밀 정보 유출 조사에서는 Claude Code가 공동 작성자로 표시된 공개 커밋의 비밀값 포함 비율이 3.2%, 기준 집단(다른 AI 작성 커밋 포함)이 1.5%로 나타났다2. 해당 해설이 정확히 짚었듯 기준 집단에도 AI 작성 커밋이 섞여 있으므로 이 수치는 AI가 유출의 직접 원인이라는 인과적 증거라기보다 공개·배포 전에 자동 검사가 필수적임을 보여주는 근거로 해석해야 한다2.

하드코딩(CWE-798)과 클라이언트 키 노출을 원천 차단하려면 코드 경계 검증과 다층 시크릿 스캐닝을 결합해야 한다11. 먼저 애플리케이션 코드에서는 환경변수 누락 시 안전하지 않은 기본값(unsafe defaults)으로 fallback하지 않고 부트스트랩 단계에서 즉시 기동을 중단(fail-fast)하는 타입 기반 설정 검증기를 표준으로 강제한다. TypeScript·Next.js·Vite 스택에는 Zod, t3-env, envalid를, Python 스택에는 Pydantic Settings나 JSON Schema를 의무 적용하며, 실제 코드의 환경변수 참조·.env.example(Cloudflare 프로젝트는 .dev.vars.example)·배포 환경 변수 목록 사이의 드리프트(env drift)와 NEXT_PUBLIC_·VITE_ 같은 브라우저 노출 접두사를 통한 비밀정보 유출 여부를 CI 정적 검사로 점검한다12.

둘째, OWASP Secrets Management Cheat Sheet와 보안 아키텍처가 권고하는 4단계 비밀정보 차단 게이트(4-Gate Model)를 Git 워크플로 전체에 적용한다11. 단일 도구에만 의존하면 commit-time 속도나 live-credential 검증 중 하나를 포기해야 하므로, 2026년 10월 기준 도구 유지보수 현황과 외부 데이터 전송 특성까지 고려해 게이트별로 도구를 조합해야 한다14.

| 게이트 / 도구 | 탐지 방식 및 실행 속도 | 오탐률 및 키 유효성 검증 | 2026년 유지보수 현황·보안·운용 트레이드오프 |
|---|---|---|---|
| 1·2단계 (로컬 프리커밋 + PR Diff): Gitleaks / Betterleaks | 정규식 + 섀넌 엔트로피 (Go 단일 바이너리, 오프라인, 일반 Diff 1초 미만)14 | 보안 비교 블로그(devsecops.ae) 추정치 기준 Gitleaks는 튜닝 전 오탐 약 5~15%; 라이브 키 검증 없음(더미 키 오탐 시 --no-verify 우회 유발 위험)15 | Gitleaks(gitleaks/gitleaks-action@v2, v8.30.0)는 2026년 10월 소스 분석 글 기준 README에 향후 보안 패치만 제공한다고 명시; 150+ 패턴의 Betterleaks가 활발한 대안이며 두 도구 모두 기본 설정 시 데이터를 외부로 전송하지 않음14 |
| 1단계 (레거시 베이스라인): detect-secrets | 정규식 + 엔트로피 (Python, 중간 속도)14 | 엔트로피 오탐이 높으나 .secrets.baseline으로 기존 레거시 저장소의 과거 누출을 기준선(Baseline) 처리하는 데 강점14 | 유지보수 상태가 자료별로 상충함(한 비교표는 Active로 표기하나, 2026년 10월 비교 분석은 2024년 5월 이후 릴리스가 없고 기본 실행 시 외부 데이터 전송 동작을 지적)14 |
| 3단계 (정기 전체 Git 히스토리 감사): TruffleHog | 엔트로피 + 정규식(700+ 탐지기) + 실제 서비스 API 호출 검증 (느림)14 | devsecops.ae 추정치 기준 Raw 오탐 약 10~20%가 라이브 검증(--results=verified) 시 2% 미만으로 감소; v3.97.0(2026년 8월 14일)부터 SARIF 출력 지원15 | 유효성 검증을 위해 후보 키를 외부 서비스 API로 전송하므로 오프라인 실행 불가 및 서드파티 Rate Limit 우려가 있으며, 일반 PII(카드번호 등)는 탐지 못 함14 |
| 4단계 (플랫폼 감시·차단): GitHub Secret Scanning & Push Protection | 200+ 파트너 토큰 패턴 + 커스텀 정규식(자체 키 등록 가능) + 파트너 자동 무효화14 | 코드·전체 브랜치 이력·이슈·PR 코멘트·Gist 스캔; 파트너 연동 시 즉각 폐기 지원68 | 공개 저장소는 무료 기본 활성화이나, 비공개 기업 저장소는 GitHub Advanced Security(GHAS) 유료 플랜 필요; Push Protection은 기본 비활성화인 경우가 많고 쓰기 권한자가 사유 입력 후 우회 가능34 |

회사 표준 구성으로는 데이터를 외부로 보내지 않는 Gitleaks 또는 Betterleaks를 프리커밋 훅(1단계)과 PR CI(SARIF Code Scanning 출력, 2단계)에 배치하고 테스트용 더미 키는 .gitleaks.toml 등으로 정교하게 제외해 --no-verify 우회를 막아야 한다14. 동시에 주간·분기 스케줄 CI로 TruffleHog(--only-verified) 전체 Git 히스토리 감사(3단계)를 돌려 과거 브랜치와 태그에 살아남은 실제 유효 키를 식별하며, 저장소 설정에서 GitHub Secret Scanning·Push Protection과 사내 커스텀 패턴(4단계)을 활성화한다14. 보안 비교 블로그(devsecops.ae)는 프리커밋 훅과 CI 스캔 조합만으로 무료로 시크릿 스캐닝 범위의 약 80%를 커버할 수 있다고 추정한다15.

스캐너 통과 여부와 무관하게 이미 원격 저장소에 비밀값이 푸시되었다면 즉시 유출로 간주하고 다음 표준 대응 절차를 밟아야 한다66.

즉각 폐기 및 재발급: 해당 클라우드·AI·결제 서비스 콘솔에서 노출된 키와 토큰을 즉시 폐기(revoke)하고 새 자격증명으로 교체(rotate)한다68.

Git 히스토리 영구 제거: 최신 커밋만 덮어쓰지 말고 git filter-repo를 사용해 전체 커밋 이력에서 민감 파일·문자열을 삭제한 뒤 강제 푸시(force push)한다68.

접근 로그 감사: 유출 시점부터 폐기 완료 시점까지 해당 키로 비정상 API 호출이나 과금이 발생했는지 제공자 감사 로그를 전수 점검한다68.


## 4계층: DB 관리 표준과 마이그레이션·RLS·D1 거버넌스

바이브코딩 시 에이전트는 프로덕션 테이블 규모와 동시 접근 잠금을 고려하지 않은 채 파괴적인 DDL을 생성하거나, Supabase·PostgreSQL의 행 수준 보안(RLS)을 형식적으로만 설정하는 경향이 있다. 이를 막으려면 PostgreSQL 계열 프로젝트의 표준 하네스에 정적 마이그레이션 린터와 라이브 스키마·RLS 린터를 모두 필수 게이트로 넣어야 한다.

SQL 마이그레이션 파일(.sql)의 정적 검증 표준은 Squawk(2026년 8월 v2.62.0 기준 40개 규칙, Apache-2.0/MIT, Rust 기반 pg-query-rs 파서, VS Code LSP·프리커밋·GitHub Action PR 코멘트 지원)다20. Squawk는 require-concurrent-index-creation(CREATE INDEX CONCURRENTLY 강제), constraint-missing-not-valid, adding-field-with-default, adding-not-nullable-field, adding-required-field, disallowed-unique-constraint, prefer-bigint-over-int, prefer-identity(serial 대신 GENERATED ... AS IDENTITY), ban-uncommitted-transaction, 하위 호환성 파괴 차단 규칙(ban-drop-table, ban-drop-column, renaming-column, changing-column-type, ban-truncate-cascade), 그리고 옵트인 RLS·정책 변경 감시(ban-alter-row-level-security, ban-drop-policy, ban-create-policy)를 검사한다20. 다만 레딧 개발자 토론에서 지적되었듯 Squawk는 정적 SQL 패턴만 보므로 5,000만 행 테이블에 치명적인 ACCESS EXCLUSIVE 락을 10행 테스트 테이블과 동일하게 취급하는 한계가 있다71. 대안 도구인 MigrationPilot은 자사 비교 문서에서 112개 무료 규칙(MIT), 20개 자동 수정(--fix), 구문별 락 유형 분석, RED/YELLOW/GREEN(0~100) 위험 점수, SARIF 출력, AI 에이전트 연동용 MCP 서버(4개 도구), 스키마 드리프트 탐지, 롤백 DDL 생성, RLS 안전 규칙(MP057, MP079), 테이블 크기·쿼리 빈도 기반 프로덕션 컨텍스트 반영을 지원한다고 제시한다21. 이는 공급사 자체 비교표의 주장이므로 사내 표준 대체 전 독립 PoC 검증이 필요하다21.

라이브 스키마와 RLS 정책 검증에는 Supabase CLI(supabase test db를 통한 pgTAP 테스트 및 supabase db lint)와 Postgres Language Server(Splinter 엔진) 규칙을 CI 테스트 DB 검증 단계에 결합한다18. Splinter는 보안과 성능 전반의 핵심 결함을 자동 적발하며, 기술 실무 가이드가 권고하듯 RLS 정책 내 auth.uid()나 is_admin() 같은 함수는 행마다 재계산되지 않도록 (SELECT auth.uid()) 스칼라 서브쿼리로 감싸 캐싱하고 조건 컬럼에 인덱스를 추가한 뒤 PostgreSQL EXPLAIN으로 실행 계획을 확인해야 한다19. 아울러 OWASP Database Security Cheat Sheet와 Password Storage Cheat Sheet에 따라 DB 전송 암호화와 최소 권한 하드닝을 하네스 체크리스트로 의무화해야 한다22.

| DB 검증·보안 영역 | 표준 도구 및 출처 | 하네스 강제 항목(대표 규칙) | 운용 시 주의사항·한계 |
|---|---|---|---|
| SQL 마이그레이션 정적 린트 | Squawk (v2.62.0, 40규칙) / MigrationPilot (공급사 주장 112규칙)20 | CONCURRENTLY 인덱스, NOT VALID 제약, bigint/IDENTITY, 컬럼·테이블 삭제·이름변경·타입변경·TRUNCATE CASCADE 차단20 | Squawk는 테이블 행 수 컨텍스트를 모르며, MigrationPilot 기능·수치는 벤더 비교 자료 기준임21 |
| 라이브 스키마·RLS 보안 | Supabase CLI (supabase db lint, test db), Postgres Language Server (Splinter)18 | rlsDisabledInPublic, policyExistsRlsDisabled, rlsEnabledNoPolicy, rlsPolicyAlwaysTrue(INSERT/UPDATE/DELETE 대상), rlsReferencesUserMetadata, securityDefinerView, authUsersExposed, sensitiveColumnsExposed, functionSearchPathMutable, foreignTableInApi, materializedViewInApi19 | SELECT의 USING (true)는 공개 조회 목적상 제외됨; 정책 내 함수 호출은 (SELECT ...) 래핑 및 EXPLAIN 검증 권장19 |
| 라이브 스키마 성능 | Postgres Language Server (Splinter)19 | noPrimaryKey, unindexedForeignKeys, multiplePermissivePolicies 탐지19 | 동일 역할·행위에 다중 허용 정책이 겹치면 매 쿼리마다 모두 평가되어 성능 저하 유발19 |
| DB 전송·계정·인증 하드닝 | OWASP Database Security & Password Storage Cheat Sheet22 | 암호화 연결 전용(TLS 1.2+ AES-GCM/ChaCha20 및 인증서 검증), 서비스별 고유·강력한 비밀번호 및 최소 권한 계정(DB 소유자 권한 부여 금지), DB 링크 지양, 패스워드 페퍼(pepper) 볼트·HSM 분리 보관22 | 런타임 앱 계정에 DB 소유자(owner) 권한을 주지 않아 권한 상승 및 임의 DDL 실행 위험 차단22 |

Cloudflare 에지 스택에서는 저장소 유형 선택과 마이그레이션 절차를 하네스에 명시해야 한다. 관계형 SQL이 필요하면 D1을, 외부 PostgreSQL 연결 풀링이 필요하면 Hyperdrive를, 파일 및 대용량 객체는 송신 비용(egress)이 없는 R2를, 단순 키-값 상태는 KV를 사용하며, 모든 리소스는 연결 문자열 하드코딩 대신 Workers·Pages 바인딩(bindings)으로만 연결한다74. D1 스키마 변경은 wrangler d1 migrations로 관리하고, 임시 SQL 실행은 반드시 wrangler d1 execute --local로 로컬 검증한 뒤에만 --remote를 실행하며, Workers Previews 운용 시 브랜치별 D1 마이그레이션 대상이 해당 프리뷰 바인딩과 정확히 일치하도록 구성해야 한다16. 장애 복구를 위해 D1은 30일간 시점 복구를 지원하는 Time Travel(wrangler d1 time-travel restore <db> --timestamp="...")을 기본 제공하지만79, 실무 블로그가 짚었듯 Time Travel은 데이터 내보내기(export)가 아니라 동일 데이터베이스를 제자리에서 덮어쓰는 복구이므로 장기 보관·이관용 논리 백업을 별도로 구축해야 한다17. 또한 Cloudflare MCP 도구를 에이전트에 연결할 경우 고위험으로 분류된 d1_database_delete 같은 삭제 도구는 PreToolUse 훅이나 권한 제한으로 차단해야 한다60.


## 5계층: Cloudflare-GitHub 연결 배포 환경 및 공급망·정책 코드화

Cloudflare와 GitHub가 연동된 배포 환경의 첫 번째 하네스 과제는 설정·로컬 비밀값·정적 에셋 번들 위생을 표준 템플릿으로 고정하는 것이다. Cloudflare 공식 자동 구성·PR CI/CD 문서에 따라 프로젝트에는 Worker 및 리소스 바인딩 설정 파일인 wrangler.jsonc(API 토큰·시크릿 기재 절대 금지), 로컬 개발 전용 .dev.vars와 템플릿 .dev.vars.example, .gitignore의 .wrangler, .dev.vars*, !.dev.vars.example 항목, 그리고 정적 에셋 번들링을 제어하는 .assetsignore를 필수로 포함한다23. 참조 오픈소스 구현 사례들에서는 .assetsignore에 README.md, LICENSE, wrangler.jsonc, package.json, scripts/를 추가해 설정과 스크립트가 정적 에셋으로 배포되는 사고를 막고, _headers 파일로 CSP·캐시 정책을 선언하며, GET /api/health Liveness 엔드포인트를 함께 표준화한다24.

GitHub-Cloudflare CI/CD 파이프라인은 Cloudflare Workers Builds(Git 통합) 또는 GitHub Actions(cloudflare/wrangler-action@v4)로 구성하되, 운영 배포는 main 브랜치 푸시 시에만 실행하고 PR은 격리된 프리뷰나 비운영(--env staging) 환경으로만 배포한다39. Cloudflare 공식 블로그 및 문서에 따르면 npx wrangler preview 기반의 Worker Previews는 프리뷰마다 독립된 Durable Object 네임스페이스와 Container 애플리케이션을 자동 생성해 운영 데이터와 격리하며 pr-<번호> 별칭 URL을 부여한다40. 민감한 내부 기능을 담은 프리뷰 URL에는 Cloudflare Access 인증을 의무 적용해 외부 접근을 차단해야 한다41. GitHub Actions에서 cloudflare/wrangler-action@v4로 배포할 때는 CLOUDFLARE_API_TOKEN과 CLOUDFLARE_ACCOUNT_ID를 GitHub Secrets에 보관해 wrangler secret put이나 wrangler secret bulk로 주입한다39. 실제 오픈소스 프로젝트 이슈에서 보고되었듯 --env staging 실행 시 환경별 Worker 이름 누락이나 AGENT_DATABASE_URL 같은 필수 시크릿 공백으로 배포가 실패할 수 있고, Cloudflare Workers Builds GitHub App이 PR 코멘트를 누락하는 장애 사례도 보고되었으므로 스테이징 배포 전 필수 변수 검증 스텝과 GitHub Actions 상태 체크를 병행해야 한다87.

에이전트나 웹 앱이 외부 LLM API를 호출할 때는 키를 Worker 코드나 매 요청 헤더에 직접 담지 않고 Cloudflare Secrets Store와 Cloudflare AI Gateway를 중앙 게이트웨이로 강제해야 한다26. 계정 단위로 시크릿을 관리하는 Secrets Store는 Workers 바인딩 및 AI Gateway(ai_gateway 스코프)와 통합되며26, 외부 시크릿 연동 이슈에서 확인된 대로 생성 이후에는 REST API로도 시크릿 원문을 조회할 수 없고 메타데이터만 반환하도록 설계되어 있다92. AI Gateway 앞단에서는 응답 캐싱, 요청 재시도, 모델 폴백 라우팅과 함께 IP·API 키·JWT·엔드포인트 경로별 Rate Limiting 및 Cloudflare One DLP 프로필을 적용할 수 있다42. 이때 Cloudflare 공식 제한 문서와 2026년 11월 가격·대안 분석 블로그(requesty.ai)가 짚은 세 가지 운용 제약을 하네스 설계에 반영해야 한다.

| Cloudflare-GitHub 통제 영역 | 표준 구성 및 규격 | 핵심 방어 목표 및 공식·실무 제약 사항 |
|---|---|---|
| 저장소 파일·번들 위생 | wrangler.jsonc, .dev.vars.example, .gitignore, .assetsignore, _headers, /api/health | wrangler.jsonc·.dev.vars*·scripts/ 번들 유출 차단, CSP/캐시 헤더 및 헬스체크 표준화23 |
| 브랜치·프리뷰 배포 격리 | main 운영 배포 / PR 프리뷰(pr-<번호>, 격리된 DO·Container) 또는 --env staging + Cloudflare Access | PR 코드의 운영 자원 오염 차단 및 민감 프리뷰 인증 보호; --env Worker 이름·필수 시크릿 사전 점검 필요40 |
| Secrets Store + AI Gateway 키·트래픽 통제 | Secrets Store(ai_gateway 스코프, 생성 후 REST 조회 불가) + BYOK 게이트웨이, 캐싱·폴백·Rate Limit | 코드·헤더 내 LLM 키 노출 차단; Unified Billing(충전 시 5% 수수료)은 60초당 200요청(HTTP 429, 코드 2018) 제한이 걸리나 BYOK는 미적용26 |
| AI Gateway 비용 상한·DLP | Access 인증 ID 기반 사용자별 spend limit, Cloudflare One DLP | requesty.ai 분석 기준 사용자별 비용 상한은 최종 일관성(eventual consistency)이므로 동시 요청 시 소폭 초과 가능; DLP 한도는 커스텀 25개, EDM 시트당 10만 셀, 계정당 워드리스트 1,000개·데이터셋 100만 셀35 |
| AI Gateway·Workers 로그 보관 및 과금 | 2026년 9월 24일 이후 신규 게이트웨이는 Workers Logs 적용, 2026년 12월 1일부터 Observability 요금제 전환 예정 | requesty.ai 2026년 11월 분석 기준 12월 1일부터 Free는 일 0.5GB(7일 보관, 초과 시 수집 중단), Paid는 주기당 50GB 수집·10GB-month 보관 포함(초과 시 GB당 0.10)으로 Workers 로그·트레이스·AI Gateway 로그가 한도를 공유함35 |

배포 직전 CI 파이프라인에는 에이전트가 하네스 파일 자체를 약화시키거나 취약한 의존성을 끌어들이는 것을 막는 정책 코드화(Policy-as-Code), 공급망 SCA, GitHub 거버넌스를 넣어야 한다. 2026년 10월 23일 기준 오픈소스 품질 게이트 조사 저장소의 도구 스냅샷에 따르면 Conftest(v0.71.1, Apache-2.0)와 OPA(v1.21.4, Apache-2.0)는 Rego 정책으로 CODEOWNERS, .env, JSON, TOML, YAML, Dockerfile, HCL, ignore 파일 등을 파싱해 github 어노테이션으로 출력할 수 있다29. 이를 통해 wrangler.jsonc에 평문 시크릿 필드가 추가되었는지, .assetsignore의 필수 제외 규칙이 빠졌는지, .claude/settings.json의 보안 훅이 제거되었는지를 PR 단계에서 자동 차단할 수 있다29. 의존성 및 인프라 취약점 스캐닝은 Lockfile 중심 11개 이상 언어 스캔과 라이선스 허용 목록(--licenses)·SBOM(JSON, SPDX, CycloneDX) 생성을 지원하는 OSV-Scanner(v2.7.0, Apache-2.0)와, 컨테이너·OS 패키지·Kubernetes·IaC 오구성·시크릿·라이선스·SBOM을 단일 플랫폼으로 통합 스캔하는 Trivy(v0.76.1, Apache-2.0), 그리고 Renovate(44.181.0)로 구성한다29. 단, 해당 품질 게이트 조사 저장소는 도구 간 상대적 탐지 품질 벤치마크를 실행하지 않았음을 명시하고 있으며, OSV-Scanner 공식 문서는 osv-scanner fix 명령이 신뢰할 수 없는 프로젝트에서 패키지 매니저 스크립트를 실행할 수 있어 위험하다고 경고하므로 PR 자동 수정에 적용해서는 안 된다29.

저장소 거버넌스는 OpenSSF Scorecard가 검사하는 GitHub Branch Protection 항목—main 브랜치에 대한 CODEOWNERS 리뷰 의무화, 최신 푸시 승인(last push approval), 최신 브랜치 상태 유지(up-to-date branches), 필수 상태 체크 통과—을 전사 기본 정책으로 강제해 완성한다30. 특히 AGENTS.md, CLAUDE.md, .claude/, wrangler.jsonc, DB 마이그레이션 폴더, .github/workflows/ 같은 하네스·인프라 핵심 경로를 플랫폼·보안 팀 소유로 CODEOWNERS에 묶으면 에이전트 단독 승인이나 자가 완화를 막을 수 있다. 이 전체 통제 아키텍처는 NIST SP 800-218(SSDF v1.1), 생성형 AI용 NIST SP 800-218A(2024년 7월), OWASP Top 10 for LLM Applications 2025, OWASP Top 10 for Agentic Applications 2026(2025년 12월 발표), OWASP Agentic Skills Top 10(AST10), 그리고 EU AI Act(Regulation (EU) 2026/1744 개정)의 에이전트 소프트웨어 개발 수명주기(ADLC) 컴플라이언스 기준과 정렬된다27.

| 정책·공급망·거버넌스 영역 | 표준 도구 및 버전(2026년 10월 집계) | 하네스 강제 항목 | 컴플라이언스 및 운용 주의사항 |
|---|---|---|---|
| Policy-as-Code | Conftest (v0.71.1, Apache-2.0), OPA (v1.21.4, Apache-2.0)29 | wrangler.jsonc, .env, YAML, TOML, CODEOWNERS, ignore 파일을 Rego로 검증 후 github 형식으로 PR 차단29 | 에이전트가 .claude/settings.json이나 CI 워크플로 가드레일을 완화하는 PR 자동 거부29 |
| 의존성·IaC·컨테이너 SCA | OSV-Scanner (v2.7.0, Apache-2.0), Trivy (v0.76.1, Apache-2.0), Renovate (44.181.0)29 | Lockfile 취약점·라이선스(--licenses)·SBOM(SPDX/CycloneDX)·IaC 오구성 차단 및 SARIF 연동29 | osv-scanner fix는 외부 레지스트리·패키지 스크립트 실행 위험이 있으므로 미검증 PR에 금지99 |
| GitHub 저장소 보호 | Branch Protection, CODEOWNERS, OpenSSF Scorecard 기준30 | 하네스·마이그레이션·배포 설정 경로 CODEOWNERS 필수 승인, last push approval, up-to-date branches, 필수 체크30 | 에이전트나 PR 작성자의 최신 푸시 무승인 머지 차단30 |
| AI·에이전트 규제·표준 매핑 | OWASP Agentic Top 10 2026, OWASP AST10, OWASP LLM Top 10 2025, NIST SP 800-218 / 800-218A, EU AI Act 2026/174427 | 스킬·도구 권한 분리, 감사 추적, 비밀정보 보호, 검증 게이트의 표준 증적 확보27 | SKILL.md 및 외부 MCP 연결 시 AST10 기준 권한 최소화와 메모리 경로 탈출 방어 필수28 |


## 회사 표준 하네스 3단계 도입 절차

전사 저장소에 다섯 계층을 한 번에 적용하면 오탐과 파이프라인 마찰로 우회(--no-verify 등)가 발생하기 쉬우므로, 치명적 유출과 파괴 차단부터 거버넌스 자동화 순으로 3단계에 걸쳐 적용한다.

1단계 (즉시 차단 기반 구축): 모든 저장소에 AGENTS.md(지도)·CLAUDE.md(200줄 미만)·.claude/settings.json(PreToolUse .env/.dev.vars/rm 차단 및 PostToolUse audit.log 적재)를 배포하고, Gitleaks/Betterleaks 프리커밋 훅·PR CI 스캔, GitHub Push Protection, Zod/t3-env/Pydantic Settings 경계 검증, .assetsignore 및 .gitignore 위생을 즉시 적용한다2.

2단계 (DB·Cloudflare 배포 파이프라인 보호): PostgreSQL·Supabase 저장소에 Squawk(또는 독립 PoC 거친 MigrationPilot)와 supabase db lint·Splinter RLS 규칙, OWASP 최소 권한 계정 분리를 PR 게이트로 연결하고, Cloudflare 환경에서는 main 운영/PR 프리뷰 분리, 민감 프리뷰 Cloudflare Access, D1 로컬 우선 실행 및 논리 백업, Secrets Store 기반 BYOK AI Gateway 프록시·Rate Limit·DLP·로그 한도 설정을 완료한다17.

3단계 (장기 실행·정책 코드화·지속 감사 완성): Conftest(Rego)로 하네스 설정·wrangler.jsonc·CODEOWNERS 무결성을 자동 검증하고, OSV-Scanner·Trivy·Renovate 공급망 게이트를 상시 가동하며, 장기 작업용 JSON 기능 목록·init.sh·실행 계획 버전 관리·브라우저 E2E 검증과 정기 TruffleHog(--only-verified) 전체 히스토리 감사 및 하네스 경로에 대한 CODEOWNERS·last push approval·up-to-date branches 보호를 강제한다5.


#### 참고 자료

1. Harness engineering for coding agent users - Martin Fowler, https://martinfowler.com/articles/harness-engineering.html
2. 클로드 코드(Claude Code) CLAUDE.md 세팅, 공식 문서와 다른 대목, https://www.digitalmarketer.co.kr/insights/claude-md-setup-official-docs
3. Markdown Files for AI Agents: A Complete Guide - Markdific, https://markdific.com/guides/markdown-files-for-ai-agents/
4. Spec-Driven Development with Cursor, Claude Code, Copilot - Enact, https://www.enactapp.io/blog/spec-driven-development-cursor-claude-code-copilot
5. Effective harnesses for long-running agents - Anthropic, https://www.anthropic.com/research/effective-harnesses-for-long-running-agents
6. Harness engineering: leveraging Codex in an agent-first world, https://openai.com/index/harness-engineering/
7. Agent harness: how to build the system that keeps AI coding agents, https://websiteinit.com/blog/agent-harness-for-ai-coding-agents/
8. Hooks reference - Claude Code Docs, https://code.claude.com/docs/en/hooks
9. PreToolUse / PostToolUse로 Claude 동작 제어하기 - Kindlove IT, https://kindloveit.tistory.com/648
10. Hooks | Cursor Docs, https://cursor.com/docs/hooks
11. Dorks for Leaked Secrets & OpenAI Keys: inurl:secrets, sk ... - chs.us, https://chs.us/guides/secrets/
12. Env Var and Config Validator: .env Drift and Typed Config… - Agensi, https://www.agensi.io/skills/env-var-and-config-validator-env-drift-and-typed-config
13. Free Online .env Editor, Validator & Secret Scanner - Jasper Bernaers, https://jasperbernaers.com/env-editor/
14. Secret Scanning Tools: Gitleaks vs TruffleHog Compared - Rafter, https://rafter.so/blog/secrets/secret-scanning-tools-comparison
15. Gitleaks vs TruffleHog: Which Secrets Scanner Wins in 2026?, https://devsecops.ae/secrets-scanners-comparison-2026/
16. cloudflare-d1 | Skills Marketplace · LobeHub, https://lobehub.com/skills/dennislee928-ethic-latex-cloudflare-d1
17. EmDash Cloudflare Lock-In: Portability Audit | Urumi.AI, https://urumi.ai/blog/emdash-cloudflare-lock-in/
18. Testing and linting | Supabase Docs, https://supabase.com/docs/guides/local-development/cli/testing-and-linting
19. Database Linter Rules - Postgres Language Server, https://pg-language-server.com/0.25.2/reference/database_rules/
20. Squawk - a linter for PostgreSQL migrations and SQL - Serverspace.io, https://serverspace.io/support/help/squawk-a-linter-for-postgresql-migrations-and-sql-how-to-avoid-deadlocks-and-errors-in-the-database/
21. MigrationPilot vs Squawk — 112 PostgreSQL Migration Rules vs 40, https://migrationpilot.dev/compare/squawk
22. Database Security - OWASP Cheat Sheet Series, https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html
23. Deploy an existing project · Cloudflare Workers docs, https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/
24. dengn/git4data.ai: Git for Data — the official website of ... - GitHub, https://github.com/dengn/git4data.ai
25. wachen/green-radius-game: Sustainability self-ranking ... - GitHub, https://github.com/wachen/green-radius-game
26. Secrets Store Changelog - Cloudflare Docs, https://developers.cloudflare.com/changelog/product/secrets-store/
27. ADLC compliance: Mapping agentic development to NIST SSDF, the, https://www.endorlabs.com/learn/adlc-compliance
28. OWASP Agentic Skills Top 10, https://owasp.org/projects/agentic-skills-top-10
29. dev-quality-gates/research/cross-cutting.md at main - GitHub, https://github.com/mokevnin/dev-quality-gates/blob/main/research/cross-cutting.md
30. github.com/google/osv-scanner | Go | Open Source Insights, https://deps.dev/go/github.com%2Fgoogle%2Fosv-scanner/v1.9.2
31. Harness Engineering for Coding Agents: What It Is (2026) - Agentastic, https://www.agentastic.dev/harness-engineering
32. 하네스 엔지니어링(Harness Engineering), https://velog.io/@qjawns99/%ED%95%98%EB%84%A4%EC%8A%A4-%EC%97%94%EC%A7%80%EB%8B%88%EC%96%B4%EB%A7%81Harness-Engineering
33. Improving Deep Agents with harness engineering - LangChain, https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering
34. Secret Scanning Tools: Gitleaks vs TruffleHog vs GitGuardian - Haxset, https://haxset.com/blog/secret-scanning-tools-gitleaks-vs-trufflehog-compared
35. Cloudflare AI Gateway alternatives for models and budgets - Requesty, https://www.requesty.ai/blog/cloudflare-ai-gateway-alternatives
36. Computer use tool - Claude Platform Docs, https://docs.anthropic.com/en/docs/build-with-claude/computer-use
37. Cursor hooks.json: the JSON Schema & Payload Reference, https://ntorres.dev/blog/cursor-hooks-json-guide
38. D1 · Cloudflare Workers docs, https://developers.cloudflare.com/workers/wrangler/commands/d1/
39. The Complete Cloudflare Wrangler Guide: From Local Development, https://www.ubitools.com/cloudflare-wrangler-guide
40. Get started · Cloudflare Workers docs, https://developers.cloudflare.com/workers/previews/get-started/
41. [기타] Cloudflare 실전 가이드 — Workers·Pages·KV·D1·VPS·AWS·CI, https://ch010104.tistory.com/319
42. Limits · Cloudflare AI Gateway docs, https://developers.cloudflare.com/ai-gateway/reference/limits/
43. OWASP Top 10 for Agentic Applications 2026, https://genai.owasp.org/top-10-for-agentic-applications-2026/
44. Harness Engineering: A Field Guide for Enterprise Teams - Medium, https://hien-luu.medium.com/harness-engineering-a-field-guide-for-enterprise-teams-43fb711b29cc
45. Agent Harnesses and Software Factories - Pento AI, https://www.pento.ai/blog/agent-harness
46. Best Agent Harnesses in 2026: 34 AI Agent Harnesses Compared, https://www.moderndata101.com/blogs/what-are-top-agent-harnesses
47. agency-agents — 전문 역할형 AI 에이전트 명세집 + 멀티툴 변환/설치, https://honbul.tistory.com/165
48. AI Lessons from the Trenches, Part I: Context-Rich AI Agents, https://equalsmoney.com/engineering/ai-lessons-from-the-trenches-part-i-context-rich-ai-agents
49. AI Rulebook: AGENTS.md Rules for Coding Agents, https://marketplace.visualstudio.com/items?itemName=WyvernSystemsLLC.ai-rulebook
50. jackby03/agentic-collaboration-standard: A unified open format for, https://github.com/jackby03/agentic-collaboration-standard
51. Context Engineering Guide - AI Coding Configuration | design.dev, https://design.dev/guides/context-engineering/
52. Standardized Rules Format (AGENTS.md) · Issue #249387 - GitHub, https://github.com/microsoft/vscode/issues/249387
53. AI 코딩 어시스턴트에 샌드고 연결하기, https://sendgo.io/ko/ai
54. Computer use tool - Claude Platform Docs, https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
55. AI 에이전트 하네스 엔지니어링 6계층 가이드 — AGENTS.md 템플릿, https://theaxlabs.com/blog/harness-engineering-6-layer-guide
56. Why does Codex need stronger harness engineering to finish the job?, https://community.openai.com/t/why-does-codex-need-stronger-harness-engineering-to-finish-the-job/1410936
57. Why does Codex need stronger harness engineering to finish the job?, https://community.openai.com/t/why-does-codex-need-stronger-harness-engineering-to-finish-the-job/1410936/3
58. Hooks 종료 코드로 도구 실행 차단하기, https://claudecode.to/docs/hooks-exit-codes
59. AI 코딩 에이전트의 권한 관리 — 화이트리스트에서 블랙리스트로 전환, https://storycompiler.tistory.com/378
60. Cloudflare Workers Bindings MCP: Secure MCP Access for AI Agents, https://neuraltrust.ai/mcp-catalog/cloudflare-workers-bindings
61. Third Party Hooks | Cursor Docs, https://cursor.com/docs/reference/third-party-hooks
62. Memory tool - Claude Platform Docs, https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
63. Claude Platform | Claude by Anthropic, https://claude.com/platform/api
64. OWASP Secrets Management Cheat Sheet, Explained for Small, https://www.krypthq.com/blog/owasp-secrets-management-cheat-sheet
65. TruffleHog vs Gitleaks vs GitHub Secret Scanning: Why Most CI, https://dev.to/chintanshah35/trufflehog-vs-gitleaks-vs-github-secret-scanning-why-most-ci-scanners-fail-2026-1372
66. Gitleaks와 TruffleHog를 쉽게 이해하기 - velog, https://velog.io/@pobi/Gitleaks%EC%99%80-TruffleHog%EB%A5%BC-%EC%89%BD%EA%B2%8C-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0
67. Preventing Secret Leaks on GitHub: A Strategic Guide for Dev Leaders, https://devactivity.com/posts/development-integrations/preventing-secret-leaks-on-github-a-strategic-guide-for-dev-leaders/
68. GitHub Secret Scanning & Push Protection 완벽 가이드 2026 - KnightK, https://knightk.tistory.com/444
69. Accidentally pushing secrets to GitHub – how to prevent this? #189652, https://github.com/orgs/community/discussions/189652
70. Squawk — a linter for Postgres migrations, https://squawkhq.com/
71. Built a PostgreSQL migration linter that checks your actual table, https://www.reddit.com/r/rust/comments/1twe0b9/built_a_postgresql_migration_linter_that_checks/
72. Optimizing RLS Performance with Supabase(postgres) - Medium, https://medium.com/@antstack/optimizing-rls-performance-with-supabase-postgres-fa4e2b6e196d
73. Password Storage - OWASP Cheat Sheet Series, https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
74. Resources and isolation - Workers - Cloudflare Developer Docs, https://developers.cloudflare.com/workers/previews/resources/
75. Bindings · Cloudflare Pages docs, https://developers.cloudflare.com/pages/functions/bindings/
76. Storage on Cloudflare: Choosing Between R2, D1, KV and Hyperdrive, https://www.cipher.co.th/en/blogs/cloudflare-storage-services-explained-2/
77. Cloudflare Databases: D1, KV, Durable Objects and Hyperdrive, https://www.runxbuild.com/blog/cloudflare-databases/
78. Production-Ready on Cloudflare: the complete guide - Flavio Copes, https://flaviocopes.com/cloudflare/
79. Cloudflare Cloud Services: Best Practices & Integration Guide, https://spike-land-nextjs.vercel.app/docs/guides/best-practices/cloudflare-services
80. Matt Silverlock - Noise, https://noise.getoto.net/author/matt-silverlock/
81. Automatic pull requests · Cloudflare Workers docs, https://developers.cloudflare.com/workers/ci-cd/builds/automatic-prs/
82. xream/EdgeGist: Minimal GitHub Gist-compatible API service, https://github.com/xream/EdgeGist
83. Builds · Cloudflare Workers docs, https://developers.cloudflare.com/workers/ci-cd/builds/
84. Deploy to Cloudflare Pages via GitHub Action not working with, https://github.com/cloudflare/wrangler-action/issues/444
85. actions/docs/user/actions/preview-workers.md at main - GitHub, https://github.com/QuantEcon/actions/blob/main/docs/user/actions/preview-workers.md
86. Isolated preview environments for every change your agent makes, https://blog.cloudflare.com/worker-previews/
87. staging agent 容器冷启动不监听8080 —— /healthz 返回500,阻塞, https://github.com/lifeodyssey/animichi/issues/826
88. Workers Builds deploys previews successfully but no longer posts, https://community.cloudflare.com/t/workers-builds-deploys-previews-successfully-but-no-longer-posts-pr-comment-deplo/945571
89. What is a Cloudflare secret? Setup & best practices - Pulumi, https://www.pulumi.com/topics/secrets-and-security/what-is-a-cloudflare-secret/
90. Secrets Store access control - Cloudflare Docs, https://developers.cloudflare.com/secrets-store/access-control/
91. AI Changelog | Cloudflare Docs, https://developers.cloudflare.com/changelog/product-group/ai/8/
92. Add Cloudflare Secrets Store provider (PushSecret + metadata read), https://github.com/external-secrets/external-secrets/issues/6549
93. Rate limiting · Cloudflare AI Gateway docs, https://developers.cloudflare.com/ai-gateway/features/rate-limiting/
94. Cloudflare AI Gateway - AI Application Control Plane, https://www.cloudflare.com/products/ai-gateway/
95. Master Cloudflare AI Gateway Usage: Best Practices - APIPark, https://apipark.com/techblog/en/master-cloudflare-ai-gateway-usage-best-practices/
96. Cloudflare AI Gateway 실전 가이드: AI 트래픽을 관찰하고 제어하는, https://ttlab.hopto.org/blog/ai-platform/2026-04-12-cloudflare-ai-gateway-practical-guide
97. Comparison between OSV-Scanner and Trivy #10524 - GitHub, https://github.com/aquasecurity/trivy/discussions/10524
98. osv-scanner · Actions · GitHub Marketplace, https://github.com/marketplace/actions/osv-scanner
99. osv-scanner/docs/usage.md at main - GitHub, https://github.com/google/osv-scanner/blob/main/docs/usage.md
100. References - Agentic AI Security Guide, https://www.casaba.com/guides/agentic-ai-security/references/
