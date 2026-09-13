/**
 * FormData 값을 문자열로 안전하게 좁힌다.
 *
 * `FormData#get(key)` 는 `string | File | null` 을 반환한다. 이걸 그대로 템플릿 리터럴이나
 * `String()` 에 넣으면 값이 File 일 때 `[object File]` 이 그대로 저장·전송된다. 타입 검사는
 * 이걸 잡지 못한다 — `String()` 은 어떤 값이든 받기 때문이다.
 *
 * 파생 프로젝트(Smart Planner)에서 같은 패턴이 43곳까지 번진 뒤에야 ESLint
 * `no-base-to-string` 으로 발견됐고, 그 43곳의 출발점이 이 스캐폴드의 로그인 action 이었다.
 * File 이거나 값이 없으면 빈 문자열로 취급한다 — 기존 `String(x ?? "")` 폴백과 같은 동작이다.
 */
export function formString(fd: FormData | null | undefined, key: string): string {
  const value = fd?.get(key)
  return typeof value === "string" ? value : ""
}
