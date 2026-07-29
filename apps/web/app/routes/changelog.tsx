import type { LoaderFunctionArgs } from "react-router"
import { requireUser } from "~/features/auth/model/session.server"
import { getVersionInfo } from "~/shared/lib/version.server"

/**
 * 변경 이력 리소스 라우트 — 사이드바 버전 배지에서 열 때만 호출된다.
 * 로그인 가드(`requireUser`)를 거치므로 비로그인 상태로는 읽히지 않는다.
 * 컴포넌트를 내보내지 않아 화면으로는 렌더되지 않는다(데이터 전용).
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request)
  return getVersionInfo()
}
