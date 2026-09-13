// ESLint 최소 구성. 아래 구성 외로 임의 확장 금지 — 늘리려면 먼저 지적 건수를 재고
// 오탐 비중을 확인한 뒤 규칙 단위로 켠다(방법은 `.agents/STACK.md` 7장).
//
// 이 스캐폴드 실측(2026-09-13, 47파일 2,702줄): 아래 구성으로 **0건**이다.
// 빚을 치우려고 넣은 게 아니라 **앞으로 생길 빚을 막으려고** 넣는다 — 이 저장소는 파생
// 프로젝트의 출발점이고, 켜진 채로 출발하면 계속 0으로 남는다. 파생 프로젝트(Smart Planner)는
// 4.7만 줄까지 자란 뒤에 도입해 352건을 재고 오탐을 걸러내는 작업을 따로 치러야 했다.
//
// 타입 인지 세트(recommendedTypeChecked) 전체는 켜지 않는다. 파생 프로젝트 실측에서 352건 중
// no-floating-promises 26건·no-misused-promises 11건이 거의 전부 React Router v7 의
// fetcher.submit(...) 정상 사용법이었고 no-unsafe-argument 116건은 잡음이었다. 그중 실제 버그를
// 잡아낸 건 no-base-to-string 하나뿐이라, 그것만 개별로 켠다.

import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import eslintConfigPrettier from "eslint-config-prettier"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.dirname(fileURLToPath(import.meta.url))

export default [
  {
    ignores: [
      "build/**",
      "**/build/**",
      "dist/**",
      ".react-router/**",
      "**/.react-router/**",
      "node_modules/**",
    ],
  },
  js.configs.recommended,
  // 타입 인지 세트가 아닌 recommended — 위 사유 참조.
  ...tseslint.configs.recommended,
  {
    // react-hooks recommended 를 통째로 펼치지 않는다. 플러그인 v7 의 recommended 에는
    // React Compiler 계열 규칙(set-state-in-effect, refs, purity 등)이 섞여 있는데, 그건
    // 린트 수정이 아니라 리팩터링 작업이라 이 구성의 범위가 아니다. 검증된 두 규칙만 켠다.
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    rules: {
      // `_args` 처럼 의도적으로 밑줄을 붙인 미사용 인자를 쓴다(routes/items.tsx).
      // 기본 설정이면 그게 전부 가짜로 잡힌다.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // 타입 정보가 필요한 규칙은 딱 하나만 켠다.
    //
    // no-base-to-string 이 잡는 것: `String(form.get("email") ?? "")`.
    // FormData#get 은 `string | File | null` 이라 File 이 오면 `[object File]` 이 그대로
    // 저장·전송된다. **타입 검사는 이걸 못 잡는다** — String() 은 어떤 값이든 받기 때문이다.
    // 이 스캐폴드의 로그인 action 에 실제로 있었고(2026-09-13 수정, ~/shared/lib/form-data),
    // 파생 프로젝트에서는 같은 패턴이 43곳까지 번진 뒤에야 발견됐다.
    //
    // projectService 로 타입 정보를 켜므로 lint 가 수 초~20초 걸리는 건 정상이다.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: repoRoot,
      },
    },
    rules: {
      "@typescript-eslint/no-base-to-string": "error",
    },
  },
  // 반드시 배열 마지막 — Prettier 가 관여하는 포맷 규칙과 충돌하지 않도록 끈다.
  //
  // 흔한 설명("충돌이 심해서")은 이 구성에 맞지 않는다. 실제로 끄는 건 no-unexpected-multiline
  // 하나뿐이다(358개 중 켠 규칙과의 교집합 1개, 19개는 지금 typescript-eslint 에 존재하지도 않는
  // 옛 호환 목록). 그래도 넣는 이유는 **보험**이다 — 나중에 누가 @stylistic 같은 포맷 규칙 프리셋을
  // 추가해도 조용히 막아 준다.
  //
  // 주의: 무딘 도구다. 358개를 무조건 끄고 배열 마지막에 있으므로, 그 목록의 규칙을 나중에
  // 의도적으로 켜려 하면 **말없이 무시된다.** 그때는 이것 뒤에 다시 켠다.
  eslintConfigPrettier,
]
