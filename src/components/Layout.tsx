// The frame around every screen: top bar with the app name, page content below.
import { Link, Outlet } from 'react-router-dom'
import { APP_NAME } from '../config'

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
        <Outlet />
      </main>
    </div>
  )
}
