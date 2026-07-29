import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  layout("routes/_app.tsx", [
    index("routes/dashboard.tsx"),
    route("items", "routes/items.tsx"),
    route("items/:itemId", "routes/item-detail.tsx"),
    route("members", "routes/members.tsx"),
    route("settings", "routes/settings.tsx"),
    // 데이터 전용 리소스 라우트(변경 이력) — 사이드바 버전 배지가 fetch 한다.
    route("changelog", "routes/changelog.tsx"),
  ]),
  route("forbidden", "routes/forbidden.tsx"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig
