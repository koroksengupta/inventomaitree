# Project: Inventory Keeper (working name) – shared inventory for a Stuttgart cultural e.V.

## 1. Context
A volunteer-run e.V. in Stuttgart organizes events (Durga Pujo, Diwali, New Year) and takes part in city fests (e.g. Aalen), selling food. We own many physical items: cooking tools, lights, water/beer crates, dry goods (rice, dal, spices). After each event, items are distributed to members who store them in their Keller. Problem: nobody has a central view of who holds what, and consumables deplete.

Goal: a small, mobile-first, invite-only web app where every member can see all items, who holds them, how many are left, and a photo. Users are non-technical volunteers; many use phones. UI language: English (structure strings so German can be added later).

Builder is a hobby developer using Claude Code. Prefer free/low-cost services, minimal moving parts, and simple code over clever code.

## 2. Tech stack (decided)
- Front end: Vite + React + TypeScript + Tailwind, built as a static PWA (installable on phones). Deployable to GitHub Pages or Cloudflare Pages.
- Backend: Supabase free tier (Postgres, Auth, Storage). No custom server.
- Auth: email magic link. Invite-only: a user may sign in only if their email is in an `allowed_members` table. Roles: `admin` (committee), `member`.
- Security: Row Level Security on every table. Only authenticated allowed members can read; members can edit items they hold; admins can edit anything and manage members.
- NOT Google Sheets as database. Provide an "Export CSV" button (all items, with holder and quantity) so the committee can open it in Sheets.

## 3. Data model
- `members`: id (auth uid), name, email, phone (optional), role, active
- `items`: id, name, category, description, unit (pcs, kg, L, crates, packs), kind (`equipment` | `consumable`), quantity_total, low_stock_threshold (nullable, consumables only), expiry_date (nullable), notes, created_by, created_at, archived (bool)
- `item_photos`: id, item_id, storage_path, created_at (max 3 photos per item)
- `holdings`: id, item_id, member_id, quantity, location_note (e.g. "Keller, blue shelf"), last_confirmed_at. One row per (item, member). Sum of holdings = item total.
- `movements` (append-only log; never edit or delete): id, item_id, type (`add` | `use` | `transfer` | `adjust` | `lost`), quantity, from_member, to_member, event_id (nullable), note, created_by, created_at
- `events`: id, name (e.g. "Diwali 2026"), date, location
- `categories`: seeded list: Cooking tools, Serving and crockery, Lighting and electrical, Decor, Drinks, Dry goods and spices, Tents and furniture, Misc

Quantities are derived from movements and holdings. Do not let the UI overwrite a number silently; every change creates a movement so history is traceable.

## 4. Core features (MVP)
1. **Item list**: card grid with photo thumbnail, name, total quantity, who holds it (avatars/names), low-stock badge. Search, filter by category, holder, kind, "low stock", "needs confirmation".
2. **Add item in under 30 seconds on a phone**: take/choose photo, name, category, quantity, unit, who holds it (defaults to me). Everything else optional.
3. **Photos**: compress client-side (max ~1280px, JPEG ~0.7, target <300 KB) before upload to a private Storage bucket; show thumbnails via signed URLs. Keep storage within the free tier.
4. **Item detail**: photos, description, holdings table (member, qty, location note, last confirmed), movement history.
5. **Use / consume**: "Used 12 bottles at Aalen fest" -> creates a `use` movement tied to an event, reduces the holder's quantity. Block going below zero.
6. **Transfer**: member A hands X units to member B. B gets a pending request and must accept; this keeps the record honest. Admin can force-transfer.
7. **Post-event redistribution flow**: choose an event, then a checklist "Items used at this event". For each item, record how much came back, who takes it home, and how many were used up. Output: updated holdings.
8. **By-member view**: "What does Priya have in her Keller?" Printable/shareable list, plus a "My items" tab.
9. **Low stock and expiry alerts**: dashboard section for consumables under threshold or expiring within 60 days. No email in MVP; dashboard only.
10. **Admin**: invite/deactivate members, edit categories, manage events, CSV export, archive items.

## 5. Improvements on the original idea (include these)
- Consumables vs equipment: equipment is counted once and moves around; consumables deplete and need thresholds and expiry.
- "Last confirmed" date per holding with a "Still have this" one-tap button. Holdings not confirmed in 12 months show as stale. This is the main defence against the list rotting.
- Event packing list: pick an event, select items, and get a list grouped by holder ("collect from Rahul: 2 gas burners, 1 big pot"). Strong motivation for members to keep data accurate.
- QR labels (phase 2): printable QR per storage crate/item that opens its page.
- Duplicate warning when adding an item with a similar name.

## 6. UX requirements
- Mobile-first, big tap targets, usable one-handed. Works on slow connections; show upload progress.
- Simple language, no jargon. Empty states explain what to do next.
- Optimistic UI is not needed; correctness over speed.
- Accessible contrast, supports dark mode via system setting.

## 7. Non-goals (MVP)
No payments, no sales/accounting, no recipes, no push notifications, no multi-organization support, no native apps.

## 8. Build phases (do one at a time; stop and show me before continuing)
0. Scaffold project, Supabase schema as SQL migration files with RLS policies, seed categories, README with setup steps for a non-expert (create Supabase project, env vars, deploy).
1. Auth with allowlist, roles, member admin.
2. Items CRUD with photo upload and compression, list/search/filter.
3. Holdings, movements, use/transfer flows, by-member view.
4. Events, post-event redistribution, packing list.
5. Dashboard alerts, CSV export, PWA install, polish.
Each phase: working app, basic tests for movement logic (quantity can never go negative, transfers conserve totals), and updated README.

## 9. Acceptance criteria
- A non-member email cannot read any data, including photos (verify RLS and private bucket).
- Adding an item with a photo from a phone takes under 30 seconds.
- After any sequence of use/transfer/adjust actions, sum of holdings equals item total and every change appears in history.
- Photos average under 300 KB stored.
- App runs entirely on free tiers; document any limit that could be hit (storage 1 GB, project pause after inactivity) and add a keep-alive suggestion.

## 10. Questions Claude Code should ask me before phase 0
- Approx. number of items and members (to size storage).
- Whether members want to see each other's phone numbers.
- Domain/URL for hosting.
