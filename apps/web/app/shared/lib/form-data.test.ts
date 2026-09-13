import { describe, expect, it } from "vitest"
import { formString } from "./form-data"

// 이 헬퍼가 막는 건 하나다 — File 이 문자열 컨텍스트에 들어가 `[object File]` 이 되는 것.
// 나머지 케이스는 기존 `String(x ?? "")` 과 동작이 같아야 한다(호출부를 바꿔도 안전하도록).
describe("formString", () => {
  it("문자열 값은 그대로 반환한다", () => {
    const fd = new FormData()
    fd.set("email", "admin@woomi.co.kr")
    expect(formString(fd, "email")).toBe("admin@woomi.co.kr")
  })

  it("키가 없으면 빈 문자열", () => {
    const fd = new FormData()
    expect(formString(fd, "missing")).toBe("")
  })

  it("File 값이면 빈 문자열 — [object File] 이 새어 나가지 않는다", () => {
    const fd = new FormData()
    fd.set("email", new File(["x"], "a.txt"))
    expect(formString(fd, "email")).toBe("")
    expect(formString(fd, "email")).not.toContain("object File")
  })

  it("FormData 자체가 null/undefined 여도 빈 문자열", () => {
    expect(formString(null, "any")).toBe("")
    expect(formString(undefined, "any")).toBe("")
  })
})
