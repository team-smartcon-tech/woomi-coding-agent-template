---
paths:
  - "**/env.server.ts"
  - "**/.env*.example"
  - "**/.dev.vars*.example"
  - "**/wrangler.jsonc"
  - "**/wrangler.toml"
---

# 환경변수·배포 설정을 고칠 때

이 파일은 포인터다. 기준은 [`.agents/DEPLOYMENT.md`](../../.agents/DEPLOYMENT.md) 4장이다([`BAD_EXAMPLES.md`](../../.agents/examples/BAD_EXAMPLES.md) B-09·B-10).

- 변수를 추가하면 스키마(`env.server.ts`)와 예시 파일을 **함께** 고친다. 배포 환경의 secret 등록은 사용자에게 알린다 — 기계가 확인하지 못한다.
- secret 계열 이름을 `wrangler` 의 `vars` 에 넣지 않는다. `wrangler secret put` 으로 등록한다(승인 필요).
- secret 이 없을 때 문자열 기본값으로 대체하지 않는다. 기동을 멈춘다.
- 예시 파일에는 이름과 설명만 적는다. 값은 비운다.
- `.env`·`.dev.vars` 는 열지 않는다. 필요한 이름은 예시 파일에서 본다.

고친 뒤 `pnpm env:check` 를 돌린다.
