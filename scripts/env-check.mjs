#!/usr/bin/env node
/**
 * 환경변수 경계 검사 — 코드가 읽는 이름, 예시 파일, wrangler 설정이 서로 맞는지 본다.
 *
 * ## 왜 만들었나
 * 조사한 저장소 16곳 중 환경변수를 한 곳에서 검증하는 모듈을 둔 곳이 0곳이었고(2026-11), 코드
 * 곳곳에서 `process.env.X`·`import.meta.env.X` 를 직접 읽고 있었다. 그러면 이름 하나를 추가하고
 * 예시 파일·배포 secret 등록을 빠뜨려도 배포 후 그 경로가 실행될 때까지 아무것도 실패하지 않는다.
 * 이 템플릿의 스캐폴드도 `SESSION_SECRET ?? "dev-insecure-…"` 로 알려진 기본값에 조용히
 * 떨어지고 있었다.
 *
 * ## 무엇을 보고 무엇을 안 보나
 * - env-drift: 코드가 읽는 이름이 `.env.example`·`.dev.vars.example`·wrangler 설정 어디에도 없다
 * - public-secret: 브라우저로 나가는 접두사(VITE_·NEXT_PUBLIC_·PUBLIC_)에 secret 계열 이름
 * - wrangler-var-secret: wrangler `vars` 에 secret 계열 이름 — vars 는 평문으로 저장소에 남는다
 * - unsafe-default: secret 계열 값이 없을 때 문자열 리터럴로 대체 (`?? "…"`, `|| "…"`)
 * - 안 본다: 값이 실제로 배포 환경에 등록됐는가(원격을 조회하지 않는다), 값의 형식(그건
 *   env.server.ts 의 Zod 스키마가 부팅 때 본다), 동적 키(`process.env[name]`).
 *
 * ## 쓰는 법
 *   node scripts/env-check.mjs                    # apps/ packages/ 를 검사. 어긋나면 exit 1
 *   node scripts/env-check.mjs --roots src,worker # 소스 폴더가 다른 프로젝트
 *   node scripts/env-check.mjs --selftest
 */

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const rootsArg = process.argv.indexOf("--roots")
const ROOTS = (rootsArg > -1 ? process.argv[rootsArg + 1] : "apps,packages").split(",")
const CODE = new RegExp(
  `^(?:${ROOTS.map((r) => r.replace(/[^\w./-]/g, "")).join("|")})/.+\\.(?:[cm]?[jt]sx?)$`,
)
const SKIP = /(?:^|\/)(?:node_modules|build|dist|coverage|\.react-router|\.wrangler)\/|\.d\.ts$/
const TEST = /\.(?:test|spec)\.[cm]?[jt]sx?$|(?:^|\/)__tests__\//
const EXAMPLE = /(?:^|\/)\.(?:env|dev\.vars)(?:\.[\w-]+)*\.example$/
const WRANGLER = /(?:^|\/)wrangler\.(?:jsonc?|toml)$/

/** 런타임·번들러가 채워 주는 이름. 예시 파일에 적을 대상이 아니다. */
const BUILTIN = new Set([
  "NODE_ENV",
  "MODE",
  "DEV",
  "PROD",
  "SSR",
  "BASE_URL",
  "CI",
  "VITEST",
  "TZ",
])
const SECRETISH = /SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|PASSWD|TOKEN|API_KEY|CREDENTIAL/
const PUBLIC_PREFIX = /^(?:VITE_|NEXT_PUBLIC_|PUBLIC_)/
// Supabase 의 anon/publishable key 는 브라우저 공개가 전제인 값이다.
const PUBLIC_BY_DESIGN = /(?:ANON|PUBLISHABLE)_KEY$|_PUBLIC_KEY$|SITE_KEY$/

/** 소스 한 파일에서 읽는 환경변수 이름을 뽑는다. */
export function envRefs(source) {
  const names = new Set()
  const patterns = [
    /\bprocess\.env\.([A-Z][A-Z0-9_]*)/g,
    /\bprocess\.env\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]/g,
    /\bimport\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
    // Hono/Workers: c.env.X, context.cloudflare.env.X, env.X 는 바인딩일 수도 있어 wrangler 설정과도 대조한다
    /\b(?:c|ctx|context(?:\.cloudflare)?)\.env\.([A-Z][A-Z0-9_]*)/g,
  ]
  for (const re of patterns) for (const m of source.matchAll(re)) names.add(m[1])
  return names
}

