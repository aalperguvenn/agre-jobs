# Put Agre Jobs online

Two stages. **Stage 1** makes the website public in about 15 minutes (no database needed: the jobs page shows
"İlk ilanlar çok yakında" until jobs exist). **Stage 2** turns on real jobs.

## Stage 1 — website live on Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**.
2. **Add New → Project** → import `aalperguvenn/agre-jobs`.
3. Before clicking Deploy, set:
   - **Root Directory:** `apps/web` (click *Edit* next to it).
   - Framework is detected as **Next.js**; leave build settings as they are.
   - **Environment Variables** (all optional, add what you have):
     | Name | Example | What it does |
     | --- | --- | --- |
     | `NEXT_PUBLIC_SITE_URL` | `https://agrejobs.com` | Used for the sitemap and link previews |
     | `NEXT_PUBLIC_CONTACT_EMAIL` | your contact address | Shown on the İşverenler page ("İlan ver") |
     | `NEXT_PUBLIC_AGRE_HUB_URL` | Agre Hub's website | Footer link |
4. Click **Deploy**. You get a public address like `agre-jobs.vercel.app`.
5. **Your own domain:** Project → Settings → Domains → add `agrejobs.com` (or the one you own) and follow the
   DNS instructions Vercel shows. HTTPS is automatic.

Every pull request gets its own preview link. Previews show clearly labelled sample jobs; the production site never does.

## Stage 2 — real jobs

| Service | Why | Plan to start |
| --- | --- | --- |
| [Supabase](https://supabase.com) | Database (jobs, clicks) and, later, curator login | Free |
| [Meilisearch Cloud](https://www.meilisearch.com/cloud) | Job search with Turkish synonyms | Entry plan |
| [Railway](https://railway.app) | Runs the weekly job worker (`npm run worker`) | Hobby |

1. **Supabase:** create a project → SQL editor → run `packages/db/migrations/001_init.sql`, then `002_seed_sources.sql`.
   Copy the connection string (Settings → Database).
2. **Meilisearch Cloud:** create a project → copy the host URL, the admin key and a search-only key.
3. **Railway:** New project → deploy from GitHub `aalperguvenn/agre-jobs` → start command `npm run worker` →
   add variables `DATABASE_URL`, `MEILI_HOST`, `MEILI_ADMIN_KEY`, plus the digest settings from `.env.example`.
4. **Vercel:** add `DATABASE_URL`, `MEILI_HOST`, `MEILI_SEARCH_KEY`, `SESSION_HASH_SECRET` (any long random text) → Redeploy.
5. **First jobs:** wire curator login (`apps/web/lib/auth.ts`, see README) so the team can use `/tr/curate/add`,
   and switch on company job boards for organizations that agree (README, "Enable a source").

Before charging employers: Careerjet's written OK for weekly server-side pulls, and the lawyer's check on sourcing and the
İŞKUR licence (PRD Section 5).
