import * as React from 'react'
import { Plus, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useSaaSStore } from '@/lib/saas-store'
import { Currency, EntityStatus } from '@/types/saas'

export function CurrenciesView() {
  const { currencies, merchants, createCurrency, updateCurrency } = useSaaSStore()

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCurrency, setEditingCurrency] = React.useState<Currency | null>(null)
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState('')
  const [symbol, setSymbol] = React.useState('')
  const [status, setStatus] = React.useState<EntityStatus>('Active')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim() || !symbol.trim()) return

    if (editingCurrency) {
      updateCurrency(editingCurrency.id, name.trim(), symbol.trim(), status)
      setEditingCurrency(null)
    } else {
      createCurrency(code.trim().toUpperCase(), name.trim(), symbol.trim())
      setIsCreateOpen(false)
    }
    setCode('')
    setName('')
    setSymbol('')
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Platform Super Admin</h1>
          <Badge variant='default' className='text-xs'>
            Currency Management
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 md:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Supported Currencies</h2>
            <p className='text-xs text-muted-foreground'>
              Section 2.5: Super Admin manages currencies. Changing a merchant currency does NOT convert prices.
            </p>
          </div>
          <Button
            size='sm'
            onClick={() => {
              setCode('')
              setName('')
              setSymbol('')
              setStatus('Active')
              setIsCreateOpen(true)
            }}
          >
            <Plus className='mr-1.5 size-4' />
            Add Currency
          </Button>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {currencies.map((currency) => {
            const count = merchants.filter((m) => m.currencyId === currency.id).length
            return (
              <Card key={currency.id} className='hover:border-primary/50 transition-colors'>
                <CardContent className='p-4 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 font-bold text-xs font-mono'>
                        {currency.symbol}
                      </div>
                      <div>
                        <h4 className='font-bold text-sm text-foreground'>{currency.code}</h4>
                        <p className='text-xs text-muted-foreground'>{currency.name}</p>
                      </div>
                    </div>

                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      onClick={() => {
                        setEditingCurrency(currency)
                        setCode(currency.code)
                        setName(currency.name)
                        setSymbol(currency.symbol)
                        setStatus(currency.status)
                      }}
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                  </div>

                  <div className='pt-2 border-t flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground text-[11px]'>{count} merchants using</span>
                    <Badge variant={currency.status === 'Active' ? 'default' : 'secondary'} className='text-[10px]'>
                      {currency.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Main>

      <Dialog
        open={isCreateOpen || !!editingCurrency}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingCurrency(null)
          }
        }}
      >
        <DialogContent className='max-w-sm'>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingCurrency ? 'Edit Currency' : 'Add Supported Currency'}</DialogTitle>
              <DialogDescription className='text-xs'>
                Currencies available for tenant merchants to select from.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 my-4 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='font-semibold block mb-1'>Currency Code *</label>
                  <Input
                    required
                    disabled={!!editingCurrency}
                    placeholder='e.g. USD, EGP'
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className='text-xs uppercase font-mono'
                  />
                </div>
                <div>
                  <label className='font-semibold block mb-1'>Symbol *</label>
                  <Input
                    required
                    placeholder='e.g. $, E£, SAR'
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className='text-xs font-mono'
                  />
                </div>
              </div>

              <div>
                <label className='font-semibold block mb-1'>Currency Name *</label>
                <Input
                  required
                  placeholder='e.g. US Dollar, Egyptian Pound'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='text-xs'
                />
              </div>

              {editingCurrency && (
                <div>
                  <label className='font-semibold block mb-1'>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EntityStatus)}
                    className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                  >
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingCurrency(null)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' size='sm'>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