/** secret 계열 이름을 읽다가 문자열 리터럴로 떨어지는 자리. */
export function unsafeDefaults(source) {
  const out = []
  const re =
    /\b(?:process\.env|import\.meta\.env|(?:c|ctx|context(?:\.cloudflare)?)\.env)\.([A-Z][A-Z0-9_]*)\s*(?:\?\?|\|\|)\s*(["'`])([^"'`]+)\2/g
  for (const m of source.matchAll(re)) if (SECRETISH.test(m[1]) && m[3].length > 0) out.push(m[1])
  return out
}

/** KEY=value 형식 파일의 이름들. */
export function exampleKeys(text) {
  const keys = new Set()
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/)
    if (m) keys.add(m[1])
  }
  return keys
}

/** wrangler 설정에서 vars 의 키와 바인딩 이름을 뽑는다. jsonc 주석은 지우고 읽는다. */
export function wranglerNames(text, isToml = false) {
  const vars = new Set()
  const bindings = new Set()
  if (isToml) {
    let section = ""
    for (const line of text.split("\n")) {
      const head = line.match(/^\s*\[+([^\]]+)\]+/)
      if (head) section = head[1].trim()
      const kv = line.match(/^\s*([A-Za-z_][\w]*)\s*=\s*"?([^"\n]*)"?/)
      if (!kv) continue
      if (/(?:^|\.)vars$/.test(section)) vars.add(kv[1])
      if (kv[1] === "binding") bindings.add(kv[2].trim())
    }
    return { vars, bindings }
  }
  let json
  try {
    json = JSON.parse(
      text
        .replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, str) => str ?? "")
        .replace(/,(\s*[}\]])/g, "$1"),
    )
  } catch {
    return { vars, bindings, unreadable: true }
  }
  const walk = (node, key) => {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, key))
    if (!node || typeof node !== "object") return
    if (key === "vars") Object.keys(node).forEach((k) => vars.add(k))
    if (typeof node.binding === "string") bindings.add(node.binding)
    for (const [k, v] of Object.entries(node)) walk(v, k)
  }
  walk(json, "")
  return { vars, bindings }
}

/** 순수 판정. inputs: { code: [{file, text}], examples: [{file, text}], wranglers: [{file, text}] } */
export function check({ code, examples, wranglers }) {
  const problems = []
  const declared = new Set()
  for (const e of examples) for (const k of exampleKeys(e.text)) declared.add(k)
  const exampleNames = new Set(declared)
  for (const w of wranglers) {
    const { vars, bindings, unreadable } = wranglerNames(w.text, w.file.endsWith(".toml"))
    if (unreadable)
      problems.push(
        `${w.file}: [wrangler-unreadable] 설정을 읽지 못해 vars·바인딩을 대조하지 못했다`,
      )
    for (const v of vars) {
      declared.add(v)
      if (SECRETISH.test(v) && !PUBLIC_BY_DESIGN.test(v))
        problems.push(
          `${w.file}: [wrangler-var-secret] vars.${v} — vars 는 평문으로 커밋된다. wrangler secret put 으로 옮긴다`,
        )
    }
    for (const b of bindings) declared.add(b)
  }

  const refs = new Map() // name -> first file
  for (const c of code) {
    for (const name of envRefs(c.text)) if (!refs.has(name)) refs.set(name, c.file)
    if (!TEST.test(c.file))
      for (const name of unsafeDefaults(c.text))
        problems.push(
          `${c.file}: [unsafe-default] ${name} 가 없으면 문자열 리터럴로 대체된다 — 없으면 기동을 멈춘다`,
        )
  }
  for (const [name, file] of refs) {
    if (BUILTIN.has(name)) continue
    if (!declared.has(name))
      problems.push(
        `${file}: [env-drift] ${name} 를 읽는데 .env.example·.dev.vars.example·wrangler 설정 어디에도 없다`,
      )
  }
  for (const name of new Set([...refs.keys(), ...exampleNames])) {
    if (PUBLIC_PREFIX.test(name) && SECRETISH.test(name) && !PUBLIC_BY_DESIGN.test(name))
      problems.push(
        `[public-secret] ${name} — 이 접두사가 붙은 값은 브라우저 번들에 들어간다. 서버에서만 읽는 이름으로 바꾼다`,
      )
  }
  return problems
}

