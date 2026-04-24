--
-- PostgreSQL database dump
--

\restrict 7rMFpkiN6CzvW1weRMgZnL58CEW0geBKV177rRGjukO4hT1Fh39J87LF9zcphpX

-- Dumped from database version 17.6 (Debian 17.6-2.pgdg13+1)
-- Dumped by pg_dump version 18.0

-- Started on 2026-04-24 10:49:44

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 16396)
-- Name: news_sense_db_main; Type: SCHEMA; Schema: -; Owner: news_sense_master
--

CREATE SCHEMA news_sense_db_main;


ALTER SCHEMA news_sense_db_main OWNER TO news_sense_master;

--
-- TOC entry 3493 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA news_sense_db_main; Type: COMMENT; Schema: -; Owner: news_sense_master
--

COMMENT ON SCHEMA news_sense_db_main IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16408)
-- Name: articles; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.articles (
    title text NOT NULL,
    original_link text NOT NULL,
    description text,
    pub_date timestamp with time zone NOT NULL,
    fetch_id text NOT NULL,
    media_name text,
    id text NOT NULL
);


ALTER TABLE news_sense_db_main.articles OWNER TO news_sense_master;

--
-- TOC entry 220 (class 1259 OID 16413)
-- Name: fetch_logs; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.fetch_logs (
    id text NOT NULL,
    fetch_date date NOT NULL,
    keyword text NOT NULL,
    article_type text NOT NULL,
    count_unique_articles integer NOT NULL,
    notified boolean DEFAULT false NOT NULL
);


ALTER TABLE news_sense_db_main.fetch_logs OWNER TO news_sense_master;

--
-- TOC entry 221 (class 1259 OID 16418)
-- Name: media_names; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.media_names (
    domain text NOT NULL,
    name text
);


ALTER TABLE news_sense_db_main.media_names OWNER TO news_sense_master;

--
-- TOC entry 222 (class 1259 OID 16428)
-- Name: notificators; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.notificators (
    name text NOT NULL,
    activated boolean DEFAULT false NOT NULL,
    id uuid DEFAULT news_sense_db_main.uuid_generate_v4() NOT NULL,
    channel_type text NOT NULL,
    channel_api_url text NOT NULL,
    channel_api_key text
);


ALTER TABLE news_sense_db_main.notificators OWNER TO news_sense_master;

--
-- TOC entry 227 (class 1259 OID 82027)
-- Name: push_subscription; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.push_subscription (
    endpoint text NOT NULL,
    p256dh_key text NOT NULL,
    auth_key text NOT NULL,
    activated boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE news_sense_db_main.push_subscription OWNER TO news_sense_master;

--
-- TOC entry 223 (class 1259 OID 16435)
-- Name: schedules; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.schedules (
    start integer NOT NULL,
    "end" integer NOT NULL,
    "interval" integer NOT NULL,
    id uuid DEFAULT news_sense_db_main.uuid_generate_v4() NOT NULL,
    day integer NOT NULL,
    scrapper_id uuid,
    notificator_id uuid,
    CONSTRAINT "fk check" CHECK ((((scrapper_id IS NOT NULL) AND (notificator_id IS NULL)) OR ((scrapper_id IS NULL) AND (notificator_id IS NOT NULL))))
);


ALTER TABLE news_sense_db_main.schedules OWNER TO news_sense_master;

--
-- TOC entry 224 (class 1259 OID 16440)
-- Name: scrappers; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.scrappers (
    scrapper_name text NOT NULL,
    type text NOT NULL,
    activated boolean DEFAULT false NOT NULL,
    keyword text NOT NULL,
    id uuid DEFAULT news_sense_db_main.uuid_generate_v4() NOT NULL
);


ALTER TABLE news_sense_db_main.scrappers OWNER TO news_sense_master;

--
-- TOC entry 225 (class 1259 OID 16447)
-- Name: users; Type: TABLE; Schema: news_sense_db_main; Owner: news_sense_master
--

CREATE TABLE news_sense_db_main.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    created date DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE news_sense_db_main.users OWNER TO news_sense_master;

--
-- TOC entry 226 (class 1259 OID 16453)
-- Name: users_id_seq; Type: SEQUENCE; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE news_sense_db_main.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME news_sense_db_main.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 9999
    CACHE 1
);


--
-- TOC entry 3325 (class 2606 OID 16455)
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- TOC entry 3327 (class 2606 OID 16457)
-- Name: fetch_logs fetch_logs_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.fetch_logs
    ADD CONSTRAINT fetch_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3329 (class 2606 OID 16459)
-- Name: media_names media_names_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.media_names
    ADD CONSTRAINT media_names_pkey PRIMARY KEY (domain);


--
-- TOC entry 3331 (class 2606 OID 16461)
-- Name: notificators notificators_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.notificators
    ADD CONSTRAINT notificators_pkey PRIMARY KEY (id);


--
-- TOC entry 3339 (class 2606 OID 82035)
-- Name: push_subscription push_subscription_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.push_subscription
    ADD CONSTRAINT push_subscription_pkey PRIMARY KEY (endpoint);


--
-- TOC entry 3333 (class 2606 OID 16465)
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id, day);


--
-- TOC entry 3335 (class 2606 OID 16467)
-- Name: scrappers scrappers_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.scrappers
    ADD CONSTRAINT scrappers_pkey PRIMARY KEY (id);


--
-- TOC entry 3337 (class 2606 OID 16469)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3340 (class 2606 OID 16470)
-- Name: articles fetch_id_reference; Type: FK CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.articles
    ADD CONSTRAINT fetch_id_reference FOREIGN KEY (fetch_id) REFERENCES news_sense_db_main.fetch_logs(id) ON DELETE CASCADE NOT VALID;


--
-- TOC entry 3341 (class 2606 OID 16480)
-- Name: schedules notificator_id_binding; Type: FK CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.schedules
    ADD CONSTRAINT notificator_id_binding FOREIGN KEY (notificator_id) REFERENCES news_sense_db_main.notificators(id) ON DELETE CASCADE;


--
-- TOC entry 3342 (class 2606 OID 16485)
-- Name: schedules scrapper_id_binding; Type: FK CONSTRAINT; Schema: news_sense_db_main; Owner: news_sense_master
--

ALTER TABLE ONLY news_sense_db_main.schedules
    ADD CONSTRAINT scrapper_id_binding FOREIGN KEY (scrapper_id) REFERENCES news_sense_db_main.scrappers(id) ON DELETE CASCADE;


-- Completed on 2026-04-24 10:49:44

--
-- PostgreSQL database dump complete
--

\unrestrict 7rMFpkiN6CzvW1weRMgZnL58CEW0geBKV177rRGjukO4hT1Fh39J87LF9zcphpX

