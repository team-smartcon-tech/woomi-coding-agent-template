import { useEffect, useState } from "react"
import { Tag, X } from "lucide-react"
import { cn } from "~/shared/lib/cn"
import { Button } from "~/shared/ui/button"
import { Markdown } from "~/shared/ui/markdown"

/**
 * 사이드바 최하단 시스템 버전 배지 + 변경 이력 뷰어.
 *
 * 버전은 레이아웃 loader 가 내려준다(CHANGELOG 최상단 헤딩에서 파생).
 * 변경 이력 본문은 열 때 `/changelog` 리소스 라우트에서 받아온다 —
 * 클라이언트 번들에 넣으면 로그인 없이 읽히므로 서버 loader 경유가 규칙이다.
 */
export function VersionInfo({ version, collapsed }: { version?: string; collapsed?: boolean }) {
  const [open, setOpen] = useState(false)
  const [changelog, setChangelog] = useState<string | null>(null)

  useEffect(() => {
    if (!open || changelog !== null) return
    let alive = true
    fetch("/changelog")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive) setChangelog(data?.changelog ?? "변경 이력을 불러오지 못했습니다.")
      })
      .catch(() => {
        if (alive) setChangelog("변경 이력을 불러오지 못했습니다.")
      })
    return () => {
      alive = false
    }
  }, [open, changelog])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (!version) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`시스템 버전 ${version} — 변경 이력 보기`}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium tabular-nums",
          "text-muted-foreground transition-colors hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        <Tag className="size-3.5 shrink-0" aria-hidden />
        {!collapsed ? <span className="truncate">v{version}</span> : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 sm:p-8"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-card shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="변경 이력"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">시스템 버전</p>
                <h2 className="mt-0.5 text-xl font-bold tabular-nums tracking-tight">v{version}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="닫기">
                <X aria-hidden />
              </Button>
            </div>
            {/* 문서가 길어 패널 안에서만 스크롤한다. */}
            <div className="overflow-y-auto px-5 pb-6 pt-4">
              {changelog === null ? (
                <p className="text-sm text-muted-foreground">불러오는 중…</p>
              ) : (
                <Markdown text={changelog} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
