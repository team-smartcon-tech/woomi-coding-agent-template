import { env as workerEnv } from "cloudflare:workers"
import { type AppEnv, parseEnv, resolveSessionSecret } from "./env.schema"

// 서버 환경변수의 유일한 입구. `cloudflare:workers` 의 env 는 이 파일에서만 읽는다(eslint.config.mjs 가 강제한다).
//
// 값이 없거나 형식이 틀리면 **처음 쓰는 요청에서** 멈춘다. 곳곳에서 직접 읽고 `?? "기본값"` 으로 받으면
// 운영에서 변수를 빠뜨려도 알려진 기본값으로 조용히 떠서, 그 값으로 서명한 세션이 그대로 통한다.
//
// 변수를 추가할 때는 세 곳을 함께 고친다 — `env.schema.ts` 스키마, `apps/web/.dev.vars.example`,
// 배포 환경의 `wrangler secret`. 앞의 둘이 어긋나면 `pnpm env:check` 가 PR 에서 실패한다.
// 셋째는 기계가 확인하지 못한다.

// 격리(isolate) 단위 캐시 — 모듈 최상위에서 읽지 않는 건 바인딩이 요청 시점에 채워질 수 있어서다.
let cachedEnv: AppEnv | null = null
let cachedSecret: string | null = null

export function getEnv(): AppEnv {
  cachedEnv ??= parseEnv(workerEnv as unknown as Record<string, unknown>)
  return cachedEnv
}

export function getSessionSecret(): string {
  // 로컬에서는 격리마다 새 값을 만든다. 고정 기본값이 없으므로 소스가 공개돼도 쓸 수 있는 값이 없다.
  // 대신 dev 서버를 다시 띄우면 로그인이 풀린다 — 유지하려면 `.dev.vars` 에 값을 둔다.
  cachedSecret ??= resolveSessionSecret(getEnv(), () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  })
  return cachedSecret
}
