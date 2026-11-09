// Admin only: who may log in. Adds/changes rows in the `allowed_members` table.
// The database itself only lets admins read or change this table.
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Button from '../components/Button'
import { Card, Field, Notice, Spinner } from '../components/ui'
import { APP_NAME, ORG_NAME } from '../config'
import { t } from '../i18n'
import { useMember } from '../lib/authContext'
import { looksLikeEmail, normalizeEmail } from '../lib/authHelpers'
import { supabase } from '../lib/supabase'

type Allowed = { email: string; role: 'member' | 'admin'; active: boolean }
type Row = Allowed & { name: string | null } // name is null until they log in once

const APP_URL = window.location.origin + import.meta.env.BASE_URL

function inviteText(email: string) {
  return t('members.inviteText', { app: APP_NAME, org: ORG_NAME, url: APP_URL, email })
}

async function fetchRows(): Promise<Row[]> {
  const sb = supabase!
  const [allowed, members] = await Promise.all([
    sb.from('allowed_members').select('email, role, active').order('email'),
    sb.from('members').select('email, name'),
  ])
  if (allowed.error) throw new Error(allowed.error.message)
  if (members.error) throw new Error(members.error.message)
  const names = new Map((members.data ?? []).map((m) => [m.email as string, m.name as string]))
  return (allowed.data as Allowed[]).map((a) => ({ ...a, name: names.get(a.email) ?? null }))
}

export default function Members() {
  const { profile, isAdmin } = useMember()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string; invite?: string } | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setRows(await fetchRows())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchRows()
      .then((r) => !cancelled && setRows(r))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  if (!isAdmin) return <Notice tone="error">Admins only.</Notice>

  async function invite(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!looksLikeEmail(newEmail)) {
      setMessage({ tone: 'error', text: t('login.badEmail') })
      return
    }
    const email = normalizeEmail(newEmail)
    setBusy(true)
    const { error } = await supabase!
      .from('allowed_members')
      .insert({ email, role: asAdmin ? 'admin' : 'member' })
    setBusy(false)
    if (error) {
      // 23505 = "this email is already in the table"
      setMessage({ tone: 'error', text: error.code === '23505' ? t('members.alreadyListed') : error.message })
      return
    }
    setNewEmail('')
    setAsAdmin(false)
    setMessage({ tone: 'ok', text: t('members.invited', { email }), invite: inviteText(email) })
    await refresh()
  }

  async function change(row: Row, patch: Partial<Allowed>) {
    if (row.email === profile.email) {
      setMessage({ tone: 'error', text: t('members.cantChangeSelf') })
      return
    }
    if (patch.active === false && !window.confirm(t('members.confirmOff', { who: row.name ?? row.email }))) return
    setBusy(true)
    // `.select()` returns the changed rows, so we notice if nothing was changed.
    const { data, error } = await supabase!.from('allowed_members').update(patch).eq('email', row.email).select()
    setBusy(false)
    if (error || !data?.length) {
      setMessage({ tone: 'error', text: error?.message ?? 'Nothing was changed. Are you still an admin?' })
      return
    }
    setMessage(null)
    await refresh()
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage((m) => ({ tone: 'ok', text: t('members.copied'), invite: m?.invite }))
    } catch {
      window.prompt('Copy this text:', text) // fallback for older phones
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t('members.title')}</h1>
        <p className="text-stone-600 dark:text-stone-400">{t('members.intro')}</p>
      </div>

      <Card>
        <form className="space-y-3" onSubmit={(e) => void invite(e)}>
          <h2 className="text-lg font-semibold">{t('members.inviteTitle')}</h2>
          <Field
            label={t('members.inviteEmail')}
            type="email"
            inputMode="email"
            autoComplete="off"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" className="h-5 w-5" checked={asAdmin} onChange={(e) => setAsAdmin(e.target.checked)} />
            {t('members.inviteAsAdmin')}
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? t('members.inviting') : t('members.invite')}
          </Button>
        </form>
      </Card>

      {message && (
        <Notice tone={message.tone}>
          <p>{message.text}</p>
          {message.invite && (
            <Button variant="secondary" className="mt-2 w-full" onClick={() => void copy(message.invite!)}>
              {t('members.copyInvite')}
            </Button>
          )}
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {!rows && !error && <Spinner label={t('common.loading')} />}
      {rows?.length === 0 && <p>{t('members.empty')}</p>}

      <ul className="space-y-3">
        {rows?.map((row) => {
          const isMe = row.email === profile.email
          return (
            <li key={row.email}>
              <Card className="space-y-3">
                <div className={row.active ? '' : 'opacity-60'}>
                  <p className="font-semibold">
                    {row.name ?? <span className="italic text-stone-500">{t('members.notLoggedInYet')}</span>}{' '}
                    {isMe && <span className="font-normal text-stone-500">{t('members.you')}</span>}
                  </p>
                  <p className="break-all text-sm text-stone-600 dark:text-stone-400">{row.email}</p>
                  <p className="mt-1 flex gap-2 text-xs">
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 dark:bg-stone-800">
                      {row.role === 'admin' ? t('members.admin') : t('members.member')}
                    </span>
                    {!row.active && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-950 dark:text-red-300">
                        {t('members.off')}
                      </span>
                    )}
                  </p>
                </div>
                {!isMe && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void change(row, { role: row.role === 'admin' ? 'member' : 'admin' })}
                    >
                      {row.role === 'admin' ? t('members.makeMember') : t('members.makeAdmin')}
                    </Button>
                    {row.active ? (
                      <Button variant="danger" disabled={busy} onClick={() => void change(row, { active: false })}>
                        {t('members.turnOff')}
                      </Button>
                    ) : (
                      <Button variant="secondary" disabled={busy} onClick={() => void change(row, { active: true })}>
                        {t('members.turnOn')}
                      </Button>
                    )}
                  </div>
                )}
                {!isMe && row.active && !row.name && (
                  <button
                    type="button"
                    className="min-h-10 text-left text-sm text-orange-800 underline dark:text-orange-300"
                    onClick={() => void copy(inviteText(row.email))}
                  >
                    {t('members.copyInvite')}
                  </button>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
