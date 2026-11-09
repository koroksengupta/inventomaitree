import { Link } from 'react-router-dom'
import { APP_NAME, ORG_NAME } from '../config'
import { t } from '../i18n'

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('home.welcome', { app: APP_NAME })}</h1>
      <p className="text-stone-600 dark:text-stone-400">{t('home.subtitle', { org: ORG_NAME })}</p>
      <p>{t('home.underConstruction')}</p>
      <Link
        to="/connection"
        className="inline-flex min-h-12 items-center rounded-xl bg-orange-700 px-5 font-medium text-white hover:bg-orange-800"
      >
        {t('home.checkConnection')}
      </Link>
    </div>
  )
}
