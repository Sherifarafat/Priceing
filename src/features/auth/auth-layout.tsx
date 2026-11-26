import { Link } from '@tanstack/react-router'
import { GreenScanLogo } from '@/components/green-scan-logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

const APPLE_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Arabic", "Plus Jakarta Sans", "Readex Pro", system-ui, sans-serif'

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{ fontFamily: APPLE_FONT_STACK }}
      className='container grid min-h-svh max-w-none items-center justify-center bg-[#F5F6F7] dark:bg-[#061006] px-4'
    >
      <div className='mx-auto flex w-full flex-col items-center justify-center space-y-5 py-8 sm:p-8'>
        <Link to='/' className='transition-transform hover:scale-105'>
          <GreenScanLogo size='md' />
        </Link>
        {children}
      </div>
    </div>
  )
}
