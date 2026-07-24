// 실제로는 loader에서 실제 API를 호출하고 응답을 zod로 검증한다. demo 파라미터는 상태 시연용이다.
import { useEffect, useRef, useState } from "react"
import { Link, useLoaderData, useSearchParams } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { Package, Plus, Search } from "lucide-react"
import { cn } from "~/shared/lib/cn"
import { formatCurrency, formatDate } from "~/shared/lib/format"
import { Button } from "~/shared/ui/button"
import { Card } from "~/shared/ui/card"
import { Checkbox, type CheckboxProps } from "~/shared/ui/checkbox"
import { ConfirmPanel } from "~/shared/ui/confirm-panel"
import { EmptyState } from "~/shared/ui/empty-state"
import { ErrorState } from "~/shared/ui/error-state"
import { Input } from "~/shared/ui/input"
import { PageHeader } from "~/shared/ui/page-header"
import { Select } from "~/shared/ui/select"
import { Skeleton } from "~/shared/ui/skeleton"
import { SheetGrid, type SheetColumn } from "~/shared/ui/sheet-grid"
import { mockItems } from "~/entities/item/model/item.mock"
import { ITEM_STATUS_LABEL, type Item, type ItemStatus } from "~/entities/item/model/item.types"
import { ItemStatusBadge } from "~/entities/item/ui/item-status-badge"

export async function loader(_args: LoaderFunctionArgs) {
  return { items: mockItems }
}

const DEMO_SEGMENTS = [
  { value: "normal", label: "정상" },
  { value: "loading", label: "로딩" },
  { value: "empty", label: "빈 상태" },
  { value: "error", label: "오류" },
]

type StatusFilter = "all" | ItemStatus

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "활성" },
  { value: "pending", label: "대기" },
  { value: "archived", label: "보관" },
]

const BULK_STATUSES: ItemStatus[] = ["active", "pending", "archived"]

