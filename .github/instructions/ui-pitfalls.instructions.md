---
description: 화면 파일에서 반복된 실수
applyTo: "apps/**/*.tsx,packages/**/*.tsx"
---

# UI Pitfalls Instructions

이 instruction은 shim이다. 실제 기준은 아래 문서를 따른다.

1. `.agents/examples/BAD_EXAMPLES.md` B-05~B-08, B-14 — 여러 저장소에서 반복된 실수
2. `.agents/ui/UX_RULES.md`
3. `.agents/code/API.md`

화면에서 테이블을 직접 읽지 않고, 목록이 1,000행에서 잘리는 것을 전제로 만들고, 날짜를 `toISOString().slice(0, 10)` 로 만들지 않고, `alert()`·`confirm()` 을 쓰지 않는다.
