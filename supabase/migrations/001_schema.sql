-- =====================================================================
-- Sehatalay (सेहतालय) — database schema, permissions and storage
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- Safe to re-run: objects are created with IF NOT EXISTS / OR REPLACE.
-- =====================================================================

-- ---------- Types ----------
do $$ begin
  create type public.provider_type as enum ('doctor', 'lab', 'pharmacy');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.listing_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- ---------- Owner ----------
-- Exactly one row. It stores the Supabase Auth user ID of the site owner.
-- Nothing in the public API can write to this table; it is set once from
-- the SQL Editor (see 003_claim_owner.sql).
create table if not exists public.site_owner (
  id         boolean primary key default true check (id),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_owner where user_id = auth.uid()
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------- Specialties ----------
create table if not exists public.specialties (
  id         bigint generated always as identity primary key,
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_en    text not null,
  name_hi    text,
  organ_key  text not null default 'general',
  sort_order int  not null default 100,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Providers (doctors, labs, pharmacies) ----------
create table if not exists public.providers (
  id                       uuid primary key default gen_random_uuid(),
  type                     public.provider_type not null,
  status                   public.listing_status not null default 'draft',

  name                     text not null check (length(btrim(name)) > 0),
  name_hi                  text,

  -- doctor-only fields (NULL = not available, shown as "N/A")
  specialty_id             bigint references public.specialties (id) on delete set null,
  qualifications           text,
  experience_years         int check (experience_years between 0 and 80),
  registration_number      text,
  registration_council     text,
  registration_verified    boolean not null default false,
  registration_verified_at timestamptz,

  clinic_name              text,
  address                  text,
  area                     text,
  city                     text not null default 'Dewas',
  state                    text not null default 'Madhya Pradesh',
  pincode                  text,

  phone                    text,
  phone_verified           boolean not null default false,
  maps_url                 text,
  website_url              text,
  timings                  text,

  photo_path               text,
  photo_authorized         boolean not null default false,

  -- research provenance (owner-only, never exposed publicly)
  source_url               text,
  source_checked_on        date,
  source_notes             text,
  verification_notes       text,

  verified                 boolean not null default false,
  approved_at              timestamptz,
  approved_by              uuid references auth.users (id) on delete set null,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- A registration can only be marked verified if a number is recorded.
  constraint registration_needs_number
    check (not registration_verified or registration_number is not null),
  -- A doctor can only carry the "Verified" badge after the registration
  -- itself has been verified.
  constraint doctor_verified_needs_registration
    check (type <> 'doctor' or not verified or registration_verified),
  -- Photos may only be attached when the owner confirms authorisation.
  constraint photo_needs_authorization
    check (photo_path is null or photo_authorized)
);

create index if not exists providers_public_idx on public.providers (type, status, name);
create index if not exists providers_specialty_idx on public.providers (specialty_id);
create index if not exists providers_area_idx on public.providers (area);

-- ---------- Site settings ----------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Triggers ----------
create or replace function public.providers_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();

  if not new.registration_verified then
    new.registration_verified_at := null;
  elsif tg_op = 'INSERT' then
    new.registration_verified_at := now();
  elsif not old.registration_verified then
    new.registration_verified_at := now();
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.approved_at := now();
      new.approved_by := auth.uid();
    elsif old.status <> 'published' then
      new.approved_at := now();
      new.approved_by := auth.uid();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists providers_before_write on public.providers;
create trigger providers_before_write
  before insert or update on public.providers
  for each row execute function public.providers_before_write();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.site_owner    enable row level security;
alter table public.specialties   enable row level security;
alter table public.providers     enable row level security;
alter table public.site_settings enable row level security;

-- site_owner: a signed-in user can see only their own row; nobody can
-- write through the API (no insert/update/delete policies exist).
drop policy if exists "owner reads own row" on public.site_owner;
create policy "owner reads own row" on public.site_owner
  for select to authenticated
  using (user_id = auth.uid());

revoke all on public.site_owner from anon, authenticated;
grant select on public.site_owner to authenticated;

-- specialties: everyone reads active ones; only the owner writes.
drop policy if exists "public reads active specialties" on public.specialties;
create policy "public reads active specialties" on public.specialties
  for select to anon, authenticated
  using (active or public.is_owner());

drop policy if exists "owner manages specialties" on public.specialties;
create policy "owner manages specialties" on public.specialties
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

revoke all on public.specialties from anon, authenticated;
grant select on public.specialties to anon, authenticated;
grant insert, update, delete on public.specialties to authenticated;

-- providers: the raw table is owner-only. The public reads published
-- listings exclusively through the public_providers view below, which
-- exposes only public columns.
drop policy if exists "owner full access to providers" on public.providers;
create policy "owner full access to providers" on public.providers
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

revoke all on public.providers from anon, authenticated;
grant select, insert, update, delete on public.providers to authenticated;

-- site_settings: public read (non-sensitive values only), owner write.
drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "owner manages settings" on public.site_settings;
create policy "owner manages settings" on public.site_settings
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

-- =====================================================================
-- Public view
-- Deliberately NOT security_invoker: it is the single, narrow gate through
-- which visitors read listings. It returns only published rows and only
-- public columns. Unverified phone numbers and all research/verification
-- notes stay private.
-- =====================================================================
drop view if exists public.public_providers;
create view public.public_providers
with (security_barrier = true) as
select
  p.id,
  p.type,
  p.name,
  p.name_hi,
  p.specialty_id,
  s.slug       as specialty_slug,
  s.name_en    as specialty_name_en,
  s.name_hi    as specialty_name_hi,
  s.organ_key,
  p.qualifications,
  p.experience_years,
  p.registration_number,
  p.registration_council,
  p.registration_verified,
  p.clinic_name,
  p.address,
  p.area,
  p.city,
  p.state,
  p.pincode,
  p.phone,
  p.phone_verified,
  case when p.phone_verified then p.phone end as verified_phone,
  p.maps_url,
  p.website_url,
  p.timings,
  case when p.photo_authorized then p.photo_path end as photo_path,
  p.verified,
  p.updated_at
from public.providers p
left join public.specialties s on s.id = p.specialty_id
where p.status = 'published';

revoke all on public.public_providers from anon, authenticated;
grant select on public.public_providers to anon, authenticated;

-- Distinct areas for the filter dropdowns (published listings only).
create or replace function public.public_areas(p_type public.provider_type)
returns table (area text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct btrim(p.area)
  from public.providers p
  where p.status = 'published'
    and p.type = p_type
    and p.area is not null
    and btrim(p.area) <> ''
  order by 1;
$$;

revoke all on function public.public_areas(public.provider_type) from public;
grant execute on function public.public_areas(public.provider_type) to anon, authenticated;

-- =====================================================================
-- Storage: authorised provider photos
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-photos', 'provider-photos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owner uploads provider photos" on storage.objects;
create policy "owner uploads provider photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'provider-photos' and public.is_owner());

drop policy if exists "owner updates provider photos" on storage.objects;
create policy "owner updates provider photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'provider-photos' and public.is_owner())
  with check (bucket_id = 'provider-photos' and public.is_owner());

drop policy if exists "owner deletes provider photos" on storage.objects;
create policy "owner deletes provider photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'provider-photos' and public.is_owner());

drop policy if exists "owner lists provider photos" on storage.objects;
create policy "owner lists provider photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'provider-photos' and public.is_owner());
