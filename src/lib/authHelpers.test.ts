import { describe, expect, it } from 'vitest'
import { friendlyAuthError, loginErrorFromUrl, looksLikeEmail, needsRealName, normalizeEmail } from './authHelpers'

describe('normalizeEmail', () => {
  it('lower-cases and trims', () => {
    expect(normalizeEmail('  Priya.S@Gmail.COM ')).toBe('priya.s@gmail.com')
  })
})

describe('looksLikeEmail', () => {
  it('accepts normal addresses and rejects obvious typos', () => {
    expect(looksLikeEmail('a@b.de')).toBe(true)
    expect(looksLikeEmail('a@b')).toBe(false)
    expect(looksLikeEmail('a b@c.de')).toBe(false)
  })
})

describe('needsRealName', () => {
  it('asks when the name is still the email prefix the database filled in', () => {
    expect(needsRealName('rahul.b1987', 'rahul.b1987@gmail.com')).toBe(true)
  })
  it('asks when empty or one letter', () => {
    expect(needsRealName('', 'x@y.de')).toBe(true)
    expect(needsRealName(' R ', 'x@y.de')).toBe(true)
  })
  it('accepts a real name, even one that only differs by capital letters', () => {
    expect(needsRealName('Rahul B.', 'rahul.b1987@gmail.com')).toBe(false)
    expect(needsRealName('Rahul', 'rahul@gmail.com')).toBe(false)
  })
})

describe('friendlyAuthError', () => {
  it('explains the allowlist rejection from our database trigger', () => {
    expect(friendlyAuthError('Database error saving new user', 500)).toBe(
      "This email hasn't been invited. Ask a committee admin.",
    )
  })
  it('explains rate limits', () => {
    expect(friendlyAuthError('Email rate limit exceeded', 429)).toMatch(/last hour/)
    expect(friendlyAuthError('For security purposes, you can only request this after 42 seconds.', 429)).toMatch(/wait a minute/)
  })
  it('explains expired codes', () => {
    expect(friendlyAuthError('Token has expired or is invalid', 403)).toMatch(/expired/)
  })
})

describe('loginErrorFromUrl', () => {
  it('reads an expired-link error from the # part', () => {
    const href = 'https://x.github.io/app/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    expect(loginErrorFromUrl(href)).toMatch(/expired/)
  })
  it('returns null for normal addresses', () => {
    expect(loginErrorFromUrl('https://x.github.io/app/#/items')).toBeNull()
    expect(loginErrorFromUrl('https://x.github.io/app/?code=abc')).toBeNull()
  })
})
