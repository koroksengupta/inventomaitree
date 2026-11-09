# Maitree Bhandar

The shared inventory of **Maitree e.V.**: who keeps which items in their Keller, how many are left, with photos.
It runs as a website (installable on phones) at **https://koroksengupta.github.io/inventomaitree/**.

- **Front end:** React + TypeScript + Tailwind, built with Vite. Plain files on GitHub Pages; no server of our own.
- **Back end:** Supabase (free tier): the database, the email login and photo storage.

Other documents in this repo:
| File | What it is |
|---|---|
| `SPEC.md` | The original product idea |
| `DECISIONS.md` | Choices made after the spec (these win over the spec) |
| `BUILD_PROMPT.md` | Instructions for the AI assistant building the app |
| `schema.sql` | The database structure. **Already applied in Supabase; do not run it again.** |
| `migrations/` | Later database changes, run once each by hand (see below) |

---

## 1. Run the app on your computer

### One-time setup
1. **Install Node.js** (version 22 or newer) from https://nodejs.org. Choose the "LTS" download.
   Check it worked: open a terminal and type `node -v`. It should print `v22...` or higher.
2. **Get the code** (if you don't have it yet):
   ```bash
   git clone https://github.com/koroksengupta/inventomaitree.git
   ```
   ```bash
   cd inventomaitree
   ```
3. **Install the libraries** the app uses (creates a `node_modules` folder; takes a minute):
   ```bash
   npm install
   ```
4. **Create your settings file.** Copy `.env.example` to a new file called `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Then open `.env.local` in a text editor and fill in the two values from
   Supabase dashboard → **Project Settings → API** (or "Data API"):
   - `VITE_SUPABASE_URL`: the **Project URL**, ending in `.supabase.co` (no `/rest/v1/` at the end)
   - `VITE_SUPABASE_ANON_KEY`: the **Publishable key** (`sb_publishable_...`) or the older `anon` key

   `.env.local` is listed in `.gitignore`, so git will never upload it.
   ⚠️ Never put the `service_role` / **Secret** key in this file or anywhere in the app.

### Every time
```bash
npm run dev
```
Then open **http://localhost:5173/inventomaitree/** in your browser. Changes to the code show up instantly.
Stop it with `Ctrl + C` in the terminal.

### Check the database connection
On the home screen tap **Check database connection** (or open `http://localhost:5173/inventomaitree/#/connection`).
- **✓ Connected, "Categories visible to you: 0"**: everything works. It shows 0 because you are not logged in:
  the database only shows data to invited members (this protection is called *Row Level Security*).
  After login works (Phase 1) it will show the real number.
- **✗ Not connected**: read the tip under the error. Most common: a typo in `.env.local`
  (restart `npm run dev` after editing it), or the Supabase project is paused (open the Supabase dashboard to wake it).

### Other useful commands
| Command | What it does |
|---|---|
| `npm run build` | Checks the code for type errors and builds the final website into `dist/` |
| `npm run lint` | Looks for common mistakes in the code |
| `npm run preview` | Serves the built `dist/` folder locally, the same way GitHub Pages will |

---

## 2. Folder structure

```
src/
  main.tsx          starts the app
  App.tsx           which screen shows for which address (#/connection, ...)
  config.ts         app name, organization name, Supabase settings
  index.css         Tailwind setup and page background (dark mode follows the system)
  i18n/en.ts        ALL English text. To add German later, add de.ts with the same keys.
  lib/supabase.ts   the single connection to Supabase
  components/       reusable pieces (layout, buttons)
  pages/            one file per screen
public/             files copied as-is (icon)
migrations/         database changes to run by hand in the Supabase SQL Editor
.github/workflows/  automatic checks (ci.yml) and deployment (deploy.yml)
```

Addresses look like `.../inventomaitree/#/connection`. The `#` is on purpose: GitHub Pages can't
send every address to the app, but everything after `#` is handled inside the app, so refreshing
or sharing a link always works.

---

## 3. Publish the website (GitHub Pages)

Do these once:
1. **Add the two secrets.** On GitHub open the repo → **Settings → Secrets and variables → Actions →
   New repository secret**. Add:
   - Name `VITE_SUPABASE_URL`, value: your Project URL
   - Name `VITE_SUPABASE_ANON_KEY`, value: your publishable key
2. **Turn on Pages.** Repo → **Settings → Pages** → under "Build and deployment", set **Source** to **GitHub Actions**.

After that, every change that lands on the `main` branch is built and published automatically
(watch progress in the repo's **Actions** tab; about 1–2 minutes). You can also start it by hand:
Actions → "Deploy to GitHub Pages" → **Run workflow**.

Only the built `dist/` folder is published, not the source code or the SQL files.

---

## 4. Database changes (migrations)

`schema.sql` is already applied. Later changes live in `migrations/` as numbered files.
To apply one: Supabase dashboard → **SQL Editor** → **New query** → paste the whole file → **Run**.
Run each file **once**, in number order. Each file says at the top what it does.

---

## 5. Free-tier limits to know about

| Limit | What happens | What we do |
|---|---|---|
| Storage 1 GB | Photo uploads fail when full | Photos are shrunk to ~300 KB before upload; ~200 items × 3 photos ≈ 180 MB |
| Project pauses after ~1 week without use | App shows "Not connected" until you wake it in the dashboard | A weekly "keep-alive" job (added in Phase 5) |
| Built-in login emails: only a few per hour | Magic links don't arrive when several people log in | Connect a free email provider (Phase 1) |
