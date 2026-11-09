// Shared login state types and the hooks screens use to read it.
// The provider that fills it in lives in AuthProvider.tsx.
import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type Profile = { id: string; email: string; name: string }

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut'; notice: string | null } // notice: e.g. "link expired"
  | { status: 'noAccess'; email: string } // logged in, but not (or no longer) an active member
  | { status: 'ready'; session: Session; profile: Profile; isAdmin: boolean }
  | { status: 'error'; message: string }

export type AuthContextValue = {
  state: AuthState
  /** Re-read the profile, e.g. after changing your name. */
  reload: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** For screens that are only shown when logged in (the gate guarantees it). */
export function useMember() {
  const { state, reload, signOut } = useAuth()
  if (state.status !== 'ready') throw new Error('useMember used outside the logged-in area')
  return { ...state, reload, signOut }
}
