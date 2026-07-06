import { useState } from "react"
import { NavLink, Outlet } from "react-router"
import { Bell, Boxes, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react"
import { cn } from "~/shared/lib/cn"
import { navItems } from "~/shared/config/nav"
import { useUiLayoutStore } from "~/shared/store/ui-layout.store"
import { Badge } from "~/shared/ui/badge"
import { Button } from "~/shared/ui/button"
import { Input } from "~/shared/ui/input"

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-border px-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Boxes className="size-5" aria-hidden />
      </div>
      {!collapsed ? <span className="truncate text-sm font-semibold">Woomi Admin</span> : null}
    </div>
  )
}

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0",
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function AppLayout() {
  const sidebarCollapsed = useUiLayoutStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiLayoutStore((state) => state.toggleSidebar)
  const mobileNavOpen = useUiLayoutStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUiLayoutStore((state) => state.setMobileNavOpen)
  const [bannerOpen, setBannerOpen] = useState(true)

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-card md:flex",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        <Brand collapsed={sidebarCollapsed} />
        <NavList collapsed={sidebarCollapsed} />
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
            className={cn("w-full", sidebarCollapsed ? "justify-center px-0" : "justify-start")}
          >
            {sidebarCollapsed ? <PanelLeft aria-hidden /> : <PanelLeftClose aria-hidden />}
            {!sidebarCollapsed ? <span>접기</span> : null}
          </Button>
        </div>
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-lg">
            <Brand />
            <NavList onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu aria-hidden />
          </Button>

          <div className="hidden flex-1 sm:block">
            <Input placeholder="검색" className="max-w-sm" />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <Badge tone="warning">SCAFFOLD</Badge>
            <Button variant="ghost" size="icon" aria-label="알림">
              <Bell aria-hidden />
            </Button>
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium"
              aria-hidden
            >
              우
            </div>
          </div>
        </header>

        <main className="flex-1">
          {bannerOpen ? (
            <div className="flex items-center justify-between gap-3 bg-accent px-4 py-2 text-sm text-accent-foreground sm:px-6">
              <p>이 화면은 스캐폴드입니다. 점선 가이드 영역과 샘플 데이터를 실제 콘텐츠로 교체하세요.</p>
              <button
                type="button"
                onClick={() => setBannerOpen(false)}
                aria-label="안내 닫기"
                className="shrink-0 rounded-md p-1 transition-colors hover:bg-accent-foreground/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
