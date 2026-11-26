import { cn } from '@/lib/utils'

interface GreenScanLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  inverted?: boolean
  className?: string
}

export function GreenScanLogo({
  size = 'md',
  showText = true,
  inverted = false,
  className,
}: GreenScanLogoProps) {
  const boxClasses =
    size === 'sm'
      ? 'size-9 rounded-xl'
      : size === 'lg'
        ? 'size-13 rounded-2xl'
        : 'size-10 rounded-2xl'

  const innerClasses =
    size === 'sm' ? 'size-4' : size === 'lg' ? 'size-6' : 'size-5'

  const cornerClasses =
    size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'

  const textClasses =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
        ? 'text-2xl'
        : 'text-xl'

  const bracketColor = inverted ? 'border-[#061006]' : 'border-[#00D632]'
  const lineColor = inverted ? 'bg-[#061006]' : 'bg-[#00D632]'

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center shadow-md shrink-0',
          boxClasses,
          inverted ? 'bg-[#00D632]' : 'bg-[#061006] dark:bg-[#00D632]'
        )}
      >
        <div className={cn('relative', innerClasses)}>
          <span
            className={cn(
              'absolute top-0 left-0 border-t-2 border-l-2 rounded-tl-[2px]',
              cornerClasses,
              inverted ? bracketColor : 'border-[#00D632] dark:border-[#061006]'
            )}
          />
          <span
            className={cn(
              'absolute top-0 right-0 border-t-2 border-r-2 rounded-tr-[2px]',
              cornerClasses,
              inverted ? bracketColor : 'border-[#00D632] dark:border-[#061006]'
            )}
          />
          <span
            className={cn(
              'absolute bottom-0 left-0 border-b-2 border-l-2 rounded-bl-[2px]',
              cornerClasses,
              inverted ? bracketColor : 'border-[#00D632] dark:border-[#061006]'
            )}
          />
          <span
            className={cn(
              'absolute bottom-0 right-0 border-b-2 border-r-2 rounded-br-[2px]',
              cornerClasses,
              inverted ? bracketColor : 'border-[#00D632] dark:border-[#061006]'
            )}
          />
          <span
            className={cn(
              'absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full',
              inverted ? lineColor : 'bg-[#00D632] dark:bg-[#061006]'
            )}
          />
        </div>
      </div>

      {showText && (
        <span className={cn('font-extrabold tracking-tight text-foreground', textClasses)}>
          Green Scan
        </span>
      )}
    </div>
  )
}
