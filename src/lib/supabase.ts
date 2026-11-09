// The one shared connection to Supabase (database, login and photo storage).
// Every screen imports `supabase` from here instead of creating its own.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'

// If the settings are missing we don't crash: screens show `configProblem` instead.
export const configProblem: string | null =
  !SUPABASE_URL || !SUPABASE_ANON_KEY
    ? 'Supabase settings are missing. Copy .env.example to .env.local and fill in your Project URL and publishable key (see README).'
    : SUPABASE_URL.includes('/rest/v1')
      ? 'VITE_SUPABASE_URL should end in .supabase.co. Remove the /rest/v1/ part.'
      : null

export const supabase: SupabaseClient | null = configProblem
  ? null
  : createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        // PKCE: the login link brings back a short `?code=...` that the app swaps
        // for a session. This avoids clashing with our #/page style URLs.
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true, // stay logged in after closing the browser
        autoRefreshToken: true,
      },
    })
