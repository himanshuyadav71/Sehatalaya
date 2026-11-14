-- =====================================================================
-- Sehatalay — medicine delivery orders (single partner shop, v1).
-- Customers place and track orders without an account, through the
-- functions below. Only the owner can read or change the orders table.
-- Safe to re-run.
-- =====================================================================

do $$ begin
  create type public.order_status as enum
    ('placed', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  provider_id       uuid references public.providers (id) on delete set null,
  customer_name     text not null,
  phone             text not null,
  address           text not null,
  area              text,
  items             text,
  prescription_path text,
  note              text,
  status            public.order_status not null default 'placed',
  amount            numeric(10, 2) check (amount >= 0),
  shop_note         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  confirmed_at      timestamptz,
  dispatched_at     timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_idx on public.orders (phone, created_at desc);

create or replace function public.orders_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then new.confirmed_at := now(); end if;
    if new.status = 'out_for_delivery' then new.dispatched_at := now(); end if;
    if new.status = 'delivered' then new.delivered_at := now(); end if;
    if new.status = 'cancelled' then new.cancelled_at := now(); end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update
  before update on public.orders
  for each row execute function public.orders_before_update();

-- Owner-only table. Visitors never touch it directly.
alter table public.orders enable row level security;

drop policy if exists "owner manages orders" on public.orders;
create policy "owner manages orders" on public.orders
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

revoke all on public.orders from anon, authenticated;
grant select, update, delete on public.orders to authenticated;

-- Last 10 digits of a phone number.
create or replace function public.norm_phone(p text)
returns text language sql immutable as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10);
$$;

-- ---------- Place an order (public) ----------
create or replace function public.place_order(
  p_name text,
  p_phone text,
  p_address text,
  p_area text,
  p_items text,
  p_note text,
  p_prescription_path text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := public.norm_phone(p_phone);
  v_name text := btrim(coalesce(p_name, ''));
  v_address text := btrim(coalesce(p_address, ''));
  v_items text := nullif(btrim(coalesce(p_items, '')), '');
  v_rx text := nullif(btrim(coalesce(p_prescription_path, '')), '');
  v_code text;
  v_provider uuid;
begin
  if coalesce((select value from site_settings where key = 'delivery_enabled'), 'false'::jsonb)
     <> 'true'::jsonb then
    raise exception 'DELIVERY_CLOSED';
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then raise exception 'BAD_NAME'; end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'BAD_PHONE'; end if;
  if length(v_address) < 8 or length(v_address) > 300 then raise exception 'BAD_ADDRESS'; end if;
  if v_items is null and v_rx is null then raise exception 'NO_ITEMS'; end if;
  if length(coalesce(v_items, '')) > 2000 or length(coalesce(p_note, '')) > 500 then
    raise exception 'TOO_LONG';
  end if;
  if v_rx is not null and v_rx !~ '^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$' then
    raise exception 'BAD_PRESCRIPTION';
  end if;
  -- Basic abuse limit: 5 orders per phone number per day.
  if (select count(*) from orders
      where phone = v_phone and created_at > now() - interval '1 day') >= 5 then
    raise exception 'TOO_MANY';
  end if;

  select (value #>> '{}')::uuid into v_provider
  from site_settings where key = 'delivery_provider_id';

  loop
    v_code := 'SH' || lpad(floor(random() * 1000000)::int::text, 6, '0');
    exit when not exists (select 1 from orders where code = v_code);
  end loop;

  insert into orders (code, provider_id, customer_name, phone, address, area,
                      items, prescription_path, note)
  values (v_code, v_provider, v_name, v_phone, v_address,
          nullif(btrim(coalesce(p_area, '')), ''), v_items, v_rx,
          nullif(btrim(coalesce(p_note, '')), ''));
  return v_code;
end;
$$;

-- ---------- Track an order (public; needs code + phone) ----------
create or replace function public.track_order(p_code text, p_phone text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'code', o.code,
    'status', o.status,
    'customer_name', o.customer_name,
    'area', o.area,
    'items', o.items,
    'has_prescription', o.prescription_path is not null,
    'amount', o.amount,
    'shop_note', o.shop_note,
    'created_at', o.created_at,
    'confirmed_at', o.confirmed_at,
    'dispatched_at', o.dispatched_at,
    'delivered_at', o.delivered_at,
    'cancelled_at', o.cancelled_at
  )
  from orders o
  where o.code = upper(btrim(p_code))
    and o.phone = public.norm_phone(p_phone);
$$;

-- ---------- Cancel (public; only before the shop confirms) ----------
create or replace function public.cancel_order(p_code text, p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update orders set status = 'cancelled'
  where code = upper(btrim(p_code))
    and phone = public.norm_phone(p_phone)
    and status = 'placed';
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.place_order(text, text, text, text, text, text, text) from public;
revoke all on function public.track_order(text, text) from public;
revoke all on function public.cancel_order(text, text) from public;
grant execute on function public.place_order(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.cancel_order(text, text) to anon, authenticated;

-- ---------- Prescription uploads (private bucket) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prescriptions', 'prescriptions', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may upload a prescription; only the owner can view or delete.
drop policy if exists "anyone uploads prescriptions" on storage.objects;
create policy "anyone uploads prescriptions" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'prescriptions');

drop policy if exists "owner reads prescriptions" on storage.objects;
create policy "owner reads prescriptions" on storage.objects
  for select to authenticated
  using (bucket_id = 'prescriptions' and public.is_owner());

drop policy if exists "owner deletes prescriptions" on storage.objects;
create policy "owner deletes prescriptions" on storage.objects
  for delete to authenticated
  using (bucket_id = 'prescriptions' and public.is_owner());

-- ---------- Partner shop: Fayda Medical (details given by the site owner) ----------
insert into public.providers (type, status, name, address, area, phone, source_notes)
select 'pharmacy', 'published', 'Fayda Medical', 'Jawahar Chowk', 'Jawahar Chowk',
       '9106709142',
       'Details provided directly by the site owner on 2026-11-14 (owner phone number). Delivery partner shop.'
where not exists (
  select 1 from public.providers where type = 'pharmacy' and name = 'Fayda Medical'
);

insert into public.site_settings (key, value) values
  ('delivery_enabled', 'true'::jsonb),
  ('delivery_shop_name', '"Fayda Medical"'::jsonb),
  ('delivery_shop_phone', '"9106709142"'::jsonb),
  ('delivery_shop_address', '"Jawahar Chowk, Dewas"'::jsonb),
  ('delivery_provider_id',
   to_jsonb((select id::text from public.providers
             where type = 'pharmacy' and name = 'Fayda Medical' limit 1)))
on conflict (key) do nothing;
