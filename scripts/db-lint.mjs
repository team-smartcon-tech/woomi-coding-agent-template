#!/usr/bin/env node
/**
 * 마이그레이션 SQL 정적 검사.
 *
 * ## 왜 만들었나
 * `.agents/data/DB_SCHEMA.md` 3.5 는 처음부터 "security definer 함수를 exposed schema 에 두지
 * 않는다", "FK 컬럼은 index 를 검토한다" 고 적고 있었다. 그런데 이 템플릿에서 분기한 프로젝트의
 * 실제 DB 12개를 조회해 보니(2026-11, 읽기 전용) 규칙과 반대인 상태가 그대로 쌓여 있었다 —
 * anon 이 실행할 수 있는 security definer 함수 66개, `(select auth.uid())` 로 감싸지 않은 정책
 * 87개, search_path 없는 함수 87개, FK 500개 중 183개가 index 없음. 문서에 적힌 규칙은 안내문이고,
 * 실패하는 검사만 잠금장치다. 실제로 반복된 것만 골라 검사로 옮겼다.
 *
 * ## 무엇을 보고 무엇을 안 보나
 * - 본다: 파일 하나 안에서 판정할 수 있는 형태 — 아래 RULES.
 * - 안 본다: 다른 마이그레이션에 흩어진 정의(테이블은 앞 파일, RLS 는 뒤 파일), `do $$ … $$`
 *   안에서 동적으로 만드는 정책, 테이블 크기와 잠금 시간, 정책이 업무상 옳은가.
 *   그래서 **새 테이블과 그 RLS·index 는 같은 마이그레이션 파일에 둔다** 가 전제다.
 * - 원격 DB 의 현재 상태는 `scripts/db-audit.sql` 로 따로 본다.
 * - SQL 파서가 아니라 정규식이다. 잠금·하위호환까지 보려면 Squawk 를 이 검사 옆에 붙인다.
 *
 * ## 쓰는 법
 *   node scripts/db-lint.mjs                       # supabase/migrations/*.sql 전부
 *   node scripts/db-lint.mjs <file.sql> ...        # 지정한 파일만
 *   node scripts/db-lint.mjs --changed <ref>       # <ref> 대비 새로 추가된 마이그레이션만 (PR)
 *   node scripts/db-lint.mjs --selftest
 *
 * 규칙을 의도적으로 어길 때는 그 파일에 이유와 함께 적는다. 이유 없는 allow 는 무시한다.
 *   -- db-lint-allow: definer-in-public 로그인 전 호출이라 anon 실행이 필요, 입력은 함수 안에서 검증
 *   -- destructive-approved: 2026-11-26 홍길동 승인, 백업 위치 …
 */

import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const MIGRATIONS = "supabase/migrations"

export const RULES = {
  "rls-missing": "public 테이블을 만들었는데 같은 파일에서 RLS 를 켜지 않았다",
  "no-primary-key": "primary key 가 없는 테이블",
  "timestamp-without-tz": "timestamp 컬럼에 시간대가 없다 — timestamptz 를 쓴다",
  "policy-bare-auth": "정책이 auth.uid()/auth.jwt()/auth.role() 을 (select …) 로 감싸지 않았다",
  "policy-always-true": "쓰기 정책의 조건이 true 다 — 로그인한 누구나 쓰고 지울 수 있다",
  "policy-user-metadata":
    "정책이 user_metadata 로 권한을 판정한다 — 사용자가 직접 바꿀 수 있는 값이다",
  "definer-in-public": "security definer 함수를 public 스키마에 만들었다",
  "definer-search-path": "security definer 함수에 set search_path 가 없다",
  "definer-anon-execute": "security definer 함수의 실행 권한을 public/anon 에서 회수하지 않았다",
  "view-security-invoker":
    "public 뷰에 security_invoker 가 없다 — 뷰 소유자 권한으로 RLS 를 우회한다",
  destructive: "데이터를 지우는 변경인데 승인 기록(-- destructive-approved:)이 없다",
}
export const WARNINGS = {
  "function-search-path": "함수에 set search_path 가 없다",
  "fk-index-decision":
    "FK 컬럼에 index 가 없다 — 만들지 않기로 했다면 이유를 적는다(DB_SCHEMA.md 3.6)",
}

