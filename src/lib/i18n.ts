import * as React from 'react'
import { useDirection } from '@/context/direction-provider'

export type AppLang = 'ar' | 'en'

/**
 * Lightweight app-wide bilingual hook tied directly to DirectionProvider (RTL = Arabic, LTR = English).
 * Usage: const { isAr, dir, t } = useLang() -> t('العروض', 'Offers')
 */
export function useLang() {
  const { dir, setDir } = useDirection()
  const isAr = dir === 'rtl'
  const lang: AppLang = isAr ? 'ar' : 'en'

  const t = React.useCallback((ar: string, en: string) => (isAr ? ar : en), [isAr])

  return {
    lang,
    isAr,
    dir,
    setDir,
    t,
  }
}
