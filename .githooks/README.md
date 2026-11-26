# Git Hooks

이 디렉토리의 훅은 **도구 무관**하게 Git 레벨에서 동작한다.

## 활성화

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push
```

루트 `package.json`의 `prepare`가 `pnpm install` 시 첫 줄을 자동 실행한다. Git 저장소가 아니면 조용히 통과한다.

`core.hooksPath`가 설정되지 않으면 이 훅들은 **한 번도 실행되지 않는다.** 확인:

```bash
git config core.hooksPath   # .githooks 가 나와야 한다
```

## 포함된 훅

- `pre-commit` — 두 가지를 막는다.
  - 값 파일(`.env`·`.dev.vars`·키 파일)과 시크릿 형태. 규칙은 [`scripts/secret-scan.mjs`](../scripts/secret-scan.mjs) 한 곳에 있고 CI(`pr-checks`)도 같은 파일을 부른다. 예시 파일(`*.example`)은 허용하고, lockfile·빌드 산출물은 검사에서 뺀다. 오탐이면 그 줄 끝에 `secret-scan:allow <이유>` 를 적는다.
  - pnpm 저장소에 `package-lock.json`·`yarn.lock` 이 같이 올라오는 것.
- `pre-push` — `main`/`master` 브랜치 직접 푸시 차단. 판정은 **푸시 대상 ref**(stdin)로 한다. 현재 브랜치로 판정하면 `main`에서 태그를 푸시하는 `AGENTS.md` 10장 절차가 막히고, 반대로 `git push origin HEAD:main`이 통과한다.

## 한계

`--no-verify`를 붙이면 두 훅이 동시에 무력화된다. 그래서 시크릿 스캔과 lockfile 검사는 CI 에서 한 번 더 돈다. 서버 측에서 막으려면 GitHub 저장소의 branch ruleset(Require a pull request, Block force pushes, bypass 없음)을 함께 켠다.
