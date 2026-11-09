# TRANSACTION.md

이 문서는 DB 쓰기 작업의 트랜잭션 경계, 동시성 제어, RPC 사용 기준을 정한다.

기본값은 **보수적으로** 잡는다. 아래 조건에 해당하면 RPC(PostgreSQL function)로 하나의 트랜잭션에 묶는 것이 기본이다. 다만 상황에 따라 RPC가 맞지 않는 경우가 있으므로, 4장의 예외 조건에 해당하면 RPC를 쓰지 않아도 된다. 예외를 적용할 때는 **반드시 근거를 기록한다**.

---

## 1. 왜 이 문서가 필요한가

Supabase JS(PostgREST)에는 클라이언트 측 트랜잭션 API가 없다.

```ts
// 각 호출이 별도 HTTP 요청 = 별도 트랜잭션 = 각자 커밋된다.
const order = await db.from('orders').insert(...)        // 커밋됨
await db.from('order_items').insert(...)                  // 여기서 실패하면?
await db.from('products').update({ stock: ... })          // 실행되지 않음
// → 주문은 있는데 항목이 없고 재고는 그대로인 상태가 남는다.
```

service가 repository 메서드를 연달아 호출하는 구조(`service → repository`)에서는 이런 코드가 자연스럽게 생긴다. 이 문서는 그 지점에 기준을 둔다.

---

## 2. 기본 규칙: RPC가 필요한 경우

아래 중 **하나라도** 해당하면 기본적으로 PostgreSQL function을 만들고 repository에서 `rpc()`로 호출한다. function 본문은 호출 요청의 트랜잭션 하나 안에서 실행되므로, 중간에 예외가 나면 전부 롤백된다.

| 코드 | 조건 | 예시 |
|---|---|---|
| T1 | 하나의 업무 동작이 **2개 이상의 테이블**, 또는 서로 다른 행 여러 개에 쓰기 | 주문 + 주문항목, 결재 + 결재이력, 부모 + 자식 생성 |
| T2 | **읽고 판단한 뒤 쓰기**(read-check-write) | 재고·잔액·정원 확인 후 차감, 중복 확인 후 생성, 현재 상태 확인 후 상태 전이 |
| T3 | **파생값/집계값**을 원본과 함께 갱신 | 댓글 추가 + `comment_count` 증가, 거래 + 잔액 |
| T4 | 일부만 반영되면 데이터가 **업무적으로 틀린 상태**가 되는 경우 | 이동(출고 + 입고), 교환, 일괄 확정 |

RPC가 필요 없는 경우(과잉 적용 금지):

- 단일 행 insert/update/delete
- 한 번의 호출로 여러 행을 insert/upsert하는 경우. `insert([...])`, `upsert([...])`는 SQL 문 하나라 그 자체로 원자적이다.
- 조건부 단일 SQL 문으로 해결되는 동시성 문제(5장 참고)

---

## 3. service 계층 규칙

- service에서 **쓰기용 repository 메서드를 연속 호출**하는 코드는 기본적으로 금지한다. T1~T4에 해당하면 RPC를 호출하는 repository 메서드 하나로 바꾼다.
- 예외(4장)를 적용한 경우에만 연속 쓰기를 허용하고, 해당 위치에 `TX-EXCEPTION` 주석을 남긴다.
- 읽기 여러 번 + 쓰기 한 번은 연속 호출이 가능하다. 단, 읽은 값으로 판단해서 쓰면 T2에 해당하는지 확인한다.
- 직접 PostgreSQL 드라이버(postgres.js, Hyperdrive 등)를 쓰는 프로젝트는 앱 코드에서 `begin/commit`을 사용할 수 있다. 판단 기준(T1~T4, 예외, 기록 의무)은 동일하고, 트랜잭션 경계는 service에서 연다. 트랜잭션 안에서 외부 API를 호출하지 않는다.

---

## 4. 예외: RPC를 쓰지 않아도 되는 경우

T1~T4에 해당하더라도 아래 조건에 해당하면 RPC를 피할 수 있다.

