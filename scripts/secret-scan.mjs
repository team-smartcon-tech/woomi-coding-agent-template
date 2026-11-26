#!/usr/bin/env node
/**
 * 시크릿 스캔 — 커밋 전(로컬 훅)과 PR(CI)에서 같은 규칙으로 돈다.
 *
 * ## 왜 만들었나
 * `.githooks/pre-commit` 에 grep 한 줄로 들어 있던 규칙을 꺼냈다. 그 훅은 `core.hooksPath` 가
 * 설정된 PC 에서만 돌고, 이 템플릿에서 분기한 저장소 여럿에서 `.githooks/` 자체가 없었다
 * (2026-11 조사). 훅이 꺼진 PC 에서 올라온 커밋을 볼 자리가 CI 뿐이라, 훅과 CI 가 같은 파일을
 * 부르게 했다 — 규칙이 두 벌이면 한쪽만 고쳐진다.
 *
 * ## 무엇을 보고 무엇을 안 보나
 * - 본다: 알려진 토큰 형태(AWS·GitHub·Supabase·OpenAI·Anthropic·OpenRouter·Slack·Google),
 *   JWT, PEM 개인키, 비밀번호가 든 DB 접속 문자열, secret 계열 이름에 붙은 긴 리터럴,
 *   값 파일 자체(.env·.dev.vars·*.pem …)의 커밋.
 * - 안 본다: 키가 **살아 있는지**(외부 호출을 하지 않는다), 과거 커밋 이력 전체,
 *   lockfile·빌드 산출물, 사람 이름·주민번호 같은 개인정보.
 * - 이 검사는 형태만 본다. 통과가 "시크릿 없음"을 증명하지 않는다. 이미 원격에 올라간 값은
 *   스캐너 결과와 무관하게 유출로 보고 폐기·재발급한다(.agents/DEPLOYMENT.md 4장).
 *
 * ## 쓰는 법
 *   node scripts/secret-scan.mjs --staged        # 스테이징된 추가분 (pre-commit)
 *   node scripts/secret-scan.mjs --diff <ref>    # <ref> 대비 추가분 (PR)
 *   node scripts/secret-scan.mjs                 # 추적 중인 파일 전체 (main push · 수동)
 *   node scripts/secret-scan.mjs --selftest
 *
 * 오탐이면 그 줄 끝에 `secret-scan:allow <이유>` 를 적는다. 이유 없는 allow 는 무시한다.
 */

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { Buffer } from "node:buffer"

const SKIP_PATH =
  /(?:^|\/)(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?)$|(?:^|\/)(?:node_modules|build|dist|coverage|\.react-router|\.wrangler)\/|\.(?:png|jpe?g|gif|webp|ico|pdf|pptx|xlsx|docx|zip|woff2?|ttf|dll|exe)$/i

/** 커밋되면 안 되는 값 파일. agent-guard.cjs 의 blockedFile 과 같은 기준이다. */
export function valueFile(path) {
  const base = String(path).replace(/\\/g, "/").split("/").pop()
  if (/^\.(?:env|dev\.vars)($|\.)/.test(base) && !/\.example$/.test(base))
    return ".env/.dev.vars 계열 파일"
  if (/\.(?:pem|key|p12|pfx|jks)$/i.test(base)) return "키·인증서 파일"
  return null
}

const PLACEHOLDER =
  /example|sample|dummy|placeholder|change[-_]?me|your[-_]|xxxx|<[^>]+>|\$\{|process\.env|import\.meta\.env|\*{4,}|\.{3}/i

const jwtRole = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8")).role || ""
  } catch {
    return ""
  }
}

