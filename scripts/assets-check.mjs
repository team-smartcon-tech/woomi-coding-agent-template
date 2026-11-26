#!/usr/bin/env node
/**
 * 정적 자산 위생 검사 — Worker 의 `assets.directory`(기본 apps/web/build/client)에 올라가면 안 되는
 * 파일이 섞였는지 본다.
 *
 * ## 왜 만들었나
 * Workers Static Assets 는 디렉터리 통째로 공개한다. `public/` 에 두었거나 빌드가 복사한
 * `package.json`·wrangler 설정·`.dev.vars`·문서가 URL 로 그대로 읽힌다. 또 변경 이력(CHANGELOG)은
 * 취약점 경로가 남으므로 클라이언트 번들로 새어 나가면 안 된다.
 *
 * ## 무엇을 보고 무엇을 안 보나
 * - forbidden-file: `wrangler.json*`, `package.json`, `.dev.vars*`, `*.md` 파일이 있다
 * - changelog-leak: CHANGELOG 최상단 `## [` 헤딩 줄 전체가 든 파일이 있다
 * - 안 본다: 서버 번들(build/server — 서버 코드는 공개되지 않는다), 소스맵 업로드 여부,
 *   헤딩이 아닌 CHANGELOG 일부 문장이나 변형·압축된 본문.
 *
 * ## 쓰는 법
 *   node scripts/assets-check.mjs                       # apps/web/build/client 검사. 위반이면 exit 1
 *   node scripts/assets-check.mjs --dir path/to/client
 *   node scripts/assets-check.mjs --selftest
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const FORBIDDEN =
  /(?:^|\/)(?:wrangler\.json[^/]*|package\.json|\.dev\.vars(?:\.[\w-]+)*|[^/]+\.md)$/i
const TEXT = /\.(?:js|mjs|cjs|css|html|json|txt|map|svg|xml|webmanifest)$/i

/** files: {path, text}[] (text 는 텍스트 파일만, 아니면 빈 문자열). 위반 설명 배열을 돌려준다. */
export function check(files, changelogHeading) {
  const out = []
  for (const f of files) {
    if (FORBIDDEN.test(f.path))
      out.push(`[forbidden-file] ${f.path} — 공개 자산에 올라가면 안 되는 파일`)
    else if (changelogHeading && f.text.includes(changelogHeading))
      out.push(`[changelog-leak] ${f.path} — CHANGELOG 헤딩 줄이 들어 있다`)
  }
  return out
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

async function selftest() {
  const assert = (await import("node:assert")).default
  const H = "## [2.33-draft] - 2026-11-26"
  const f = (path, text = "") => ({ path, text })
  const rules = (files) => check(files, H).map((p) => p.match(/\[([a-z-]+)\]/)[1])

  assert.deepStrictEqual(rules([f("assets/app-1.js", "x"), f("woomi.png"), f("favicon.ico")]), [])
  assert.deepStrictEqual(rules([f("package.json", "{}")]), ["forbidden-file"])
  assert.deepStrictEqual(rules([f(".dev.vars")]), ["forbidden-file"])
  assert.deepStrictEqual(rules([f("wrangler.json5"), f(".dev.vars.production")]), [
    "forbidden-file",
    "forbidden-file",
  ])
  assert.deepStrictEqual(rules([f("wrangler.json"), f("docs/README.md")]), [
    "forbidden-file",
    "forbidden-file",
  ])
  assert.deepStrictEqual(rules([f("assets/a.js", `a\n${H}\nb`)]), ["changelog-leak"])
  assert.deepStrictEqual(rules([f("assets/a.js", "## [2.32-draft] - 2026-11-25")]), [])
  // 검사 도구가 자기 설정 파일 이름 때문에 걸리지 않아야 한다
  assert.deepStrictEqual(rules([f(".assetsignore", "*.md"), f("_headers", "/*")]), [])
  console.log("assets-check selftest OK")
}

if (process.argv[2] === "--selftest") await selftest()
else if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--dir")
  // 저장소 루트는 스크립트 위치 기준 — 어디서 실행해도 같은 CHANGELOG 와 기본 폴더를 본다.
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const dir = i > -1 ? process.argv[i + 1] : join(root, "apps/web/build/client")
  const changelog = join(root, "CHANGELOG.md")
  let heading
  try {
    heading = readFileSync(changelog, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("## ["))
  } catch {}
  // 헤딩을 못 찾으면 changelog-leak 검사가 조용히 꺼지므로 통과시키지 않는다.
  if (!heading) {
    console.error(
      `ERROR: ${changelog} 에서 최상단 "## [" 헤딩을 찾지 못했다. 검사를 할 수 없습니다.`,
    )
    process.exit(1)
  }
  let paths
  try {
    paths = walk(dir)
  } catch {
    console.error(`ERROR: ${dir} 가 없다. 먼저 pnpm build 를 실행하세요.`)
    process.exit(1)
  }
  const files = paths.map((p) => ({
    path: relative(dir, p).replaceAll("\\", "/"),
    text: TEXT.test(p) ? readFileSync(p, "utf8") : "",
  }))
  const problems = check(files, heading)
  if (problems.length) {
    console.error("ERROR: 정적 자산에 올라가면 안 되는 것이 있습니다.\n")
    for (const p of problems) console.error("  " + p)
    process.exit(1)
  }
  console.log(`assets-check OK — ${files.length}개 파일 (${dir})`)
}
