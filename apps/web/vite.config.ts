import { cloudflare } from "@cloudflare/vite-plugin"
import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(({ command, isPreview }) => {
  // dev 서버만 development 환경을 고른다. npm script 의 `VAR=x` 구문은 Windows cmd 에서 안 되므로 여기서 정한다.
  // build·preview 는 최상위(운영) 설정을 쓴다 — preview 는 빌드 산출물의 설정을 읽어 CLOUDFLARE_ENV 가 의미 없다.
  if (command === "serve" && !isPreview) process.env.CLOUDFLARE_ENV ??= "development"

  return {
    server: { port: 5173 },
    plugins: [
      // 단위 테스트는 Node 에서 돈다 — Worker 런타임 플러그인을 얹으면 vitest 가 시작하지 못한다.
      ...(process.env.VITEST ? [] : [cloudflare({ viteEnvironment: { name: "ssr" } })]),
      tailwindcss(),
      reactRouter(),
      tsconfigPaths(),
    ],
  }
})
