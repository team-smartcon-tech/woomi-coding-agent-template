import { describe, expect, it } from "vitest"
import { parseVersion } from "./version.server"

describe("parseVersion", () => {
  it("최상단 ## [x] 헤딩에서 버전을 뽑는다", () => {
    expect(parseVersion("# CHANGELOG\n\n## [2.33-draft] - 2026-11-26\n\n## [2.32-draft]")).toBe(
      "2.33-draft",
    )
  })
  it("헤딩이 없으면 빈 문자열", () => expect(parseVersion("")).toBe(""))
})
