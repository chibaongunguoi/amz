--
-- PostgreSQL database dump
--

\restrict msbwYedHSIHNU3nhLSwiTds0GA1i7iZHoePEqttsi728fscl40gK4tJeCsgxQtg

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

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
-- Name: collection_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_nodes (
    collection text NOT NULL,
    node_path text NOT NULL,
    parent_path text,
    field_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    node_type text NOT NULL,
    text_value text,
    number_value numeric,
    boolean_value boolean,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT collection_nodes_node_type_check CHECK ((node_type = ANY (ARRAY['object'::text, 'array'::text, 'string'::text, 'number'::text, 'boolean'::text, 'null'::text])))
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id text NOT NULL,
    title text,
    category_id text,
    category_slug text,
    status text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text,
    date_text text,
    published_at timestamp with time zone,
    created_at timestamp with time zone,
    content text,
    excerpt text,
    thumbnail text,
    featured_image text,
    author_id text,
    author_name text,
    author_avatar text,
    author_bio text,
    category text,
    category_name text,
    views integer DEFAULT 0 NOT NULL,
    reading_time integer DEFAULT 0 NOT NULL,
    meta_description text,
    meta_keywords text[] DEFAULT ARRAY[]::text[] NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[] NOT NULL,
    related_post_ids text[] DEFAULT ARRAY[]::text[] NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    pinned boolean DEFAULT false NOT NULL
);


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    product_id text NOT NULL,
    sort_order integer NOT NULL,
    url text NOT NULL,
    alt text,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_variant_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variant_images (
    product_id text NOT NULL,
    variant_key text NOT NULL,
    sort_order integer NOT NULL,
    url text NOT NULL,
    alt text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    product_id text NOT NULL,
    variant_key text NOT NULL,
    variant_id text,
    sku text,
    name text,
    color text,
    condition_label text,
    price_for_sale numeric,
    price_default numeric,
    sale_percent numeric,
    inventory integer DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    collection text NOT NULL,
    name text,
    brand text,
    category text,
    sku text,
    status text,
    price_for_sale numeric,
    price_default numeric,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ma_san_pham text,
    product_type text,
    primary_color text,
    condition_label text,
    sale_percent numeric,
    is_best_seller boolean DEFAULT false NOT NULL,
    description text,
    table_info text,
    video_url text,
    post_id text
);


--
-- Name: collection_nodes collection_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_nodes
    ADD CONSTRAINT collection_nodes_pkey PRIMARY KEY (collection, node_path);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (product_id, sort_order);


--
-- Name: product_variant_images product_variant_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variant_images
    ADD CONSTRAINT product_variant_images_pkey PRIMARY KEY (product_id, variant_key, sort_order);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (product_id, variant_key);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: collection_nodes_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_nodes_parent_idx ON public.collection_nodes USING btree (collection, parent_path, sort_order);


--
-- Name: posts_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_category_idx ON public.posts USING btree (category_id, category_slug);


--
-- Name: posts_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_slug_idx ON public.posts USING btree (slug);


--
-- Name: posts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_status_idx ON public.posts USING btree (status);


--
-- Name: product_images_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_images_product_idx ON public.product_images USING btree (product_id);


--
-- Name: product_variant_images_variant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_variant_images_variant_idx ON public.product_variant_images USING btree (product_id, variant_key);


--
-- Name: product_variants_color_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_variants_color_idx ON public.product_variants USING btree (color);


--
-- Name: product_variants_condition_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_variants_condition_idx ON public.product_variants USING btree (condition_label);


--
-- Name: product_variants_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_variants_product_idx ON public.product_variants USING btree (product_id);


--
-- Name: product_variants_sku_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_variants_sku_idx ON public.product_variants USING btree (sku);


--
-- Name: products_brand_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_brand_idx ON public.products USING btree (brand);


--
-- Name: products_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_category_idx ON public.products USING btree (category);


--
-- Name: products_collection_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_collection_idx ON public.products USING btree (collection);


--
-- Name: products_is_best_seller_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_is_best_seller_idx ON public.products USING btree (is_best_seller);


--
-- Name: products_ma_san_pham_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_ma_san_pham_idx ON public.products USING btree (ma_san_pham);


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_variant_images product_variant_images_product_id_variant_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variant_images
    ADD CONSTRAINT product_variant_images_product_id_variant_key_fkey FOREIGN KEY (product_id, variant_key) REFERENCES public.product_variants(product_id, variant_key) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict msbwYedHSIHNU3nhLSwiTds0GA1i7iZHoePEqttsi728fscl40gK4tJeCsgxQtg