/** 주석을 걷어내고 문장 단위로 자른다. 작은따옴표 문자열과 $tag$ 본문 안의 `;` 는 자르지 않는다. */
export function splitStatements(sql) {
  const out = []
  let cur = ""
  let i = 0
  const n = sql.length
  while (i < n) {
    const two = sql.slice(i, i + 2)
    if (two === "--") {
      while (i < n && sql[i] !== "\n") i++
      continue
    }
    if (two === "/*") {
      const end = sql.indexOf("*/", i + 2)
      i = end === -1 ? n : end + 2
      cur += " "
      continue
    }
    const ch = sql[i]
    if (ch === "'") {
      let j = i + 1
      while (j < n) {
        if (sql[j] === "'" && sql[j + 1] === "'") j += 2
        else if (sql[j] === "'") break
        else j++
      }
      cur += sql.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (ch === "$") {
      const m = sql.slice(i).match(/^\$[A-Za-z_]*\$/)
      if (m) {
        const end = sql.indexOf(m[0], i + m[0].length)
        const stop = end === -1 ? n : end + m[0].length
        cur += sql.slice(i, stop)
        i = stop
        continue
      }
    }
    if (ch === ";") {
      if (cur.trim()) out.push(cur.trim())
      cur = ""
      i++
      continue
    }
    cur += ch
    i++
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

const flat = (s) => s.replace(/\s+/g, " ").trim().toLowerCase()
const noBody = (s) => s.replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, " $$body$$ ")
const noStrings = (s) => s.replace(/'(?:[^']|'')*'/g, "''")
const ident = (s) => s.replace(/"/g, "")
/** 스키마를 떼고 이름만. public 이 아니면 null — exposed schema 가 아닌 것은 대부분의 규칙에서 뺀다. */
function publicName(qualified) {
  const parts = ident(qualified).split(".")
  if (parts.length === 1) return parts[0]
  return parts[0] === "public" ? parts[1] : null
}

/** 첫 `(` 부터 짝이 맞는 `)` 까지의 안쪽. */
function parenBody(s) {
  const start = s.indexOf("(")
  if (start === -1) return ""
  let depth = 0
  for (let i = start; i < s.length; i++) {
    if (s[i] === "(") depth++
    else if (s[i] === ")" && --depth === 0) return s.slice(start + 1, i)
  }
  return s.slice(start + 1)
}

function topLevelSplit(body) {
  const parts = []
  let depth = 0
  let cur = ""
  for (const ch of body) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      parts.push(cur.trim())
      cur = ""
    } else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

const bareTimestamp = (typePart) => {
  const m = typePart.match(/\btimestamp\b(\s*\(\d+\))?(\s*with\s+time\s+zone)?/)
  return !!m && !m[2]
}

/** 파일 하나를 검사해 [{ rule, level, message }] 를 돌려준다. */
export function lint(sql) {
  const allow = new Set()
  for (const m of sql.matchAll(/--[ \t]*db-lint-allow:[ \t]*([a-z-]+)[ \t]+(\S[^\n]{4,})/g))
    allow.add(m[1])
  const destructiveApproved = /--[ \t]*destructive-approved:[ \t]*\S[^\n]{4,}/.test(sql)

  const found = []
  const add = (rule, detail) => {
    if (allow.has(rule)) return
    const level = rule in RULES ? "error" : "warning"
    found.push({ rule, level, message: `${RULES[rule] ?? WARNINGS[rule]} — ${detail}` })
  }

  // s: 문자열·함수 본문을 지운 판정용, withStrings: 문자열 리터럴은 남긴 것(user_metadata 처럼 리터럴을 봐야 할 때)
  const statements = splitStatements(sql).map((raw) => ({
    s: flat(noStrings(noBody(raw))),
    withStrings: flat(noBody(raw)),
  }))
  const all = statements.map((x) => x.s)

  const rlsEnabled = new Set()
  const indexed = new Set() // "table.column" — 선두 컬럼만 본다
  const invokerViews = new Set()
  for (const s of all) {
    let m = s.match(
      /^alter table (?:if exists )?(?:only )?([\w."]+) (?:enable|force) row level security/,
    )
    if (m && publicName(m[1])) rlsEnabled.add(publicName(m[1]))
    m = s.match(
      /^create (?:unique )?index (?:concurrently )?(?:if not exists )?[\w."]* ?on (?:only )?([\w."]+) ?(?:using \w+ ?)?\( ?"?(\w+)/,
    )
    if (m && publicName(m[1])) indexed.add(publicName(m[1]) + "." + m[2])
    m = s.match(/^alter view (?:if exists )?([\w."]+) set ?\(.*security_invoker/)
    if (m && publicName(m[1])) invokerViews.add(publicName(m[1]))
  }
  const revoked = (fn) =>
    all.some(
      (s) =>
        /^revoke\b/.test(s) &&
        /\bfrom\b.*\b(?:public|anon)\b/.test(s) &&
        (/\ball functions in schema\b/.test(s) ||
          new RegExp(`\\bfunction ["\\w.]*\\b${fn}\\b`).test(s)),
    )

  const fks = [] // { table, column }
  for (const { s, withStrings } of statements) {
    // ── 테이블 ──
    let m = s.match(/^create (?:unlogged )?table (?:if not exists )?([\w."]+) ?\(/)
    if (m && !/ partition of /.test(s)) {
      const table = publicName(m[1])
      if (table) {
        const body = parenBody(s)
        if (!rlsEnabled.has(table)) add("rls-missing", table)
        if (!/\bprimary key\b/.test(body)) add("no-primary-key", table)
        for (const def of topLevelSplit(body)) {
          const tableLevel = /^(?:constraint|primary|foreign|unique|check|exclude|like)\b/.test(def)
          if (tableLevel) {
            const fk = def.match(/foreign key ?\( ?"?(\w+)/)
            if (fk) fks.push({ table, column: fk[1] })
            const key = def.match(/(?:primary key|unique) ?\( ?"?(\w+)/)
            if (key) indexed.add(table + "." + key[1])
            continue
          }
          const [name, ...rest] = def.split(" ")
          const column = ident(name)
          const type = rest.join(" ")
          if (bareTimestamp(type)) add("timestamp-without-tz", `${table}.${column}`)
          if (/\b(?:primary key|unique)\b/.test(type)) indexed.add(table + "." + column)
          if (/\breferences\b/.test(type)) fks.push({ table, column })
        }
      }
    }
    m = s.match(/^alter table (?:if exists )?(?:only )?([\w."]+) (.*)$/)
    if (m && publicName(m[1])) {
      const table = publicName(m[1])
      for (const action of topLevelSplit(m[2])) {
        const col = action.match(/^add (?:column )?(?:if not exists )?"?(\w+)"? (.*)$/)
        if (col && !/^(?:constraint|primary|foreign|unique|check)$/.test(col[1])) {
          if (bareTimestamp(col[2])) add("timestamp-without-tz", `${table}.${col[1]}`)
          if (/\breferences\b/.test(col[2])) fks.push({ table, column: col[1] })
        }
        const fk = action.match(/^add (?:constraint "?\w+"? )?foreign key ?\( ?"?(\w+)/)
        if (fk) fks.push({ table, column: fk[1] })
        if (/^drop column\b/.test(action) && !destructiveApproved)
          add("destructive", `${table}: ${action.slice(0, 40)}`)
      }
    }

    // ── 정책 ──
    m = s.match(/^(?:create|alter) policy ("[^"]+"|\w+) on ([\w."]+)(.*)$/)
    if (m) {
      const [, name, , rest] = m
      const cmd = (rest.match(/\bfor (all|select|insert|update|delete)\b/) || [, "all"])[1]
      const roles = (rest.match(/\bto ([\w", ]+?)(?= using| with check|$)/) || [, ""])[1]
      const serviceOnly = ident(roles).trim() === "service_role"
      if (/(?<!select )\bauth ?\. ?(?:uid|jwt|role) ?\( ?\)/.test(rest))
        add("policy-bare-auth", name)
      if (/user_metadata/.test(withStrings)) add("policy-user-metadata", name)
      const alwaysTrue = /\b(?:using|with check) ?\( ?true ?\)/.test(rest)
      if (alwaysTrue && cmd !== "select" && !serviceOnly)
        add("policy-always-true", `${name} (for ${cmd})`)
    }

    // ── 함수 ──
    m = s.match(/^create (?:or replace )?function ([\w."]+) ?\(/)
    if (m) {
      const fn = publicName(m[1])
      const label = ident(m[1])
      const definer = /\bsecurity definer\b/.test(s)
      const hasPath = /\bset search_path\b/.test(s)
      if (definer && !hasPath) add("definer-search-path", label)
      else if (!hasPath) add("function-search-path", label)
      if (definer && fn) {
        add("definer-in-public", label)
        if (!revoked(fn)) add("definer-anon-execute", label)
      }
    }

    // ── 뷰 ──
    m = s.match(/^create (?:or replace )?view ([\w."]+)/)
    if (m && publicName(m[1])) {
      const view = publicName(m[1])
      if (!/security_invoker/.test(s) && !invokerViews.has(view)) add("view-security-invoker", view)
    }

    // ── 데이터 손실 ──
    if (!destructiveApproved) {
      if (/^drop (?:table|schema)\b/.test(s) || /^truncate\b/.test(s))
        add("destructive", s.slice(0, 50))
      if (/^delete from\b/.test(s) && !/\bwhere\b/.test(s)) add("destructive", s.slice(0, 50))
    }
  }

  for (const { table, column } of fks)
    if (!indexed.has(table + "." + column)) add("fk-index-decision", `${table}.${column}`)

  return found
}

function changedFiles(ref) {
  const out = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=A", ref, "HEAD", "--", MIGRATIONS],
    { encoding: "utf8" },
  )
  return out.split("\n").filter((f) => f.endsWith(".sql"))
}

function run(files) {
  let errors = 0
  let warnings = 0
  for (const file of files) {
    for (const f of lint(readFileSync(file, "utf8"))) {
      if (f.level === "error") errors++
      else warnings++
      console.log(`${f.level === "error" ? "ERROR" : "warn "}  ${file}: [${f.rule}] ${f.message}`)
    }
  }
  console.log(`\ndb-lint: 파일 ${files.length}개, 오류 ${errors}, 경고 ${warnings}`)
  if (errors > 0) {
    console.log(
      "\n고치는 형태는 .agents/data/DB_SCHEMA.md 3.5·3.7 에 있습니다. 의도한 예외면 그 파일에\n" +
        "`-- db-lint-allow: <규칙> <이유>` 를 적습니다. 이유 없는 allow 는 무시합니다.",
    )
  }
  return errors > 0 ? 1 : 0
}

async function selftest() {
  const assert = (await import("node:assert")).default
  const rules = (sql) =>
    lint(sql)
      .map((f) => f.rule)
      .sort()
  const has = (sql, rule) => assert.ok(rules(sql).includes(rule), `${rule} 가 나와야 함:\n${sql}`)
  const clean = (sql) => assert.deepStrictEqual(rules(sql), [], sql)

  const good = `
    create table public.site_documents (
      id uuid primary key default gen_random_uuid(),
      site_id uuid not null references public.sites (id) on delete restrict,
      title text not null,
      created_by uuid not null,
      created_at timestamptz not null default now(),
      expires_at timestamp(3) with time zone
    );
    create index site_documents_site_id_idx on public.site_documents (site_id);
    alter table public.site_documents enable row level security;
    create policy "members read" on public.site_documents for select to authenticated
      using (created_by = (select auth.uid()));
    create policy "owner update" on public.site_documents for update to authenticated
      using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
    create function private.close_site(p_site uuid) returns void
      language plpgsql security definer set search_path = '' as $fn$
      begin
        update public.sites set closed = true where id = p_site; -- ; 본문 안의 세미콜론
      end $fn$;
    create view public.site_summary with (security_invoker = true) as select 1 as n;
  `
  clean(good)

  has("create table t (id uuid primary key);", "rls-missing")
  has(
    "create table public.t (a int); alter table public.t enable row level security;",
    "no-primary-key",
  )
  has(
    "create table t (id int primary key, at timestamp not null); alter table t enable row level security;",
    "timestamp-without-tz",
  )
  has(
    "alter table public.t add column seen_at timestamp without time zone;",
    "timestamp-without-tz",
  )
  has("create policy p on t for select using (owner = auth.uid());", "policy-bare-auth")
  has(
    "create policy p on t for select using ((auth.jwt() ->> 'role') = 'admin');",
    "policy-bare-auth",
  )
  clean("create policy p on t for select using (((select auth.jwt()) ->> 'r') = 'admin');")
  clean("create policy p on t for select using ((select auth.jwt() ->> 'r') = 'admin');")
  has(
    "create policy p on t for all to authenticated using (true) with check (true);",
    "policy-always-true",
  )
  has("create policy p on t for insert with check (true);", "policy-always-true")
  clean("create policy p on t for select using (true);") // 공개 조회는 의도일 수 있다
  clean("create policy p on t for all to service_role using (true) with check (true);")
  has(
    "create policy p on t for select using ((select auth.jwt()) -> 'user_metadata' ->> 'role' = 'admin');",
    "policy-user-metadata",
  )

  const definer = "create or replace function public.f() returns int language sql security definer"
  has(definer + " as $$ select 1 $$;", "definer-search-path")
  has(definer + " set search_path = '' as $$ select 1 $$;", "definer-in-public")
  has(definer + " set search_path = '' as $$ select 1 $$;", "definer-anon-execute")
  assert.deepStrictEqual(
    rules(
      definer +
        " set search_path = '' as $$ select 1 $$;\nrevoke execute on function public.f() from public, anon;",
    ),
    ["definer-in-public"],
  )
  clean(
    "-- db-lint-allow: definer-in-public 로그인 전 호출이 필요해 public 에 둔다\n" +
      definer +
      " set search_path = '' as $$ select 1 $$;\nrevoke all on function public.f() from public, anon;",
  )
  // 이유 없는 allow 는 무시한다
  has("-- db-lint-allow: rls-missing\ncreate table t (id int primary key);", "rls-missing")
  // 본문 안의 문자열은 판정에 쓰지 않는다
  clean(
    "create function private.g() returns text language sql set search_path = '' as $$ select 'security definer; drop table x' $$;",
  )
  has(
    "create function public.h() returns int language sql as $$ select 1 $$;",
    "function-search-path",
  )

  has("create view public.v as select 1 as n;", "view-security-invoker")
  clean("create view public.v as select 1 as n; alter view public.v set (security_invoker = on);")

  has(
    "create table t (id int primary key, site_id uuid references sites(id)); alter table t enable row level security;",
    "fk-index-decision",
  )
  has(
    "alter table public.t add constraint t_site_fk foreign key (site_id) references sites (id);",
    "fk-index-decision",
  )
  clean(
    "alter table public.t add constraint t_site_fk foreign key (site_id) references sites (id);\ncreate index on public.t (site_id);",
  )

  has("drop table if exists public.old_reports;", "destructive")
  has("alter table public.t drop column legacy_code;", "destructive")
  has("truncate public.t;", "destructive")
  has("delete from public.t;", "destructive")
  clean("delete from public.t where created_at < now() - interval '90 days';")
  clean(
    "-- destructive-approved: 2026-11-26 DB 담당 승인, 백업 확인\ndrop table public.old_reports;",
  )
  // 다른 스키마는 exposed 가 아니므로 RLS·PK 규칙에서 뺀다
  clean("create table private.audit_log (payload jsonb);")

  assert.deepStrictEqual(splitStatements("select ';' ; select $$ a;b $$; -- c;\nselect 2"), [
    "select ';'",
    "select $$ a;b $$",
    "select 2",
  ])
  for (const r of Object.keys({ ...RULES, ...WARNINGS })) assert.ok(/^[a-z-]+$/.test(r))

  console.log("db-lint selftest OK")
}

const args = process.argv.slice(2)
if (args[0] === "--selftest") await selftest()
else if (args[0] === "--changed" && args[1]) {
  const files = changedFiles(args[1])
  if (files.length === 0) console.log("db-lint: 새로 추가된 마이그레이션이 없습니다.")
  else process.exit(run(files))
} else {
  const files = args.length
    ? args
    : existsSync(MIGRATIONS)
      ? readdirSync(MIGRATIONS)
          .filter((f) => f.endsWith(".sql"))
          .sort()
          .map((f) => join(MIGRATIONS, f))
      : []
  if (files.length === 0) console.log(`db-lint: ${MIGRATIONS}/*.sql 이 없습니다.`)
  else process.exit(run(files))
}