// 전체 선택 헤더 체크박스: 일부만 선택되면 indeterminate 로 표시한다(지침: UX_RULES.md §14).
function SelectAllCheckbox({ indeterminate, ...props }: CheckboxProps & { indeterminate: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return <Checkbox ref={ref} {...props} />
}

// 표는 SheetGrid 로 만든다(엑셀식 셀 주행·범위 선택·TSV 복사). 지침: .agents/ui/COMPONENTS.md
// 선택 열은 컴포넌트에서 앞에 붙인다(선택 상태에 의존). 색인·작업 열은 focusable:false 로 둔다.
const baseColumns: SheetColumn<Item>[] = [
  {
    key: "id",
    header: "항목 ID",
    minW: "min-w-28",
    copyText: (item) => item.id,
    cell: (item) => item.id,
    cellClassName: "text-xs text-muted-foreground tabular-nums",
  },
  {
    key: "name",
    header: "이름",
    minW: "min-w-40",
    copyText: (item) => item.name,
    cell: (item) => (
      <Link to={`/items/${item.id}`} className="font-medium hover:underline">
        {item.name}
      </Link>
    ),
  },
  {
    key: "status",
    header: "상태",
    focusable: false,
    minW: "min-w-20",
    copyText: (item) => ITEM_STATUS_LABEL[item.status],
    cell: (item) => <ItemStatusBadge status={item.status} />,
  },
  {
    key: "owner",
    header: "담당자",
    minW: "min-w-28",
    copyText: (item) => item.owner,
    cell: (item) => item.owner,
  },
  {
    key: "amount",
    header: "금액",
    align: "right",
    minW: "min-w-28",
    copyText: (item) => String(item.amount),
    cell: (item) => <span className="tabular-nums">{formatCurrency(item.amount)}</span>,
  },
  {
    key: "updatedAt",
    header: "수정일",
    minW: "min-w-32",
    copyText: (item) => item.updatedAt,
    cell: (item) => formatDate(item.updatedAt),
  },
  {
    key: "actions",
    header: <span className="sr-only">작업</span>,
    focusable: false,
    sticky: "right",
    align: "right",
    minW: "min-w-20",
    cell: (item) => (
      <Link to={`/items/${item.id}`}>
        <Button variant="ghost" size="sm">
          보기
        </Button>
      </Link>
    ),
  },
]

export default function ItemsRoute() {
  const { items } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()
  const demo = searchParams.get("demo") ?? "normal"
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  // 실제로는 mutation(일괄 수정/삭제) 후 loader 재검증으로 목록을 갱신한다. demo 라 로컬 상태로 시연한다.
  const [rows, setRows] = useState<Item[]>(items)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [bulkStatus, setBulkStatus] = useState<ItemStatus>("active")
  const [confirm, setConfirm] = useState<{ kind: "status" | "delete" } | null>(null)

  const filtered = rows.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(q.trim().toLowerCase())
    const matchesStatus = status === "all" || item.status === status
    return matchesQuery && matchesStatus
  })

  // 선택 상태는 현재 보이는(필터된) 행 기준으로 판단한다.
  const selectedVisible = filtered.filter((item) => selected.has(item.id))
  const allSelected = filtered.length > 0 && selectedVisible.length === filtered.length
  const someSelected = selectedVisible.length > 0 && !allSelected

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) filtered.forEach((item) => next.delete(item.id))
      else filtered.forEach((item) => next.add(item.id))
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
    setConfirm(null)
  }

  // 일괄 작업은 실행 전 대상 건수를 confirm 으로 확인한 뒤 적용한다(지침: UX_RULES.md §7, §14).
  function applyBulk() {
    const ids = new Set(selectedVisible.map((item) => item.id))
    if (ids.size === 0) return setConfirm(null)
    if (confirm?.kind === "status") {
      setRows((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, status: bulkStatus } : r)))
    } else if (confirm?.kind === "delete") {
      setRows((prev) => prev.filter((r) => !ids.has(r.id)))
    }
    clearSelection()
  }

  function setDemo(value: string) {
    setSearchParams((prev) => {
      prev.set("demo", value)
      return prev
    })
  }

  const count = demo === "empty" ? 0 : demo === "normal" ? filtered.length : rows.length

  const columns: SheetColumn<Item>[] = [
    {
      key: "select",
      header: (
        <SelectAllCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleAll}
          aria-label="전체 선택"
        />
      ),
      focusable: false,
      sticky: "left",
      align: "center",
      minW: "min-w-10",
      cell: (item) => (
        <Checkbox
          checked={selected.has(item.id)}
          onChange={() => toggleOne(item.id)}
          aria-label={`${item.name} 선택`}
        />
      ),
    },
    ...baseColumns,
  ]

  function renderBody() {
    if (demo === "loading") {
      return (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      )
    }

    if (demo === "error") {
      return (
        <ErrorState
          title="목록을 불러오지 못했습니다"
          description="네트워크 오류로 항목을 표시하지 못했습니다. 다시 시도해 주세요."
          onRetry={() => setDemo("normal")}
        />
      )
    }

    if (demo === "empty") {
      return (
        <EmptyState
          icon={<Package className="size-6" aria-hidden />}
          title="등록된 항목이 없습니다."
          description="새 항목을 추가해 시작하세요."
          action={
            <Button>
              <Plus />
              새 항목
            </Button>
          }
        />
      )
    }

    if (filtered.length === 0) {
      return (
        <EmptyState
          title="검색 결과가 없습니다."
          description="검색어나 필터를 변경해 보세요."
        />
      )
    }

    return (
      <SheetGrid
        columns={columns}
        rows={filtered}
        rowKey={(item) => item.id}
        empty="검색 결과가 없습니다."
        className="max-h-[28rem] rounded-md border border-border"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="항목 관리"
        description="등록된 항목을 검색·필터하고, 여러 항목을 선택해 일괄 수정합니다."
        actions={
          // 여러 항목 일괄 등록(CSV/여러 행 추가)도 같은 화면에서 제공한다 — 지침: UX_RULES.md §14
          <Button>
            <Plus />
            새 항목
          </Button>
        }
      />

      <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
        {DEMO_SEGMENTS.map((segment) => {
          const active = demo === segment.value
          return (
            <button
              key={segment.value}
              type="button"
              onClick={() => setDemo(segment.value)}
              aria-pressed={active}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {segment.label}
            </button>
          )
        })}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="이름으로 검색"
              className="pl-9"
              aria-label="항목 이름 검색"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            aria-label="상태 필터"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {/* 일괄 작업 툴바: 선택이 있을 때만 노출 (지침: UX_RULES.md §14) */}
        {demo === "normal" && selectedVisible.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium text-foreground">{selectedVisible.length}개 선택됨</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value as ItemStatus)}
                className="h-8"
                aria-label="일괄 변경할 상태"
              >
                {BULK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ITEM_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
              <Button size="sm" variant="outline" onClick={() => setConfirm({ kind: "status" })}>
                상태 일괄 변경
              </Button>
              <Button size="sm" variant="danger" onClick={() => setConfirm({ kind: "delete" })}>
                일괄 삭제
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                선택 해제
              </Button>
            </div>
          </div>
        )}

        {/* 실행 전 대상 건수 확인 */}
        {demo === "normal" && confirm && selectedVisible.length > 0 &&
          (confirm.kind === "delete" ? (
            <ConfirmPanel
              className="mt-3"
              title={`${selectedVisible.length}개 항목을 삭제할까요?`}
              description="되돌릴 수 없습니다. 선택한 항목이 목록에서 제거됩니다."
              confirmLabel="삭제"
              onConfirm={applyBulk}
              onCancel={() => setConfirm(null)}
            />
          ) : (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">
                {selectedVisible.length}개 항목의 상태를 &lsquo;{ITEM_STATUS_LABEL[bulkStatus]}&rsquo;(으)로 변경할까요?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">적용 전 대상 건수를 확인하세요.</p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={applyBulk}>
                  적용
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                  취소
                </Button>
              </div>
            </div>
          ))}

        <div className="mt-4">{renderBody()}</div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">총 {count}건</p>
          {/* 실제로는 URL search params의 page로 페이지네이션을 관리한다. */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              이전
            </Button>
            <Button variant="outline" size="sm" disabled>
              다음
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
