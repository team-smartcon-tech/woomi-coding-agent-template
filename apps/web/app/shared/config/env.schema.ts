import { z } from "zod"

// `cloudflare:workers` 를 import 하지 않는다 — Node(Vitest)에서도 돌아야 하는 순수 부분만 둔다.
// Worker 바인딩을 읽는 쪽은 env.server.ts 다.

const schema = z.object({
  // 빠뜨렸을 때 로컬로 오인해 느슨해지지 않도록, 없으면 production(닫힌 쪽)으로 본다.
  APP_ENV: z.enum(["development", "preview", "production"]).default("production"),
  // `.dev.vars.example` 을 그대로 복사하면 빈 문자열이 들어온다 — 없는 것으로 본다.
  SESSION_SECRET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(32, "32자 이상이어야 합니다").optional(),
  ),
})

export type AppEnvName = z.infer<typeof schema>["APP_ENV"]
export type AppEnv = { APP_ENV: AppEnvName; isDeployed: boolean; SESSION_SECRET: string | null }

export class MissingSecretError extends Error {
  constructor() {
    super(
      "SESSION_SECRET 이 없습니다. 배포 환경은 임시 값으로 뜨지 않습니다. " +
        "`wrangler secret put SESSION_SECRET` 으로 등록하세요(.agents/DEPLOYMENT.md 4장).",
    )
    this.name = "MissingSecretError"
  }
}

export function parseEnv(raw: Record<string, unknown>): AppEnv {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
    throw new Error(`환경변수가 올바르지 않습니다 — ${detail} (apps/web/.dev.vars.example 참고)`)
  }
  return {
    APP_ENV: parsed.data.APP_ENV,
    isDeployed: parsed.data.APP_ENV !== "development",
    SESSION_SECRET: parsed.data.SESSION_SECRET ?? null,
  }
}

export function resolveSessionSecret(e: AppEnv, makeLocal: () => string): string {
  if (e.SESSION_SECRET) return e.SESSION_SECRET
  if (!e.isDeployed) return makeLocal()
  throw new MissingSecretError()
}

export function isReady(e: AppEnv): boolean {
  return !!e.SESSION_SECRET || !e.isDeployed
}
