import * as React from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Store,
  GitBranch,
  Package,
  Users,
  Calendar,
  Edit2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  QrCode,
  Coins,
  Shield,
  Copy,
  Check,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSaaSStore } from '@/lib/saas-store'
import { Merchant, MerchantStatus } from '@/types/saas'
import { MerchantQrButton } from '@/components/merchant-qr-modal'

interface MerchantDetailsSheetProps {
  merchant: Merchant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (merchant: Merchant) => void
}

export function MerchantDetailsSheet({
  merchant,
  open,
  onOpenChange,
  onEdit,
}: MerchantDetailsSheetProps) {
  const {
    currencies,
    branches,
    products,
    users,
    setMerchantStatus,
  } = useSaaSStore()

  const [copiedId, setCopiedId] = React.useState(false)

  if (!merchant) return null

  const mCurr = currencies.find((c) => c.id === merchant.currencyId)
  const merchantBranches = branches.filter((b) => b.merchantId === merchant.id)
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id)
  const merchantStaff = users.filter((u) => u.merchantId === merchant.id)

  const copyMerchantId = () => {
    navigator.clipboard.writeText(merchant.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const getStatusBadge = (status: MerchantStatus) => {
    switch (status) {
      case 'Active':
        return (
          <Badge
            variant='outline'
            className='bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50 flex items-center gap-1 font-semibold'
          >
            <CheckCircle2 className='size-3' /> Active
          </Badge>
        )
      case 'Pending':
        return (
          <Badge
            variant='outline'
            className='bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/50 flex items-center gap-1 font-semibold'
          >
            <Clock className='size-3' /> Pending
          </Badge>
        )
      case 'Suspended':
        return (
          <Badge
            variant='outline'
            className='bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/50 flex items-center gap-1 font-semibold'
          >
            <AlertTriangle className='size-3' /> Suspended
          </Badge>
        )
      default:
        return (
          <Badge
            variant='outline'
            className='bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50 flex items-center gap-1 font-semibold'
          >
            <XCircle className='size-3' /> Inactive
          </Badge>
        )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='sm:max-w-xl w-full p-0 flex flex-col gap-0 border-s bg-background'
      >
        {/* Top Header Card */}
        <div className='p-6 border-b border-border/60 bg-muted/20'>
          <SheetHeader className='p-0 space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-center gap-3.5'>
                {merchant.logo ? (
                  <img
                    src={merchant.logo}
                    alt={merchant.name}
                    className='size-14 rounded-2xl object-cover border border-border/80 shadow-xs shrink-0'
                  />
                ) : (
                  <div className='size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#3EEA85] flex items-center justify-center font-bold text-xl shrink-0 shadow-xs border border-emerald-500/20'>
                    {merchant.name[0]}
                  </div>
                )}
                <div>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <SheetTitle className='text-lg font-bold text-foreground'>
                      {merchant.name}
                    </SheetTitle>
                    {getStatusBadge(merchant.status)}
                  </div>
                  <SheetDescription className='text-xs text-muted-foreground mt-0.5'>
                    Merchant ID: <span className='font-mono text-foreground'>{merchant.id}</span>
                  </SheetDescription>
                </div>
              </div>

              <div className='flex items-center gap-2 shrink-0'>
                <MerchantQrButton merchant={merchant} variant='outline' />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    onEdit(merchant)
                  }}
                  className='h-8 px-3 rounded-lg text-xs gap-1.5 shrink-0'
                >
                  <Edit2 className='size-3.5 text-primary' />
                  Edit
                </Button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className='grid grid-cols-4 gap-2 pt-1'>
              <div className='rounded-xl bg-background border border-border/60 p-2.5 text-center shadow-2xs'>
                <div className='flex items-center justify-center text-muted-foreground mb-1'>
                  <GitBranch className='size-3.5' />
                </div>
                <div className='font-bold text-sm text-foreground'>
                  {merchantBranches.length}
                </div>
                <div className='text-[10px] text-muted-foreground font-medium'>
                  Branches
                </div>
              </div>

              <div className='rounded-xl bg-background border border-border/60 p-2.5 text-center shadow-2xs'>
                <div className='flex items-center justify-center text-muted-foreground mb-1'>
                  <Package className='size-3.5' />
                </div>
                <div className='font-bold text-sm text-foreground'>
                  {merchantProducts.length}
                </div>
                <div className='text-[10px] text-muted-foreground font-medium'>
                  Products
                </div>
              </div>

              <div className='rounded-xl bg-background border border-border/60 p-2.5 text-center shadow-2xs'>
                <div className='flex items-center justify-center text-muted-foreground mb-1'>
                  <Users className='size-3.5' />
                </div>
                <div className='font-bold text-sm text-foreground'>
                  {merchantStaff.length}
                </div>
                <div className='text-[10px] text-muted-foreground font-medium'>
                  Staff
                </div>
              </div>

              <div className='rounded-xl bg-background border border-border/60 p-2.5 text-center shadow-2xs'>
                <div className='flex items-center justify-center text-muted-foreground mb-1'>
                  <Coins className='size-3.5' />
                </div>
                <div className='font-bold text-sm text-foreground font-mono'>
                  {mCurr?.code || 'USD'}
                </div>
                <div className='text-[10px] text-muted-foreground font-medium'>
                  Currency
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Content with Tabs */}
        <Tabs defaultValue='overview' className='flex-1 flex flex-col min-h-0'>
          <div className='px-6 pt-3 border-b border-border/60 bg-muted/10'>
            <TabsList className='w-full grid grid-cols-4 h-9 p-1 rounded-xl bg-muted/50'>
              <TabsTrigger value='overview' className='text-xs rounded-lg'>
                Overview
              </TabsTrigger>
              <TabsTrigger value='branches' className='text-xs rounded-lg'>
                Branches ({merchantBranches.length})
              </TabsTrigger>
              <TabsTrigger value='products' className='text-xs rounded-lg'>
                Products ({merchantProducts.length})
              </TabsTrigger>
              <TabsTrigger value='staff' className='text-xs rounded-lg'>
                Staff ({merchantStaff.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className='flex-1 px-6 py-4'>
            {/* OVERVIEW TAB */}
            <TabsContent value='overview' className='m-0 space-y-4'>
              {/* Contact Information */}
              <Card className='p-4 border-border/70 rounded-xl space-y-3 bg-card'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                  <Store className='size-3.5 text-primary' />
                  Contact & Location
                </h4>

                <div className='space-y-2.5 text-xs'>
                  <div className='flex items-start justify-between gap-3'>
                    <span className='text-muted-foreground flex items-center gap-1.5 shrink-0'>
                      <Mail className='size-3.5' /> Email:
                    </span>
                    <a
                      href={`mailto:${merchant.email}`}
                      className='font-medium text-foreground hover:text-primary transition-colors truncate'
                    >
                      {merchant.email}
                    </a>
                  </div>

                  <div className='flex items-start justify-between gap-3'>
                    <span className='text-muted-foreground flex items-center gap-1.5 shrink-0'>
                      <Phone className='size-3.5' /> Phone:
                    </span>
                    <span className='font-medium font-mono text-foreground'>
                      {merchant.phone || '—'}
                    </span>
                  </div>

                  <div className='flex items-start justify-between gap-3'>
                    <span className='text-muted-foreground flex items-center gap-1.5 shrink-0'>
                      <MapPin className='size-3.5' /> Address:
                    </span>
                    <span className='font-medium text-foreground text-end'>
                      {merchant.address || '—'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Status Management */}
              <Card className='p-4 border-border/70 rounded-xl space-y-3 bg-card'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                    <Shield className='size-3.5 text-primary' />
                    Operational Status
                  </h4>
                  {getStatusBadge(merchant.status)}
                </div>

                <div className='grid grid-cols-2 gap-2 pt-1'>
                  <Button
                    size='sm'
                    variant={merchant.status === 'Active' ? 'default' : 'outline'}
                    onClick={() => setMerchantStatus(merchant.id, 'Active')}
                    className='h-8 text-xs justify-start gap-1.5 rounded-lg'
                  >
                    <CheckCircle2 className='size-3.5 text-emerald-500' />
                    Active
                  </Button>
                  <Button
                    size='sm'
                    variant={merchant.status === 'Pending' ? 'default' : 'outline'}
                    onClick={() => setMerchantStatus(merchant.id, 'Pending')}
                    className='h-8 text-xs justify-start gap-1.5 rounded-lg'
                  >
                    <Clock className='size-3.5 text-amber-500' />
                    Pending
                  </Button>
                  <Button
                    size='sm'
                    variant={merchant.status === 'Inactive' ? 'default' : 'outline'}
                    onClick={() => setMerchantStatus(merchant.id, 'Inactive')}
                    className='h-8 text-xs justify-start gap-1.5 rounded-lg'
                  >
                    <XCircle className='size-3.5 text-slate-400' />
                    Inactive
                  </Button>
                  <Button
                    size='sm'
                    variant={merchant.status === 'Suspended' ? 'destructive' : 'outline'}
                    onClick={() => setMerchantStatus(merchant.id, 'Suspended')}
                    className='h-8 text-xs justify-start gap-1.5 rounded-lg'
                  >
                    <AlertTriangle className='size-3.5 text-rose-500' />
                    Suspended
                  </Button>
                </div>
              </Card>

              {/* System Metadata */}
              <Card className='p-4 border-border/70 rounded-xl space-y-2.5 text-xs bg-card'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                  <Calendar className='size-3.5 text-primary' />
                  System Records
                </h4>

                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>Merchant ID:</span>
                  <button
                    onClick={copyMerchantId}
                    className='font-mono text-[11px] text-foreground bg-muted px-2 py-0.5 rounded flex items-center gap-1 hover:bg-muted/80'
                  >
                    {merchant.id}
                    {copiedId ? (
                      <Check className='size-3 text-emerald-500' />
                    ) : (
                      <Copy className='size-3 text-muted-foreground' />
                    )}
                  </button>
                </div>

                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>Onboarded Date:</span>
                  <span className='font-medium text-foreground'>
                    {merchant.createdAt
                      ? new Date(merchant.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>

                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>Last Updated:</span>
                  <span className='font-medium text-foreground'>
                    {merchant.updatedAt
                      ? new Date(merchant.updatedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
              </Card>
            </TabsContent>

            {/* BRANCHES TAB */}
            <TabsContent value='branches' className='m-0 space-y-3'>
              {merchantBranches.length === 0 ? (
                <div className='py-12 text-center text-muted-foreground text-xs'>
                  <GitBranch className='size-8 mx-auto mb-2 opacity-20' />
                  <p className='font-semibold'>No branches assigned</p>
                  <p className='text-[11px] mt-0.5'>This merchant has no physical branches configured yet.</p>
                </div>
              ) : (
                merchantBranches.map((branch) => (
                  <Card
                    key={branch.id}
                    className='p-3.5 border-border/70 rounded-xl space-y-2 bg-card hover:border-border transition-colors'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <div className='font-semibold text-xs text-foreground'>
                          {branch.name}
                        </div>
                        <div className='text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5'>
                          <MapPin className='size-3 shrink-0' />
                          <span>{branch.address || 'No address specified'}</span>
                        </div>
                      </div>
                      <Badge
                        variant='outline'
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          branch.qrStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/50'
                        }`}
                      >
                        QR: {branch.qrStatus}
                      </Badge>
                    </div>

                    <div className='flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40'>
                      <span className='flex items-center gap-1'>
                        <QrCode className='size-3 text-primary' />
                        Token:
                      </span>
                      <span className='font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded'>
                        {branch.qrToken ? `${branch.qrToken.slice(0, 12)}...` : 'None'}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* PRODUCTS TAB */}
            <TabsContent value='products' className='m-0 space-y-3'>
              {merchantProducts.length === 0 ? (
                <div className='py-12 text-center text-muted-foreground text-xs'>
                  <Package className='size-8 mx-auto mb-2 opacity-20' />
                  <p className='font-semibold'>No products registered</p>
                  <p className='text-[11px] mt-0.5'>This merchant has not cataloged any items yet.</p>
                </div>
              ) : (
                merchantProducts.map((product) => (
                  <Card
                    key={product.id}
                    className='p-3 border-border/70 rounded-xl flex items-center justify-between gap-3 bg-card hover:border-border transition-colors'
                  >
                    <div className='flex items-center gap-2.5 min-w-0'>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className='size-9 rounded-lg object-cover border border-border/60 shrink-0'
                        />
                      ) : (
                        <div className='size-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0'>
                          <Package className='size-4' />
                        </div>
                      )}
                      <div className='min-w-0'>
                        <div className='font-semibold text-xs text-foreground truncate'>
                          {product.name}
                        </div>
                        <div className='text-[10px] text-muted-foreground font-mono truncate'>
                          Barcode: {product.barcode}
                        </div>
                      </div>
                    </div>

                    <div className='text-end shrink-0'>
                      <div className='font-bold text-xs text-foreground font-mono'>
                        {mCurr?.symbol || '$'}{product.price.toFixed(2)}
                      </div>
                      <Badge
                        variant='outline'
                        className={`text-[9px] px-1.5 py-0 rounded ${
                          product.status === 'Active'
                            ? 'text-emerald-600 border-emerald-200/50'
                            : 'text-slate-500 border-slate-200/50'
                        }`}
                      >
                        {product.status}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* STAFF TAB */}
            <TabsContent value='staff' className='m-0 space-y-3'>
              {merchantStaff.length === 0 ? (
                <div className='py-12 text-center text-muted-foreground text-xs'>
                  <Users className='size-8 mx-auto mb-2 opacity-20' />
                  <p className='font-semibold'>No team members</p>
                  <p className='text-[11px] mt-0.5'>No managers or staff accounts are linked to this merchant.</p>
                </div>
              ) : (
                merchantStaff.map((user) => (
                  <Card
                    key={user.id}
                    className='p-3.5 border-border/70 rounded-xl space-y-1.5 bg-card'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='font-semibold text-xs text-foreground'>
                        {user.name}
                      </div>
                      <Badge
                        variant='outline'
                        className='text-[10px] font-mono px-1.5 py-0.5 rounded'
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <div className='text-[11px] text-muted-foreground flex items-center gap-1.5'>
                      <Mail className='size-3' />
                      <span>{user.email}</span>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
