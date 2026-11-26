import { describe, expect, it } from "vitest"
import { isReady, MissingSecretError, parseEnv, resolveSessionSecret } from "./env.schema"

describe("parseEnv", () => {
  it("APP_ENV 가 없으면 production 으로 본다", () => {
    expect(parseEnv({}).APP_ENV).toBe("production")
    expect(parseEnv({}).isDeployed).toBe(true)
  })
  it("development 는 배포 환경이 아니다", () => {
    expect(parseEnv({ APP_ENV: "development" }).isDeployed).toBe(false)
  })
  it("preview 는 배포 환경이다", () => {
    expect(parseEnv({ APP_ENV: "preview" }).isDeployed).toBe(true)
  })
  it("32자 미만 SESSION_SECRET 은 거부한다", () => {
    expect(() => parseEnv({ APP_ENV: "development", SESSION_SECRET: "short" })).toThrow(
      /SESSION_SECRET/,
    )
  })
  it("빈 문자열 SESSION_SECRET 은 없는 것으로 본다", () => {
    expect(parseEnv({ APP_ENV: "development", SESSION_SECRET: "" }).SESSION_SECRET).toBeNull()
  })
  it("모르는 APP_ENV 는 거부한다", () => {
    expect(() => parseEnv({ APP_ENV: "staging" })).toThrow(/APP_ENV/)
  })
})

describe("resolveSessionSecret", () => {
  const s = "a".repeat(32)
  it("값이 있으면 그대로", () => {
    expect(resolveSessionSecret(parseEnv({ SESSION_SECRET: s }), () => "x")).toBe(s)
  })
  it("로컬에서 없으면 임시 값", () => {
    expect(resolveSessionSecret(parseEnv({ APP_ENV: "development" }), () => "tmp")).toBe("tmp")
  })
  it("배포 환경에서 없으면 MissingSecretError", () => {
    expect(() => resolveSessionSecret(parseEnv({ APP_ENV: "preview" }), () => "tmp")).toThrow(
      MissingSecretError,
    )
  })
})

describe("isReady", () => {
  it("배포 환경 + secret 없음 → false", () => expect(isReady(parseEnv({}))).toBe(false))
  it("로컬 + secret 없음 → true", () =>
    expect(isReady(parseEnv({ APP_ENV: "development" }))).toBe(true))
})
