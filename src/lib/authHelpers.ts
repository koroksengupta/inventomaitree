// Small, pure helper functions for login. Kept separate so they can be tested
// automatically (see authHelpers.test.ts) without a browser or database.

/** Lower-case and trim an email, the way the allowlist stores it. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/** A simple "looks like an email" check; the real check is the email arriving. */
export function looksLikeEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())
}

/**
 * On sign-up the database fills in the name as the part of the email before "@"
 * (e.g. "rahul.b1987"). We ask people to replace it with their real name.
 */
export function needsRealName(name: string | null | undefined, email: string): boolean {
  const n = (name ?? '').trim()
  return n.length < 2 || n === email.split('@')[0]
}

/**
 * Turn Supabase's technical login errors into plain sentences.
 * `status` is the HTTP status code when there is one.
 */
export function friendlyAuthError(message: string, status?: number): string {
  const m = message.toLowerCase()
  // Our database trigger rejects emails not on the allowlist. Supabase reports
  // this as a generic "Database error saving new user" (status 500).
  if (m.includes('database error') || m.includes('allowlist')) {
    return "This email hasn't been invited. Ask a committee admin."
  }
  if (m.includes('email rate limit')) {
    return 'Too many login emails were sent in the last hour. Please try again later, or ask an admin.'
  }
  if (status === 429 || m.includes('for security purposes') || m.includes('rate limit')) {
    return 'Please wait a minute before asking for another login email.'
  }
  if (m.includes('expired') || (m.includes('invalid') && m.includes('token')) || m.includes('otp')) {
    return 'That code or link has expired or was already used. Ask for a new login email.'
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Could not reach the server. Check your internet connection and try again.'
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'That email address does not look right.'
  }
  return `Something went wrong: ${message}`
}

/**
 * Read a login error that Supabase put in the address after a failed link,
 * e.g. ".../#error=access_denied&error_code=otp_expired&error_description=..."
 */
export function loginErrorFromUrl(href: string): string | null {
  const url = new URL(href)
  const params = new URLSearchParams(url.hash.replace(/^#\/?/, ''))
  url.searchParams.forEach((v, k) => params.set(k, v))
  const code = params.get('error_code')
  const description = params.get('error_description')
  if (!code && !description && !params.get('error')) return null
  if (code === 'otp_expired') {
    return 'That login link has expired or was already used. Ask for a new login email below.'
  }
  return friendlyAuthError(description ?? code ?? 'unknown error')
}
