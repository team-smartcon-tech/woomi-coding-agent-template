import { randomBytes } from "node:crypto"
import { z } from "zod"

// 서버 환경변수의 유일한 입구. `process.env` 는 이 파일에서만 읽는다(eslint.config.mjs 가 강제한다).
//
// 값이 없거나 형식이 틀리면 **기동할 때** 멈춘다. 곳곳에서 환경변수를 직접 읽고 `?? "기본값"` 으로 받으면
// 운영에서 변수를 빠뜨려도 알려진 기본값으로 조용히 떠서, 그 값으로 서명한 세션이 그대로 통한다.
//
// 변수를 추가할 때는 세 곳을 함께 고친다 — 이 스키마, `apps/web/.env.example`, 배포 환경의 secret.
// 앞의 둘이 어긋나면 `pnpm env:check` 가 PR 에서 실패한다. 셋째는 기계가 확인하지 못한다.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z.string().min(32, "32자 이상이어야 합니다").optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
  throw new Error(`환경변수가 올바르지 않습니다 — ${detail} (apps/web/.env.example 참고)`)
}

const isProduction = parsed.data.NODE_ENV === "production"
if (isProduction && !parsed.data.SESSION_SECRET) {
  // `pnpm start`(react-router-serve)는 NODE_ENV 를 production 으로 두고 뜬다 — 로컬에서 빌드 결과를
  // 띄워 볼 때도 여기에 걸린다.
  throw new Error(
    "SESSION_SECRET 이 없습니다. 운영 모드(pnpm start 포함)는 기본값으로 뜨지 않습니다. " +
      "만드는 법은 apps/web/.env.example 에 있습니다.",
  )
}

export const env = {
  NODE_ENV: parsed.data.NODE_ENV,
  isProduction,
  // 로컬에서는 프로세스마다 새 값을 만든다. 고정된 기본값을 두지 않으므로 소스가 공개돼도 쓸 수 있는
  // 값이 없다. 대신 dev 서버를 다시 띄우면 로그인이 풀린다 — 유지하려면 `.env` 에 값을 둔다.
  SESSION_SECRET: parsed.data.SESSION_SECRET ?? randomBytes(32).toString("hex"),
}
