import { getEnv } from "~/shared/config/env.server"
import { isReady } from "~/shared/config/env.schema"

/**
 * 배포 상태 확인(로그인 불필요, 데이터 전용). 응답에는 변수 이름·값·버전을 싣지 않는다 —
 * 무엇이 빠졌는지는 서버 로그(`console.error`)에만 남긴다.
 */
export function loader() {
  const headers = { "Cache-Control": "no-store" }
  try {
    const e = getEnv()
    if (isReady(e)) return Response.json({ status: "ok", env: e.APP_ENV }, { headers })
    console.error("health: SESSION_SECRET 이 없어 준비되지 않음")
  } catch (err) {
    // 형식이 틀린 변수(예: 짧은 SESSION_SECRET) — 메시지는 로그에만 둔다.
    console.error("health:", err instanceof Error ? err.message : err)
  }
  return Response.json({ status: "not_ready" }, { status: 503, headers })
}
