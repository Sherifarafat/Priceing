import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn, Shield, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useSaaSStore } from '@/lib/saas-store'
import { sleep, cn } from '@/lib/utils'
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

const formSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Please enter your username or email.'),
  password: z.string().min(1, 'Please enter your password.'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { users, switchUser } = useSaaSStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  })

  // Quick fill helper for convenience
  const fillCredentials = (identifier: string, pass: string) => {
    form.setValue('usernameOrEmail', identifier)
    form.setValue('password', pass)
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    await sleep(600)

    const input = data.usernameOrEmail.trim().toLowerCase()
    const pass = data.password.trim()

    // 1. Check if it matches Sherif (Company Super Admin)
    if ((input === 'sherif' || input === 'sherif@company.com') && pass === '123456') {
      const sherifUser = users.find((u) => u.id === 'user-sherif')
      if (sherifUser) {
        switchUser(sherifUser.id)
      }

      auth.setUser({
        accountNo: 'user-sherif',
        email: 'sherif@company.com',
        role: ['SUPER_ADMIN'],
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
      auth.setAccessToken('auth-token-sherif-super-admin')

      setIsLoading(false)
      toast.success('Welcome back, Sherif! Logged in as Company Super Admin.')
      navigate({ to: redirectTo || '/', replace: true })
      return
    }

    // 2. Check other registered users in SaaS store
    const matchedUser = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === input) ||
        u.email.toLowerCase() === input
    )

    if (matchedUser) {
      const validPass = matchedUser.password ? matchedUser.password === pass : pass === '123456'
      if (validPass) {
        switchUser(matchedUser.id)
        auth.setUser({
          accountNo: matchedUser.id,
          email: matchedUser.email,
          role: [matchedUser.role],
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
        auth.setAccessToken(`auth-token-${matchedUser.id}`)

        setIsLoading(false)
        toast.success(`Welcome back, ${matchedUser.name}! (${matchedUser.role})`)
        navigate({ to: redirectTo || '/', replace: true })
        return
      }
    }

    // Invalid credentials
    setIsLoading(false)
    toast.error('Invalid username or password. For Company Super Admin use: sherif / 123456')
  }

  return (
    <div className='space-y-4'>
      {/* Quick Demo Credentials Pill */}
      <div className='rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5'>
        <div className='flex items-center justify-between text-xs font-semibold text-primary'>
          <span className='flex items-center gap-1.5'>
            <Shield className='size-3.5' /> Company Super Admin
          </span>
          <button
            type='button'
            onClick={() => fillCredentials('sherif', '123456')}
            className='text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded font-mono hover:opacity-90 transition-opacity'
          >
            Auto-fill
          </button>
        </div>
        <div className='text-[11px] text-muted-foreground font-mono flex items-center justify-between'>
          <span>User: <strong>sherif</strong></span>
          <span>Pass: <strong>123456</strong></span>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn('grid gap-3', className)}
          {...props}
        >
          <FormField
            control={form.control}
            name='usernameOrEmail'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username or Email</FormLabel>
                <FormControl>
                  <Input placeholder='sherif or user@company.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem className='relative'>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder='Enter your password' {...field} />
                </FormControl>
                <FormMessage />
                <Link
                  to='/forgot-password'
                  className='absolute inset-e-0 -top-0.5 text-xs font-medium text-muted-foreground hover:text-primary'
                >
                  Forgot password?
                </Link>
              </FormItem>
            )}
          />

          <Button className='mt-2 h-10 font-semibold gap-2' disabled={isLoading}>
            {isLoading ? <Loader2 className='size-4 animate-spin' /> : <LogIn className='size-4' />}
            Sign In
          </Button>

          {/* Additional quick demo accounts */}
          <div className='pt-2 border-t border-border/60 text-center'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-wider block mb-2'>
              Or Quick Test Accounts
            </span>
            <div className='grid grid-cols-2 gap-2'>
              <Button
                variant='outline'
                type='button'
                size='sm'
                className='text-[11px] h-8'
                onClick={() => fillCredentials('admin@platform.com', '123456')}
              >
                Platform Admin
              </Button>
              <Button
                variant='outline'
                type='button'
                size='sm'
                className='text-[11px] h-8'
                onClick={() => fillCredentials('manager@metro.com', '123456')}
              >
                Store Manager
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
