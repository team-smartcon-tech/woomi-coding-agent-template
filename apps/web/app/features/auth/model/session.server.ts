import { createCookieSessionStorage, redirect } from "react-router"
import { findMemberById, type Member } from "~/entities/member/model/member"
import { getEnv, getSessionSecret } from "~/shared/config/env.server"

// 환경변수는 요청 시점에야 읽을 수 있어 첫 호출에 만든다. MissingSecretError 는 잡지 않는다 — 500 으로 올라간다.
let cachedStorage: ReturnType<typeof createStorage> | null = null

function createStorage() {
  return createCookieSessionStorage({
    cookie: {
      name: "woomi_session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [getSessionSecret()],
      secure: getEnv().isDeployed,
      maxAge: 60 * 60 * 24 * 7,
    },
  })
}

function getStorage() {
  cachedStorage ??= createStorage()
  return cachedStorage
}

const USER_ID_KEY = "userId"

function getSession(request: Request) {
  return getStorage().getSession(request.headers.get("Cookie"))
}

// open redirect 방지: 앱 내부 경로만 허용한다.
export function safeRedirect(to: unknown, fallback = "/"): string {
  if (typeof to !== "string" || !to.startsWith("/") || to.startsWith("//")) return fallback
  return to
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await getStorage().getSession()
  session.set(USER_ID_KEY, userId)
  return redirect(safeRedirect(redirectTo), {
    headers: { "Set-Cookie": await getStorage().commitSession(session) },
  })
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request)
  const userId = session.get(USER_ID_KEY)
  return typeof userId === "string" ? userId : null
}

export async function getUser(request: Request): Promise<Member | null> {
  const userId = await getUserId(request)
  if (!userId) return null
  return findMemberById(userId) ?? null
}

// 인증이 필요한 route loader에서 호출한다. 미인증이면 로그인 화면으로 redirect(throw)한다.
export async function requireUser(request: Request): Promise<Member> {
  const user = await getUser(request)
  if (!user) {
    const url = new URL(request.url)
    const params = new URLSearchParams([["redirectTo", url.pathname + url.search]])
    throw redirect(`/login?${params.toString()}`)
  }
  return user
}

export async function logout(request: Request) {
  const session = await getSession(request)
  return redirect("/login", {
    headers: { "Set-Cookie": await getStorage().destroySession(session) },
  })
}
