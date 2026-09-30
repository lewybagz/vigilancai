-- Vigilancai initial schema
-- Run with: supabase db push   (or paste into the SQL editor)

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type severity as enum ('medium', 'high', 'critical');
create type change_status as enum ('published', 'needs_review', 'handled', 'dismissed');
create type change_category as enum (
  'permit_fee', 'material_price', 'licensing', 'code_requirement', 'supplier_terms', 'other'
);
create type number_kind as enum ('dollar', 'percent', 'date', 'tag');
create type source_kind as enum ('jurisdiction', 'supplier', 'manufacturer', 'licensing', 'code');
create type source_cadence as enum ('hourly', 'daily', 'weekly');
create type source_status as enum ('pending', 'ok', 'error');
create type trade_type as enum ('roofing', 'hvac', 'gc');
create type briefing_cadence as enum ('daily', 'weekly');
create type severity_threshold as enum ('critical', 'critical_high', 'all');
create type plan_tier as enum ('starter', 'pro');
create type guide_status as enum ('draft', 'published', 'archived');

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  business_name text,
  trade trade_type not null default 'roofing',
  service_area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cadence briefing_cadence not null default 'weekly',
  delivery_time time not null default '06:30',
  timezone text not null default 'America/Phoenix',
  delivery_channel text not null default 'email',
  threshold severity_threshold not null default 'critical_high',
  in_app_history_sync boolean not null default true,
  last_briefing_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table alert_recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now(),
  unique (user_id, email)
);

-- ---------- sources ----------
create table sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind source_kind not null,
  url text not null,
  cadence source_cadence not null default 'daily',
  css_selector text,
  snoozed_until timestamptz,
  status source_status not null default 'pending',
  last_error text,
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  created_at timestamptz not null default now()
);
create index sources_user_idx on sources(user_id);

create table source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  content_hash text not null,
  content_text text not null,
  fetched_at timestamptz not null default now()
);
create index source_snapshots_source_idx on source_snapshots(source_id, fetched_at desc);

-- ---------- changes ----------
create table changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  source_name text not null,
  headline text not null,
  summary text not null,
  category change_category not null default 'other',
  severity severity not null,
  number_display text,
  number_kind number_kind not null default 'tag',
  effective_label text,
  effective_date date,
  recommended_action text not null,
  action_detail text,
  source_excerpt text,
  diff_before text,
  diff_after text,
  status change_status not null default 'published',
  trade_relevance jsonb not null default '{}'::jsonb,
  classification jsonb not null default '{}'::jsonb,
  laya_result jsonb,
  llm_result jsonb,
  alert_sent_at timestamptz,
  detected_at timestamptz not null default now(),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index changes_user_detected_idx on changes(user_id, detected_at desc);
create index changes_user_status_idx on changes(user_id, status);

create table pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome text not null default 'running',
  notes jsonb not null default '{}'::jsonb
);

-- ---------- billing ----------
create table subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan plan_tier,
  status text not null default 'none',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- guides ----------
create table guide_pillars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  primary_keyword text not null,
  meta_description text not null,
  body_markdown text not null,
  hero_image_url text,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  related_pillar_ids uuid[] not null default '{}',
  faq jsonb not null default '[]'::jsonb,
  status guide_status not null default 'draft'
);

create table guide_spokes (
  id uuid primary key default gen_random_uuid(),
  pillar_id uuid not null references guide_pillars(id) on delete cascade,
  slug text not null,
  title text not null,
  primary_keyword text not null,
  meta_description text not null,
  body_markdown text not null,
  is_how_to boolean not null default false,
  how_to_steps jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  faq jsonb not null default '[]'::jsonb,
  status guide_status not null default 'draft',
  unique (pillar_id, slug)
);

-- Redirect records: created whenever a published slug changes.
-- old_path/new_path are full paths under /guides, e.g. /guides/permit-fee-changes/old-slug
create table guide_redirects (
  id uuid primary key default gen_random_uuid(),
  old_path text not null unique,
  new_path text not null,
  changed_at timestamptz not null default now()
);

-- Collapse redirect chains: if A->B exists and B->C is inserted, rewrite A->C.
create or replace function collapse_redirect_chain() returns trigger as $$
begin
  update guide_redirects set new_path = new.new_path where new_path = new.old_path;
  return new;
end;
$$ language plpgsql;
create trigger guide_redirects_collapse after insert on guide_redirects
  for each row execute function collapse_redirect_chain();

-- Auto-record a redirect when a published pillar or spoke slug changes.
create or replace function pillar_slug_redirect() returns trigger as $$
begin
  if old.slug <> new.slug and old.status = 'published' then
    insert into guide_redirects (old_path, new_path)
      values ('/guides/' || old.slug, '/guides/' || new.slug)
      on conflict (old_path) do update set new_path = excluded.new_path, changed_at = now();
    -- spokes under the pillar move with it
    insert into guide_redirects (old_path, new_path)
      select '/guides/' || old.slug || '/' || s.slug, '/guides/' || new.slug || '/' || s.slug
      from guide_spokes s where s.pillar_id = new.id
      on conflict (old_path) do update set new_path = excluded.new_path, changed_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
create trigger guide_pillars_slug before update on guide_pillars
  for each row execute function pillar_slug_redirect();

create or replace function spoke_slug_redirect() returns trigger as $$
declare pslug text;
begin
  select slug into pslug from guide_pillars where id = new.pillar_id;
  if old.slug <> new.slug and old.status = 'published' then
    insert into guide_redirects (old_path, new_path)
      values ('/guides/' || pslug || '/' || old.slug, '/guides/' || pslug || '/' || new.slug)
      on conflict (old_path) do update set new_path = excluded.new_path, changed_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
create trigger guide_spokes_slug before update on guide_spokes
  for each row execute function spoke_slug_redirect();

-- ---------- new-user bootstrap ----------
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email, first_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)));
  insert into user_settings (user_id) values (new.id);
  insert into subscriptions (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- row level security ----------
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table alert_recipients enable row level security;
alter table sources enable row level security;
alter table source_snapshots enable row level security;
alter table changes enable row level security;
alter table pipeline_runs enable row level security;
alter table subscriptions enable row level security;
alter table guide_pillars enable row level security;
alter table guide_spokes enable row level security;
alter table guide_redirects enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own settings" on user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recipients" on alert_recipients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sources" on sources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own snapshots" on source_snapshots for select
  using (exists (select 1 from sources s where s.id = source_id and s.user_id = auth.uid()));
create policy "own changes" on changes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own runs" on pipeline_runs for select
  using (exists (select 1 from sources s where s.id = source_id and s.user_id = auth.uid()));
create policy "own subscription" on subscriptions for select using (auth.uid() = user_id);

-- Guides are public so search engines can crawl them without a session.
create policy "public published pillars" on guide_pillars for select using (status = 'published');
create policy "public published spokes" on guide_spokes for select using (status = 'published');
create policy "public redirects" on guide_redirects for select using (true);