| 코드 | 예외 조건 | 대신 지켜야 할 것 |
|---|---|---|
| E1 | 쓰기 대상 중 일부가 **DB 트랜잭션에 들어갈 수 없음**(외부 API, R2/Storage, 이메일, 다른 DB) | 실행 순서 설계, 보상 처리 또는 outbox, 멱등성 키(6장) |
| E2 | 부분 실패가 업무적으로 **허용**되고, **재실행하면 같은 결과로 수렴**함 | 모든 쓰기가 멱등(upsert, 자연키 unique)이고 재시도 경로가 있음 |
| E3 | 핵심 쓰기는 원자적으로 처리하고, 나머지는 **비동기 후속 작업**으로 분리함 | queue/event 소비자가 멱등이고 실패 시 재처리 가능 |
| E4 | 일회성 운영 스크립트, backfill, 데이터 보정 | `MIGRATION.md`의 backfill 절차와 검증 쿼리 |
| E5 | 프로토타입/데모 단계이고 **사용자가 승인**함 | 코드에 TODO와 `TX-EXCEPTION`을 남기고, 운영 전 해소 여부를 체크리스트에 올림 |
| E6 | 위에 없는 **프로젝트 특수 사정**(성능 측정 결과, 플랫폼 제약 등) | 사용자 승인 + 근거 기록. 반복되면 이 표에 프로젝트 예외로 추가 |

예외 사유로 인정하지 않는 것:

- "RPC 작성이 번거롭다", "supabase-js 체이닝이 편하다"
- "실패할 확률이 낮다"
- "지금은 사용자가 적어서 동시성 문제가 없다"

### 4.1 예외 기록 형식

예외를 적용한 코드 위치에 주석을 남기고, PR 설명에도 같은 내용을 적는다.

```ts
// TX-EXCEPTION: E1
// Reason: R2 업로드는 DB 트랜잭션에 포함할 수 없음
// On failure: DB insert 실패 시 업로드된 객체가 고아로 남음
// Recovery: catch에서 객체 삭제, 실패 시 orphan 정리 배치가 24시간 후 제거
```

필수 항목은 `코드(E1~E6)`, `Reason`, `On failure`(실패 시 남는 상태), `Recovery`(복구 방법)다. `On failure`를 적을 수 없다면 예외를 적용하면 안 된다.

---

## 5. 동시성 패턴

트랜잭션이 있어도 동시 요청이 들어오면 race condition이 생길 수 있다. 가장 가벼운 수단부터 검토한다.

| 상황 | 우선 수단 |
|---|---|
| 상태 전이(`pending → approved`) | 조건부 update: `update ... set status='approved' where id=$1 and status='pending'` 후 영향받은 행 수 확인 |
| 재고/잔액 차감 | 조건부 update: `set stock = stock - $n where id=$1 and stock >= $n` |
| 중복 생성 방지 | unique constraint + `on conflict` (앱에서 "먼저 조회 후 insert" 하지 않는다) |
| 카운터 증가 | `set count = count + 1` (앱에서 읽은 값 + 1로 덮어쓰지 않는다) |
| 여러 행을 읽고 판단 후 쓰기 | RPC 안에서 `select ... for update`로 잠금 |
| 행 단위로 표현하기 어려운 직렬화(예: 일자별 정원) | RPC 안에서 `pg_advisory_xact_lock` |

주의:

- 여러 행을 잠글 때는 **항상 같은 순서**(예: id 오름차순)로 잠가 deadlock을 피한다.
- 기본 격리 수준(read committed)을 전제로 설계한다. `serializable`이 필요하면 재시도 로직과 함께 근거를 남긴다.
- supabase-js에서 조건부 update를 쓸 때는 `.select()`로 반환된 행 수를 확인해 0건이면 도메인 에러로 처리한다.

---

## 6. 외부 시스템이 섞인 경우 (E1 패턴)

DB와 외부 시스템을 하나의 트랜잭션으로 묶을 수는 없다. 실패했을 때 어떤 상태가 남을지를 먼저 정하고 실행 순서를 고른다.

| 패턴 | 순서 | 적합한 경우 |
|---|---|---|
| 파일 먼저 | Storage 업로드 → DB 기록, DB 실패 시 객체 삭제 | 첨부파일. 고아 파일은 정리 배치로 회수 |
| DB 먼저 + 상태값 | DB에 `pending`으로 기록 → 외부 호출 → `completed`/`failed` 갱신 | 결제, 외부 등록. 오래 `pending`인 건을 재처리 |
| Outbox | 업무 쓰기 + `outbox` 행 insert를 같은 RPC에서 처리 → 워커가 외부 호출 | 알림, 메일, 웹훅. 최소 1회 전달 |

공통:

- 외부 호출에는 **멱등성 키**를 보낸다. 재시도할 때 중복 처리를 막기 위해서다.
- DB 트랜잭션(RPC 포함) 안에서 외부 HTTP 호출을 하지 않는다.

---

## 7. RPC 표준 템플릿

