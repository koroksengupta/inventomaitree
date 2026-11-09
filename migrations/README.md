# Database migrations

`../schema.sql` counts as migration **001** and is already applied.
Each later file here is run **once, by hand, in number order**:
Supabase dashboard → SQL Editor → New query → paste the whole file → Run.

| File | Status |
|---|---|
| `002_ping.sql` | planned (keep-alive, Phase 5) |
| `003_tagging_and_event_updates.sql` | planned (tag other holders, post-event updates, 3 new categories; Phase 2–4) |
