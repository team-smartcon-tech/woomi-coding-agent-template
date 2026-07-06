import { LayoutDashboard, Package, Settings, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: "/", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "/items", label: "항목 관리", icon: Package },
  { to: "/members", label: "구성원", icon: Users },
  { to: "/settings", label: "설정", icon: Settings },
]
