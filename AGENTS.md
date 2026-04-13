# AGENTS.md

이 문서는 **웹 서비스 제작 프로젝트**를 대상으로 한 에이전트 행동/구현 규약이다.

- 최종 수정일: 2026-04-14

## 0. Project Overview

이 프로젝트는 [한 줄 설명 작성]

예:

* B2B SaaS를 위한 어드민 대시보드
* 사용자 콘텐츠를 관리하는 웹 플랫폼

---

## 1. Tech Stack

이 프로젝트에서 사용하는 기술 스택:

### Frontend

* [예: React, Vite, TypeScript]

### Backend

* [예: Node.js, Express, Prisma]

### Database

* [예: PostgreSQL]

### Infra / DevOps

* [예: Docker, AWS, CI/CD 도구]

---

## 2. How to Run / Build / Test

### Install

```bash
[설치 명령]
```

### Run Dev Server

```bash
[개발 서버 실행]
```

### Build

```bash
[빌드 명령]
```

### Test

```bash
[테스트 실행]
```

---

## 3. Directory Structure (Summary)

```shell
.
├── .agents/
│   ├── ARCHITECTURE.md
│   ├── STACK.md
│   ├── WORKFLOW.md
│   ├── data/
│   │   ├── DB_SCHEMA.md
│   │   ├── DOMAIN_MODEL.md
│   │   └── API_CONTRACT.md
│   ├── ui/
│   │   ├── DESIGN.md
│   │   ├── COMPONENTS.md
│   │   └── UX_RULES.md
│   ├── code/
│   │   ├── CODE_STYLE.md
│   │   ├── PROJECT_STRUCTURE.md
│   │   ├── TESTING.md
│   │   └── ERROR_HANDLING.md
│   └── examples/
│       ├── GOOD_EXAMPLES.md
│       └── BAD_EXAMPLES.md
└── AGENTS.md
```

```shell
.
├── .agents/                              # AI 규칙/컨텍스트 루트
│   ├── ARCHITECTURE.md                  # 시스템 구조/레이어 규칙
│   ├── STACK.md                         # 기술 스택/사용 제한
│   ├── WORKFLOW.md                      # 개발/배포 프로세스
│   ├── data/                            # 데이터 계층 정의
│   │   ├── DB_SCHEMA.md                 # DB 테이블/컬럼 구조
│   │   ├── DOMAIN_MODEL.md              # 도메인/엔티티 관계
│   │   └── API_CONTRACT.md              # API 요청/응답 스펙
│   ├── ui/                              # UI/프론트 규칙
│   │   ├── DESIGN.md                    # 디자인 시스템
│   │   ├── COMPONENTS.md                # 컴포넌트 구조/재사용
│   │   └── UX_RULES.md                  # UX 패턴/상태 규칙
│   ├── code/                            # 코드 작성 규칙
│   │   ├── CODE_STYLE.md                # 네이밍/포맷 규칙
│   │   ├── PROJECT_STRUCTURE.md         # 디렉토리 구조 규칙
│   │   ├── TESTING.md                   # 테스트 기준/전략
│   │   └── ERROR_HANDLING.md            # 에러 처리/로깅
│   └── examples/                        # 구현 예시 모음
│       ├── GOOD_EXAMPLES.md             # 권장 패턴 예시
│       └── BAD_EXAMPLES.md              # 금지 패턴 예시
└── AGENTS.md                             # 에이전트 진입/행동 규칙
```

---

## 4. Agent Reading Order (IMPORTANT)

에이전트는 작업을 수행하기 전에 반드시 아래 순서로 문서를 참고해야 한다.

1. 이 문서 (AGENTS.md)
2. `.agents/ARCHITECTURE.md`
3. 작업 유형에 따라 아래 문서를 추가로 참고

---

## 5. Task Routing Rules (CRITICAL)

작업 유형에 따라 반드시 다음 문서를 먼저 읽어야 한다.

### 5.1 새로운 화면 / UI 생성

참고 순서:

1. `.agents/ARCHITECTURE.md`
2. `.agents/Views/DESIGN.md`
3. `.agents/Views/COMPONENT.md`
4. `.agents/code/CODE_CONVENTION.md`

---

### 5.2 API / Backend 로직 구현

참고 순서:

1. `.agents/ARCHITECTURE.md`
2. `.agents/DB.md`
3. `.agents/code/CODE_CONVENTION.md`

---

### 5.3 공통 컴포넌트 생성

참고 순서:

1. `.agents/Views/COMPONENT.md`
2. `.agents/Views/DESIGN.md`
3. `.agents/code/CODE_CONVENTION.md`

---

### 5.4 데이터 구조 / DB 변경

참고 순서:

1. `.agents/DB.md`
2. `.agents/ARCHITECTURE.md`
3. `.agents/code/CODE_CONVENTION.md`

---

## 6. Core Development Rules (MUST FOLLOW)

에이전트는 아래 규칙을 반드시 지켜야 한다.

### 6.1 구조 준수

* 기존 프로젝트 구조를 반드시 따른다
* 새로운 패턴을 임의로 만들지 않는다
* 기존 코드와 일관성을 유지한다

### 6.2 재사용 우선

* 기존 컴포넌트/유틸/서비스를 먼저 탐색한다
* 중복 구현을 금지한다

### 6.3 아키텍처 준수

* 레이어 책임을 반드시 지킨다
* 허용되지 않은 의존성 참조 금지

### 6.4 코드 품질

* 가독성을 최우선으로 한다
* 불필요한 복잡성 추가 금지
* 명확한 네이밍 사용

### 6.5 테스트

* 기능 구현 시 테스트 가능성을 고려한다
* 기존 테스트 스타일을 따른다

---

## 7. Forbidden Actions (DO NOT)

에이전트는 다음을 절대 수행하면 안 된다.

* 임의로 라이브러리 추가
* 기존 구조를 무시한 파일 생성
* 디자인 규칙을 따르지 않는 UI 생성
* DB 스키마를 문서 없이 변경
* 기존 코드 스타일을 무시한 구현

---

## 8. Output Requirements

에이전트는 결과를 생성할 때 다음을 반드시 포함해야 한다.

### 8.1 코드 생성 시

* 파일 경로 명시
* 전체 코드 제공 (부분 코드 금지)
* 필요한 import 포함

### 8.2 수정 작업 시

* 변경 전/후 설명
* 영향 범위 설명

### 8.3 UI 작업 시

* 사용된 컴포넌트 명시
* 디자인 규칙 준수 여부 설명

---

## 9. Conflict Resolution Priority

문서 간 충돌이 발생할 경우 아래 우선순위를 따른다:

1. 실제 코드 및 설정 파일
2. AGENTS.md
3. `.agents/ARCHITECTURE.md`
4. 각 영역별 문서
5. 예시 문서

---

## 10. General Guidelines

* 항상 기존 패턴을 먼저 분석한다
* 추측하지 말고 근거 기반으로 구현한다
* 불확실한 경우 명시적으로 가정한다
* 최소한의 변경으로 목적을 달성한다

---

## 11. Agent Behavior Summary

에이전트는 다음과 같이 행동해야 한다:

1. 작업 유형을 먼저 분류한다
2. 해당 작업에 필요한 문서를 읽는다
3. 기존 코드 패턴을 분석한다
4. 규칙을 준수하며 구현한다
5. 결과를 명확하게 설명한다

---
