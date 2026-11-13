# Provider research workflow

How real doctors, labs and pharmacies get into Sehatalay. The short version:
**research → draft CSV → import as drafts → owner checks each record → owner approves.**
Nothing reaches the public site without the owner's approval.

## Rules

1. **Real providers only.** Never add a doctor or business you cannot trace to a source.
2. **Never guess.** If a detail is not on the source, leave the cell empty or write `N/A`.
   The site shows it as "N/A".
3. **Permitted sources only:** the provider's own website, official company pages, government
   sites, council/registration directories, and direct confirmation (phone call or visit).
4. **Do not copy from Google Maps.** No business data, reviews, ratings or photos. You may paste
   the *link* to a Maps listing into `maps_url`; nothing else.
5. **Record provenance.** Every row needs `source_url` and `source_checked_on` (YYYY-MM-DD).
6. **Public information goes stale.** Treat every researched detail as unconfirmed until you
   re-check it. Phone numbers are shown publicly only after you tick "Contact number verified".
7. **Photos need permission.** Upload a photo only when the provider has authorised it;
   otherwise the neutral placeholder is used.
8. **No ratings, reviews or rankings.** The product has no such fields on purpose.

## Step by step

1. Add rows to a CSV using the template (Admin → Import CSV → Download CSV template).
2. Import it from Admin → Import CSV. Every row becomes a **draft**; duplicates
   (same type + name + address) are skipped.
3. For each draft (Admin → Listings → Drafts), open **Edit** and:
   - open the source link and compare every field;
   - call the clinic/store to confirm address, timings and phone, then tick
     **Contact number verified**;
   - for doctors, look the registration number up on the council register
     ([NMC Indian Medical Register](https://www.nmc.org.in/information-desk/indian-medical-register/),
     or the state medical / dental / AYUSH council) and only then tick
     **registration checked**; write what you checked under *Verification notes*;
   - tick **Show the public "Verified" badge** only after the above (the database refuses the
     badge for a doctor whose registration is not verified).
4. Click **Approve & publish**. To take a listing down later, use **Unpublish** or **Archive**.

## CSV columns

| Column | Notes |
| --- | --- |
| `type` | `doctor`, `lab` or `pharmacy` (required) |
| `name` | Doctor or business name (required) |
| `name_hi` | Name in Hindi (optional) |
| `specialty_slug` | Doctors only; must match a slug on Admin → Specialties |
| `qualifications` | e.g. `MBBS, MD` |
| `experience_years` | Whole number |
| `registration_number`, `registration_council` | As printed on the source |
| `clinic_name` | Clinic or hospital |
| `address`, `area`, `city`, `state`, `pincode` | `area` drives the area filter |
| `phone` | Public contact number (hidden until verified) |
| `maps_url` | Link to the Google Maps listing only |
| `website_url`, `timings` | Optional |
| `source_url`, `source_checked_on`, `source_notes` | Where and when the data was found |

The CSV cannot set status or any "verified" flag — those are owner actions in the dashboard.

## Files in this repository

- `data/research/dewas_providers_draft.csv` — first batch of researched records (drafts).
- `supabase/seed/dewas_providers_draft.sql` — the same records as SQL (`status = 'draft'`),
  generated with `npm run csv-to-sql -- data/research/dewas_providers_draft.csv`.

Use **either** the CSV importer **or** the SQL file, not both (both skip exact duplicates, but
there is no reason to run both).

## First batch (checked 2026-11-13): what to know

- 9 doctors, 2 labs, 1 pharmacy. All are **unverified drafts**.
- Doctor records come from public practice-platform profiles (Eka Care, MediBuddy), which are
  third-party pages, not council registers. Registration numbers are recorded as shown there
  and have **not** been checked against any council register.
- Two doctor records have a name, specialty and clinic only; everything else is N/A.
- The Metropolis lab row is **low confidence**: the official page blocked automated access, so
  its address and phone came from a search-result snippet. Re-check it by hand.
- The Jan Aushadhi Kendra row comes from a third-party directory; confirm it on the official
  locator at https://janaushadhi.gov.in/.
- `maps_url` is N/A everywhere — add the listing link by hand if you want one.
- Leads not included because the source could not be authenticated: a "Dewas Hospital" page at
  dewas-hospital.vercel.app (AB Road, opp. Power House) naming five doctors. Confirm with the
  hospital directly before adding any of them.
- Official list of government facilities: https://dewas.nic.in/en/public-utility-category/hospitals/
