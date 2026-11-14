# Sehatalay (सेहतालय) — Sehat Ka Ghar

A free, neutral directory of doctors, diagnostic labs and pharmacies for **Dewas, Madhya
Pradesh**, in Hindi and English.

- **Frontend:** React + Vite single-page app, hosted on Netlify (free tier)
- **Database / auth / photo storage:** Supabase (PostgreSQL, Auth, Storage)
- **Security:** only the owner's Supabase user ID can write anything; enforced in the database
  with Row Level Security, not just in the UI

## What is in version 1

| Area | Behaviour |
| --- | --- |
| Doctor directory | 10 per page, Previous / Next + page numbers, specialty filter, organ-based filter, area filter, search by name / area / specialization |
| Sorting | Alphabetical only (name or area). No ratings, reviews, "top doctors" or paid placement |
| Labs and pharmacies | Same directory with search and area filter |
| Chat button | Opens a modal: "Messaging — Coming Soon" / "चैट सुविधा — जल्द आ रही है". No messaging |
| Call button | Opens a modal: "Voice Connect — In Development". No in-app calling. The contact number is shown on the listing, labelled "verified" or "not yet verified" |
| Missing data | Shown as "N/A"; neutral placeholder instead of a photo |
| Admin dashboard | `/admin` — add / edit / remove providers, approve drafts, upload authorised photos, manage specialties, verify information, website settings, CSV import |
| Publishing | Every record starts as a draft. Only the owner's approval publishes it |
| AdSense | Wired in but off. Nothing loads until the owner enables it in Admin → Settings |
| Listings | Free for all providers |

## Setup

### 1. Supabase

1. Create a project at https://supabase.com (free tier).
2. **SQL Editor** → run, in order:
   1. `supabase/migrations/001_schema.sql` — tables, permissions, photo bucket
   2. `supabase/migrations/002_seed.sql` — specialties and default settings (no providers)
3. **Authentication → Users → Add user**: create `hyadavmp41@gmail.com` with a strong
   password and tick *Auto Confirm User*.
4. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up".
5. **SQL Editor** → run `supabase/migrations/003_claim_owner.sql`. It must return one row.
   This stores the owner's user ID; every write policy checks against it.
6. **Project Settings → API**: copy the *Project URL* and the *anon public* key.

Never put the `service_role` key in this project or in Netlify.

### 2. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev                  # http://localhost:5173
```

### 3. GitHub

```bash
git add .
git commit -m "Sehatalay v1"
git branch -M main
git remote add origin https://github.com/himanshuyadav71/sehatalaya.git
git push -u origin main
```

(Create the empty `sehatalaya` repository on GitHub first.)

### 4. Netlify

1. **Add new site → Import an existing project** → pick the `sehatalaya` repository.
2. Build settings are read from `netlify.toml` (`npm run build`, publish `dist`).
3. **Site configuration → Environment variables** — add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OWNER_EMAIL` (optional; only pre-fills the login form)
4. Deploy. Then in Supabase → **Authentication → URL Configuration**, set *Site URL* to the
   Netlify address.

### 5. Add providers

Sign in at `/admin/login`, then follow [docs/RESEARCH_WORKFLOW.md](docs/RESEARCH_WORKFLOW.md).
A first batch of researched **draft** records is in
`data/research/dewas_providers_draft.csv` — import it from Admin → Import CSV, then check and
approve each record.

## How owner-only access is enforced

- `public.site_owner` holds one row: the owner's Supabase Auth user ID. The API cannot write
  to it; it is set once from the SQL Editor.
- `public.is_owner()` returns true only when `auth.uid()` matches that row.
- RLS policies on `providers`, `specialties`, `site_settings` and the `provider-photos`
  storage bucket allow insert / update / delete only when `is_owner()` is true.
- Visitors cannot read the `providers` table at all. They read the `public_providers` view,
  which returns only published rows and only public columns. Research notes, verification
  notes and unverified phone numbers never leave the database.
- Database constraints back up the rules: a doctor cannot be marked "Verified" unless the
  registration is verified; a photo cannot be attached without the authorisation flag.

The `/admin` screens hide themselves from non-owners, but that is a convenience. The
protection is the database.

## Turning on AdSense (after Google approves the site)

1. Admin → Settings → enter the publisher ID (`ca-pub-…`) and tick *Enable AdSense*.
2. Rename `public/ads.txt.example` to `public/ads.txt`, put your publisher ID in it, redeploy.

## Project layout

```
src/pages/            public pages (Home, Directory, ProviderDetail, About)
src/pages/admin/      owner dashboard (Listings, ProviderForm, ImportCsv, Specialties, Settings)
src/components/       shared UI (cards, pagination, modals, ad slot)
src/lib/              Supabase client, auth, translations, CSV validation
supabase/migrations/  schema, seed data, owner registration
supabase/seed/        draft provider SQL generated from the research CSV
data/research/        researched draft CSV files
scripts/              csv-to-sql converter
docs/                 research workflow
```
