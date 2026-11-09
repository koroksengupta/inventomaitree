import { en } from './en'

export type TextKey = keyof typeof en

// Look up a text and fill in {placeholders}.
// Example: t('conn.categories', { count: 8 }) -> "Categories visible to you: 8"
export function t(key: TextKey, vars: Record<string, string | number> = {}): string {
  return en[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}
