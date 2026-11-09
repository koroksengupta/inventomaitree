import { useState } from 'react'
import Button from '../components/Button'
import { Card, Notice } from '../components/ui'
import { t } from '../i18n'
import { useMember } from '../lib/authContext'
import { NameForm } from './SetName'

export default function Profile() {
  const { profile, isAdmin, signOut } = useMember()
  const [saved, setSaved] = useState(false)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
      <Card className="space-y-2">
        <p>
          <span className="text-stone-600 dark:text-stone-400">{t('profile.email')}: </span>
          {profile.email}
        </p>
        <p>
          <span className="text-stone-600 dark:text-stone-400">{t('profile.role')}: </span>
          {isAdmin ? t('profile.roleAdmin') : t('profile.roleMember')}
        </p>
      </Card>
      {saved && <Notice tone="ok">{t('common.saved')}</Notice>}
      <NameForm submitLabel={t('common.save')} onSaved={() => setSaved(true)} />
      <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
        {t('profile.signOut')}
      </Button>
    </div>
  )
}
