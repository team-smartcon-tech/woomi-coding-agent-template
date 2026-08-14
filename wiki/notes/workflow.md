# 작업 흐름

절차가 중요한 작업의 순서와 검증 방법. 진입 규칙과 라우팅은 [진입 규칙](agents-entry.md)이 담당하고, 이 페이지는 그다음 절차다.

## 기본 원칙

기존 패턴을 먼저 찾고 새 패턴은 마지막에 만든다. 작업 범위는 작고 명확하게 제한한다. 코드와 문서 변경은 같은 작업에서 함께 처리한다. 요청하지 않은 자동 커밋·푸시·배포는 하지 않는다. 불확실하면 추측 대신 코드·설정을 먼저 확인한다.

## 작업 시작 전

요청 유형 분류 → `AGENTS.md` 읽기 → Task Routing에서 필요한 문서만 확인 → 같은 도메인 기존 구현 검색 → 변경 대상·영향 범위 파악. 단순 수정은 전체 문서 세트를 읽지 않는다.

## 만들 때

- 프론트엔드는 사용자 행동을 `features/`, 공유 업무 명사를 `entities/`, 업무 무관 UI·유틸을 `shared/`에 둔다 — [프로젝트 구조](project-structure.md).
- 백엔드는 `route → service → repository → db/platform` 흐름을 따른다 — [API 계층 규칙](api-layers.md).
- DB/RPC/RLS/API 계약을 바꾸면 코드와 문서를 같은 작업에서 함께 갱신한다 — [마이그레이션](migration.md), [API 계약과 도메인 모델](api-contract.md).

## 검증

`pnpm lint / typecheck / test / build`를 가능한 범위에서 실행한다. Worker는 `--filter`로 typecheck·test·deploy:dry. 실행하지 못하면 이유를 최종 보고에 명시한다 — [테스트와 검증](testing.md).

## 커밋·PR

commit은 Conventional Commits(`<type>: <한국어 요약>`, 제목 72자 이내)를 따른다. 배포 전 `git status`/`git fetch`/`git status -sb`로 상태를 확인하고, 미커밋·untracked·ahead/behind·검증 실패면 보류한다.

## 승인 경계

작업의 성격으로 나뉜다. 저장소 안에서 끝나는 것(`git init`, 브랜치 생성, `git add`, `git commit`)은 되돌릴 수 있으므로 사전 승인된 것으로 보고 매번 묻지 않는다 — 오히려 커밋을 미루는 쪽이 작업 유실 위험이 크다. 저장소 밖으로 나가는 것(`git push`, `git pull`, PR 생성, 원격 저장소 생성)은 되돌리기 어렵다는 사실을 한 줄로 알린 뒤 진행한다. **PR merge는 여전히 사용자 승인이 필요하다.** `main` 직접 push는 원칙적으로 금지 — [절대 금지·필수 규칙](non-negotiable-rules.md).

## 리뷰

리뷰 요청을 받으면 구현 설명보다 문제 발견을 먼저 쓴다. 우선순위: 버그 → 보안 → 데이터 손실 → 권한/인증 → 회귀 → 누락 테스트 → 문서 불일치.

## 함께 보기

- [진입 규칙](agents-entry.md)
- [절대 금지·필수 규칙](non-negotiable-rules.md)
- [테스트와 검증](testing.md)
- [배포](deployment.md)
- [계층 아키텍처](layered-architecture.md)
- [도구 사용 기준](tooling.md)
- [바이브코딩 가이드](vibe-coding-guide.md)
- [팀 위키](team-wiki.md)

## 출처

- [원본 · .agents/WORKFLOW.md](../sources/workflow.md)
