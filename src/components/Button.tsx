// A large, thumb-friendly button (at least 48px tall) used across the app.
// variant: 'primary' (orange, the main action), 'secondary' (outlined), 'danger' (red outline).
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }

export default function Button({ className = '', variant = 'primary', type = 'button', ...props }: Props) {
  const look = {
    primary: 'bg-orange-700 text-white hover:bg-orange-800 active:bg-orange-900',
    secondary:
      'border border-stone-300 bg-white text-stone-900 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800',
    danger:
      'border border-red-300 bg-white text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-stone-900 dark:text-red-300 dark:hover:bg-red-950',
  }[variant]
  return (
    <button
      type={type}
      {...props}
      className={`min-h-12 rounded-xl px-5 font-medium disabled:opacity-50 ${look} ${className}`}
    />
  )
}
