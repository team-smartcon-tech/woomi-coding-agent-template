#!/usr/bin/env node
"use strict"

// Claude Code / Codex 공용 훅 판정 로직.
//
// 판정 로직을 여기 한 곳에 둔다. 훅 정의 파일(.claude/settings.json, .codex/hooks.json)에
// 인라인 정규식을 두 벌 넣으면 JSON + 셸 이스케이프가 겹쳐 조용히 어긋난다. 실제로 그래서
// `git push`(refspec 없이 main 에서) 가 통과하고 있었다.
//
//   node scripts/agent-guard.cjs file|bash|mcp    PreToolUse. 훅 payload 를 stdin JSON 으로 받는다
//       뒤에 --ask 를 붙이면 승인이 필요한 명령을 권한 프롬프트로 올린다(아래 「승인 프롬프트」)
//   node scripts/agent-guard.cjs stop-changelog   Stop. CHANGELOG 갱신 리마인더
//   node scripts/agent-guard.cjs commit-wiki      PostToolUse(Bash). 커밋 직후 위키 기록 리마인더
//   node scripts/agent-guard.cjs --selftest       판정 로직 자체 점검
//
// 차단은 exit code 2 + stderr 다(Claude Code 훅 규약). 승인 프롬프트는 exit 0 + stdout JSON 이다.
// exit 2 면 stdout JSON 은 읽히지 않으므로 한 판정에서 둘을 섞지 않는다. 그 외 실패는 통과시킨다 —
// 가드가 깨졌을 때 에이전트를 멈추게 하는 것보다 훅이 실제로 도는지 --selftest 로
// 확인하는 편이 낫다.

