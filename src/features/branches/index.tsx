import * as React from 'react'
import {
  Plus,
  RotateCcw,
  Printer,
  Trash2,
  ExternalLink,
  Store,
  MapPin,
  AlertTriangle,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
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
import { getQRCodeSvg } from '@/lib/qr-generator'
import { Branch } from '@/types/saas'

export function BranchesView() {
  const {
    merchants,
    branches,
    createBranch,
    deleteBranch,
    regenerateBranchQr,
  } = useSaaSStore()

  // State
  const [selectedMerchantId, setSelectedMerchantId] = React.useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [viewingQrBranch, setViewingQrBranch] = React.useState<Branch | null>(null)
  const [regeneratingBranch, setRegeneratingBranch] = React.useState<Branch | null>(null)
  const [deletingBranch, setDeletingBranch] = React.useState<Branch | null>(null)

  // Form Fields
  const [branchName, setBranchName] = React.useState('')
  const [branchAddress, setBranchAddress] = React.useState('')
  const [targetMerchantId, setTargetMerchantId] = React.useState(merchants[0]?.id || '')
  const [error, setError] = React.useState<string | null>(null)

  const openCreate = () => {
    setBranchName('')
    setBranchAddress('')
    setTargetMerchantId(merchants[0]?.id || '')
    setError(null)
    setIsCreateOpen(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchName.trim()) {
      setError('Branch name is required.')
      return
    }
    createBranch(targetMerchantId, branchName.trim(), branchAddress.trim())
    setIsCreateOpen(false)
  }

  // Section 9.3: QR Regeneration execution
  const handleRegenerateConfirm = () => {
    if (regeneratingBranch) {
      regenerateBranchQr(regeneratingBranch.id)
      setRegeneratingBranch(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (deletingBranch) {
      deleteBranch(deletingBranch.id)
      setDeletingBranch(null)
    }
  }

  const filteredBranches = branches.filter((b) => {
    if (selectedMerchantId === 'all') return true
    return b.merchantId === selectedMerchantId
  })

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Platform Super Admin</h1>
          <Badge variant='default' className='text-xs'>
            Branch & QR Management
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
            <h2 className='text-2xl font-bold tracking-tight'>Branches & QR Codes</h2>
            <p className='text-xs text-muted-foreground'>
              Only Super Admin can create branches and generate or regenerate unique non-guessable QR codes.
            </p>
          </div>
          <Button size='sm' onClick={openCreate}>
            <Plus className='mr-1.5 size-4' />
            Create Branch
          </Button>
        </div>

        {/* Filter bar */}
        <Card className='p-3 bg-card'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-xs'>
              <span className='font-medium text-muted-foreground'>Filter by Merchant:</span>
              <select
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className='rounded-md border bg-background px-3 py-1.5 text-xs text-foreground'
              >
                <option value='all'>All Merchants ({branches.length} branches)</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Branches Grid */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {filteredBranches.map((branch) => {
            const merchant = merchants.find((m) => m.id === branch.merchantId)
            const scanUrl = `${window.location.origin}/branch/${branch.qrToken}`
            const qrSvg = getQRCodeSvg(scanUrl, 140)

            return (
              <Card key={branch.id} className='hover:border-primary/50 transition-colors'>
                <CardContent className='p-4 space-y-3.5'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <h4 className='font-bold text-sm text-foreground'>{branch.name}</h4>
                      <div className='flex items-center gap-1.5 text-xs text-primary font-medium mt-0.5'>
                        <Store className='size-3.5' /> {merchant?.name}
                      </div>
                    </div>
                    <Badge variant={branch.qrStatus === 'Active' ? 'outline' : 'destructive'} className='text-[10px]'>
                      QR {branch.qrStatus}
                    </Badge>
                  </div>

                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <MapPin className='size-3.5 shrink-0' />
                    <span className='truncate'>{branch.address || 'No address specified'}</span>
                  </div>

                  {/* QR Preview Box */}
                  <div className='flex flex-col items-center justify-center p-3 bg-muted/40 rounded-lg border'>
                    <div
                      className='p-1.5 bg-white rounded shadow-xs'
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                    <div className='text-[10px] font-mono text-muted-foreground mt-2 truncate max-w-full'>
                      Token: {branch.qrToken}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='pt-2 border-t flex flex-wrap items-center justify-between gap-1.5 text-xs'>
                    <Button asChild size='sm' variant='outline' className='h-7 text-xs px-2'>
                      <Link to='/branch/$token' params={{ token: branch.qrToken }} target='_blank'>
                        <ExternalLink className='mr-1 size-3' /> Open View
                      </Link>
                    </Button>

                    <div className='flex items-center gap-1'>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-7 text-xs px-2 gap-1'
                        onClick={() => setViewingQrBranch(branch)}
                      >
                        <Printer className='size-3' /> Print
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='h-7 text-xs px-2 gap-1'
                        onClick={() => setRegeneratingBranch(branch)}
                      >
                        <RotateCcw className='size-3' /> Regenerate
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='size-7 text-muted-foreground hover:text-destructive'
                        onClick={() => setDeletingBranch(branch)}
                      >
                        <Trash2 className='size-3' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Main>

      {/* Create Branch Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='max-w-md'>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New Branch</DialogTitle>
              <DialogDescription className='text-xs'>
                Branches inherit all products and prices from their parent Merchant. A secure, non-guessable QR code is generated automatically.
              </DialogDescription>
            </DialogHeader>

            {error && <p className='text-xs text-destructive mt-2'>{error}</p>}

            <div className='space-y-3 my-4 text-xs'>
              <div>
                <label className='font-semibold block mb-1'>Parent Merchant *</label>
                <select
                  value={targetMerchantId}
                  onChange={(e) => setTargetMerchantId(e.target.value)}
                  className='w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground'
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='font-semibold block mb-1'>Branch Name *</label>
                <Input
                  required
                  placeholder='e.g. Dokki Branch, Zamalek Store...'
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className='text-xs'
                />
              </div>

              <div>
                <label className='font-semibold block mb-1'>Physical Address</label>
                <Input
                  placeholder='Street, Area, City...'
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' size='sm' onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' size='sm'>
                Generate Branch & QR
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Section 9.3: QR Regeneration Alert Dialog */}
      <Dialog open={!!regeneratingBranch} onOpenChange={(open) => !open && setRegeneratingBranch(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600 dark:text-amber-400'>
              <AlertTriangle className='size-5' /> Regenerate QR Code?
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Section 9.3 Requirement: When a QR Code is regenerated, the <strong>old QR Code becomes invalid immediately</strong>. Only the newly generated QR Code will work for customer scanning.
            </DialogDescription>
          </DialogHeader>

          <div className='rounded bg-muted p-3 text-xs my-2'>
            <p className='font-semibold text-foreground mb-1'>Affected Branch:</p>
            <p>{regeneratingBranch?.name}</p>
            <p className='text-muted-foreground font-mono text-[11px] mt-1'>
              Current Token: {regeneratingBranch?.qrToken}
            </p>
          </div>

          <DialogFooter>
            <Button variant='outline' size='sm' onClick={() => setRegeneratingBranch(null)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={handleRegenerateConfirm}>
              Invalidate Old & Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print / View QR Dialog */}
      <Dialog open={!!viewingQrBranch} onOpenChange={(open) => !open && setViewingQrBranch(null)}>
        <DialogContent className='max-w-sm text-center'>
          <DialogHeader>
            <DialogTitle className='text-center'>Branch Customer QR Code</DialogTitle>
            <DialogDescription className='text-xs text-center'>
              Display this QR code inside <strong>{viewingQrBranch?.name}</strong> for customer barcode lookups.
            </DialogDescription>
          </DialogHeader>

          {viewingQrBranch && (
            <div className='my-4 flex flex-col items-center justify-center space-y-3'>
              <div
                className='p-4 bg-white rounded-xl shadow-md border inline-block'
                dangerouslySetInnerHTML={{
                  __html: getQRCodeSvg(
                    `${window.location.origin}/branch/${viewingQrBranch.qrToken}`,
                    220
                  ),
                }}
              />
              <div className='font-bold text-sm'>
                {merchants.find((m) => m.id === viewingQrBranch.merchantId)?.name}
              </div>
              <div className='text-xs text-muted-foreground'>{viewingQrBranch.name}</div>
            </div>
          )}

          <DialogFooter className='sm:justify-center'>
            <Button size='sm' onClick={() => window.print()} className='gap-2'>
              <Printer className='size-4' /> Print QR Standee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Dialog */}
      <Dialog open={!!deletingBranch} onOpenChange={(open) => !open && setDeletingBranch(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='text-destructive'>Delete Branch?</DialogTitle>
            <DialogDescription className='text-xs'>
              Are you sure you want to delete <strong>{deletingBranch?.name}</strong>? Its QR code will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' size='sm' onClick={() => setDeletingBranch(null)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