function run() {
  const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter((f) => f && !SKIP.test(f))
  const read = (file) => {
    try {
      return { file, text: readFileSync(file, "utf8") }
    } catch {
      return null
    }
  }
  const pick = (re) =>
    tracked
      .filter((f) => re.test(f))
      .map(read)
      .filter(Boolean)
  const inputs = { code: pick(CODE), examples: pick(EXAMPLE), wranglers: pick(WRANGLER) }
  const problems = check(inputs)
  if (problems.length === 0) {
    console.log(
      `env-check OK (소스 ${inputs.code.length}개, 예시 ${inputs.examples.length}개, wrangler ${inputs.wranglers.length}개)`,
    )
    return 0
  }
  console.error("ERROR: 환경변수 경계가 어긋났습니다.\n")
  for (const p of problems) console.error("  " + p)
  console.error("\n기준: .agents/DEPLOYMENT.md 4장 「Vars, Secrets, Env Files」.")
  return 1
}

async function selftest() {
  const assert = (await import("node:assert")).default
  const rules = (inputs) =>
    check({ code: [], examples: [], wranglers: [], ...inputs })
      .map((p) => p.match(/\[([a-z-]+)\]/)[1])
      .sort()
  const src = (text, file = "apps/web/app/x.server.ts") => [{ file, text }]
  const ex = (text, file = "apps/web/.env.example") => [{ file, text }]

  assert.deepStrictEqual(
    [
      ...envRefs(
        'process.env.A_B; process.env["C"]; import.meta.env.VITE_D; c.env.DB; process.env[name]',
      ),
    ],
    ["A_B", "C", "VITE_D", "DB"],
  )
  assert.deepStrictEqual(rules({ code: src("process.env.SESSION_SECRET") }), ["env-drift"])
  assert.deepStrictEqual(
    rules({ code: src("process.env.SESSION_SECRET"), examples: ex("# 설명\nSESSION_SECRET=\n") }),
    [],
  )
  assert.deepStrictEqual(rules({ code: src("process.env.NODE_ENV; import.meta.env.DEV") }), [])
  // 바인딩과 vars 는 wrangler 설정이 선언한 것으로 본다
  const wr = [
    {
      file: "apps/worker/wrangler.jsonc",
      text: '{ // 주석\n "vars": { "PUBLIC_URL": "https://x", }, "r2_buckets": [{ "binding": "FILES" }],\n "env": { "dev": { "vars": { "MODEL": "m" } } } }',
    },
  ]
  assert.deepStrictEqual(
    rules({ code: src("c.env.FILES; c.env.PUBLIC_URL; c.env.MODEL"), wranglers: wr }),
    [],
  )
  assert.deepStrictEqual(
    rules({
      wranglers: [
        { file: "wrangler.jsonc", text: '{"vars":{"JWT_SECRET":"abc","SUPABASE_ANON_KEY":"k"}}' },
      ],
    }),
    ["wrangler-var-secret"],
  )
  assert.deepStrictEqual(
    rules({
      wranglers: [
        {
          file: "wrangler.toml",
          text: '[vars]\nOPENAI_API_KEY = "x"\n[[r2_buckets]]\nbinding = "FILES"\n',
        },
      ],
    }),
    ["wrangler-var-secret"],
  )
  assert.deepStrictEqual(
    rules({ examples: ex("VITE_SUPABASE_ANON_KEY=\nVITE_SUPABASE_SERVICE_ROLE_KEY=\n") }),
    ["public-secret"],
  )
  assert.deepStrictEqual(
    rules({
      code: src('const s = process.env.SESSION_SECRET ?? "dev-insecure"'),
      examples: ex("SESSION_SECRET=\n"),
    }),
    ["unsafe-default"],
  )
  // secret 계열이 아닌 값의 기본값과, 테스트 파일은 대상이 아니다
  assert.deepStrictEqual(
    rules({ code: src('process.env.LOG_LEVEL ?? "info"'), examples: ex("LOG_LEVEL=\n") }),
    [],
  )
  assert.deepStrictEqual(
    rules({
      code: src('process.env.JWT_SECRET ?? "test-secret"', "apps/web/app/x.test.ts"),
      examples: ex("JWT_SECRET=\n"),
    }),
    [],
  )
  assert.ok(EXAMPLE.test(".env.example") && EXAMPLE.test("apps/w/.dev.vars.example"))
  assert.ok(EXAMPLE.test(".env.production.example") && !EXAMPLE.test(".env.production"))

  console.log("env-check selftest OK")
}

if (process.argv[2] === "--selftest") await selftest()
else process.exit(run())
