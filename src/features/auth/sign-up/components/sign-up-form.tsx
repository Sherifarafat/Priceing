import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { useSaaSStore } from '@/lib/saas-store'
import { useAuthStore } from '@/stores/auth-store'
import { useDirection } from '@/context/direction-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formCopy = {
  en: {
    emailLabel: 'Email',
    emailPlaceholder: 'store@example.com',
    passLabel: 'Password',
    confirmLabel: 'Confirm Password',
    submit: 'Create Account',
    errEmailRequired: 'Please enter your email.',
    errPassRequired: 'Please enter your password.',
    errPassMin: 'Password must be at least 7 characters long.',
    errConfirmRequired: 'Please confirm your password.',
    errMismatch: "Passwords don't match.",
    success: (email: string) => `Account created successfully for ${email}!`,
    fail: 'Failed to create account',
  },
  ar: {
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'store@example.com',
    passLabel: 'كلمة المرور',
    confirmLabel: 'تأكيد كلمة المرور',
    submit: 'إنشاء الحساب',
    errEmailRequired: 'يرجى إدخال البريد الإلكتروني.',
    errPassRequired: 'يرجى إدخال كلمة المرور.',
    errPassMin: 'يجب أن تتكون كلمة المرور من 7 أحرف على الأقل.',
    errConfirmRequired: 'يرجى تأكيد كلمة المرور.',
    errMismatch: 'كلمتا المرور غير متطابقتين.',
    success: (email: string) => `تم إنشاء الحساب بنجاح لـ ${email}!`,
    fail: 'تعذّر إنشاء الحساب',
  },
} as const

type SignUpValues = {
  email: string
  password: string
  confirmPassword: string
}

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = React.useState(false)
  const navigate = useNavigate()
  const { dir } = useDirection()
  const isAr = dir === 'rtl'
  const t = formCopy[isAr ? 'ar' : 'en']

  const formSchema = React.useMemo(
    () =>
      z
        .object({
          email: z.email({
            error: (iss) => (iss.input === '' ? t.errEmailRequired : undefined),
          }),
          password: z
            .string()
            .min(1, t.errPassRequired)
            .min(7, t.errPassMin),
          confirmPassword: z.string().min(1, t.errConfirmRequired),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t.errMismatch,
          path: ['confirmPassword'],
        }),
    [t]
  )

  const form = useForm<SignUpValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignUpValues) {
    setIsLoading(true)
    try {
      const res = await api.auth.register({
        email: data.email,
        password: data.password,
      })
      if (res?.token && res?.user) {
        localStorage.setItem('saas_auth_token', res.token)
        const { auth } = useAuthStore.getState()
        auth.setUser({
          accountNo: res.user.id,
          email: res.user.email,
          role: [res.user.role],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
        auth.setAccessToken(res.token)
      }
      toast.success(t.success(data.email))
      await useSaaSStore.getState().fetchFromBackend()
      navigate({ to: '/onboarding', replace: true })
    } catch (err: any) {
      toast.error(err.message || t.fail)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-xs font-semibold text-foreground'>
                {t.emailLabel}
              </FormLabel>
              <FormControl>
                <div className='relative'>
                  <Mail className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2' />
                  <Input
                    placeholder={t.emailPlaceholder}
                    className='ps-10 h-11 rounded-2xl text-xs bg-muted/40 dark:bg-muted/20 border-border/80 focus-visible:border-[#00D632] focus-visible:ring-[#00D632]/30'
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className='text-[11px]' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-xs font-semibold text-foreground'>
                {t.passLabel}
              </FormLabel>
              <FormControl>
                <div className='relative'>
                  <Lock className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none' />
                  <PasswordInput
                    placeholder='••••••••'
                    className='[&_input]:ps-10 [&_input]:h-11 [&_input]:rounded-2xl [&_input]:text-xs [&_input]:bg-muted/40 dark:[&_input]:bg-muted/20 [&_input]:border-border/80'
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className='text-[11px]' />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-xs font-semibold text-foreground'>
                {t.confirmLabel}
              </FormLabel>
              <FormControl>
                <div className='relative'>
                  <Lock className='size-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none' />
                  <PasswordInput
                    placeholder='••••••••'
                    className='[&_input]:ps-10 [&_input]:h-11 [&_input]:rounded-2xl [&_input]:text-xs [&_input]:bg-muted/40 dark:[&_input]:bg-muted/20 [&_input]:border-border/80'
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className='text-[11px]' />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='w-full h-12 rounded-full font-bold text-sm bg-[#061006] hover:bg-black text-white dark:bg-[#00D632] dark:hover:bg-[#19e848] dark:text-[#061006] shadow-lg active:scale-[0.99] transition-all gap-2 mt-2 cursor-pointer'
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <>
              <span>{t.submit}</span>
              <ArrowRight className={`size-4 ${isAr ? 'rotate-180' : ''}`} />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
