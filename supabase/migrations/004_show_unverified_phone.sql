-- =====================================================================
-- Sehatalay — show contact numbers even before verification.
-- The public view now exposes the phone number as researched, plus the
-- phone_verified flag, so the site can label it "verified" or
-- "not yet verified" instead of hiding it. Run once in the SQL Editor.
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
