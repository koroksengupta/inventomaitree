import { Link } from 'react-router-dom'
import { Card } from '../components/ui'
import { ORG_NAME } from '../config'
import { t } from '../i18n'
import { useMember } from '../lib/authContext'

export default function Home() {
  const { profile } = useMember()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('home.hello', { name: profile.name })}</h1>
      <p className="text-stone-600 dark:text-stone-400">{t('home.subtitle', { org: ORG_NAME })}</p>
      <Card>
        <p>{t('home.comingSoon')}</p>
      </Card>
      <Link to="/connection" className="inline-block py-3 text-orange-800 underline dark:text-orange-300">
        {t('home.checkConnection')}
      </Link>
    </div>
  )
}
