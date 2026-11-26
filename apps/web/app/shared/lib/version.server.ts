import changelogRaw from "../../../../../CHANGELOG.md?raw"

/**
 * 시스템 버전 + 변경 이력 — **서버 전용**.
 *
 * 변경 이력에는 수정된 취약점의 파일·경로가 남기 마련이라 클라이언트 번들이나
 * 정적 자산으로 노출하면 안 된다(로그인 없이 읽힌다). 그래서 `.server.ts` 안에서만 `?raw` 를 쓴다 —
 * 서버 번들에만 들어간다. 빌드 후 `pnpm assets:check` 가 클라이언트 자산에 CHANGELOG 최상단 헤딩 줄이 새지 않았는지 본다(헤딩이 아닌 일부 문장은 못 잡는다).
 * 로그인 가드가 걸린 loader 안에서만 이 모듈을 읽는다.
 *
 * 버전은 CHANGELOG 최상단 `## [x.y-draft]` 헤딩에서 파생한다 —
 * 상수를 따로 두면 반드시 어긋나므로 단일 출처로 둔다.
 */
export function parseVersion(changelog: string): string {
  return changelog.match(/^##\s*\[([^\]]+)\]/m)?.[1] ?? ""
}

const info = { version: parseVersion(changelogRaw), changelog: changelogRaw }

export function getVersionInfo(): { version: string; changelog: string } {
  return info
}