// ── 파일 경로 ───────────────────────────────────────────────────────────────
// 값이 들어 있는 파일만 막는다. `app/lib/secrets.ts` 처럼 secret 을 다루는 소스 코드는
// 편집 대상이지 차단 대상이 아니다(기존 규칙은 경로에 'secret' 이 있으면 전부 막았다).
function blockedFile(input) {
  const path = String(input || "").replace(/\\/g, "/")
  const base = path.split("/").pop()

  // .env.example / .env.*.example 은 .gitignore 의 `!.env.example` 과 같은 기준으로 허용한다.
  // .dev.vars 는 Cloudflare Worker 의 로컬 secret 파일이다 — .env 와 같은 값 파일로 본다.
  if (/^\.(?:env|dev\.vars)($|\.)/.test(base) && !/\.example$/.test(base))
    return ".env/.dev.vars 계열 파일"
  if (/\.(pem|key|p12|pfx|jks)$/i.test(base)) return "키·인증서 파일"
  if (/^secrets?\.(json|ya?ml|toml|txt|enc)$/i.test(base)) return "secret 값 파일"
  if (/(^|\/)secrets?\//i.test(path)) return "secret 디렉터리 안의 파일"
  return null
}

// ── Bash 명령 ───────────────────────────────────────────────────────────────
// 문장 시작에 있는 git 호출만 본다. `grep 'git push'` 같은 인용은 잡지 않는다.
const STMT = "(?:^|\\n|&&|\\|\\||;|\\|)\\s*"
const PROTECTED = /^(?:refs\/heads\/)?(?:main|master)$/

// 플래그를 판정하기 전에 인용 문자열을 지운다. `git commit -m "fix -n bug"` 오탐 방지.
const unquote = (s) => s.replace(/'[^']*'/g, " ").replace(/"[^"]*"/g, " ")

function gitArgs(command, sub) {
  const m = command.match(new RegExp(STMT + "git\\s+(?:-\\S+\\s+)*" + sub + "\\b([^\\n&|;]*)"))
  return m ? unquote(m[1]) : null
}

function currentBranch() {
  try {
    return require("child_process")
      .execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      .trim()
  } catch {
    return ""
  }
}

// ── 값 파일을 읽어 컨텍스트로 끌어오는 명령 ────────────────────────────────
// Read/Edit/Write 를 막아도 `cat .env` 는 Bash 로 지나간다. 값이 모델 컨텍스트에 들어오면
// 대화·로그·커밋 메시지 어디로든 새어 나갈 수 있어, 읽는 쪽을 막는다. `cp .env.example .env`
// 같은 생성과 `source .env` 같은 로드는 값을 출력하지 않으므로 통과시킨다.
const READERS =
  /^(?:sudo\s+)?(?:cat|bat|head|tail|less|more|nl|tac|strings|xxd|od|base64|grep|egrep|rg|ag|sed|awk|cut|sort|uniq|diff|type|gc|Get-Content|Select-String|findstr)\b/i
const ENV_FILE = /(?:^|[\s=<(/\\])(\.(?:env|dev\.vars)(?:\.[\w.-]+)?)(?=$|[\s)>])/g
const statements = (command) => String(command || "").split(/\n|&&|\|\||;|\|/)

function readsSecretFile(command) {
  for (const raw of statements(command)) {
    const stmt = raw.replace(/['"`]/g, "").trim()
    if (!READERS.test(stmt)) continue
    for (const m of stmt.matchAll(ENV_FILE)) {
      if (!/\.example$/.test(m[1])) return true
    }
  }
  return false
}

// ── 넓은 범위를 지우는 명령 ────────────────────────────────────────────────
// `rm -rf node_modules` 는 일상 작업이라 통과시킨다. 막는 것은 대상이 저장소 전체·홈·루트·
// 절대경로·안전장치 폴더일 때뿐이다. 재귀가 아닌 단일 파일 rm 은 보지 않는다.
const BROAD_TARGET =
  /^(?:\/|~|\$HOME|\$\{HOME\}|\.|\.\.|\*|\.\/\*|\/\*|[A-Za-z]:[\\/]?)$|^(?:~|\$HOME|\$\{HOME\})[\\/]|^(?:\.\/)?(?:\.git|\.githooks|\.claude|\.codex|\.agents|supabase|supabase\/migrations|scripts|wiki|docs)\/?$|(?:^|\/)\.\.(?:\/|$)/
const isBroad = (t) =>
  BROAD_TARGET.test(t) ||
  (/^\//.test(t) && !/^\/tmp\//.test(t)) ||
  (/^[A-Za-z]:[\\/]/.test(t) && !/[\\/](?:Temp|tmp)[\\/]/i.test(t))

function broadDelete(command) {
  for (const raw of statements(command)) {
    const stmt = raw.replace(/['"`]/g, "").trim()
    let m = stmt.match(/^(?:sudo\s+)?rm\s+(.*)$/)
    if (m) {
      const tokens = m[1].split(/\s+/).filter(Boolean)
      const flags = tokens.filter((t) => t.startsWith("-"))
      const recursive = flags.some((f) => f === "--recursive" || /^-[a-zA-Z]*[rR]/.test(f))
      if (recursive && tokens.filter((t) => !t.startsWith("-")).some(isBroad)) return true
      continue
    }
    // PowerShell·cmd. Windows 가 기본 개발 환경이다.
    m = stmt.match(/^(?:Remove-Item|ri|del|erase|rd|rmdir)\s+(.*)$/i)
    if (m) {
      const tokens = m[1].split(/\s+/).filter(Boolean)
      const isFlag = (t) => /^-[A-Za-z]+$/.test(t) || /^\/[A-Za-z]$/.test(t)
      const recursive = tokens.some((t) => /^(?:-r|-recurse|\/s)$/i.test(t))
      if (recursive && tokens.filter((t) => !isFlag(t)).some(isBroad)) return true
    }
  }
  return false
}

// ── 승인 프롬프트 ───────────────────────────────────────────────────────────
// AGENTS.md 6장이 "사용자 승인 없이는 금지"로 둔 작업이다. 막아 버리면 승인받은 배포도 못 하므로
// 차단하지 않고 권한 프롬프트를 강제한다(Claude Code PreToolUse 의 permissionDecision: "ask").
// `.claude/settings.local.json` 에 allowlist 를 넣어 조용히 사전 승인해 둔 경우에도 프롬프트가 뜬다 —
// 그 파일은 gitignore 대상이라 리뷰에 보이지 않는다(CLAUDE.md 「Claude 전용 안전 규칙」).
const RUNNER = "(?:(?:pnpm|npm|npx|yarn|bunx?)\\s+(?:exec\\s+|dlx\\s+|run\\s+)?)?"
const TAIL = "[^\\n&|;]*"
const ASK_RULES = [
  ["supabase\\s+db\\s+push\\b", "원격 DB 에 마이그레이션 적용 (supabase db push)"],
  [
    "supabase\\s+migration\\s+(?:repair|up|squash)\\b",
    "마이그레이션 이력 변경 (supabase migration)",
  ],
  ["supabase\\s+functions\\s+deploy\\b", "Edge Function 배포"],
  ["supabase\\s+secrets\\s+(?:set|unset)\\b", "Supabase secret 변경"],
  [
    "wrangler\\s+(?:(?:versions|pages)\\s+)?(?:deploy|publish)\\b(?!" + TAIL + "--dry-run)",
    "Cloudflare 배포 (wrangler deploy)",
  ],
  ["wrangler\\s+(?:versions\\s+)?secret\\s+(?:put|delete|bulk)\\b", "Worker secret 변경"],
  ["wrangler\\s+d1\\s+" + TAIL + "--remote\\b", "원격 D1 변경 (--remote)"],
  ["wrangler\\s+(?:delete|rollback)\\b", "Worker 삭제·롤백"],
  ["wrangler\\s+(?:r2|kv)\\s+" + TAIL + "\\b(?:delete|put|bulk)\\b", "R2/KV 원격 데이터 변경"],
].map(([re, why]) => [new RegExp(STMT + RUNNER + re), why])
ASK_RULES.push(
  [
    new RegExp(
      STMT +
        "(?:pnpm|npm|yarn|bun)\\s+(?:--filter\\s+\\S+\\s+)?(?:run\\s+)?deploy(?![\\w:-]*dry)(?::[\\w:-]+)?(?:\\s|$)",
    ),
    "배포 스크립트 실행",
  ],
  [new RegExp(STMT + "gh\\s+pr\\s+merge\\b"), "PR 머지 (gh pr merge)"],
)

function askBash(input) {
  const command = String(input || "")
  for (const [re, why] of ASK_RULES) if (re.test(command)) return why
  return null
}

// ── MCP 도구 ────────────────────────────────────────────────────────────────
// 서버 이름은 등록하는 사람마다 다르다(mcp__supabase__…, mcp__Supabase-Dev__…). 그래서 서버 이름은
// 포함 여부로, 동작은 마지막 토막으로 본다. 반환: { deny } | { ask } | null
const SQL_WRITE_HEAD =
  /^(?:insert|update|delete|drop|alter|create|truncate|grant|revoke|comment|refresh|call|do|copy|vacuum|reindex|merge|set|reset|lock|cluster)\b/i
const SQL_WRITE_BODY =
  /\b(?:insert\s+into|update\s+[\w."]+\s+set|delete\s+from|truncate\s+|drop\s+|alter\s+)/i

function sqlWrites(query) {
  const sql = String(query || "")
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
  return sql
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .some((x) => SQL_WRITE_HEAD.test(x) || (/^with\b/i.test(x) && SQL_WRITE_BODY.test(x)))
}

function mcpDecision(toolName, toolInput) {
  const name = String(toolName || "")
  if (!/^mcp__/i.test(name)) return null
  const parts = name.split("__")
  const server = parts.slice(1, -1).join("__").toLowerCase()
  const op = parts[parts.length - 1].toLowerCase()
  const input = toolInput || {}

  if (server.includes("supabase")) {
    // MIGRATION.md 1장·TOOLING.md 6.5: MCP 는 조회 전용이고 스키마 변경은 마이그레이션 파일로만 한다.
    // 원격에 직접 적용하면 저장소의 migrations/ 와 원격 이력이 갈라진다(BAD_EXAMPLES.md B-06).
    if (op === "apply_migration")
      return { deny: "MCP 로 마이그레이션 직접 적용 — 파일을 만들고 Supabase CLI 로 적용합니다" }
    if (op === "execute_sql" && sqlWrites(input.query))
      return { deny: "MCP execute_sql 로 쓰기·DDL 실행 — MCP 는 조회 전용입니다" }
    if (/^(?:reset_branch|pause_project|restore_project|delete_.*)$/.test(op))
      return { deny: "Supabase 프로젝트·브랜치를 지우거나 멈추는 MCP 도구 (" + op + ")" }
    if (/^(?:deploy_edge_function|merge_branch|rebase_branch|create_.*)$/.test(op))
      return { ask: "Supabase 원격 상태를 바꾸는 MCP 도구 (" + op + ")" }
    return null
  }
  if (server.includes("cloudflare")) {
    if (/(?:^|_)delete(?:$|_)/.test(op))
      return { deny: "Cloudflare 리소스를 지우는 MCP 도구 (" + op + ")" }
    if (op === "d1_database_query" && sqlWrites(input.sql || input.query))
      return { ask: "원격 D1 에 쓰기·DDL 실행" }
    if (/(?:^|_)(?:create|update|edit|execute|deploy|put)(?:$|_)/.test(op))
      return { ask: "Cloudflare 원격 상태를 바꾸는 MCP 도구 (" + op + ")" }
    return null
  }
  // 그 밖의 외부 서비스: 삭제 계열만 승인 프롬프트로 올린다(6장 "외부 서비스 데이터 삭제").
  if (/(?:^|[_-])(?:delete|remove|trash|destroy|drop|purge)(?:$|[_-])/.test(op))
    return { ask: "외부 서비스 데이터를 지우는 MCP 도구 (" + op + ")" }
  return null
}

function blockedBash(input, branch) {
  const command = String(input || "")

  const commit = gitArgs(command, "commit")
  // commit 에서 -n 은 --no-verify 다. -nm 같은 묶음 형태도 같은 우회다.
  if (commit !== null && /(?:^|\s)(?:--no-verify|-[a-z]*n[a-z]*)(?:\s|$)/i.test(commit)) {
    return "안전 훅을 건너뛰는 커밋"
  }

  const push = gitArgs(command, "push")
  // push 에서 -n 은 --dry-run 이다. 원격을 바꾸지 않으므로 전부 통과시킨다.
  if (push !== null && !/(?:^|\s)(?:-n|--dry-run)(?:\s|$)/.test(push)) {
    if (/(?:^|\s)--no-verify(?:\s|$)/.test(push)) return "안전 훅을 건너뛰는 푸시"
    if (/(?:^|\s)(?:--all|--mirror)(?:\s|$)/.test(push)) return "모든 ref 를 한 번에 푸시"
    // 6장은 대상과 무관하게 강제 푸시를 금지한다. `-uf` 같은 묶음 형태도 `-f` 다.
    if (/(?:^|\s)(?:--force(?:-with-lease(?:=\S*)?)?|-[a-z]*f[a-z]*)(?:\s|$)/i.test(push))
      return "강제 푸시"

    // 플래그를 걷어내고 남은 토큰은 [remote, refspec...] 이다.
    const refs = push
      .trim()
      .split(/\s+/)
      .filter((t) => t && !t.startsWith("-"))
      .slice(1)
    // refspec 앞의 `+` 도 강제 갱신이다(`--force` 를 ref 하나에만 건 것).
    if (refs.some((r) => r.startsWith("+") && !PROTECTED.test(r.slice(1).split(":").pop())))
      return "강제 푸시"
    // 앞의 `+` 는 강제 갱신 표시라 떼고 본다 — `+main` 도 main 대상 푸시다.
    const dst = refs.map((r) => r.replace(/^\+/, "").split(":").pop())
    if (dst.some((d) => PROTECTED.test(d))) return "main 브랜치 직접 푸시"
    // ref 를 안 적었거나 HEAD 면 현재 브랜치로 판정한다. 명시한 ref 가 main 이 아니면
    // (태그·피처 브랜치) 통과 — AGENTS.md 10장의 `git push origin v<버전>` 이 여기 걸리면 안 된다.
    if ((dst.length === 0 || dst.includes("HEAD")) && PROTECTED.test(branch)) {
      return "main 브랜치 직접 푸시"
    }
  }

  if (new RegExp(STMT + "git\\s+reset\\s+[^\\n&|;]*--hard").test(command))
    return "git reset --hard (사용자 변경 소실)"
  if (new RegExp(STMT + "supabase\\s+db\\s+reset").test(command))
    return "supabase db reset (DB 초기화)"

  // 추적되지 않은 파일·작업트리 전체를 되돌리는 명령. 6장 "사용자 변경사항 되돌리기".
  const clean = gitArgs(command, "clean")
  if (
    clean !== null &&
    /(?:^|\s)-[a-zA-Z]*f/.test(clean) &&
    !/(?:^|\s)(?:-[a-zA-Z]*n|--dry-run)/.test(clean)
  )
    return "git clean -f (추적되지 않은 사용자 파일 삭제)"
  const wholeTree = (args) =>
    args !== null &&
    args
      .trim()
      .split(/\s+/)
      .some((t) => t === "." || t === ":/" || t === "*")
  const restore = gitArgs(command, "restore")
  if (wholeTree(restore) && !(/--staged\b/.test(restore) && !/--worktree\b/.test(restore)))
    return "git restore . (작업트리 전체 되돌리기)"
  if (wholeTree(gitArgs(command, "checkout"))) return "git checkout . (작업트리 전체 되돌리기)"

  if (readsSecretFile(command)) return ".env/.dev.vars 값을 읽어 출력하는 명령"
  if (broadDelete(command)) return "넓은 범위를 재귀 삭제하는 명령"

  return null
}

// ── CHANGELOG 리마인더 (Stop 훅) ────────────────────────────────────────────
// AGENTS.md 10장이 CHANGELOG 갱신을 요구하는 대상만 본다. 무관한 임시 파일 하나에도
// 매 턴 발화하면 리마인더가 소음이 되어 정작 필요할 때 무시된다.
const CHANGELOG_SCOPE =
  /^(?:AGENTS|CLAUDE|CODEX|README|QUICKSTART)\.md$|^\.(?:agents|claude|codex|github|githooks)\//
const CHANGELOG_SCOPE2 =
  /^(?:apps|packages|scripts)\/|^(?:package\.json|pnpm-workspace\.yaml|tsconfig[^/]*\.json|\.gitignore|\.gitattributes)$/
const GENERATED = /(?:^|\/)node_modules\/|\/build\/|\.react-router\//

function needsChangelog(files) {
  const inScope = files.filter(
    (f) => !GENERATED.test(f) && (CHANGELOG_SCOPE.test(f) || CHANGELOG_SCOPE2.test(f)),
  )
  return inScope.length > 0 && !files.includes("CHANGELOG.md")
}

// ── 위키 기록 리마인더 (커밋 직후 PostToolUse 훅) ──────────────────────────
// wiki/README.md·AGENTS.md §1: 남길 것이 생기면 에이전트가 먼저 위키에 남긴다.
// 파생 프로젝트에서 실작업 커밋 26건이 위키 갱신 0건으로 지나간 사례가 있었고, 소급 복원은 커밋
// 메시지에 남은 사실까지만 됐다("왜"는 유실) — 커밋 직후가 맥락이 살아 있어 가장 싸다.
// CHANGELOG 와 달리 코드·규칙 변경만 본다. 문서·설정 잔손질에까지 발화하면 소음이 된다.
const WIKI_SCOPE = /^(?:apps|packages|supabase)\/|^\.agents\/|^scripts\//

function needsWikiNote(files) {
  if (files.some((f) => f.startsWith("wiki/"))) return false
  return files.some((f) => !GENERATED.test(f) && WIKI_SCOPE.test(f))
}

// `git status --porcelain` 한 줄에서 경로만 뽑는다. 비ASCII 경로는 인용되고, rename 은 `a -> b` 다.
function porcelainPath(line) {
  const p = line.slice(3)
  const renamed = p.includes(" -> ") ? p.split(" -> ").pop() : p
  return renamed.replace(/^"|"$/g, "")
}

// ── 판정 기록 ───────────────────────────────────────────────────────────────
// 차단·승인요청만 한 줄씩 남긴다. 정규식 가드는 새 우회 형태를 사후에야 알게 되므로, 무엇이
// 걸렸고 무엇이 오탐이었는지 볼 기록이 있어야 규칙을 고칠 수 있다. 명령 전문은 값이 섞일 수 있어
// 앞 80자만 남긴다. 파일은 gitignore 대상이다.
function logDecision(decision, mode, why, subject) {
  try {
    const head = String(subject).replace(/\s+/g, " ").slice(0, 80)
    const line = [new Date().toISOString(), decision, mode, why, head].join("\t") + "\n"
    require("fs").appendFileSync(".agent-guard.log", line)
  } catch {
    // 기록 실패가 판정을 바꾸면 안 된다.
  }
}

// ── 하네스 배선 점검 ────────────────────────────────────────────────────────
// 훅 정의 파일에서 가드 호출이 빠지면 이 스크립트가 멀쩡해도 아무것도 막지 않는다. 이 템플릿에서
// 분기한 저장소들에서 .githooks/ 가 통째로 없거나 CI 워크플로가 꺼진 사례가 여럿 나왔다(2026-11
// 조사, docs/ai/designs/). 파일이 있는데 배선이 빠진 경우만 실패시킨다 — 그 도구를 안 쓰기로 해
// 파일을 지운 것은 정상이다.
function harnessProblems() {
  const fs = require("fs")
  const problems = []
  const need = {
    ".claude/settings.json": [
      "agent-guard.cjs file",
      "agent-guard.cjs bash",
      "agent-guard.cjs mcp",
    ],
    ".codex/hooks.json": ["agent-guard.cjs file", "agent-guard.cjs bash"],
  }
  for (const [file, calls] of Object.entries(need)) {
    if (!fs.existsSync(file)) continue
    let pre = ""
    try {
      pre = JSON.stringify((JSON.parse(fs.readFileSync(file, "utf8")).hooks || {}).PreToolUse || [])
    } catch {
      problems.push(file + ": JSON 으로 읽을 수 없음")
      continue
    }
    for (const c of calls)
      if (!pre.includes(c)) problems.push(file + ": PreToolUse 에 `" + c + "` 가 없음")
  }
  return problems
}

// ── 자체 점검 ───────────────────────────────────────────────────────────────
function selftest() {
  const assert = require("assert")
  const block = (c, br) => assert.ok(blockedBash(c, br), "BLOCK 이어야 함: " + c + " @" + br)
  const pass = (c, br) =>
    assert.strictEqual(blockedBash(c, br), null, "통과여야 함: " + c + " @" + br)

  // main 직접 푸시 — 기존 인라인 훅이 놓친 형태들
  block("git push", "main")
  block("git push origin", "main")
  block("git push -u origin HEAD", "main")
  block("git push origin HEAD:main", "feature/x")
  block("git push --force origin main", "feature/x")
  block("git push origin :main", "feature/x")
  block("git push --all", "feature/x")
  block("pnpm build && git push", "main")
  // `+` 는 강제 갱신 refspec 이다. 떼지 않고 비교하면 `+main` 이 main 으로 보이지 않았다.
  block("git push origin +main", "feature/x")
  block("git push origin +refs/heads/main", "feature/x")
  block("git push origin +HEAD", "main")
  block("git push origin +HEAD:main", "feature/x") // 콜론 뒤만 보므로 원래도 막혔다 — 회귀 방지

  // 허용해야 하는 것 — 태그 푸시(AGENTS.md 10장)와 피처 브랜치
  pass("git push origin v2.7-draft", "main")
  pass("git push origin feature/x", "main")
  pass("git push", "feature/x")
  pass("git push -n", "main") // --dry-run
  pass("grep -n 'git push' README.md", "main")

  // 훅 우회
  block('git commit --no-verify -m "x"', "feature/x")
  block('git commit -nm "x"', "feature/x")
  block("git push --no-verify origin feature/x", "feature/x")
  // 강제 푸시 — 6장은 대상과 무관하게 `--force` 를 금지한다. 예전에는 main 대상만 막았다.
  block("git push --force origin feature/x", "feature/x")
  block("git push -f origin feature/x", "feature/x")
  block("git push -uf origin feature/x", "feature/x")
  block("git push --force-with-lease origin feature/x", "feature/x")
  block("git push --force-with-lease=feature/x origin feature/x", "feature/x")
  block("git push origin +feature/x", "feature/x")
  pass("git push -u origin feature/x", "feature/x")
  pass("git push --follow-tags origin feature/x", "feature/x")
  pass('git commit -m "fix -n flag handling"', "feature/x")
  pass('git commit -am "x"', "feature/x")

  // 파괴적 명령
  block("git reset --hard HEAD~1", "feature/x")
  block("supabase db reset", "feature/x")

  // 작업트리 전체 되돌리기 — 일부 경로만 되돌리는 것과 unstage 는 통과
  block("git clean -fd", "feature/x")
  block("git clean -xdf", "feature/x")
  pass("git clean -n", "feature/x")
  block("git restore .", "feature/x")
  block("git checkout -- .", "feature/x")
  block("git checkout .", "feature/x")
  pass("git restore --staged .", "feature/x")
  pass("git restore apps/web/app/root.tsx", "feature/x")
  pass("git checkout -b feature/y", "feature/x")
  pass("git checkout main", "feature/x")

  // 값 파일 읽기 — 읽어서 출력하는 명령만 막는다
  block("cat .env", "feature/x")
  block('cat "apps/web/.env.local"', "feature/x")
  block("cat .dev.vars", "feature/x")
  block("grep SUPABASE .env.production", "feature/x")
  block("pnpm build && head -3 .dev.vars", "feature/x")
  block("Get-Content .env", "feature/x")
  block("type .env | findstr KEY", "feature/x")
  pass("cat .env.example", "feature/x")
  pass("cat .dev.vars.example", "feature/x")
  pass("cp .env.example .env", "feature/x")
  pass("ls -la .env", "feature/x")
  pass("cat apps/web/app/shared/config/env.server.ts", "feature/x")
  pass("grep -rn process.env apps/web/app", "feature/x")

  // 넓은 범위 재귀 삭제 — 산출물 폴더는 통과
  block("rm -rf .", "feature/x")
  block("rm -rf *", "feature/x")
  block("rm -rf ~/", "feature/x")
  block("rm -fr /", "feature/x")
  block("rm -rf .git", "feature/x")
  block("rm -rf supabase/migrations", "feature/x")
  block("rm -rf ../other-repo", "feature/x")
  block("rm -rf /home/user/project", "feature/x")
  block("Remove-Item -Recurse -Force .", "feature/x")
  block("Remove-Item -Recurse -Force C:\\Users\\user\\Documents", "feature/x")
  block("rd /s /q .git", "feature/x")
  pass("rm -rf node_modules", "feature/x")
  pass("rm -rf apps/web/build .react-router", "feature/x")
  pass("rm -rf ./dist", "feature/x")
  pass("rm -rf /tmp/scratch", "feature/x")
  pass("rm apps/web/app/old.tsx", "feature/x")
  pass("Remove-Item -Recurse -Force node_modules", "feature/x")

  // 승인 프롬프트 대상 — 차단은 아니다
  const ask = (c) => {
    pass(c, "feature/x")
    assert.ok(askBash(c), "ASK 여야 함: " + c)
  }
  const noAsk = (c) => assert.strictEqual(askBash(c), null, "ASK 가 아니어야 함: " + c)
  ask("supabase db push")
  ask("pnpm exec supabase db push --linked")
  ask("supabase migration repair --status applied 20260101000000")
  ask("wrangler deploy")
  ask("npx wrangler deploy --env production")
  ask("pnpm --filter worker run deploy")
  ask("pnpm run deploy:prod")
  ask("wrangler secret put JWT_SECRET")
  ask("wrangler d1 execute db --remote --file=x.sql")
  ask("wrangler d1 migrations apply db --remote")
  ask("gh pr merge 12 --squash")
  noAsk("wrangler deploy --dry-run")
  noAsk("pnpm --filter worker run deploy:dry")
  noAsk("pnpm deploy:dev:dry")
  ask("pnpm deploy")
  ask("pnpm deploy:dev")
  noAsk("wrangler d1 execute db --local --file=x.sql")
  noAsk("wrangler dev")
  noAsk("supabase migration new add_site_documents")
  noAsk("supabase migration list")
  noAsk("supabase db diff")
  noAsk("grep -n 'wrangler deploy' README.md")
  noAsk("gh pr view 12")

  // MCP 도구
  const md = (n, i) => mcpDecision(n, i) || {}
  assert.ok(md("mcp__supabase__apply_migration", { query: "create table t()" }).deny)
  assert.ok(md("mcp__Supabase-Dev__execute_sql", { query: "update t set a = 1" }).deny)
  assert.ok(md("mcp__supabase__execute_sql", { query: "with x as (select 1) delete from t" }).deny)
  assert.ok(md("mcp__supabase__execute_sql", { query: "-- note\ndrop table t;" }).deny)
  assert.ok(md("mcp__supabase__delete_branch", {}).deny)
  assert.ok(md("mcp__supabase__deploy_edge_function", {}).ask)
  assert.ok(md("mcp__cloudflare__d1_database_delete", {}).deny)
  assert.ok(md("mcp__Cloudflare_Developer_Platform__kv_namespace_create", {}).ask)
  assert.ok(md("mcp__notion__notion-delete-pages", {}).ask)
  const mcpPass = (n, i) => assert.deepStrictEqual(md(n, i), {}, n)
  mcpPass("mcp__supabase__execute_sql", {
    query: "select * from t where note = 'please update it'",
  })
  mcpPass("mcp__supabase__execute_sql", { query: "select updated_at, deleted_at from t" })
  mcpPass("mcp__supabase__list_tables", {})
  mcpPass("mcp__supabase__get_advisors", {})
  mcpPass("mcp__cloudflare__workers_list", {})
  mcpPass("mcp__notion__notion-search", {})
  mcpPass("Bash", {})

  // 파일 경로
  const bf = (p, want) => assert.strictEqual(!!blockedFile(p), want, p)
  bf(".dev.vars", true)
  bf("apps/worker/.dev.vars.production", true)
  bf(".dev.vars.example", false)
  bf(".env", true)
  bf(".env.production", true)
  bf("apps/web/.env.local", true)
  bf("certs/server.pem", true)
  bf("supabase/secrets.json", true)
  bf("secrets/prod.yaml", true)
  bf(".env.example", false)
  bf(".env.production.example", false)
  bf("apps/web/app/lib/secrets.ts", false) // secret 을 다루는 소스 코드는 편집 대상
  bf("apps/web/app/routes/settings.tsx", false)

  // CHANGELOG 리마인더 대상
  const nc = (files, want) => assert.strictEqual(needsChangelog(files), want, files.join(","))
  nc(["AGENTS.md"], true)
  nc([".agents/code/TESTING.md"], true)
  nc(["apps/web/app/root.tsx"], true)
  nc(["scripts/agent-guard.cjs"], true)
  nc(["package.json"], true)
  nc(["AGENTS.md", "CHANGELOG.md"], false) // 이미 갱신했으면 침묵
  nc(["docs/exec-brief/README.md"], false) // 사람용 문서는 대상 아님
  nc(["apps/web/build/index.js"], false) // 빌드 산출물
  nc(["node_modules/x/index.js"], false)
  nc([], false)

  // 위키 기록 리마인더 대상
  const nw = (files, want) => assert.strictEqual(needsWikiNote(files), want, files.join(","))
  nw(["apps/web/app/root.tsx"], true)
  nw(["supabase/migrations/20260825_x.sql"], true)
  nw([".agents/DEPLOYMENT.md"], true)
  nw(["scripts/agent-guard.cjs"], true)
  nw(["apps/web/app/root.tsx", "wiki/log.md"], false) // 같은 커밋에 위키가 있으면 침묵
  nw(["wiki/log.md", "wiki/index.md"], false) // 위키만 고친 커밋
  nw(["CHANGELOG.md", "AGENTS.md"], false) // 루트 문서만 — CHANGELOG 리마인더의 몫
  nw(["apps/web/build/index.js"], false) // 빌드 산출물
  nw([], false)

  assert.strictEqual(porcelainPath('?? "\\355\\225\\234.md"'), "\\355\\225\\234.md")
  assert.strictEqual(porcelainPath("R  old.md -> new.md"), "new.md")

  // 훅 정의 파일에 가드 호출이 실제로 걸려 있는지
  const problems = harnessProblems()
  assert.deepStrictEqual(problems, [], "하네스 배선이 빠졌습니다:\n  " + problems.join("\n  "))

  console.log("agent-guard selftest OK")
}

const mode = process.argv[2]

if (mode === "--selftest") {
  selftest()
} else if (mode === "commit-wiki") {
  try {
    const fs = require("fs")
    const cp = require("child_process")
    const run = (cmd) => cp.execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })

    const payload = JSON.parse(fs.readFileSync(0, "utf8"))
    const command = String((payload.tool_input || {}).command || "")
    // 커밋 명령이 아니면 즉시 통과. 위키가 없는 저장소(템플릿 이식처)도 통과.
    if (gitArgs(command, "commit") === null || !fs.existsSync("wiki")) process.exit(0)

    // 방금 만든 커밋인지 확인한다 — 커밋이 실패했으면 HEAD 는 옛 커밋이라 오탐이 된다.
    const age = Date.now() / 1000 - Number(run("git log -1 --format=%ct").trim())
    if (!(age >= 0 && age < 300)) process.exit(0)

    // 위키 수정이 작업트리에 남아 있으면(따로 커밋할 계획) 침묵한다.
    if (run("git status --porcelain -- wiki").trim()) process.exit(0)

    const files = run("git log -1 --name-only --format=").split("\n").filter(Boolean)
    if (needsWikiNote(files)) {
      process.stdout.write(
        JSON.stringify({
          decision: "block",
          reason:
            "방금 커밋에 위키 기록이 없습니다. wiki/log.md 에 항목을 덧붙이고, 배운 것·정한 것이 있으면 관련 정리본도 갱신하세요(규칙은 wiki/rules/, 화면·경로는 wiki/systems/, 두 번 이상 반복된 실패는 wiki/patterns/)(규칙: wiki/CLAUDE.md). 정말 남길 것이 없는 사소한 변경이면 그렇게 판단했다고 사용자에게 한 줄 보고하고 넘어갑니다.",
        }),
      )
    }
  } catch {
    // 저장소가 아니거나 git 이 없으면 조용히 넘어간다.
  }
} else if (mode === "stop-changelog") {
  try {
    const out = require("child_process").execSync("git status --porcelain", { encoding: "utf8" })
    const files = out.split("\n").filter(Boolean).map(porcelainPath)
    if (needsChangelog(files)) {
      process.stdout.write(
        JSON.stringify({
          systemMessage:
            // 이 스크립트는 템플릿에서 분기한 프로젝트에도 그대로 복사된다. 분기한 쪽은 표준 버전이
            // 아니라 제품 버전(CHANGELOG 최상단)을 올린다(10장) — 한쪽만 지시하면 다른 쪽에서 틀린다.
            "REMINDER: 변경사항이 있습니다. CHANGELOG.md에 항목을 추가하세요. 템플릿 저장소면 AGENTS.md/README.md의 표준 버전·최종 수정일을, 템플릿에서 분기한 프로젝트면 제품 버전(CHANGELOG 최상단)을 갱신합니다. (AGENTS.md 10장)",
        }),
      )
    }
  } catch {
    // 저장소가 아니거나 git 이 없으면 조용히 넘어간다.
  }
} else {
  // deny: 차단(exit 2 + stderr). ask: 권한 프롬프트(exit 0 + stdout JSON). 한 판정에서 섞지 않는다.
  const askMode = process.argv.includes("--ask")
  let deny = null
  let ask = null
  let subject = ""
  try {
    const payload = JSON.parse(require("fs").readFileSync(0, "utf8"))
    const toolInput = payload.tool_input || {}
    if (mode === "file") {
      subject = String(toolInput.file_path || toolInput.path || "")
      deny = blockedFile(subject)
    } else if (mode === "mcp") {
      subject = String(payload.tool_name || "")
      const d = mcpDecision(subject, toolInput) || {}
      deny = d.deny || null
      ask = d.ask || null
    } else {
      subject = String(toolInput.command || "")
      deny = blockedBash(subject, currentBranch())
      if (!deny) ask = askBash(subject)
    }
  } catch {
    process.exit(0)
  }
  if (deny) {
    logDecision("deny", mode, deny, subject)
    console.error("BLOCK: " + deny + " — 사용자 승인이 필요합니다. (AGENTS.md 6장)")
    process.exit(2)
  }
  // --ask 를 넘기지 않은 하네스(권한 프롬프트 규약을 확인하지 못한 도구)에서는 예전처럼 통과시킨다.
  if (ask && askMode) {
    logDecision("ask", mode, ask, subject)
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason:
            ask +
            " — AGENTS.md 6장이 사용자 승인을 요구합니다. 대상 환경과 되돌리는 방법을 확인하세요.",
        },
      }),
    )
  }
}
