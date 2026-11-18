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
  Building2,
  Search,
  Edit2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { LanguageSwitch } from '@/components/language-switch'
import { useSaaSStore } from '@/lib/saas-store'
import { getQRCodeSvg } from '@/lib/qr-generator'
import { Branch } from '@/types/saas'
import { toast } from 'sonner'

export function BranchesView() {
  const {
    merchants,
    branches,
    createBranch,
    updateBranch,
    deleteBranch,
    regenerateBranchQr,
  } = useSaaSStore()

  // State
  const [selectedMerchantId, setSelectedMerchantId] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null)
  const [viewingQrBranch, setViewingQrBranch] = React.useState<Branch | null>(null)
  const [regeneratingBranch, setRegeneratingBranch] = React.useState<Branch | null>(null)
  const [deletingBranch, setDeletingBranch] = React.useState<Branch | null>(null)

  // Form Fields
  const [branchName, setBranchName] = React.useState('')
  const [branchAddress, setBranchAddress] = React.useState('')
  const [branchImageUrl, setBranchImageUrl] = React.useState('')
  const [targetMerchantId, setTargetMerchantId] = React.useState(merchants[0]?.id || '')
  const [error, setError] = React.useState<string | null>(null)

  const openCreate = () => {
    setEditingBranch(null)
    setBranchName('')
    setBranchAddress('')
    setBranchImageUrl('')
    setTargetMerchantId(merchants[0]?.id || '')
    setError(null)
    setIsCreateOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setBranchName(branch.name)
    setBranchAddress(branch.address)
    setBranchImageUrl(branch.imageUrl || '')
    setTargetMerchantId(branch.merchantId)
    setError(null)
    setIsCreateOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchName.trim()) {
      setError('Branch name is required.')
      return
    }

    if (editingBranch) {
      updateBranch(editingBranch.id, branchName.trim(), branchAddress.trim(), branchImageUrl.trim())
      toast.success(`Branch "${branchName}" updated successfully`)
    } else {
      createBranch(targetMerchantId, branchName.trim(), branchAddress.trim(), branchImageUrl.trim())
      toast.success(`Branch "${branchName}" created successfully`)
    }
    setIsCreateOpen(false)
  }

  // Section 9.3: QR Regeneration execution
  const handleRegenerateConfirm = () => {
    if (regeneratingBranch) {
      regenerateBranchQr(regeneratingBranch.id)
      toast.success(`QR token regenerated for ${regeneratingBranch.name}`)
      setRegeneratingBranch(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (deletingBranch) {
      deleteBranch(deletingBranch.id)
      toast.success(`Branch "${deletingBranch.name}" deleted`)
      setDeletingBranch(null)
    }
  }

  const filteredBranches = branches.filter((b) => {
    const matchesMerchant = selectedMerchantId === 'all' || b.merchantId === selectedMerchantId
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMerchant && matchesSearch
  })

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Platform Super Admin</h1>
          <Badge variant='outline' className='text-xs bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border-indigo-200/50'>
            Branch Network
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 p-4 sm:p-6'>
        {/* Title Bar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2.5'>
              <div className='size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold shadow-2xs'>
                <Store className='size-5' />
              </div>
              <div>
                <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                  Branches
                </h1>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  Manage physical store branches, merchant assignments, addresses, and live point-of-sale scanner endpoints.
                </p>
              </div>
            </div>
          </div>
          <Button
            size='sm'
            onClick={openCreate}
            className='gap-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold shadow-xs h-9 px-4 rounded-lg'
          >
            <Plus className='size-4' />
            Create Branch
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          {/* Keyword Search */}
          <div className='relative w-full sm:w-72'>
            <Search className='size-3.5 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2' />
            <Input
              placeholder='Search branch name, address, ID...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='ps-8 h-8 text-xs rounded-lg bg-card border-border/80'
            />
          </div>

          {/* Filter by Merchant */}
          <div className='flex items-center gap-2 w-full sm:w-auto ms-auto'>
            <span className='text-xs font-medium text-muted-foreground whitespace-nowrap'>Merchant:</span>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className='h-8 rounded-lg border border-border/80 bg-card px-2.5 text-xs text-foreground'
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

        {/* Table View (Replaces old Card Grid) */}
        <Card className='border-border/80 shadow-xs overflow-hidden bg-white dark:bg-card rounded-xl'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-border/70 bg-slate-50/80 dark:bg-muted/40 hover:bg-slate-50/80 dark:hover:bg-muted/40'>
                  <TableHead className='ps-5 py-3.5 text-xs font-semibold text-foreground'>
                    Branch & Storefront
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Merchant
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground'>
                    Physical Address
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Status
                  </TableHead>
                  <TableHead className='py-3.5 text-xs font-semibold text-foreground text-center'>
                    Customer Scanner
                  </TableHead>
                  <TableHead className='pe-5 py-3.5 text-xs font-semibold text-foreground text-end'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-40 text-center text-muted-foreground text-xs'>
                      <Store className='size-8 mx-auto mb-2 opacity-25' />
                      <p className='font-semibold'>No branches found</p>
                      <p className='text-[11px] mt-0.5'>Click "Create Branch" above to add a new physical location.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => {
                    const merchant = merchants.find((m) => m.id === branch.merchantId)

                    return (
                      <TableRow
                        key={branch.id}
                        className='bg-white dark:bg-card hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 border-b border-border/40 transition-colors'
                      >
                        {/* Branch Logo / Image & Title */}
                        <TableCell className='ps-5 py-3.5 font-semibold text-xs text-foreground'>
                          <div className='flex items-center gap-3'>
                            {branch.imageUrl ? (
                              <img
                                src={branch.imageUrl}
                                alt={branch.name}
                                className='size-10 rounded-xl object-cover border border-border/70 shrink-0 shadow-2xs'
                              />
                            ) : (
                              <div className='size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold shrink-0 shadow-2xs'>
                                <Store className='size-5' />
                              </div>
                            )}
                            <div className='min-w-0'>
                              <div className='font-bold text-sm text-foreground truncate'>
                                {branch.name}
                              </div>
                              <div className='text-[10px] text-muted-foreground font-mono truncate'>
                                {branch.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Merchant */}
                        <TableCell className='py-3.5 text-xs'>
                          <Badge variant='outline' className='bg-muted/50 font-normal inline-flex items-center gap-1.5'>
                            <Building2 className='size-3 text-muted-foreground' />
                            {merchant?.name || 'Unassigned'}
                          </Badge>
                        </TableCell>

                        {/* Address */}
                        <TableCell className='py-3.5 text-xs text-muted-foreground'>
                          <div className='flex items-center gap-1.5 max-w-xs truncate'>
                            <MapPin className='size-3.5 text-muted-foreground shrink-0' />
                            <span className='truncate'>{branch.address || 'No physical address specified'}</span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className='py-3.5 text-center'>
                          <Badge
                            variant='outline'
                            className={
                              branch.qrStatus === 'Active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/50 text-[11px]'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/50 text-[11px]'
                            }
                          >
                            {branch.qrStatus === 'Active' ? (
                              <CheckCircle2 className='size-3 mr-1 inline' />
                            ) : (
                              <XCircle className='size-3 mr-1 inline' />
                            )}
                            {branch.qrStatus}
                          </Badge>
                        </TableCell>

                        {/* Live POS Scanner Link */}
                        <TableCell className='py-3.5 text-center'>
                          <Button
                            asChild
                            size='sm'
                            variant='outline'
                            className='h-7 text-xs px-2.5 rounded-lg gap-1.5 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors'
                          >
                            <Link to='/branch/$token' params={{ token: branch.qrToken }} target='_blank'>
                              <ExternalLink className='size-3' /> Open Live POS
                            </Link>
                          </Button>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className='pe-5 py-3.5 text-end'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              title='Print Branch Standee QR'
                              onClick={() => setViewingQrBranch(branch)}
                              className='size-7 rounded-lg text-muted-foreground hover:text-foreground'
                            >
                              <Printer className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              title='Regenerate Secure Token'
                              onClick={() => setRegeneratingBranch(branch)}
                              className='size-7 rounded-lg text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            >
                              <RotateCcw className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              title='Edit Branch'
                              onClick={() => openEdit(branch)}
                              className='size-7 rounded-lg text-muted-foreground hover:text-foreground'
                            >
                              <Edit2 className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              title='Delete Branch'
                              onClick={() => setDeletingBranch(branch)}
                              className='size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                            >
                              <Trash2 className='size-3.5' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Main>

      {/* Create / Edit Branch Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='max-w-md'>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Store className='size-5 text-[#4F46E5]' />
                {editingBranch ? 'Edit Branch' : 'Create New Branch'}
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Branches inherit catalog products from their parent Merchant and provide a dedicated scanner endpoint.
              </DialogDescription>
            </DialogHeader>

            {error && <p className='text-xs text-destructive mt-2'>{error}</p>}

            <div className='space-y-3.5 my-4 text-xs'>
              {!editingBranch && (
                <div>
                  <label className='font-semibold block mb-1.5 text-foreground'>Parent Merchant *</label>
                  <select
                    value={targetMerchantId}
                    onChange={(e) => setTargetMerchantId(e.target.value)}
                    className='w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs text-foreground'
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className='font-semibold block mb-1.5 text-foreground'>Branch Name *</label>
                <Input
                  required
                  placeholder='e.g. Dokki Branch or Downtown Store'
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className='text-xs h-9 rounded-lg'
                />
              </div>

              <div>
                <label className='font-semibold block mb-1.5 text-foreground'>Physical Address</label>
                <Input
                  placeholder='Street, Area, City...'
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className='text-xs h-9 rounded-lg'
                />
              </div>

              <div>
                <label className='font-semibold block mb-1.5 text-foreground'>Storefront Logo / Image URL (Optional)</label>
                <Input
                  placeholder='https://images.unsplash.com/...'
                  value={branchImageUrl}
                  onChange={(e) => setBranchImageUrl(e.target.value)}
                  className='text-xs h-9 rounded-lg'
                />
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button type='button' variant='outline' size='sm' onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' size='sm' className='bg-[#4F46E5] hover:bg-indigo-700 text-white'>
                {editingBranch ? 'Save Changes' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Regeneration Alert Dialog */}
      <Dialog open={!!regeneratingBranch} onOpenChange={(open) => !open && setRegeneratingBranch(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600 dark:text-amber-400'>
              <AlertTriangle className='size-5' /> Regenerate QR Code?
            </DialogTitle>
            <DialogDescription className='text-xs'>
              When a QR code is regenerated, the <strong>old QR code will become invalid immediately</strong>. Only the newly generated token will allow customer scanning.
            </DialogDescription>
          </DialogHeader>

          <div className='rounded-xl bg-muted/60 p-3 text-xs my-2 border border-border/60'>
            <p className='font-semibold text-foreground mb-1'>Target Branch:</p>
            <p className='font-bold text-foreground'>{regeneratingBranch?.name}</p>
            <p className='text-muted-foreground font-mono text-[11px] mt-1'>
              Current Token: {regeneratingBranch?.qrToken}
            </p>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' size='sm' onClick={() => setRegeneratingBranch(null)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={handleRegenerateConfirm}>
              Invalidate Old & Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print QR Standee Dialog */}
      <Dialog open={!!viewingQrBranch} onOpenChange={(open) => !open && setViewingQrBranch(null)}>
        <DialogContent className='max-w-sm text-center'>
          <DialogHeader>
            <DialogTitle className='text-center'>Branch Customer QR Code</DialogTitle>
            <DialogDescription className='text-xs text-center'>
              Print and display this QR standee inside <strong>{viewingQrBranch?.name}</strong> for customer barcode lookups.
            </DialogDescription>
          </DialogHeader>

          {viewingQrBranch && (
            <div className='my-4 flex flex-col items-center justify-center space-y-3'>
              <div
                className='p-4 bg-white rounded-2xl shadow-md border inline-block'
                dangerouslySetInnerHTML={{
                  __html: getQRCodeSvg(
                    `${window.location.origin}/branch/${viewingQrBranch.qrToken}`,
                    200
                  ),
                }}
              />
              <div className='font-bold text-sm text-foreground'>
                {merchants.find((m) => m.id === viewingQrBranch.merchantId)?.name}
              </div>
              <div className='text-xs text-muted-foreground'>{viewingQrBranch.name}</div>
              <div className='text-[10px] text-muted-foreground font-mono'>{viewingQrBranch.address}</div>
            </div>
          )}

          <DialogFooter className='sm:justify-center'>
            <Button size='sm' onClick={() => window.print()} className='gap-2 bg-[#4F46E5] hover:bg-indigo-700 text-white'>
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
              Are you sure you want to delete <strong>{deletingBranch?.name}</strong>? Its customer QR scanning will be permanently disabled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
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
