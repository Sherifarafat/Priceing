import * as React from 'react'
import { Check, Sparkles, Zap, Shield } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PlanSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlanSelectionDialog({ open, onOpenChange }: PlanSelectionDialogProps) {
  const [selectedPlan, setSelectedPlan] = React.useState<'starter' | 'pro' | 'enterprise'>('pro')
  const [isAnnual, setIsAnnual] = React.useState(true)

  const handleChoosePlan = (planName: string) => {
    toast.success(`You have selected the ${planName} plan! Special features unlocked.`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl p-6'>
        <DialogHeader className='text-center sm:text-center space-y-1.5'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 text-xs font-semibold mx-auto border border-indigo-100 dark:border-indigo-900/40'>
            <Sparkles className='size-3.5' />
            <span>5 Days Left on Your Free Trial</span>
          </div>
          <DialogTitle className='text-2xl font-black tracking-tight text-foreground'>
            Select your plan to continue
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground max-w-md mx-auto'>
            Unlock unlimited branches, live customer scanning telemetry, price radar and automated compliance logs.
          </DialogDescription>

          {/* Monthly / Annual Toggle */}
          <div className='flex items-center justify-center gap-3 pt-3'>
            <button
              type='button'
              onClick={() => setIsAnnual(false)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                !isAnnual
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly billing
            </button>
            <button
              type='button'
              onClick={() => setIsAnnual(true)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 ${
                isAnnual
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual billing</span>
              <Badge variant='outline' className='bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] border-emerald-200/50 py-0 px-1'>
                Save 20%
              </Badge>
            </button>
          </div>
        </DialogHeader>

        {/* 3 Plans Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4'>
          {/* 1. Starter Trial */}
          <div
            onClick={() => setSelectedPlan('starter')}
            className={`relative rounded-2xl border p-4.5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedPlan === 'starter'
                ? 'border-border shadow-xs bg-muted/20'
                : 'border-border/60 hover:border-border'
            }`}
          >
            <div>
              <div className='font-bold text-sm text-foreground'>Starter</div>
              <p className='text-[11px] text-muted-foreground mt-0.5'>For single local storefronts</p>
              <div className='mt-3 mb-4'>
                <span className='text-2xl font-extrabold text-foreground font-mono'>Free</span>
                <span className='text-xs text-muted-foreground ms-1'>/ 14 days trial</span>
              </div>
              <ul className='space-y-2 text-xs text-muted-foreground'>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-emerald-500 shrink-0' />
                  <span>1 Store Branch</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-emerald-500 shrink-0' />
                  <span>Up to 100 Products</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-emerald-500 shrink-0' />
                  <span>Standard QR Standee</span>
                </li>
              </ul>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='w-full mt-5 text-xs text-muted-foreground cursor-not-allowed'
              disabled
            >
              Current Active Trial
            </Button>
          </div>

          {/* 2. Business Pro (Signature Plan) */}
          <div
            onClick={() => setSelectedPlan('pro')}
            className={`relative rounded-2xl border-2 p-4.5 flex flex-col justify-between transition-all cursor-pointer shadow-md ${
              selectedPlan === 'pro'
                ? 'border-[#4F46E5] bg-indigo-50/20 dark:bg-indigo-950/20'
                : 'border-[#4F46E5]/40 hover:border-[#4F46E5]'
            }`}
          >
            <div className='absolute -top-3 start-1/2 -translate-x-1/2'>
              <span className='bg-[#4F46E5] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs'>
                Most Popular
              </span>
            </div>
            <div>
              <div className='font-bold text-sm text-foreground flex items-center gap-1.5'>
                <span>Business Pro</span>
                <Zap className='size-3.5 text-[#4F46E5] fill-[#4F46E5]' />
              </div>
              <p className='text-[11px] text-muted-foreground mt-0.5'>Complete multi-branch retail network</p>
              <div className='mt-3 mb-4'>
                <span className='text-2xl font-extrabold text-foreground font-mono'>
                  {isAnnual ? 'E£ 799' : 'E£ 999'}
                </span>
                <span className='text-xs text-muted-foreground ms-1'>/ month</span>
              </div>
              <ul className='space-y-2 text-xs text-foreground/90'>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-[#4F46E5] shrink-0 font-bold' />
                  <span className='font-medium'>Unlimited Store Branches</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-[#4F46E5] shrink-0 font-bold' />
                  <span>Real-time Barcode Scanner</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-[#4F46E5] shrink-0 font-bold' />
                  <span>Live Footfall Telemetry</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-[#4F46E5] shrink-0 font-bold' />
                  <span>AI Copilot & Smart Audit</span>
                </li>
              </ul>
            </div>
            <Button
              size='sm'
              className='w-full mt-5 text-xs bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold shadow-xs'
              onClick={() => handleChoosePlan('Business Pro')}
            >
              Upgrade to Pro
            </Button>
          </div>

          {/* 3. Enterprise Scale */}
          <div
            onClick={() => setSelectedPlan('enterprise')}
            className={`relative rounded-2xl border p-4.5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedPlan === 'enterprise'
                ? 'border-border shadow-xs bg-muted/20'
                : 'border-border/60 hover:border-border'
            }`}
          >
            <div>
              <div className='font-bold text-sm text-foreground flex items-center gap-1.5'>
                <span>Enterprise</span>
                <Shield className='size-3.5 text-neutral-500' />
              </div>
              <p className='text-[11px] text-muted-foreground mt-0.5'>Large supermarket chains & franchises</p>
              <div className='mt-3 mb-4'>
                <span className='text-2xl font-extrabold text-foreground font-mono'>
                  {isAnnual ? 'E£ 1,999' : 'E£ 2,499'}
                </span>
                <span className='text-xs text-muted-foreground ms-1'>/ month</span>
              </div>
              <ul className='space-y-2 text-xs text-muted-foreground'>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-emerald-500 shrink-0' />
                  <span>All Business Pro Features</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-emerald-500 shrink-0' />
                  <span>Dedicated Mutual TLS POS API</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-emerald-500 shrink-0' />
                  <span>24/7 Dedicated Account Manager</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Check className='size-3.5 text-emerald-500 shrink-0' />
                  <span>Custom ERP Sync Integrations</span>
                </li>
              </ul>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='w-full mt-5 text-xs font-semibold'
              onClick={() => handleChoosePlan('Enterprise Scale')}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
