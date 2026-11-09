---
type: rule
updated: 2026-11-09
tags: [area/데이터, area/api]
---

# 트랜잭션과 RPC

여러 번의 DB 쓰기를 언제 하나의 트랜잭션으로 묶어야 하는지, 그리고 그러지 않아도 되는 예외를 정한 규칙.

## 왜 필요한가

Supabase JS(PostgREST)에는 클라이언트 트랜잭션이 없다. `from().insert()` 호출 하나가 트랜잭션 하나라서, service가 repository 쓰기를 연달아 부르면 중간 실패 시 앞의 쓰기만 커밋된 채 남는다. `route → service → repository` 구조에서는 이런 코드가 자연스럽게 생긴다. [원본 · .agents/data/TRANSACTION.md](../sources/transaction.md)

## 기본값은 보수적으로 — RPC가 필요한 경우

하나라도 해당하면 PostgreSQL function을 만들고 repository에서 `rpc()`로 부른다. [원본](../sources/transaction.md)

- **T1** 2개 이상 테이블 또는 여러 행에 쓰기 (주문 + 주문항목, 결재 + 이력)
- **T2** 읽고 판단한 뒤 쓰기 (재고·잔액·정원 확인 후 차감, 상태 확인 후 전이)
- **T3** 파생값·집계값을 원본과 함께 갱신 (댓글 + `comment_count`)
- **T4** 일부만 반영되면 업무적으로 틀린 상태 (출고 + 입고)

단일 쓰기, 배열 한 번에 넣는 `insert([...])`·`upsert([...])`, 조건부 단일 SQL 문으로 끝나는 경우는 RPC가 필요 없다 — 과잉 적용도 막는다.

## 예외는 열어 두되 근거를 남긴다

상황마다 RPC가 맞지 않을 수 있어 예외 E1~E6을 둔다: 외부 시스템(Storage·외부 API)이 섞임, 멱등 재실행으로 수렴, 비동기 후속 작업으로 분리, backfill, 승인된 프로토타입, 프로젝트 특수 사정. 예외를 쓰면 코드와 PR에 `TX-EXCEPTION`(코드·Reason·On failure·Recovery)을 남긴다. **실패 시 남는 상태를 적을 수 없으면 예외가 아니다.** "번거롭다", "실패 확률이 낮다"는 사유가 안 된다. [원본](../sources/transaction.md)

## 동시성과 RPC 작성

- 가벼운 수단부터: 조건부 update(`where status = 'pending'`, `where stock >= n`) → unique + `on conflict` → RPC 안의 `select ... for update` → advisory lock. 여러 행을 잠글 땐 순서를 고정한다.
- RPC는 `security invoker` + `set search_path = ''`가 기본. `security definer`는 private schema에만 — [DB 스키마 가드레일](db-schema-guardrails.md).
- plpgsql에서 `exception when others`로 예외를 삼키면 부분 커밋이 생긴다. 잡았으면 다시 `raise`.
- 트랜잭션·RPC 안에서 외부 HTTP를 부르지 않는다. 필요하면 outbox.

템플릿 SQL과 리뷰 체크리스트 본문은 원본에만 둔다 — 여기에 복사하지 않는다. [원본](../sources/transaction.md)

## 함께 보기

- [API 계층 규칙](api-layers.md)
- [DB 스키마 가드레일](db-schema-guardrails.md)
- [마이그레이션](migration.md)
- [에러 처리](error-handling.md)
- [작업 흐름](workflow.md)

## 출처

- [원본 · .agents/data/TRANSACTION.md](../sources/transaction.md)
