// App-wide settings in one place. Change names here, not inside the screens.

export const APP_NAME = 'Maitree Bhandar'
export const APP_SHORT_NAME = 'Bhandar' // shown under the phone home-screen icon
export const ORG_NAME = 'Maitree e.V.'

// Values from `.env.local` (on your computer) or GitHub secrets (when deployed).
// Vite only exposes variables whose names start with VITE_.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
