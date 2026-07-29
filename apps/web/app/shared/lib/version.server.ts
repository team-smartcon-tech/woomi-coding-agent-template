import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

/**
 * 시스템 버전 + 변경 이력 — **서버 전용**.
 *
 * 변경 이력에는 수정된 취약점의 파일·경로가 남기 마련이라 클라이언트 번들이나
 * 정적 자산으로 노출하면 안 된다(로그인 없이 읽힌다). 그래서 `?raw` import 나
 * `public/` 배치 대신, 로그인 가드가 걸린 loader 안에서만 이 모듈을 읽는다.
 *
 * 버전은 CHANGELOG 최상단 `## [x.y-draft]` 헤딩에서 파생한다 —
 * 상수를 따로 두면 반드시 어긋나므로 단일 출처로 둔다.
 */
let cached: { version: string; changelog: string } | null = null

/** 실행 위치(레포 루트 / apps/web 등)에 무관하게 CHANGELOG.md 를 찾는다. */
function findChangelog(): string | null {
  let dir = process.cwd()
  for (let i = 0; i < 6; i += 1) {
    const candidate = join(dir, "CHANGELOG.md")
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = resolve(parent)
  }
  return null
}

export function getVersionInfo(): { version: string; changelog: string } {
  if (cached) return cached

  const path = findChangelog()
  const changelog = path ? readFileSync(path, "utf8") : ""
  const matched = changelog.match(/^##\s*\[([^\]]+)\]/m)

  cached = { version: matched ? matched[1] : "", changelog }
  return cached
}