```sql
-- supabase/migrations/<timestamp>_create_order_rpc.sql
create or replace function public.create_order(
  p_customer_id uuid,
  p_items jsonb,               -- [{ "product_id": uuid, "quantity": int }]
  p_idempotency_key text
)
returns uuid
language plpgsql
security invoker               -- 기본값. 호출자 권한과 RLS를 그대로 적용
set search_path = ''           -- search_path 하이재킹 방지. 객체는 schema까지 명시
as $$
declare
  v_order_id uuid;
  v_item record;
  v_updated int;
begin
  -- 1) 멱등성: 같은 키로 이미 처리된 요청이면 기존 결과 반환
  insert into public.orders (customer_id, idempotency_key)
  values (p_customer_id, p_idempotency_key)
  on conflict (idempotency_key) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    select id into v_order_id
    from public.orders
    where idempotency_key = p_idempotency_key;
    return v_order_id;
  end if;

  -- 2) 항목 처리: 잠금 순서를 고정하기 위해 product_id 순으로 정렬
  for v_item in
    select (value->>'product_id')::uuid as product_id,
           (value->>'quantity')::int    as quantity
    from jsonb_array_elements(p_items)
    order by 1
  loop
    -- 조건부 update로 재고 확인과 차감을 한 문장에서 처리
    update public.products
       set stock = stock - v_item.quantity
     where id = v_item.product_id
       and stock >= v_item.quantity;

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      -- 예외가 발생하면 이 function에서 한 쓰기가 전부 롤백된다
      raise exception using errcode = 'P0001', message = 'OUT_OF_STOCK',
        detail = v_item.product_id::text;
    end if;

    insert into public.order_items (order_id, product_id, quantity)
    values (v_order_id, v_item.product_id, v_item.quantity);
  end loop;

  return v_order_id;
end;
$$;

revoke execute on function public.create_order(uuid, jsonb, text) from public, anon;
grant execute on function public.create_order(uuid, jsonb, text) to authenticated;
```

```ts
// repository: RPC 이름은 중앙 상수, DB 에러는 도메인 에러로 변환
const { data, error } = await db.rpc(RPC.createOrder, {
  p_customer_id: customerId,
  p_items: items,
  p_idempotency_key: idempotencyKey,
})
if (error) throw mapDbError(error) // 'OUT_OF_STOCK' → AppError(ErrorCode.Conflict, ...)
return data
```

템플릿 규칙:

- `security invoker`를 기본으로 한다. `security definer`는 RLS를 우회해야 하는 명확한 이유가 있을 때만 쓰고, `DB_SCHEMA.md` 3.5에 따라 exposed schema(`public`)가 아닌 private schema에 둔다. function 안에서 `auth.uid()` 기반 권한 검사를 직접 하고 `anon` 실행 권한을 회수한다.
- `set search_path = ''`를 지정하고 모든 객체를 `public.` 등 schema까지 명시한다.
- `exception when others then ...`로 예외를 삼키지 않는다. 블록 안의 쓰기만 롤백되고 function은 정상 종료되므로, **부분 커밋**이 생긴다. 잡았으면 다시 `raise`한다.
- 업무 에러는 `raise exception using message = '<DOMAIN_CODE>'`로 던지고, repository에서 `ERROR_HANDLING.md`의 `ErrorCode`로 변환한다.
- function 추가/변경은 `MIGRATION.md` 절차(작업 전 `docs/DB-ERD` 대조 포함)를 따르는 migration으로만 하고, `DB_SCHEMA.md`의 RPC/functions 항목과 `API_CONTRACT.md`를 함께 갱신한다.
- function 안에서 외부 HTTP 호출(`pg_net` 등)을 하지 않는다. 필요하면 6장의 outbox를 쓴다.

---

## 8. Review Checklist

쓰기 경로가 있는 API/service 변경 시 확인한다.

```txt
Write path touches multiple tables/rows (T1):
Read-check-write exists (T2):
Derived/aggregate value updated (T3):
Partial apply leaves invalid state (T4):
Transaction boundary: RPC / single statement / TX-EXCEPTION E#:
TX-EXCEPTION has Reason, On failure, Recovery:
Concurrency: conditional update / unique+on conflict / row lock / n/a:
Lock ordering fixed (if multiple rows locked):
External calls outside DB transaction:
Idempotency key for retryable or external operations:
RPC: security invoker (or definer with reason), search_path set, grants reviewed:
No swallowed exceptions in plpgsql:
```

---

## 9. Project Notes

프로젝트별로 자주 쓰는 예외(E6)나 트랜잭션 패턴이 생기면 이 섹션에 기록한다.
