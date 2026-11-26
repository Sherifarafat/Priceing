import * as React from 'react'
import {
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  parseCsvText,
  validateImportData,
  getProductImportTemplate,
  getBulkEditTemplate,
  getBulkDeleteTemplate,
  downloadFile,
  ExcelImportRow,
  DuplicateComparison,
  ImportExecutionSummary,
} from '@/lib/excel-utils'

export function ExcelBulkOperationsView() {
  const {
    currentUser,
    merchants,
    currencies,
    products,
    executeExcelImport,
    executeBulkEdit,
    executeBulkDelete,
    hasPermission,
  } = useSaaSStore()

  const merchantId = currentUser.merchantId || merchants[0]?.id || ''
  const merchant = merchants.find((m) => m.id === merchantId)
  const currency = currencies.find((c) => c.id === merchant?.currencyId) || currencies[0]

  const merchantProducts = products.filter((p) => p.merchantId === merchantId)

  // Permissions
  const canImport = hasPermission('excel.import')
  const canBulkEdit = hasPermission('excel.bulk_edit')
  const canBulkDelete = hasPermission('excel.bulk_delete')

  // Import State
  const [fileName, setFileName] = React.useState<string>('')
  const [validationResult, setValidationResult] = React.useState<{
    validRows: ExcelImportRow[]
    invalidRows: ExcelImportRow[]
    duplicates: DuplicateComparison[]
    allRows: ExcelImportRow[]
  } | null>(null)

  // Section 7.3: Duplicate decisions map: barcode -> 'UPDATE' | 'SKIP'
  const [duplicateDecisions, setDuplicateDecisions] = React.useState<Record<string, 'UPDATE' | 'SKIP'>>({})
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = React.useState(false)
  const [importSummary, setImportSummary] = React.useState<ImportExecutionSummary | null>(null)

  // Bulk Edit State
  const [bulkEditText, setBulkEditText] = React.useState('')
  const [bulkEditFileName, setBulkEditFileName] = React.useState('')
  const [bulkEditSummary, setBulkEditSummary] = React.useState<number | null>(null)

  // Bulk Delete State
  const [bulkDeleteText, setBulkDeleteText] = React.useState('')
  const [bulkDeleteFileName, setBulkDeleteFileName] = React.useState('')
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false)
  const [bulkDeleteSummary, setBulkDeleteSummary] = React.useState<number | null>(null)

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCsvText(text)
      const result = validateImportData(parsed, merchantProducts)
      setValidationResult(result)

      // Initialize all duplicates to 'SKIP' by default as a safe precaution (Section 7.3)
      const initialDecisions: Record<string, 'UPDATE' | 'SKIP'> = {}
      result.duplicates.forEach((d) => {
        initialDecisions[d.barcode] = 'SKIP'
      })
      setDuplicateDecisions(initialDecisions)
    }
    reader.readAsText(file)
  }

  // Execute Import
  const handleRunImport = () => {
    if (!validationResult || validationResult.validRows.length === 0) return

    const rowsToProcess = validationResult.validRows.map((r) => ({
      name: r.name,
      barcode: r.barcode,
      price: r.price,
      description: r.description,
      imageUrl: r.imageUrl,
      categoryName: r.categoryName,
      status: r.status,
    }))

    const { imported, updated, skipped } = executeExcelImport(rowsToProcess, duplicateDecisions)

    const failed = validationResult.invalidRows.length
    const errorDetails = validationResult.invalidRows.map((r) => ({
      rowNumber: r.rowNumber,
      barcode: r.barcode,
      errors: r.errors,
    }))

    setImportSummary({
      totalProcessed: validationResult.allRows.length,
      successfullyImported: imported,
      updated,
      skipped,
      failed,
      errorDetails,
    })

    // Reset upload state
    setFileName('')
    setValidationResult(null)
  }

  // Handle Bulk Edit Upload
  const handleBulkEditUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBulkEditFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      setBulkEditText(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleRunBulkEdit = () => {
    const parsed = parseCsvText(bulkEditText)
    if (parsed.length <= 1) return

    const headers = parsed[0].map((h) => h.toLowerCase())
    const barcodeIdx = headers.findIndex((h) => h.includes('barcode'))
    const nameIdx = headers.findIndex((h) => h.includes('name'))
    const priceIdx = headers.findIndex((h) => h.includes('price'))
    const statusIdx = headers.findIndex((h) => h.includes('status'))
    const descIdx = headers.findIndex((h) => h.includes('desc'))

    const updates = []
    for (let i = 1; i < parsed.length; i++) {
      const row = parsed[i]
      const barcode = barcodeIdx !== -1 ? row[barcodeIdx]?.trim() : ''
      if (!barcode) continue

      const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : undefined
      const priceStr = priceIdx !== -1 && row[priceIdx] ? row[priceIdx] : undefined
      const price = priceStr ? parseFloat(priceStr) : undefined
      const statusRaw = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toLowerCase() : undefined
      const status = statusRaw
        ? statusRaw.includes('inact')
          ? ('Inactive' as const)
          : ('Active' as const)
        : undefined
      const description = descIdx !== -1 && row[descIdx] ? row[descIdx] : undefined

      updates.push({ barcode, name, price, status, description })
    }

    const count = executeBulkEdit(updates)
    setBulkEditSummary(count)
    setBulkEditText('')
    setBulkEditFileName('')
  }

  // Handle Bulk Delete Upload
  const handleBulkDeleteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBulkDeleteFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      setBulkDeleteText(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleRunBulkDelete = () => {
    const parsed = parseCsvText(bulkDeleteText)
    if (parsed.length <= 1) return
    const barcodes = parsed.slice(1).map((r) => r[0]?.trim()).filter(Boolean)
    const count = executeBulkDelete(barcodes)
    setBulkDeleteSummary(count)
    setIsBulkDeleteModalOpen(false)
    setBulkDeleteText('')
    setBulkDeleteFileName('')
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='font-semibold text-sm'>Excel Bulk Operations</h1>
          <Badge variant='outline' className='text-xs'>
            {merchant?.name}
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Bulk Product Operations</h2>
          <p className='text-xs text-muted-foreground'>
            Manage large catalogs efficiently via Excel / CSV templates. Export is not included per SRS scope.
          </p>
        </div>

        <Tabs defaultValue='import' className='space-y-4'>
          <TabsList className='grid grid-cols-3 max-w-md'>
            <TabsTrigger value='import' disabled={!canImport}>
              Bulk Import
            </TabsTrigger>
            <TabsTrigger value='edit' disabled={!canBulkEdit}>
              Bulk Edit
            </TabsTrigger>
            <TabsTrigger value='delete' disabled={!canBulkDelete}>
              Bulk Delete
            </TabsTrigger>
          </TabsList>

          {/* ================= 1. BULK IMPORT TAB ================= */}
          <TabsContent value='import' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-3'>
              {/* Step 1: Download Template */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <Download className='size-4 text-primary' /> Step 1: Get Template
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Download the standardized template with verified columns.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full text-xs'
                    onClick={() =>
                      downloadFile(getProductImportTemplate(), 'product_import_template.csv')
                    }
                  >
                    Download Import Template
                  </Button>
                </CardContent>
              </Card>

              {/* Step 2: Upload File */}
              <Card className='md:col-span-2'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <Upload className='size-4 text-primary' /> Step 2: Upload & Validate
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Select your populated file (.csv, .xlsx formatted text) to validate data and detect duplicates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-3'>
                    <label className='flex-1 cursor-pointer rounded-lg border-2 border-dashed p-3 text-center hover:bg-muted/50 transition-colors'>
                      <input
                        type='file'
                        accept='.csv,.txt,.xlsx,.xls'
                        onChange={handleFileUpload}
                        className='hidden'
                      />
                      <span className='text-xs font-medium text-primary'>
                        {fileName ? `File selected: ${fileName}` : 'Click here to choose file'}
                      </span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Validation & Preview Section (Section 7.2 of SRS) */}
            {validationResult && (
              <Card className='animate-in fade-in'>
                <CardHeader className='pb-3'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div>
                      <CardTitle className='text-base flex items-center gap-2'>
                        <Eye className='size-4 text-primary' /> Import Preview & Validation
                      </CardTitle>
                      <CardDescription className='text-xs'>
                        Review parsed rows. Barcodes already in the catalog require your explicit decision.
                      </CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                      {validationResult.duplicates.length > 0 && (
                        <Button
                          variant='secondary'
                          size='sm'
                          className='h-7 text-xs px-2 gap-1.5'
                          onClick={() => setIsDuplicateModalOpen(true)}
                        >
                          <AlertTriangle className='size-3.5 text-amber-500' />
                          Review {validationResult.duplicates.length} Duplicate(s)
                        </Button>
                      )}
                      <Button
                        size='sm'
                        onClick={handleRunImport}
                        disabled={validationResult.validRows.length === 0}
                        className='h-7 text-xs px-3'
                      >
                        Execute Import ({validationResult.validRows.length} valid rows)
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status badges summary */}
                  <div className='flex flex-wrap gap-2 mb-4 text-xs'>
                    <Badge variant='outline'>Total Rows: {validationResult.allRows.length}</Badge>
                    <Badge variant='default' className='bg-green-600'>
                      Valid: {validationResult.validRows.length}
                    </Badge>
                    {validationResult.duplicates.length > 0 && (
                      <Badge variant='destructive' className='bg-amber-600'>
                        Duplicates Detected: {validationResult.duplicates.length}
                      </Badge>
                    )}
                    {validationResult.invalidRows.length > 0 && (
                      <Badge variant='destructive'>Invalid Rows: {validationResult.invalidRows.length}</Badge>
                    )}
                  </div>

                  {/* Preview Table */}
                  <div className='overflow-x-auto rounded-md border text-xs max-h-72'>
                    <table className='w-full text-left'>
                      <thead className='bg-muted text-[10px] uppercase font-bold sticky top-0'>
                        <tr>
                          <th className='p-2.5'>Row</th>
                          <th className='p-2.5'>Product Name</th>
                          <th className='p-2.5'>Barcode</th>
                          <th className='p-2.5'>Price</th>
                          <th className='p-2.5'>Category</th>
                          <th className='p-2.5'>Duplicate?</th>
                          <th className='p-2.5'>Validation Status</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {validationResult.allRows.map((row) => {
                          const isDup = validationResult.duplicates.some((d) => d.barcode === row.barcode)
                          const decision = duplicateDecisions[row.barcode] || 'SKIP'
                          return (
                            <tr key={row.rowNumber} className={row.isValid ? '' : 'bg-destructive/10'}>
                              <td className='p-2.5 font-mono'>{row.rowNumber}</td>
                              <td className='p-2.5 font-semibold'>{row.name || '—'}</td>
                              <td className='p-2.5 font-mono'>{row.barcode || '—'}</td>
                              <td className='p-2.5 font-mono'>{currency.symbol} {row.price.toFixed(2)}</td>
                              <td className='p-2.5'>{row.categoryName || 'Uncategorized'}</td>
                              <td className='p-2.5'>
                                {isDup ? (
                                  <Badge
                                    variant='outline'
                                    className={`text-[10px] cursor-pointer ${
                                      decision === 'UPDATE' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-amber-500 text-amber-500'
                                    }`}
                                    onClick={() => setIsDuplicateModalOpen(true)}
                                  >
                                    Duplicate ({decision})
                                  </Badge>
                                ) : (
                                  <span className='text-muted-foreground text-[10px]'>New</span>
                                )}
                              </td>
                              <td className='p-2.5'>
                                {row.isValid ? (
                                  <Badge variant='outline' className='text-green-600 border-green-600 text-[10px]'>
                                    <CheckCircle2 className='size-3 mr-1' /> Valid
                                  </Badge>
                                ) : (
                                  <div className='text-destructive text-[11px] font-medium'>
                                    {row.errors.join(' ')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 7.4: Execution Summary Alert */}
            {importSummary && (
              <Card className='border-green-500/50 bg-green-50/50 dark:bg-green-950/20 animate-in fade-in'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm text-green-700 dark:text-green-300 flex items-center gap-2'>
                    <CheckCircle2 className='size-4' /> Section 7.4 Import Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className='text-xs space-y-2'>
                  <div className='grid grid-cols-2 sm:grid-cols-5 gap-2 font-semibold'>
                    <div>Processed: {importSummary.totalProcessed}</div>
                    <div className='text-green-600'>Imported: {importSummary.successfullyImported}</div>
                    <div className='text-[#4F46E5] dark:text-indigo-400'>Updated: {importSummary.updated}</div>
                    <div className='text-amber-600'>Skipped: {importSummary.skipped}</div>
                    <div className='text-red-600'>Failed: {importSummary.failed}</div>
                  </div>
                  {importSummary.errorDetails.length > 0 && (
                    <div className='mt-2 rounded border border-red-200 p-2 text-destructive bg-background'>
                      <p className='font-bold mb-1'>Error Details:</p>
                      {importSummary.errorDetails.map((err, idx) => (
                        <p key={idx}>
                          Row {err.rowNumber} (Barcode: {err.barcode}): {err.errors.join(', ')}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ================= 2. BULK EDIT TAB ================= */}
          <TabsContent value='edit' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Step 1: Download Bulk Edit Template</CardTitle>
                  <CardDescription className='text-xs'>
                    Columns: Barcode (Key), Product Name, New Price, Status, Description
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-xs'
                    onClick={() => downloadFile(getBulkEditTemplate(), 'bulk_edit_template.csv')}
                  >
                    Download Edit Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Step 2: Upload Populated Edit File</CardTitle>
                  <CardDescription className='text-xs'>
                    Updates existing products matching barcodes.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <input
                    type='file'
                    accept='.csv,.txt,.xlsx,.xls'
                    onChange={handleBulkEditUpload}
                    className='text-xs'
                  />
                  {bulkEditFileName && (
                    <Button size='sm' onClick={handleRunBulkEdit} className='text-xs'>
                      Execute Bulk Edit
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {bulkEditSummary !== null && (
              <Card className='border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20'>
                <CardContent className='p-4 text-xs font-semibold text-indigo-700 dark:text-indigo-300'>
                  Successfully updated {bulkEditSummary} products in catalog.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ================= 3. BULK DELETE TAB ================= */}
          <TabsContent value='delete' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Step 1: Download Bulk Delete Template</CardTitle>
                  <CardDescription className='text-xs'>
                    Single column containing target barcodes to delete.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-xs'
                    onClick={() => downloadFile(getBulkDeleteTemplate(), 'bulk_delete_template.csv')}
                  >
                    Download Delete Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Step 2: Upload File for Deletion</CardTitle>
                  <CardDescription className='text-xs'>
                    Section 7.5: Bulk Delete requires explicit confirmation.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <input
                    type='file'
                    accept='.csv,.txt,.xlsx,.xls'
                    onChange={handleBulkDeleteUpload}
                    className='text-xs'
                  />
                  {bulkDeleteFileName && (
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className='text-xs'
                    >
                      Review & Delete Products
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {bulkDeleteSummary !== null && (
              <Card className='border-red-500/50 bg-red-50/50 dark:bg-red-950/20'>
                <CardContent className='p-4 text-xs font-semibold text-red-700 dark:text-red-300'>
                  Successfully deleted {bulkDeleteSummary} products from catalog.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </Main>

      {/* Section 7.3: Duplicate Barcode Comparison Modal */}
      <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600 dark:text-amber-400'>
              <AlertTriangle className='size-5' /> Duplicate Barcodes Detected
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Section 7.3: The system must NEVER automatically overwrite existing products without your approval. Choose whether to <strong>Update Existing</strong> or <strong>Skip</strong> for each barcode.
            </DialogDescription>
          </DialogHeader>

          <div className='my-3 flex justify-end gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='h-7 text-xs px-2'
              onClick={() => {
                const updated: Record<string, 'UPDATE' | 'SKIP'> = {}
                validationResult?.duplicates.forEach((d) => (updated[d.barcode] = 'SKIP'))
                setDuplicateDecisions(updated)
              }}
            >
              Skip All
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='h-7 text-xs px-2'
              onClick={() => {
                const updated: Record<string, 'UPDATE' | 'SKIP'> = {}
                validationResult?.duplicates.forEach((d) => (updated[d.barcode] = 'UPDATE'))
                setDuplicateDecisions(updated)
              }}
            >
              Update All
            </Button>
          </div>

          <div className='space-y-3'>
            {validationResult?.duplicates.map((dup) => {
              const currentDecision = duplicateDecisions[dup.barcode] || 'SKIP'
              return (
                <div key={dup.barcode} className='rounded-lg border bg-card p-3 text-xs space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='font-mono font-bold text-foreground'>
                      Barcode: {dup.barcode}
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Button
                        size='sm'
                        variant={currentDecision === 'SKIP' ? 'default' : 'outline'}
                        className='h-6 text-[11px] px-2'
                        onClick={() =>
                          setDuplicateDecisions((prev) => ({ ...prev, [dup.barcode]: 'SKIP' }))
                        }
                      >
                        Skip
                      </Button>
                      <Button
                        size='sm'
                        variant={currentDecision === 'UPDATE' ? 'default' : 'outline'}
                        className='h-6 text-[11px] px-2'
                        onClick={() =>
                          setDuplicateDecisions((prev) => ({ ...prev, [dup.barcode]: 'UPDATE' }))
                        }
                      >
                        Update Existing
                      </Button>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison (Existing vs Incoming) */}
                  <div className='grid grid-cols-2 gap-2 rounded bg-muted/50 p-2'>
                    <div>
                      <span className='font-bold text-[10px] text-muted-foreground uppercase'>
                        Existing in Catalog:
                      </span>
                      <p className='font-semibold text-foreground truncate'>
                        {dup.existingProduct.name}
                      </p>
                      <p className='font-mono text-primary'>
                        {currency.symbol} {dup.existingProduct.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className='font-bold text-[10px] text-muted-foreground uppercase'>
                        Incoming from File:
                      </span>
                      <p className='font-semibold text-foreground truncate'>{dup.newRow.name}</p>
                      <p className='font-mono text-primary'>
                        {currency.symbol} {dup.newRow.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button size='sm' onClick={() => setIsDuplicateModalOpen(false)}>
              Save Decisions & Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section 7.5: Explicit Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='size-5' /> Confirm Bulk Delete
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Are you sure you want to permanently delete all products matching barcodes in file{' '}
              <strong>{bulkDeleteFileName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' size='sm' onClick={() => setIsBulkDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={handleRunBulkDelete}>
              Confirm Permanent Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
