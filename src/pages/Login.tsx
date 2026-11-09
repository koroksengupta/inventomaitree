// Log in with a magic link. Step 1: type your email. Step 2: tap the link in
// the email, OR type the code from the email here. The code works even when
// the email opens in another browser/app (common on phones).
import { useEffect, useState, type FormEvent } from 'react'
import Button from '../components/Button'
import { Field, Notice } from '../components/ui'
import { APP_NAME, ORG_NAME } from '../config'
import { t } from '../i18n'
import { friendlyAuthError, looksLikeEmail, normalizeEmail } from '../lib/authHelpers'
import { supabase } from '../lib/supabase'

const PENDING_KEY = 'mb.pendingLoginEmail' // remembers step 2 if the page reloads
const RESEND_SECONDS = 60 // Supabase allows one login email per minute per address

function readPending(): string {
  try {
    return localStorage.getItem(PENDING_KEY) ?? ''
  } catch {
    return ''
  }
}
function writePending(email: string | null) {
  try {
    if (email) localStorage.setItem(PENDING_KEY, email)
    else localStorage.removeItem(PENDING_KEY)
  } catch {
    /* private mode: just don't remember */
  }
}

export default function Login({ notice }: { notice: string | null }) {
  const [sentTo, setSentTo] = useState(readPending) // '' = step 1, otherwise step 2
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Count down the "send again" timer once per second.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function sendEmail(address: string) {
    if (!supabase) return
    setError(null)
    if (!looksLikeEmail(address)) {
      setError(t('login.badEmail'))
      return
    }
    const clean = normalizeEmail(address)
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        // Where the link in the email leads back to: this same app.
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
        shouldCreateUser: true, // first login creates the account (only if invited)
      },
    })
    setBusy(false)
    if (error) {
      setError(friendlyAuthError(error.message, error.status))
      return
    }
    writePending(clean)
    setSentTo(clean)
    setCode('')
    setCooldown(RESEND_SECONDS)
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.verifyOtp({ email: sentTo, token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) {
      setError(friendlyAuthError(error.message, error.status))
      return
    }
    writePending(null) // logged in; the app switches screens by itself
  }

  return (
    <div className="mx-auto max-w-sm space-y-5 pt-4">
      <div className="space-y-1 text-center">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="mx-auto h-16 w-16" />
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-stone-600 dark:text-stone-400">{t('login.intro', { org: ORG_NAME })}</p>
      </div>

      {notice && !sentTo && <Notice tone="error">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {!sentTo ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void sendEmail(email)
          }}
        >
          <Field
            label={t('login.emailLabel')}
            hint={t('login.emailHint')}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? t('login.sending') : t('login.send')}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <Notice tone="ok">
            <p className="font-semibold">{t('login.sentTitle')}</p>
            <p>{t('login.sentBody', { email: sentTo })}</p>
          </Notice>
          <form className="space-y-4" onSubmit={(e) => void verifyCode(e)}>
            <Field
              label={t('login.codeLabel')}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={10}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
              {busy ? t('login.verifying') : t('login.verify')}
            </Button>
          </form>
          <p className="text-sm text-stone-600 dark:text-stone-400">{t('login.sentSpam')}</p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" disabled={busy || cooldown > 0} onClick={() => void sendEmail(sentTo)}>
              {cooldown > 0 ? t('login.resendIn', { seconds: cooldown }) : t('login.resend')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                writePending(null)
                setSentTo('')
                setError(null)
              }}
            >
              {t('login.otherEmail')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
