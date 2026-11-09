// Small shared building blocks so every screen looks the same.
import type { InputHTMLAttributes, ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 ${className}`}>
      {children}
    </div>
  )
}

/** Coloured message box. tone: 'error' (red), 'ok' (green), 'info' (neutral). */
export function Notice({ tone = 'info', children }: { tone?: 'error' | 'ok' | 'info'; children: ReactNode }) {
  const colors = {
    error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    ok: 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
    info: 'border-stone-300 bg-stone-100 text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${colors}`}>
      {children}
    </div>
  )
}

/** A labelled text field with a large tap area. */
export function Field({ label, hint, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        className="block min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base dark:border-stone-700 dark:bg-stone-900"
      />
      {hint && <span className="block text-sm text-stone-600 dark:text-stone-400">{hint}</span>}
    </label>
  )
}

export function Spinner({ label }: { label: string }) {
  return (
    <p className="py-10 text-center text-stone-600 dark:text-stone-400" aria-live="polite">
      {label}
    </p>
  )
}
