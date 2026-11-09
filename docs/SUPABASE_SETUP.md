# Supabase dashboard settings (do these by clicking)

Open https://supabase.com/dashboard and choose your project. Do each part once.

---

## A. Login addresses (URL Configuration)

Tells Supabase where the login link in the email may lead to.

1. Left sidebar → **Authentication** → **URL Configuration**.
2. **Site URL**: replace what's there with
   `https://koroksengupta.github.io/inventomaitree/` → **Save**.
3. **Redirect URLs** → **Add URL** → `http://localhost:5173/**` → **Save URLs**.
   (The `**` allows any page of the app on your computer.)

Why both: links from the live site go back to the live site; links asked for while you run the app on
your computer go back to your computer. If an address is not on this list, Supabase silently sends
people to the Site URL instead.

---

## B. Put the 6-digit code into the login emails (Email Templates)

The app lets people type a code from the email, which works even when the email opens in a
different browser or app (common on phones, and needed for the app installed on an iPhone home screen).
The default emails don't show the code, so add it.

1. **Authentication** → **Emails** (or **Email Templates**).
2. Open the **Magic Link** template. Replace the **Body** with:
   ```html
   <h2>Log in to Maitree Bhandar</h2>
   <p>Your login code: <strong style="font-size:24px;letter-spacing:4px">{{ .Token }}</strong></p>
   <p>Type this code in the app, or tap this link on the same phone/browser where you asked for it:</p>
   <p><a href="{{ .ConfirmationURL }}">Log in</a></p>
   <p>The code and link work once and expire after 1 hour. If you did not ask for this, ignore this email.</p>
   ```
   Subject: `Your Maitree Bhandar login code`. Click **Save**.
3. Open the **Confirm signup** template (used for someone's *very first* login) and paste the **same body**
   and subject. **Save**.

---

## C. Sign-ups stay ON

**Authentication** → **Sign In / Providers** (or **Providers**) → **Email**:
- **Enable Email provider**: on
- **Allow new users to sign up**: **on** (the database blocks everyone not on the members list)

---

## D. Photo bucket is private

**Storage** → you should see a bucket **item-photos** *without* a "Public" badge.
If it says Public: click the bucket's **⋯** → **Edit bucket** → turn **Public bucket** off → **Save**.

---

## E. Own email sender (SMTP), needed before inviting other members

Supabase's built-in email sends only a few emails per hour for the whole project and is meant for
testing. Around an event several people log in at once and the emails would simply not arrive.
A free email provider fixes that.

**First find out:** does Maitree own a web domain (e.g. `maitree-xyz.de`) and who can change its DNS settings?

### Option 1: Resend (if you have a domain): 3,000 emails/month free
1. Sign up at https://resend.com.
2. **Domains** → **Add Domain** → enter your domain (tip: use a sub-domain like `mail.your-domain.de`).
3. Resend shows 3–4 DNS records (TXT/MX). Add them at your domain provider (Strato, IONOS, ...).
   Wait until Resend shows **Verified** (minutes to a few hours).
4. **API Keys** → **Create API Key** (permission: Sending access). Copy it **straight into Supabase in
   the next step**; do not paste it into chat or any file.
5. In Supabase: **Authentication** → **Emails** → **SMTP Settings** → turn on **Enable Custom SMTP**:
   | Field | Value |
   |---|---|
   | Sender email | `login@mail.your-domain.de` |
   | Sender name | `Maitree Bhandar` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | the API key from step 4 |
   **Save**.

### Option 2: Brevo (no domain): 300 emails/day free
1. Sign up at https://www.brevo.com.
2. **Senders, Domains & Dedicated IPs** → **Senders** → **Add a sender** with an email you can read
   (e.g. the association's Gmail) → confirm the email Brevo sends you.
3. **SMTP & API** → **SMTP** tab → **Generate a new SMTP key**. Copy it **straight into Supabase**.
   Note the **Login** shown on that page (looks like `xxxx@smtp-brevo.com`).
4. In Supabase: **Authentication** → **Emails** → **SMTP Settings** → **Enable Custom SMTP**:
   | Field | Value |
   |---|---|
   | Sender email | the sender address from step 2 |
   | Sender name | `Maitree Bhandar` |
   | Host | `smtp-relay.brevo.com` |
   | Port | `587` |
   | Username | the Login from step 3 |
   | Password | the SMTP key from step 3 |
   **Save**.
   Note: emails sent "from" a Gmail address via another service land in spam more often.
   Tell members to check spam the first time and mark it "not spam".

### After either option
**Authentication** → **Rate Limits**: raise **Rate limit for sending emails** to e.g. `30` per hour.
Then log in once yourself to test.

Provider screens change over time; if a menu name differs, look for the closest match or ask.
