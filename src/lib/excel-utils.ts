import { Product } from '@/types/saas'

export interface ExcelImportRow {
  rowNumber: number
  name: string
  barcode: string
  price: number
  description?: string
  imageUrl?: string
  categoryName?: string
  status: 'Active' | 'Inactive'
  isValid: boolean
  errors: string[]
}

export interface DuplicateComparison {
  barcode: string
  existingProduct: Product
  newRow: ExcelImportRow
  action: 'UPDATE' | 'SKIP' | 'PENDING'
}

export interface ImportValidationResult {
  validRows: ExcelImportRow[]
  invalidRows: ExcelImportRow[]
  duplicates: DuplicateComparison[]
  allRows: ExcelImportRow[]
}

export interface ImportExecutionSummary {
  totalProcessed: number
  successfullyImported: number
  updated: number
  skipped: number
  failed: number
  errorDetails: { rowNumber: number; barcode: string; errors: string[] }[]
}

/**
 * Parses CSV text into rows, handling quotes and commas.
 */
export function parseCsvText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  return lines.map((line) => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

/**
 * Validates Excel/CSV rows according to Section 7 of SRS
 */
export function validateImportData(
  parsedRows: string[][],
  existingProducts: Product[]
): ImportValidationResult {
  if (parsedRows.length <= 1) {
    return { validRows: [], invalidRows: [], duplicates: [], allRows: [] }
  }

  // Header row
  const headers = parsedRows[0].map((h) => h.toLowerCase().trim())
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('product'))
  const barcodeIdx = headers.findIndex((h) => h.includes('barcode'))
  const priceIdx = headers.findIndex((h) => h.includes('price'))
  const descIdx = headers.findIndex((h) => h.includes('desc'))
  const imgIdx = headers.findIndex((h) => h.includes('image') || h.includes('url'))
  const catIdx = headers.findIndex((h) => h.includes('cat'))
  const statusIdx = headers.findIndex((h) => h.includes('status'))

  const allRows: ExcelImportRow[] = []
  const validRows: ExcelImportRow[] = []
  const invalidRows: ExcelImportRow[] = []
  const duplicates: DuplicateComparison[] = []

  const existingMap = new Map<string, Product>()
  existingProducts.forEach((p) => existingMap.set(p.barcode.trim(), p))

  const seenBarcodesInFile = new Set<string>()

  for (let i = 1; i < parsedRows.length; i++) {
    const row = parsedRows[i]
    if (row.length === 0 || row.every((c) => !c)) continue

    const rowNum = i + 1
    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : ''
    const barcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx].trim() : ''
    const priceStr = priceIdx !== -1 && row[priceIdx] ? row[priceIdx] : ''
    const description = descIdx !== -1 ? row[descIdx] : ''
    const imageUrl = imgIdx !== -1 ? row[imgIdx] : ''
    const categoryName = catIdx !== -1 ? row[catIdx] : ''
    const statusRaw = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toLowerCase() : 'active'
    const status: 'Active' | 'Inactive' = statusRaw.includes('inact') ? 'Inactive' : 'Active'

    const errors: string[] = []

    // 1. Required: Product Name
    if (!name) {
      errors.push('Product Name is required.')
    }

    // 2. Required: Barcode
    if (!barcode) {
      errors.push('Barcode is required.')
    } else if (seenBarcodesInFile.has(barcode)) {
      errors.push(`Duplicate barcode "${barcode}" found within the same uploaded file.`)
    } else {
      seenBarcodesInFile.add(barcode)
    }

    // 3. Required: Price
    const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, ''))
    if (isNaN(price) || price < 0) {
      errors.push('Price must be a valid non-negative number.')
    }

    // 4. Validate image URL if provided
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/')) {
      errors.push('Image URL must start with http:// or https:// or be a valid relative path.')
    }

    const rowObj: ExcelImportRow = {
      rowNumber: rowNum,
      name,
      barcode,
      price: isNaN(price) ? 0 : price,
      description,
      imageUrl,
      categoryName,
      status,
      isValid: errors.length === 0,
      errors,
    }

    allRows.push(rowObj)

    if (rowObj.isValid) {
      validRows.push(rowObj)

      // Section 7.3: Duplicate Barcode Handling against existing merchant products
      if (existingMap.has(barcode)) {
        duplicates.push({
          barcode,
          existingProduct: existingMap.get(barcode)!,
          newRow: rowObj,
          action: 'PENDING',
        })
      }
    } else {
      invalidRows.push(rowObj)
    }
  }

  return { validRows, invalidRows, duplicates, allRows }
}

/**
 * Generates downloadable CSV template content
 */
export function getProductImportTemplate(): string {
  const headers = ['Product Name', 'Barcode', 'Price', 'Description', 'Image URL', 'Category', 'Status']
  const sampleRows = [
    ['Coca Cola 330ml', '5449000000996', '15.00', 'Refreshing soda can', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300', 'Beverages', 'Active'],
    ['Lays Potato Chips Salt', '6221155021201', '12.50', 'Crispy potato chips 85g', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300', 'Snacks', 'Active'],
    ['Full Cream Milk 1L', '6223000450012', '45.00', 'Fresh cow milk 1 liter', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300', 'Dairy', 'Active'],
  ]
  return [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
}

export function getBulkEditTemplate(): string {
  const headers = ['Barcode', 'Product Name', 'New Price', 'Status', 'Description']
  const sampleRows = [
    ['5449000000996', 'Coca Cola 330ml', '18.00', 'Active', 'Price updated for festival'],
    ['6221155021201', 'Lays Potato Chips Salt', '14.00', 'Active', 'Updated price'],
  ]
  return [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
}

export function getBulkDeleteTemplate(): string {
  const headers = ['Barcode']
  const sampleRows = [['5449000000996'], ['6221155021201']]
  return [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
}

/**
 * Helper to download template as file in browser
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