/** [id, 설명, 정규식, 추가 판정(선택)] */
const RULES = [
  ["aws-access-key", "AWS access key", /AKIA[0-9A-Z]{16}/],
  ["github-token", "GitHub 토큰", /(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/],
  ["supabase-secret-key", "Supabase secret key", /sb_secret_[A-Za-z0-9_-]{16,}/],
  ["anthropic-key", "Anthropic API key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["openrouter-key", "OpenRouter API key", /sk-or-v1-[A-Za-z0-9]{32,}/],
  ["openai-key", "OpenAI API key", /sk-(?:proj-)?[A-Za-z0-9_-]{40,}/],
  ["slack-token", "Slack 토큰", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["google-api-key", "Google API key", /AIza[0-9A-Za-z_-]{35}/],
  ["private-key", "PEM 개인키", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  [
    "jwt",
    "JWT",
    /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    (m) => (jwtRole(m[0]) === "service_role" ? "service_role JWT — RLS 를 우회하는 키" : "JWT"),
  ],
  [
    "db-url-password",
    "비밀번호가 든 DB 접속 문자열",
    /postgres(?:ql)?:\/\/[^\s:@/]+:([^\s@/]{6,})@([^\s/:]+)/,
    (m) =>
      /^(?:127\.0\.0\.1|localhost|db|postgres)$/.test(m[2]) || PLACEHOLDER.test(m[1])
        ? null
        : "비밀번호가 든 DB 접속 문자열",
  ],
  [
    "secret-assignment",
    "secret 계열 이름에 붙은 리터럴",
    /\b[A-Za-z0-9_]*(?:SERVICE_ROLE|SECRET|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_TOKEN|AUTH_TOKEN)[A-Za-z0-9_]*["']?\s*[:=]\s*["'`]([^"'`\s]{20,})["'`]/i,
    (m) =>
      PLACEHOLDER.test(m[1]) || !/[0-9]/.test(m[1]) || !/[A-Za-z]/.test(m[1])
        ? null
        : "secret 계열 이름에 붙은 리터럴",
  ],
]

/** 한 줄을 검사해 [{ id, why }] 를 돌려준다. 값은 돌려주지 않는다. */
/** 테스트 픽스처와 문서의 예시 값은 일반 규칙(secret-assignment)에서만 뺀다. 형태가 확실한 토큰은 계속 본다. */
const LOW_SIGNAL_PATH =
  /\.(?:test|spec)\.[cm]?[jt]sx?$|(?:^|\/)(?:__tests__|__mocks__|fixtures?)\/|\.mdx?$/

export function scanLine(line, file = "") {
  const allow = line.match(/secret-scan:allow\s+(\S.{3,})/)
  if (allow) return []
  const hits = []
  for (const [id, desc, re, judge] of RULES) {
    const m = line.match(re)
    if (!m) continue
    if (id === "secret-assignment" && (LOW_SIGNAL_PATH.test(file) || /test|fake|mock/i.test(m[1])))
      continue
    const why = judge ? judge(m) : desc
    if (why) hits.push({ id, why })
  }
  // 같은 줄에서 더 구체적인 규칙이 잡혔으면 일반 규칙(secret-assignment)은 뺀다.
  return hits.length > 1 ? hits.filter((h) => h.id !== "secret-assignment") : hits
}

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 })

/** unified diff(-U0) 에서 추가된 줄만 { file, line, text } 로 뽑는다. */
export function addedLines(diff) {
  const out = []
  let file = null
  let n = 0
  for (const row of diff.split("\n")) {
    if (row.startsWith("+++ ")) {
      file = row.slice(4).replace(/^b\//, "").replace(/^"|"$/g, "")
      if (file === "/dev/null") file = null
    } else if (row.startsWith("@@")) {
      const m = row.match(/\+(\d+)/)
      n = m ? Number(m[1]) : 0
    } else if (row.startsWith("+") && file) {
      out.push({ file, line: n++, text: row.slice(1) })
    }
  }
  return out
}

function collect(mode, ref) {
  if (mode === "staged") {
    return {
      files: git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split("\n"),
      lines: addedLines(git(["diff", "--cached", "-U0", "--no-color"])),
    }
  }
  if (mode === "diff") {
    return {
      files: git(["diff", "--name-only", "--diff-filter=ACMR", ref, "HEAD"]).split("\n"),
      lines: addedLines(git(["diff", "-U0", "--no-color", ref, "HEAD"])),
    }
  }
  const files = git(["ls-files"]).split("\n").filter(Boolean)
  const lines = []
  for (const file of files) {
    if (SKIP_PATH.test(file)) continue
    let text
    try {
      text = readFileSync(file, "utf8")
    } catch {
      continue // 삭제됐거나 서브모듈
    }
    if (text.includes("\u0000")) continue
    text.split("\n").forEach((t, i) => lines.push({ file, line: i + 1, text: t }))
  }
  return { files, lines }
}

function run(mode, ref) {
  const { files, lines } = collect(mode, ref)
  const problems = []
  for (const f of files.filter(Boolean)) {
    const why = valueFile(f)
    if (why) problems.push(`${f}: ${why} — 커밋하지 않습니다(.env.example 계열만 추적).`)
  }
  for (const { file, line, text } of lines) {
    if (SKIP_PATH.test(file) || valueFile(file)) continue
    for (const hit of scanLine(text, file)) problems.push(`${file}:${line}: ${hit.why} [${hit.id}]`)
  }
  if (problems.length === 0) {
    console.log(`secret-scan OK (${mode}, ${lines.length} 줄)`)
    return 0
  }
  console.error("ERROR: 시크릿으로 보이는 내용이 있습니다.\n")
  for (const p of problems) console.error("  " + p)
  console.error(
    "\n값을 코드에서 지우고 환경변수 또는 platform secret 으로 옮기세요. 이미 push 된 값이면\n" +
      "지우는 것으로 끝나지 않습니다 — 폐기·재발급이 먼저입니다(.agents/DEPLOYMENT.md 4장).\n" +
      "오탐이면 그 줄 끝에 `secret-scan:allow <이유>` 를 적습니다.",
  )
  return 1
}

async function selftest() {
  const assert = (await import("node:assert")).default
  const hit = (line, id) =>
    assert.ok(
      scanLine(line).some((h) => h.id === id),
      `${id} 로 잡혀야 함: ${line.slice(0, 40)}…`,
    )
  const miss = (line) => assert.deepStrictEqual(scanLine(line), [], "통과여야 함: " + line)
  // 검사 대상 문자열을 소스에 그대로 두면 이 파일이 스스로 걸린다 — 조각을 이어 붙인다.
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url")
  const jwt = (role) =>
    [b64({ alg: "HS256", typ: "JWT" }), b64({ iss: "supabase", role, ref: "abcdefghij" })].join(
      ".",
    ) + ".c2lnbmF0dXJlLXNpZ25hdHVyZQ"
  const r = (ch, n) => ch.repeat(n)

  hit("key = " + "AKIA" + r("A", 16), "aws-access-key")
  hit("token: " + "ghp_" + r("a", 36), "github-token")
  hit("const k = '" + "sb_secret_" + r("x", 24) + "'", "supabase-secret-key")
  hit("ANTHROPIC=" + "sk-ant-" + "api03-" + r("b", 30), "anthropic-key")
  hit("OPENROUTER=" + "sk-or-v1-" + r("c", 64), "openrouter-key")
  hit("OPENAI=" + "sk-proj-" + r("d", 48), "openai-key")
  hit("-----BEGIN RSA " + "PRIVATE KEY-----", "private-key")
  hit("anon: " + jwt("anon"), "jwt")
  assert.ok(scanLine("k=" + jwt("service_role"))[0].why.includes("service_role"))
  hit(
    "DATABASE_URL=postgresql://postgres:" + "Sup3rS3cretPw" + "@db.abc.supabase.co:5432/x",
    "db-url-password",
  )
  hit('JWT_SECRET: "' + "a1B2c3D4e5F6g7H8i9J0k1L2" + '"', "secret-assignment")

  assert.deepStrictEqual(
    scanLine(
      'JWT_SECRET: "' + "a1B2c3D4e5F6g7H8i9J0k1L2" + '"',
      "worker/lib/__tests__/sso.test.ts",
    ),
    [],
  )
  assert.ok(scanLine("k=" + jwt("service_role"), "docs/setup.md").length === 1) // 문서여도 토큰은 본다
  miss("DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres")
  miss('const sessionSecret = env.SESSION_SECRET ?? "dev-insecure-session-secret-change-me"')
  miss("SUPABASE_SERVICE_ROLE_KEY=")
  miss('SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"')
  miss("wrangler secret put SUPABASE_SERVICE_ROLE_KEY")
  miss('const password = form.get("password")')
  miss('{ email: "admin@woomi.dev", password: "admin1234", role: "관리자" }')
  miss("AKIA" + r("A", 16) + " // secret-scan:allow 문서용 가짜 키")
  // 이유 없는 allow 는 무시한다
  hit("AKIA" + r("A", 16) + " // secret-scan:allow", "aws-access-key")

  assert.ok(valueFile(".env.production"))
  assert.ok(valueFile("apps/worker/.dev.vars"))
  assert.ok(valueFile("certs/server.pem"))
  assert.strictEqual(valueFile(".env.example"), null)
  assert.strictEqual(valueFile(".dev.vars.example"), null)
  assert.strictEqual(valueFile("apps/web/app/shared/config/env.server.ts"), null)

  const diff = ["+++ b/a.ts", "@@ -0,0 +3,2 @@", "+one", "+two", "+++ /dev/null", "@@ -1 +0,0 @@"]
  assert.deepStrictEqual(addedLines(diff.join("\n")), [
    { file: "a.ts", line: 3, text: "one" },
    { file: "a.ts", line: 4, text: "two" },
  ])

  console.log("secret-scan selftest OK")
}

const args = process.argv.slice(2)
if (args[0] === "--selftest") await selftest()
else if (args[0] === "--staged") process.exit(run("staged"))
else if (args[0] === "--diff" && args[1]) process.exit(run("diff", args[1]))
else if (args.length === 0) process.exit(run("all"))
else {
  console.error("사용법: secret-scan.mjs [--staged | --diff <ref> | --selftest]")
  process.exit(2)
}
