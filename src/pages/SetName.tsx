// Shown once after the first login: replace the email-based name with a real one.
import { useState, type FormEvent } from 'react'
import Button from '../components/Button'
import { Field, Notice } from '../components/ui'
import { t } from '../i18n'
import { useMember } from '../lib/authContext'
import { needsRealName } from '../lib/authHelpers'
import { supabase } from '../lib/supabase'

/** The name form, also reused on the profile screen. */
export function NameForm({ submitLabel, onSaved }: { submitLabel: string; onSaved?: () => void }) {
  const { profile, reload } = useMember()
  const [name, setName] = useState(needsRealName(profile.name, profile.email) ? '' : profile.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    const clean = name.trim().replace(/\s+/g, ' ')
    if (needsRealName(clean, profile.email)) {
      setError(t('setName.tooShort'))
      return
    }
    setBusy(true)
    setError(null)
    // Members may only update their own row (enforced by the database).
    const { error } = await supabase!.from('members').update({ name: clean }).eq('id', profile.id)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    await reload()
    onSaved?.()
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void save(e)}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field
        label={t('setName.label')}
        placeholder={t('setName.placeholder')}
        autoComplete="name"
        autoCapitalize="words"
        required
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t('common.saving') : submitLabel}
      </Button>
    </form>
  )
}

export default function SetName() {
  return (
    <div className="mx-auto max-w-sm space-y-4 pt-4">
      <h1 className="text-2xl font-bold">{t('setName.title')}</h1>
      <p className="text-stone-600 dark:text-stone-400">{t('setName.body')}</p>
      <NameForm submitLabel={t('setName.continue')} />
    </div>
  )
}
