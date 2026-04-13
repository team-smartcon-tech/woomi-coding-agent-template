# woomi-coding-agent-template

팀의 바이브 코딩을 일관된 기준으로 운영하기 위한 **에이전트 규약 템플릿 저장소**입니다.

이 프로젝트는 `AGENT.md`와 `.agent/` 하위 문서를 통해,
에이전트와 개발자가 동일한 구조/스타일/워크플로우를 따르도록 돕습니다.

## 왜 이 프로젝트가 필요한가

- 프로젝트마다 달라지는 규칙 때문에 코드 품질 기준이 흔들리는 문제를 줄입니다.
- 코드 생성 에이전트가 문맥 없이 임의 패턴을 만드는 문제를 방지합니다.
- 팀 온보딩 시 "어떻게 만들어야 하는지"를 문서로 빠르게 공유합니다.

## 핵심 문서

- [`AGENT.md`](./AGENT.md): 에이전트 진입 규칙, 문서 우선순위, 행동 원칙
- [`.agent/ARCHITECTURE.md`](./.agent/ARCHITECTURE.md): 시스템 구조 및 서비스 경계
- [`.agent/STACK.md`](./.agent/STACK.md): 표준 기술스택
- [`.agent/code/PROJECT_STRUCTURE.md`](./.agent/code/PROJECT_STRUCTURE.md): 프론트/백엔드 파일 구조 규칙
- [`.agent/code/CODE_STYLE.md`](./.agent/code/CODE_STYLE.md): 코드 스타일 및 작성 가이드

## 디렉토리 개요

```shell
.
├── AGENT.md
└── .agent/
    ├── ARCHITECTURE.md
    ├── STACK.md
    ├── WORKFLOW.md
    ├── data/
    ├── ui/
    ├── code/
    └── examples/
```

## 사용 방법

1. 새 프로젝트를 시작할 때 이 템플릿을 기준으로 규약 문서를 복사/수정합니다.
2. 에이전트 작업 전에 `AGENT.md` → `ARCHITECTURE.md` → 작업 유형별 문서를 읽도록 합니다.
3. 코드 리뷰 시 `CODE_STYLE.md`와 `PROJECT_STRUCTURE.md` 기준으로 검토합니다.
4. 규약이 바뀌면 관련 문서를 함께 업데이트해 일관성을 유지합니다.

## 목표

이 저장소의 목표는 "코드를 잘 쓰는 방법"을 추상적으로 말하는 것이 아니라,
팀이 반복적으로 사용할 수 있는 **실행 가능한 표준 규칙**을 제공하는 것입니다.
