# BUILD PROMPT: Inventory Keeper (paste into Claude Code, or save as BUILD_PROMPT.md and say "follow BUILD_PROMPT.md")

You are my senior developer and guide. I am a hobby developer, not a professional. Explain choices in plain language, keep code simple and well commented, and never assume I know a tool. Go one step at a time.

## Files you must read first
- `SPEC.md` — product spec (features, UX, phases, acceptance criteria)
- `schema.sql` — database schema. **It is already applied in my Supabase project. Do not regenerate or change it.** If you find a bug in it, tell me and propose a separate migration file `migrations/00X_fix.sql` that I run manually.
Where this file and SPEC.md disagree, this file wins. Specifically: items have NO stored `quantity_total`; read totals from the view `items_with_totals`. Quantities change ONLY through the SQL functions (`add_stock`, `use_stock`, `accept_transfer`, `confirm_holding`, `adjust_stock`), never by direct table writes. Sign-ups are left ON in Supabase; a database trigger rejects emails not in `allowed_members`.

## Stack (fixed)
Vite + React + TypeScript + Tailwind, `@supabase/supabase-js`, static PWA, deployed to GitHub Pages. No custom server.

## STEP 0: INTERVIEW ME BEFORE WRITING ANY CODE
Ask these questions **one at a time**, wait for my answer, and use multiple-choice options where possible. After each answer, say in one line how you will use it. For every item I may not know, tell me exactly where to find it.

1. **Supabase Project URL.** Where: Supabase dashboard → Project Settings → API (or "Data API") → Project URL.
2. **Supabase public key** (the `anon` or "publishable" key). Same page. It is safe in the browser because RLS protects data.
3. **GitHub username and repository name** for the app, and whether the repo already exists. Needed for the Pages URL (`https://<user>.github.io/<repo>/`) and the Vite `base` setting. My personal site already uses GitHub Pages, so confirm this will be a separate project repo.
4. **Confirm the first admin.** Ask: "Did you already insert your email into `allowed_members` as admin? Which email?" If not, give me the one-line SQL.
5. **App name** shown in the UI and on the phone home screen (suggest 3 options; default "Inventory Keeper").
6. **Organization name** to show on the login page.
7. **Approximate sizes:** number of members, number of items expected in year one (affects pagination and storage warnings).
8. **Phone numbers:** should members see each other's phone numbers? (yes / admins only / not collected)
9. **UI language:** English only for now, or English + German switch? (Build i18n structure either way.)
10. **Email sending (SMTP).** Explain in two sentences why Supabase's built-in email is rate-limited and will break login around events. Ask which free provider I prefer (Resend, Brevo, other) and walk me through setup and the Supabase SMTP settings when we reach phase 1.
11. **Events to pre-create** (e.g. Durga Pujo, Diwali, New Year, Aalen fest) with dates if known.
12. **Item categories:** show the 8 seeded categories; ask what to rename or add.
13. **Consumable defaults:** typical units and low-stock thresholds for items like water, beer crates, rice, dal (so the add-item form has sensible defaults).

### Secrets rules (follow strictly)
- **Never ask me to paste** the database password, the `service_role` key, or any secret into chat. If you ever need one, stop and tell me to put it in a local file instead.
- Only the Project URL and public key go into `.env.local` (git-ignored) as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Create `.env.example` with placeholders and add `.env*` to `.gitignore` before the first commit.
- For GitHub Actions, tell me to add them as repository secrets and show me where (Settings → Secrets and variables → Actions).

## Dashboard tasks you must walk me through (I do these by clicking; you give exact steps)
- Supabase → Authentication → URL Configuration: set Site URL to the GitHub Pages URL; add `http://localhost:5173` as an extra redirect URL.
- Supabase → Authentication → SMTP: configure custom SMTP after step 10.
- Supabase → Storage: confirm bucket `item-photos` exists and is **private**.
- GitHub → Settings → Pages: set source to GitHub Actions.
After each, ask me to confirm it is done before moving on.

## Known pitfalls to handle deliberately
- GitHub Pages has no SPA fallback: use HashRouter (or a 404.html redirect) so deep links and refresh work.
- Magic-link login with hash routing can collide with Supabase's token handling: use the PKCE flow, handle the returned code on app start, and test the full login round trip on the deployed URL, not only on localhost.
- Handle the "email not on allowlist" signup error with a friendly message: "This email hasn't been invited. Ask a committee admin."
- Signed URLs for private photos expire: fetch them on demand and cache briefly.
- Compress photos in the browser before upload (max ~1280px longest side, JPEG quality ~0.7, target under 300 KB), strip EXIF location data, max 3 photos per item.
- Free-tier projects pause after about a week of inactivity. Add migration `migrations/002_ping.sql` creating `public.ping()` (returns `now()`, executable by `anon`), and a weekly GitHub Action that calls it via the REST API. Tell me to run the SQL and add the secrets. Note honestly that I should verify in Supabase's current docs that this prevents the pause.

## Phases (stop after each, show me what to click to verify, wait for "go")
**Phase 0** Scaffold, folder structure, `.env.example`, README for a non-expert, Supabase client, connection test page showing "Connected" and the number of categories (will be 0 until logged in; explain why).
**Phase 1** Login via magic link, member profile (name, phone per my answer), admin screen to invite/deactivate members (adds rows to `allowed_members`), SMTP setup walk-through.
**Phase 2** Items: list (cards, search, filters), add-item flow optimized for phone (under 30 seconds), photo compression and upload, item detail.
**Phase 3** Holdings and movements: add stock, use stock, transfer request and accept/decline, "Still have this" button, by-member view, "My items" tab, movement history on item detail.
**Phase 4** Events, post-event redistribution checklist, event packing list grouped by holder.
**Phase 5** Dashboard (low stock, expiring in 60 days, stale holdings over 12 months, pending transfers for me), CSV export, PWA install, keep-alive Action, GitHub Pages deploy workflow, final polish.

## Quality rules
- Use the functions for every quantity change; show friendly errors from them ("you do not hold enough of this item").
- Write automated tests for the quantity logic (can't go negative; a transfer conserves the total; every change creates a movement). These can run against a separate Supabase test project or local Supabase; ask me which I prefer in Phase 3.
- Security test I can perform myself at the end of Phase 1 and Phase 2: sign in with an email NOT on the allowlist and confirm no data and no photos are visible. Give me exact steps.
- Mobile first: test layouts at 375px width. Large tap targets. Dark mode follows system.
- Commit after every working step with a clear message. Do not push secrets.
- If you are unsure about a requirement, ask me instead of guessing.

## Start now
Greet me briefly, confirm you have read `SPEC.md` and `schema.sql`, and begin STEP 0 with question 1.
