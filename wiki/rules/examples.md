---
type: rule
updated: 2026-11-26
tags: [area/코드품질]
---

# 좋은 예시와 금지 예시

반복해서 따라야 할 패턴과 피해야 할 실패 사례를 **진행 중에 모으는** 두 문서. 시작 시 억지로 채우지 않고, 실제 코드에서 확인된 것만 넣는다.

## 언제 남기나

- **좋은 예시** — 재사용할 만한 route/service/repository 패턴이 생겼을 때, 좋은 form·table·dialog·상태 구현이 생겼을 때, 권한 처리·에러 처리·API client 사용이 모범적으로 정리됐을 때, AI가 따라 하면 좋은 파일 구조나 테스트 패턴이 생겼을 때.
- **금지 예시** — 같은 실수가 반복될 때, 보안·권한·데이터 손실·배포 사고 위험이 발견될 때, AI가 자주 잘못 생성하는 패턴이 확인될 때, 기존 구현 중 더는 따라 하면 안 되는 것이 생겼을 때.

## 기록 항목

- 좋은 예시: Pattern / File / Why it is good / When to follow / Related rules / Notes.
- 금지 예시: Anti-pattern / File or context / Why it is bad / Risk / **Use this instead** / Related rules / Notes.

금지 예시에 대안(`Use this instead`) 칸이 있다는 점이 중요하다. 금지만 적으면 다음 사람이 같은 자리에서 다시 막힌다.

## 이 저장소의 현재 상태

`BAD_EXAMPLES.md` 에는 2.32-draft(2026-11-26)에 **14건(B-01~B-14)** 이 처음 들어갔다. 분기 저장소 16곳과 Supabase DB 12개를 조사해 두 곳 이상에서 반복된 것만 올렸고, 항목마다 "이 실수를 잡는 검사가 있는가"를 적었다 — 검사가 없는 항목(화면에서 테이블 직접 접근, 1,000행 잘림, UTC 날짜, `alert()`)은 리뷰와 그 문서가 유일한 방어선이다. 목록은 원본에서 본다(여기에 복사하지 않는다). `GOOD_EXAMPLES.md` 는 아직 비어 있다 — [API 계약과 도메인 모델](api-contract.md)과 [공통 컴포넌트](components.md)도 같은 성격의 "채워 가는 문서"다.

## 위키와 무엇이 다른가

역할이 겹쳐 보이지만 다르다. `examples/*`는 **코드 패턴**을 모아 AI가 작업 중에 읽는 규칙 자료다. 이 위키는 **결정과 그 이유, 막혔다 푼 것**을 모아 사람과 AI가 탐색하는 자리다 — [팀 위키](team-wiki.md). 반복 실수를 발견하면 `BAD_EXAMPLES.md`에, 그 판단의 배경은 위키 기록에 남긴다. 어느 쪽이든 [작업 흐름](workflow.md)의 문서 업데이트 표가 갱신 시점을 정한다.

## 함께 보기

- [작업 흐름](workflow.md)
- [코드 스타일](code-style.md)
- [진입 규칙](agents-entry.md)
- [팀 위키](team-wiki.md)
- [공통 컴포넌트](components.md)
- [API 계약과 도메인 모델](api-contract.md)

## 출처

- [원본 · .agents/examples/GOOD_EXAMPLES.md](../sources/good-examples.md)
- [원본 · .agents/examples/BAD_EXAMPLES.md](../sources/bad-examples.md)
