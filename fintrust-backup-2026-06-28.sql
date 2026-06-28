--
-- PostgreSQL database dump
--

\restrict rCcszdbqUA5xoLzgvspqXeEfhaAFI8bPurhlyhKudDemVyAfjEU9crQAGrsSjyD

-- Dumped from database version 13.23 (Debian 13.23-1.pgdg13+1)
-- Dumped by pg_dump version 13.23 (Debian 13.23-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: fintrustuser
--

CREATE TABLE public.accounts (
    id uuid NOT NULL,
    customer_name character varying(100) NOT NULL,
    account_number character varying(20) NOT NULL,
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.accounts OWNER TO fintrustuser;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: fintrustuser
--

CREATE TABLE public.transactions (
    id uuid NOT NULL,
    account_id uuid,
    type character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transactions OWNER TO fintrustuser;

--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: fintrustuser
--

COPY public.accounts (id, customer_name, account_number, balance, status, created_at) FROM stdin;
2aec14c6-cf22-4e9c-a761-670be96d4ccd	Amina Bello	FTB-100001	250000.00	ACTIVE	2026-06-26 21:50:03.022844
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: fintrustuser
--

COPY public.transactions (id, account_id, type, amount, description, created_at) FROM stdin;
9cf87ff0-a25d-4b2b-97e5-34df5e79e382	2aec14c6-cf22-4e9c-a761-670be96d4ccd	CREDIT	250000.00	Initial demo deposit	2026-06-26 21:50:03.030035
\.


--
-- Name: accounts accounts_account_number_key; Type: CONSTRAINT; Schema: public; Owner: fintrustuser
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_account_number_key UNIQUE (account_number);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: fintrustuser
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: fintrustuser
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fintrustuser
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rCcszdbqUA5xoLzgvspqXeEfhaAFI8bPurhlyhKudDemVyAfjEU9crQAGrsSjyD

