#!/usr/bin/env node
/**
 * ERD 관계선 ↔ DB 외래 키 대조.
 *
 * `docs/DB-ERD/` 의 Mermaid 그림에서 **실선 관계**를 뽑아, DB 의 FK 목록과 같은지 본다.
 * 표기 약속(`docs/DB-ERD/README.md`)이 "실선 = DB 에 FK 가 있다 / 점선 = FK 없음" 이므로
 * 둘은 개수까지 같아야 한다.
 *
 * ## 왜 만들었나
 * ERD 는 사람이 마이그레이션 SQL 을 읽고 그린 정리본이라, 갱신을 빠뜨리거나 선 모양을 잘못
 * 골라도 아무것도 실패하지 않는다. 파생 프로젝트(Smart Planner)에서 원격 FK 17개를 손으로
 * 대조해 보니 FK 가 있는데 점선으로 그린 것과 FK 가 없는데 실선으로 그린 것(뷰)이 하나씩
 * 나왔다. 그 프로젝트의 검사를 일반화해 들여왔다(2.30-draft).
 *
 * ## 무엇을 보고 무엇을 안 보나
 * - 본다: (부모, 자식, 부모 쪽이 `|o` 인가 = FK 컬럼이 nullable 인가) 의 묶음.
 * - 안 본다: 엔티티 블록 안의 컬럼 주석, 삭제 동작(cascade 등), 점선 관계, 일반 컬럼.
 * - 비교할 그림: `현재-DB-ERD.md` + 머리말 `상태:` 가 아직 적용 전인 계획 문서.
 *   CI 의 격리 DB 는 `migrations/` 를 **전부** 적용하므로 미적용 마이그레이션의 테이블도 있다 —
 *   그것은 계획 문서에 그려져 있어야 한다(README 갱신 방법 1). 적용이 끝난 계획 문서
 *   (`적용 완료`·`적용됨`)는 내용이 현재 문서로 옮겨졌으므로 빼야 중복으로 세지 않는다.
 * - 원격 DB 의 적용 상태는 보지 않는다. CI 에 원격 접속 정보를 두지 않기 위해서다.
 *
 * ## 쓰는 법
 *   psql "$DB_URL" -At -F '|' -c "<아래 FK_QUERY>" > fks.txt
 *   node scripts/erd-check.mjs fks.txt      # 어긋나면 exit 1
 *   node scripts/erd-check.mjs --query      # FK_QUERY 만 출력 (CI 가 이걸 psql 에 넘긴다)
 *   node scripts/erd-check.mjs --selftest   # 파서·대조 규칙 자체 검사
 */

import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const ERD_DIR = process.env.ERD_DIR ?? "docs/DB-ERD" // 테스트용으로 바꿀 수 있다
const CURRENT = "현재-DB-ERD.md"

/** 한 줄 = 자식|FK 컬럼|부모|nullable(t/f). public 스키마의 단일 컬럼 FK 만 있다. */
export const FK_QUERY = `select c.conrelid::regclass::text, a.attname, c.confrelid::regclass::text,
  case when a.attnotnull then 'f' else 't' end
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
where c.contype = 'f' and c.connamespace = 'public'::regnamespace
order by 1, 2`

// 부모 쪽 표기: || 정확히 1, |o 0 또는 1. 자식 쪽은 개수라 대조에 쓰지 않는다.
const REL =
  /^\s*([a-z_][a-z0-9_]*)\s+(\|\||\|o|o\||\}o|o\{|\}\||\|\{)(--|\.\.)(\|\||\|o|o\||\}o|o\{|\}\||\|\{)\s+([a-z_][a-z0-9_]*)\s*:/

/** Mermaid erDiagram 블록에서 실선 관계만 뽑는다. */
export function parseSolidRelations(markdown) {
  const out = []
  const blocks = markdown.match(/```mermaid\s*\n\s*erDiagram[\s\S]*?```/g) ?? []
  for (const block of blocks) {
    for (const line of block.split("\n")) {
      const m = REL.exec(line)
      if (!m) continue
      const [, parent, left, link, , child] = m
      if (link !== "--") continue
      out.push({ parent, child, nullable: left === "|o" || left === "o|", line: line.trim() })
    }
  }
  return out
}

/** `상태:` 가 적용 전인 계획 문서인가. 현재 문서는 항상 대상이다. */
export function isComparedDoc(fileName, markdown) {
  if (fileName === CURRENT) return true
  const status = /상태:\s*([^\n]*)/.exec(markdown)?.[1] ?? ""
  if (/적용 완료|적용됨/.test(status)) return false
  return /계획|미적용/.test(status)
}

