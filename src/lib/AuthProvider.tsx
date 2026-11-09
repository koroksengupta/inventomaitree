// Keeps track of who is logged in and what they may do, for the whole app.
// Screens read it with `useAuth()` / `useMember()` from authContext.ts.
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthState, type Profile } from './authContext'
import { loginErrorFromUrl } from './authHelpers'
import { supabase } from './supabase'

// --- Read once when the app starts, before anything changes the address ---
// 1) A failed magic link comes back as ".../#error=...": remember the message.
let startupNotice = typeof window !== 'undefined' ? loginErrorFromUrl(window.location.href) : null
// 2) A link opened in a *different* browser than the one that asked for it
//    comes back with "?code=..." that this browser cannot use.
let startedWithCode = typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('code')

const WRONG_BROWSER =
  'This login link was opened in a different browser or app than the one where you asked for it. Type the code from the email instead, or ask for a new email and open it in this browser.'

/** Remove leftover login bits (?code=..., #error=...) from the address bar. */
function cleanAddressBar() {
  const url = new URL(window.location.href)
  if (url.searchParams.has('code') || url.hash.includes('error')) {
    window.history.replaceState(null, '', `${url.origin}${url.pathname}#/`)
  }
}

/** Work out the login state for a session (null = not logged in). Never throws. */
async function computeState(session: Session | null): Promise<AuthState> {
  if (!session) {
    return { status: 'signedOut', notice: startupNotice ?? (startedWithCode ? WRONG_BROWSER : null) }
  }
  // Logged in: the startup messages are no longer relevant.
  startupNotice = null
  startedWithCode = false
  try {
    const sb = supabase!
    const [member, admin, profile] = await Promise.all([
      sb.rpc('is_member'),
      sb.rpc('is_admin'),
      sb.from('members').select('id, email, name').eq('id', session.user.id).maybeSingle(),
    ])
    const err = member.error ?? admin.error ?? profile.error
    if (err) return { status: 'error', message: err.message }
    if (!member.data || !profile.data) return { status: 'noAccess', email: session.user.email ?? '' }
    return { status: 'ready', session, profile: profile.data as Profile, isAdmin: admin.data === true }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  // undefined = Supabase is still starting up; null = nobody logged in.
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  // Listen for log in / log out. (Supabase advises not to make database calls
  // inside this listener, so we only store the session here.)
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      cleanAddressBar() // safe now: Supabase has finished reading the address
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) =>
      // Keep the old object when it is the same person (e.g. a background token
      // refresh), so we don't reload everything every hour.
      setSession((prev) => (prev && s && prev.user.id === s.user.id ? prev : s)),
    )
    return () => data.subscription.unsubscribe()
  }, [])

  // Whenever the logged-in person changes, find out what they may do.
  useEffect(() => {
    if (session === undefined) return
    let cancelled = false
    void computeState(session).then((s) => {
      if (!cancelled) setState(s)
    })
    return () => {
      cancelled = true
    }
  }, [session])

  const reload = useCallback(async () => {
    if (session !== undefined) setState(await computeState(session))
  }, [session])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  return <AuthContext.Provider value={{ state, reload, signOut }}>{children}</AuthContext.Provider>
}
