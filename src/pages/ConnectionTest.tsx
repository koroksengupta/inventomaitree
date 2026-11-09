// Checks that the app can talk to Supabase and shows how many categories
// the database lets you see. Useful when setting up or when something breaks.
import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { t } from '../i18n'
import { configProblem, supabase } from '../lib/supabase'

type Result =
  | { state: 'checking' }
  | { state: 'ok'; count: number; email: string | null }
  | { state: 'error'; message: string }

// Runs the check and returns what happened (never throws).
async function runCheck(): Promise<Result> {
  if (!supabase) return { state: 'error', message: configProblem ?? 'Unknown problem' }
  try {
    // `head: true` asks only for the number of rows, not the rows themselves.
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
    if (error) throw new Error(error.message || `Error code ${error.code}`)
    const { data } = await supabase.auth.getSession()
    return { state: 'ok', count: count ?? 0, email: data.session?.user.email ?? null }
  } catch (e) {
    return { state: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

export default function ConnectionTest() {
  const [result, setResult] = useState<Result>({ state: 'checking' })

  // Check once when the screen opens. `cancelled` stops a late answer from
  // updating the screen after you have already left it.
  useEffect(() => {
    let cancelled = false
    void runCheck().then((r) => {
      if (!cancelled) setResult(r)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function checkAgain() {
    setResult({ state: 'checking' })
    setResult(await runCheck())
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('conn.title')}</h1>

      {result.state === 'checking' && <p aria-live="polite">{t('conn.checking')}</p>}

      {result.state === 'ok' && (
        <div className="space-y-3 rounded-xl border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <p className="text-xl font-semibold text-green-800 dark:text-green-300">✓ {t('conn.connected')}</p>
          <p>{t('conn.categories', { count: result.count })}</p>
          <p className="text-sm">
            {result.email ? t('conn.loggedInAs', { email: result.email }) : t('conn.notLoggedIn')}
          </p>
          {result.count === 0 && !result.email && (
            <p className="text-sm text-stone-600 dark:text-stone-400">{t('conn.zeroExplained')}</p>
          )}
        </div>
      )}

      {result.state === 'error' && (
        <div className="space-y-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-xl font-semibold text-red-800 dark:text-red-300">✗ {t('conn.notConnected')}</p>
          <p className="break-words font-mono text-sm">{result.message}</p>
          <p className="text-sm">{t('conn.hintNetwork')}</p>
          <p className="text-sm">{t('conn.hintKey')}</p>
        </div>
      )}

      <Button onClick={() => void checkAgain()} disabled={result.state === 'checking'}>
        {t('conn.retry')}
      </Button>
    </div>
  )
}
