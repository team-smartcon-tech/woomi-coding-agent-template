-- 운영 중인 DB 의 상태 점검 (읽기 전용 · 개수만 돌려준다)
--
-- scripts/db-lint.mjs 는 새 마이그레이션 파일만 본다. 이미 쌓인 상태는 이 쿼리로 본다.
-- Supabase MCP(read_only) 의 execute_sql 이나 SQL Editor 에 그대로 붙여 넣는다. 행 데이터는 읽지
-- 않고 시스템 카탈로그만 센다. 결과와 날짜를 .agents/data/DB_SCHEMA.md 5장에 남긴다.
--
-- 읽는 법 (0 이 아니면 확인할 것 — 근거는 DB_SCHEMA.md 3.5·3.6, BAD_EXAMPLES.md)
--   rls_off                  public 테이블인데 RLS 꺼짐. anon key 로 전부 읽힌다
--   rls_on_no_policy         RLS 켜짐 + 정책 없음. 서버(service role)만 쓰는 테이블이면 정상
--   pol_write_true           쓰기 정책 조건이 true (service_role 전용 제외)            B-03
--   pol_anon_or_public       anon·public 역할에 열린 정책. 로그인 없이 닿는다 — 의도인지 확인
--   pol_bare_auth_fn         auth.uid() 등을 (select …) 로 감싸지 않은 정책            B-01
--   pol_user_metadata        user_metadata 로 권한을 판정하는 정책
--   fn_secdef                public 의 security definer 함수                           B-02
--   fn_secdef_anon_exec      그중 anon 이 실행할 수 있는 것                            B-02
--   fn_no_search_path        set search_path 없는 함수
--   no_pk                    primary key 없는 테이블
--   fk / fk_unindexed        FK 수 / 선두 컬럼 index 없는 FK. 전부 만들 필요는 없다(3.6)
--   ts_without_tz_cols       timestamp(시간대 없음) 컬럼                               B-07
--   views_not_invoker        security_invoker 없는 public 뷰. 소유자 권한으로 RLS 우회
--   public_buckets           공개 Storage 버킷
--   migrations               원격에 기록된 마이그레이션 수. 저장소의 파일 수와 비교한다  B-04
--                            (-1 = 이력 테이블 없음: CLI 로 적용한 적이 없다)
select json_build_object(
  'tables', (select count(*) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'),
  'rls_off', (select count(*) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity),
  'rls_on_no_policy', (select count(*) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relrowsecurity
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
  'policies', (select count(*) from pg_policies where schemaname = 'public'),
  'pol_write_true', (select count(*) from pg_policies where schemaname = 'public' and cmd <> 'SELECT'
      and roles <> array['service_role']::name[]
      and coalesce(qual, 'true') = 'true' and coalesce(with_check, 'true') = 'true'),
  'pol_anon_or_public', (select count(*) from pg_policies where schemaname = 'public' and roles && array['anon', 'public']::name[]),
  'pol_bare_auth_fn', (select count(*) from pg_policies where schemaname = 'public'
      and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'auth\.(uid|jwt|role)\(\)'
      and (coalesce(qual, '') || coalesce(with_check, '')) !~* 'select auth\.(uid|jwt|role)\(\)'),
  'pol_user_metadata', (select count(*) from pg_policies where schemaname = 'public'
      and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'user_metadata'),
  'fn_secdef', (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosecdef),
  'fn_secdef_anon_exec', (select count(*) from pg_proc p where pronamespace = 'public'::regnamespace and prosecdef
      and has_function_privilege('anon', p.oid, 'execute')),
  'fn_no_search_path', (select count(*) from pg_proc p where pronamespace = 'public'::regnamespace and prokind = 'f'
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) x where x like 'search_path=%')),
  'no_pk', (select count(*) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
      and not exists (select 1 from pg_constraint k where k.conrelid = c.oid and k.contype = 'p')),
  'fk', (select count(*) from pg_constraint where contype = 'f' and connamespace = 'public'::regnamespace),
  'fk_unindexed', (select count(*) from pg_constraint k where contype = 'f' and connamespace = 'public'::regnamespace
      and not exists (select 1 from pg_index i where i.indrelid = k.conrelid and i.indkey[0] = k.conkey[1])),
  'ts_without_tz_cols', (select count(*) from information_schema.columns where table_schema = 'public' and data_type = 'timestamp without time zone'),
  'views_not_invoker', (select count(*) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
      and not coalesce(c.reloptions::text, '') ~ 'security_invoker=(true|on)'),
  'public_buckets', (select count(*) from storage.buckets where public),
  'migrations', (select case when to_regclass('supabase_migrations.schema_migrations') is null then -1
      else (xpath('/row/c/text()', query_to_xml('select count(*) as c from supabase_migrations.schema_migrations', false, true, '')))[1]::text::int end)
) as audit;
