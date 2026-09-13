import { useState } from "react"
import { Form, NavLink, Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router"
import { Bell, LogOut, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react"
import { MEMBER_ROLE_LABEL } from "~/entities/member/model/member"
import { requireUser } from "~/features/auth/model/session.server"
import { getVersionInfo } from "~/shared/lib/version.server"
import { cn } from "~/shared/lib/cn"
import { navItems } from "~/shared/config/nav"
import { useUiLayoutStore } from "~/shared/store/ui-layout.store"
import { Badge } from "~/shared/ui/badge"
import { Button } from "~/shared/ui/button"
import { Input } from "~/shared/ui/input"
import { VersionInfo } from "~/shared/ui/version-info"

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  // 버전만 내려준다(캐시된 문자열 하나). 변경 이력 본문은 열 때 /changelog 에서 받는다.
  return { user, version: getVersionInfo().version }
}

/**
 * 브랜드 — 우미 로고 + 구분선 + 제품 워드마크.
 *
 * 자산은 `docs/logo/우미2.png` 원본을 `public/woomi.png` 로 복사한 것이다.
 * **로고 이미지 위에 색을 덮지 않는다** — `bg-primary` 배지 안에 넣거나 `filter` 로
 * 물들이지 않는다. 로고 블루와 UI `--primary` 는 다른 값이고, 덮으면 브랜드 색이 깨진다.
 *
 * 접힘(w-16)에서는 **정사각 심볼**(`woomi-icon.png`)로 바꾼다. 가로 3:1 워드마크를 48px 폭에
 * 욱여넣으면 47×16px 로 뭉개진다 — 줄이는 대신 자산을 교체한다.
 * 심볼은 원본 `docs/logo/우미2.png` 에서 심볼 부분(x 0–55)만 잘라낸 것이다. 원본이 정확히
 * 56×56 정사각이라 비율 왜곡 없이 떨어졌다.
 */
function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b border-border",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
      )}
    >
      <img
        src={collapsed ? "/woomi-icon.png" : "/woomi.png"}
        alt="우미"
        className={cn("shrink-0 object-contain", collapsed ? "size-7" : "h-5 w-auto")}
        draggable={false}
      />
      {!collapsed ? (
        <>
          <span className="h-4 w-px shrink-0 bg-border" aria-hidden />
          <span className="truncate text-sm font-semibold">표준템플릿</span>
        </>
      ) : null}
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
  const { user, version } = useLoaderData<typeof loader>()
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
          <VersionInfo version={version} collapsed={sidebarCollapsed} />
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-3 backdrop-blur sm:px-5">
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
            <div className="flex items-center gap-2 pl-1">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                aria-hidden
              >
                {user.name.slice(0, 1)}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{MEMBER_ROLE_LABEL[user.role]}</p>
              </div>
              <Form method="post" action="/logout">
                <Button type="submit" variant="ghost" size="icon" aria-label="로그아웃">
                  <LogOut aria-hidden />
                </Button>
              </Form>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {bannerOpen ? (
            <div className="flex items-center justify-between gap-3 bg-accent px-3 py-1.5 text-sm text-accent-foreground sm:px-5">
              <p>
                이 화면은 스캐폴드입니다. 점선 가이드 영역과 샘플 데이터를 실제 콘텐츠로 교체하세요.
              </p>
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

          {/*
            본문은 폭을 제한하지 않는다. 예전에는 `mx-auto max-w-6xl` 이라 1,600px 화면에서
            좌우에 각각 90px 이 넘는 빈 띠가 생겼고, 표·대시보드처럼 폭이 곧 정보량인 화면이
            손해를 봤다(`.agents/ui/DESIGN.md` "정보 밀도와 스캔 가능성을 우선한다").
            폼처럼 넓으면 오히려 읽기 나쁜 화면은 그 화면에서 감싼다 — routes/settings.tsx 참고.
          */}
          <div className="w-full px-3 py-3 sm:px-5 sm:py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
