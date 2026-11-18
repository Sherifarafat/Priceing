import {
  Shield,
  CheckCircle2,
  Calendar,
  Edit2,
  Trash2,
  Lock,
  Sparkles,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSaaSStore } from '@/lib/saas-store'
import { CustomRole } from '@/types/saas'
import { SYSTEM_PERMISSIONS, PERMISSION_CATEGORIES } from '../data/permissions'

interface RoleDetailsSheetProps {
  role: CustomRole | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (role: CustomRole) => void
  onDelete: (roleId: string) => void
}

export function RoleDetailsSheet({
  role,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: RoleDetailsSheetProps) {
  const { merchants } = useSaaSStore()

  if (!role) return null

  const targetMerchant = role.merchantId
    ? merchants.find((m) => m.id === role.merchantId)
    : null

  const hasAllPermissions = role.permissions.includes('*')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='sm:max-w-xl w-full p-0 flex flex-col gap-0 border-s bg-background'
      >
        {/* Header */}
        <div className='p-6 border-b border-border/60 bg-muted/20'>
          <SheetHeader className='p-0 space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-center gap-3.5'>
                <div className='size-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-xs border bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40'>
                  <Shield className='size-6' />
                </div>
                <div>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <SheetTitle className='text-lg font-bold text-foreground'>
                      {role.name}
                    </SheetTitle>
                    {role.isSystem && (
                      <Badge variant='outline' className='text-[10px] gap-1 font-semibold'>
                        <Lock className='size-2.5' /> System Root
                      </Badge>
                    )}
                  </div>
                  <SheetDescription className='text-xs text-muted-foreground mt-0.5 flex items-center gap-2'>
                    <Badge
                      className={
                        role.scope === 'COMPANY'
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }
                      variant='outline'
                    >
                      {role.scope === 'COMPANY' ? 'Company Master' : 'Merchant Role'}
                    </Badge>
                    <span>•</span>
                    <span>
                      {targetMerchant ? `Assigned to: ${targetMerchant.name}` : 'Global (All Merchants)'}
                    </span>
                  </SheetDescription>
                </div>
              </div>

              {!role.isSystem && (
                <div className='flex items-center gap-1.5 shrink-0'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      onEdit(role)
                      onOpenChange(false)
                    }}
                    className='h-8 px-2.5 text-xs gap-1.5'
                  >
                    <Edit2 className='size-3.5' />
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
                        onDelete(role.id)
                        onOpenChange(false)
                      }
                    }}
                    className='h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10'
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              )}
            </div>

            <p className='text-xs text-muted-foreground bg-background/80 p-3 rounded-xl border border-border/60 leading-relaxed'>
              {role.description}
            </p>
          </SheetHeader>
        </div>

        {/* Permissions Breakdown */}
        <ScrollArea className='flex-1 px-6 py-4'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                <Shield className='size-3.5 text-primary' />
                Granted Permissions
              </h4>
              <Badge variant='outline' className='text-xs font-mono font-semibold'>
                {hasAllPermissions ? 'Full Access (*)' : `${role.permissions.length} Permissions`}
              </Badge>
            </div>

            {hasAllPermissions ? (
              <Card className='p-4 border-primary/20 bg-primary/5 rounded-xl space-y-2'>
                <div className='flex items-center gap-2 font-bold text-xs text-primary'>
                  <Shield className='size-4' />
                  Unrestricted System Master Control
                </div>
                <p className='text-[11px] text-muted-foreground leading-relaxed'>
                  This role possesses full master authority over all platform operations, tenant management, merchant role creation, database records, and platform governance without limitations.
                </p>
              </Card>
            ) : (
              <div className='space-y-3'>
                {PERMISSION_CATEGORIES.map((cat) => {
                  const categoryPermissions = SYSTEM_PERMISSIONS.filter(
                    (p) => p.category === cat.category
                  )
                  const granted = categoryPermissions.filter((p) =>
                    role.permissions.includes(p.key)
                  )

                  if (granted.length === 0) return null

                  return (
                    <Card
                      key={cat.category}
                      className='p-3.5 border-border/70 rounded-xl space-y-2 bg-card'
                    >
                      <div className='flex items-center justify-between border-b border-border/40 pb-2'>
                        <div className='font-bold text-xs text-foreground'>
                          {cat.title}
                        </div>
                        <Badge variant='outline' className='text-[10px]'>
                          {granted.length} / {categoryPermissions.length}
                        </Badge>
                      </div>

                      <div className='space-y-1.5 pt-1'>
                        {granted.map((p) => (
                          <div
                            key={p.key}
                            className='flex items-start gap-2 text-xs py-1 px-2 rounded-lg bg-muted/30'
                          >
                            <CheckCircle2 className='size-3.5 text-emerald-500 mt-0.5 shrink-0' />
                            <div>
                              <div className='font-semibold text-foreground'>{p.label}</div>
                              <div className='text-[10px] text-muted-foreground'>
                                {p.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Metadata Card */}
            <Card className='p-4 border-border/70 rounded-xl space-y-2 text-xs bg-card'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                <Calendar className='size-3.5 text-primary' />
                System Information
              </h4>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span>Role ID:</span>
                <span className='font-mono text-[11px] bg-muted px-2 py-0.5 rounded text-foreground'>
                  {role.id}
                </span>
              </div>
              <div className='flex items-center justify-between text-muted-foreground'>
                <span>Created Date:</span>
                <span className='font-medium text-foreground'>
                  {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
