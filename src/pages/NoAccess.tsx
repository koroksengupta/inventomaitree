// Logged in, but the email is not (or no longer) an active member.
// The database already hides all data from them; this screen just explains why.
import Button from '../components/Button'
import { t } from '../i18n'
import { useAuth } from '../lib/authContext'

export default function NoAccess({ email }: { email: string }) {
  const { signOut } = useAuth()
  return (
    <div className="mx-auto max-w-sm space-y-4 pt-4">
      <h1 className="text-2xl font-bold">{t('noAccess.title')}</h1>
      <p>{t('noAccess.body', { email })}</p>
      <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
        {t('noAccess.signOut')}
      </Button>
    </div>
  )
}
