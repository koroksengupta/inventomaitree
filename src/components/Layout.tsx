// The frame around every screen, and the "gate" that decides what you may see:
//   not logged in      -> login screen
//   not a member       -> "no access" screen
//   no real name yet   -> "what is your name?" screen
//   otherwise          -> the requested page, with the bottom menu
// The connection test is always reachable (useful for troubleshooting).
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { APP_NAME } from '../config'
import { t, type TextKey } from '../i18n'
import { useAuth } from '../lib/authContext'
import { needsRealName } from '../lib/authHelpers'
import { configProblem } from '../lib/supabase'
import Login from '../pages/Login'
import NoAccess from '../pages/NoAccess'
import SetName from '../pages/SetName'
import Button from './Button'
import { Notice, Spinner } from './ui'

function Gate() {
  const { state, reload } = useAuth()
  const location = useLocation()
  if (location.pathname === '/connection' || configProblem) return <Outlet />

  switch (state.status) {
    case 'loading':
      return <Spinner label={t('common.loading')} />
    case 'signedOut':
      return <Login notice={state.notice} />
    case 'noAccess':
      return <NoAccess email={state.email} />
    case 'error':
      return (
        <div className="space-y-4">
          <Notice tone="error">
            <p className="font-semibold">{t('error.title')}</p>
            <p className="break-words">{state.message}</p>
          </Notice>
          <Button onClick={() => void reload()}>{t('error.retry')}</Button>
        </div>
      )
    case 'ready':
      return needsRealName(state.profile.name, state.profile.email) ? <SetName /> : <Outlet />
  }
}

function BottomNav() {
  const { state } = useAuth()
  if (state.status !== 'ready' || needsRealName(state.profile.name, state.profile.email)) return null
  const tabs: { to: string; label: TextKey }[] = [
    { to: '/', label: 'nav.home' },
    ...(state.isAdmin ? [{ to: '/members', label: 'nav.members' as TextKey }] : []),
    { to: '/profile', label: 'nav.profile' },
  ]
  return (
    <nav className="sticky bottom-0 z-10 border-t border-stone-200 bg-stone-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <ul className="flex">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end
              className={({ isActive }) =>
                `flex min-h-14 items-center justify-center font-medium ${
                  isActive ? 'text-orange-700 dark:text-orange-400' : 'text-stone-600 dark:text-stone-400'
                }`
              }
            >
              {t(tab.label)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
          {APP_NAME}
        </Link>
      </header>
      <main className="flex-1 px-4 py-6">
        <Gate />
      </main>
      <BottomNav />
    </div>
  )
}
