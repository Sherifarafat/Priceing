import * as React from 'react'
import { Globe, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDirection } from '@/context/direction-provider'
import { setCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LANG_COOKIE = 'app_language'

export function LanguageSwitch() {
  const { dir, setDir } = useDirection()
  const currentLang: 'en' | 'ar' = dir === 'rtl' ? 'ar' : 'en'

  React.useEffect(() => {
    document.documentElement.lang = currentLang
  }, [currentLang])

  const switchLanguage = (lang: 'en' | 'ar') => {
    setCookie(LANG_COOKIE, lang, 60 * 60 * 24 * 365)
    document.documentElement.lang = lang
    if (lang === 'ar') {
      setDir('rtl')
    } else {
      setDir('ltr')
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-9 px-2.5 rounded-xl gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground'
        >
          <Globe className='size-4' />
          <span className='font-bold uppercase tracking-wider text-[11px]'>
            {currentLang.toUpperCase()}
          </span>
          <span className='sr-only'>Switch Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-36 text-xs rounded-xl shadow-lg'>
        <DropdownMenuItem
          onClick={() => switchLanguage('en')}
          className='cursor-pointer flex items-center justify-between'
        >
          <span>English</span>
          <Check
            size={14}
            className={cn('ms-auto text-primary', currentLang !== 'en' && 'hidden')}
          />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage('ar')}
          className='cursor-pointer flex items-center justify-between font-sans'
        >
          <span>العربية</span>
          <Check
            size={14}
            className={cn('ms-auto text-primary', currentLang !== 'ar' && 'hidden')}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
