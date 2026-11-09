// A large, thumb-friendly button (at least 48px tall) used across the app.
import type { ButtonHTMLAttributes } from 'react'

export default function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-12 rounded-xl bg-orange-700 px-5 font-medium text-white hover:bg-orange-800 active:bg-orange-900 disabled:opacity-50 ${className}`}
    />
  )
}
