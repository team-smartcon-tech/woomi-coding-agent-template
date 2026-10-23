# 현재 DB ERD

> 작성 2026-10-23 / 최종 수정 2026-10-23 / 상태: 비어 있음 (적용된 테이블 0개)

DB 에 **적용된** 테이블의 관계도다. 관계와 식별에 필요한 컬럼만 그린다. 읽는 법·갱신 방법·원천의 순위는 [README](README.md) 에 있다.

- 기준: 원격에 적용된 마이그레이션 (아직 없음). 마이그레이션 SQL 을 읽어 그린다. **적용 전 테이블은 그리지 않는다** — 계획 문서에 둔다.
- 적용 상태의 원본은 [`.agents/data/DB_SCHEMA.md`](../../.agents/data/DB_SCHEMA.md) 5장이다.

## ERD

아직 테이블이 없다. 첫 테이블이 적용되면 아래 모양으로 `mermaid` 블록을 만든다(이 예시는 `text` 블록이라 자동 대조가 읽지 않는다).

```text
erDiagram
  projects ||--o{ project_members : "배정"
  members ||--o{ project_members : "배정"
  projects |o--o{ events : "현장 일정 (null = 전사)"
  templates ||..o{ stages : "template_id (FK 아님 — 코드로 연결)"

  projects {
    uuid id PK
    text code UK "프로젝트 코드"
    text status "active | closed"
  }
  events {
    uuid id PK
    uuid project_id FK "nullable · set null"
  }
```

## 테이블 ↔ 마이그레이션

| 테이블 | 만든 마이그레이션 | 적용일 | 비고 |
| --- | --- | --- | --- |
| (없음) | | | |

## 변경 이력

- 2026-10-23 — 빈 서식으로 만듦(템플릿 2.30-draft).