export function parseFks(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [child, column, parent, nullable] = l.split("|")
      return { parent: strip(parent), child: strip(child), column, nullable: nullable === "t" }
    })
}

const strip = (name) => name.replace(/^public\./, "")
const key = (r) => `${r.parent} → ${r.child} (${r.nullable ? "nullable" : "not null"})`

/** 두 목록의 차이. 같은 (부모, 자식) 쌍에 FK 가 둘일 수 있어 개수까지 센다. */
export function diff(relations, fks) {
  const count = (list) => {
    const m = new Map()
    for (const r of list) m.set(key(r), (m.get(key(r)) ?? 0) + 1)
    return m
  }
  const drawn = count(relations)
  const actual = count(fks)
  const problems = []
  for (const [k, n] of actual) {
    const d = drawn.get(k) ?? 0
    if (d < n)
      problems.push(
        `DB 에 FK 가 있는데 그림에 실선이 없다: ${k}${n > 1 ? ` — FK ${n}개, 실선 ${d}개` : ""}`,
      )
  }
  for (const [k, n] of drawn) {
    const a = actual.get(k) ?? 0
    if (a < n)
      problems.push(
        `그림은 실선인데 DB 에 FK 가 없다: ${k}${n > 1 ? ` — 실선 ${n}개, FK ${a}개` : ""}`,
      )
  }
  return problems
}

function loadRelations() {
  const docs = readdirSync(ERD_DIR).filter((f) => f.endsWith(".md") && f !== "README.md")
  const used = []
  const relations = []
  for (const f of docs) {
    const md = readFileSync(join(ERD_DIR, f), "utf8")
    if (!isComparedDoc(f, md)) continue
    used.push(f)
    relations.push(...parseSolidRelations(md))
  }
  return { used, relations }
}

function selftest() {
  const md = [
    "```mermaid",
    "erDiagram",
    '  projects ||--o{ events : "a"',
    '  projects |o--o{ plans : "b"',
    '  templates ||..o{ stages : "c (FK 아님)"',
    "  projects {",
    "    text id PK",
    "  }",
    "```",
  ].join("\n")
  const rel = parseSolidRelations(md)
  const fks = parseFks("public.events|project_id|public.projects|f\nplans|seeded|projects|t\n")
  const cases = [
    ["실선만 뽑는다", rel.length === 2],
    ["|o 는 nullable", rel[1].nullable === true && rel[0].nullable === false],
    ["일치하면 문제 없음", diff(rel, fks).length === 0],
    ["FK 가 있는데 선이 없으면 잡는다", diff(rel.slice(0, 1), fks).length === 1],
    ["선이 있는데 FK 가 없으면 잡는다", diff(rel, fks.slice(0, 1)).length === 1],
    [
      "nullable 이 다르면 양쪽 다 잡는다",
      diff(rel, [fks[0], { ...fks[1], nullable: false }]).length === 2,
    ],
    ["같은 쌍 FK 두 개는 선도 두 개", diff(rel.slice(0, 1), [fks[0], fks[0]]).length === 1],
    ["현재 문서는 항상 대상", isComparedDoc(CURRENT, "")],
    ["적용 완료 계획 문서는 뺀다", !isComparedDoc("x.md", "> 상태: **적용 완료** — 2차 계획")],
    ["미적용 계획 문서는 넣는다", isComparedDoc("x.md", "> 상태: **계획 — 원격 미적용**")],
  ]
  const failed = cases.filter(([, ok]) => !ok)
  for (const [name, ok] of cases) console.log(`${ok ? "✓" : "✗"} ${name}`)
  if (failed.length) process.exit(1)
}

const arg = process.argv[2]
if (arg === "--selftest") {
  selftest()
} else if (arg === "--query") {
  console.log(FK_QUERY)
} else if (arg) {
  const fks = parseFks(readFileSync(arg, "utf8"))
  const { used, relations } = loadRelations()
  const problems = diff(relations, fks)
  console.log(
    `대조한 그림: ${used.join(", ")} — 실선 ${relations.length}개 / DB FK ${fks.length}개`,
  )
  if (problems.length) {
    console.error(
      `ERD 와 DB 의 FK 가 어긋난다 (${problems.length}건)\n  - ${problems.join("\n  - ")}`,
    )
    console.error(
      "고치는 법: docs/DB-ERD/README.md 「갱신하는 방법」 — 적용 전 테이블은 계획 문서에 그린다",
    )
    process.exit(1)
  }
  console.log("ERD 관계선과 DB 외래 키가 일치한다")
} else {
  console.error("사용법: node scripts/erd-check.mjs <fks.txt> | --query | --selftest")
  process.exit(2)
}
