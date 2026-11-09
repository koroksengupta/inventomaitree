# Decisions from the STEP 0 interview (2026-11-09)

These override `SPEC.md` where they differ. `BUILD_PROMPT.md` still overrides both on technical rules.

## Project settings
| Setting | Value |
|---|---|
| Supabase Project URL | `https://dudkxqtiekqfajuhjmyn.supabase.co` (goes in `.env.local`, not committed) |
| Supabase public key | publishable key (goes in `.env.local` + GitHub secret, not committed) |
| Repo | `koroksengupta/inventomaitree` (separate from the personal site, no custom domain) |
| App URL | `https://koroksengupta.github.io/inventomaitree/` (Vite `base: '/inventomaitree/'`) |
| First admin | `tellkorok@gmail.com` (already in `allowed_members`) |
| App name | **Maitree Bhandar** (home-screen short name: **Bhandar**) |
| Organization | **Maitree e.V.** |
| Size | under 20 members, under 200 items → load all items at once, filter in the browser |
| Language | English only; all text in `src/i18n/en.ts` |
| Email (SMTP) | decide in Phase 1 (Resend if Maitree owns a domain, otherwise Brevo). Built-in email only for solo testing. |

## Product changes vs SPEC.md
1. **No phone numbers.** Field hidden everywhere. Instead, every member must enter their **real name on first login** (the database pre-fills it with the email prefix).
2. **Adding an item = photo + name + who has it + a +/- counter starting at 1.** "1" means one entry (one bottle, one plate, one pack, one box). No units, no consumable/equipment switch, no low-stock thresholds in the UI. Category is optional.
3. **Anyone can tag another member as the holder.** It takes effect immediately and shows as "please confirm" in that person's *My items* until they tap **Still have this**.
4. **No pre-created events.** Events exist only when a member runs a **post-event update** (e.g. "After Durga Pujo 2026"): a checklist of items showing *who had it → who has it now* and *old qty → new qty*. Any member may run it. Changes apply immediately, are linked to the event, and can be reviewed later as a before/after list.
5. **Categories:** the 8 seeded ones plus **Puja items**, **Sound and stage**, **Paper and disposables**.
6. **Dashboard (Phase 5) consequences:** no low-stock or expiry sections (no thresholds/expiry collected). Instead: *unconfirmed items for me*, *stale holdings (12 months)*, *recent post-event updates*. Transfer requests stay available for ordinary hand-overs between events.

## Database changes needed (separate migrations, run manually; `schema.sql` is not touched)
- `migrations/002_ping.sql`: `public.ping()` for the keep-alive Action.
- `migrations/003_tagging_and_event_updates.sql`:
  - `add_stock_for(item, holder, qty, ...)`: any member records stock held by another member (logged as `add`, `created_by` = me). Holding is marked unconfirmed.
  - `apply_event_update(event, changes)`: any member creates the event and applies all moves/quantity changes in one transaction, every change logged as a movement with `event_id`.
  - A way to mark a holding "unconfirmed" (e.g. `confirmed_by_holder boolean`, reset by `confirm_holding`).
  - Insert the 3 new categories.
  Full SQL will be shown for review before you run it.
