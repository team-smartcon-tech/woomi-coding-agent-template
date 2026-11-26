---
paths:
  - "apps/**/*.tsx"
  - "packages/**/*.tsx"
---

# 화면 파일을 고칠 때

이 파일은 포인터다. 기준은 [`.agents/ui/UX_RULES.md`](../../.agents/ui/UX_RULES.md), [`.agents/code/API.md`](../../.agents/code/API.md), [`.agents/code/PROJECT_STRUCTURE.md`](../../.agents/code/PROJECT_STRUCTURE.md) 다. 아래는 여러 저장소에서 반복된 것만 추린 것이다([`BAD_EXAMPLES.md`](../../.agents/examples/BAD_EXAMPLES.md) B-05~B-08, B-14).

- 화면에서 테이블을 직접 읽고 쓰지 않는다(`supabase.from("…")`). API client 를 거친다.
- 목록은 1,000행에서 조용히 잘린다. 전체가 필요하면 끝까지 읽거나 DB 에서 집계하고, 목록 화면은 페이지 단위로 만든다.
- 날짜를 `toISOString().slice(0, 10)` 로 만들지 않는다. 한국 시간 오전 9시 전에는 어제 날짜가 된다. `shared/lib` 의 날짜 함수를 쓴다.
- `alert()`·`confirm()` 을 쓰지 않는다. `shared/ui/confirm-panel.tsx` 를 쓴다.
- 엑셀·PDF·인쇄 출력은 화면마다 새로 만들지 않고 공통 모듈에 형식을 더한다.
- 화면의 동작을 바꿨으면 [`docs/브라우저-검증-절차.md`](../../docs/브라우저-검증-절차.md) 로 확인한다.
