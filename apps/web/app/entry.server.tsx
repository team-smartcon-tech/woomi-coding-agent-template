import type { EntryContext, RouterContextProvider } from "react-router"
import { ServerRouter } from "react-router"
import { isbot } from "isbot"
import { renderToReadableStream } from "react-dom/server"

export const streamTimeout = 5_000

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    })
  }

  let shellRendered = false
  const userAgent = request.headers.get("user-agent")

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: AbortSignal.timeout(streamTimeout + 1000),
      onError(error: unknown) {
        responseStatusCode = 500
        // Log streaming rendering errors from inside the shell. Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error)
        }
      },
    },
  )
  shellRendered = true

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady
  }

  // Workers 는 _headers 를 정적 자산 응답에만 적용한다. SSR 응답은 여기서 같은 값을 건다(값을 바꾸면 public/_headers 도 같이).
  for (const [name, value] of Object.entries({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy-Report-Only": "default-src 'self'",
  })) {
    if (!responseHeaders.has(name)) responseHeaders.set(name, value)
  }
  responseHeaders.set("Content-Type", "text/html")
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
