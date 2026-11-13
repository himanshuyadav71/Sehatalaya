-- =====================================================================
-- Sehatalaya — register the site owner (run ONCE, from the SQL Editor).
--
-- Before running:
--   1. Supabase → Authentication → Users → "Add user" → create the user
--      hyadavmp41@gmail.com with a strong password ("Auto Confirm User").
--   2. Supabase → Authentication → Sign In / Providers → turn OFF
--      "Allow new users to sign up".
--
-- This stores that user's ID in public.site_owner. Every write policy in
-- the database checks auth.uid() against this row, so no other account
-- (even one that somehow signs in) can change anything.
-- =====================================================================

insert into public.site_owner (id, user_id)
select true, u.id
from auth.users u
where lower(u.email) = 'hyadavmp41@gmail.com'
  and u.email_confirmed_at is not null
on conflict (id) do update set user_id = excluded.user_id;

-- Should return exactly one row. If it returns none, the user above has
-- not been created/confirmed yet.
select o.user_id, u.email
from public.site_owner o
join auth.users u on u.id = o.user_id;
