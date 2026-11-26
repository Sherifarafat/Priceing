import * as React from 'react'
import { useDirection } from '@/context/direction-provider'

/**
 * Curated exact-match EN <-> AR UI dictionary so every dashboard screen
 * (Dashboard, Merchants, Branches, Products, Add-ons, Services, Reports, Fees,
 * Roles, Users, Staff, Audit Logs, Excel, Settings, Profile Dropdown, Dialogs)
 * translates cleanly and reversibly when toggling Arabic (RTL) / English (LTR).
 */
const EN_TO_AR: Record<string, string> = {
  // Common Actions & UI
  'Add': 'إضافة',
  'Create': 'إنشاء',
  'Edit': 'تعديل',
  'Delete': 'حذف',
  'Save': 'حفظ',
  'Save Changes': 'حفظ التعديلات',
  'Cancel': 'إلغاء',
  'Close': 'إغلاق',
  'Confirm': 'تأكيد',
  'View': 'عرض',
  'Export': 'تصدير',
  'Import': 'استيراد',
  'Download': 'تحميل',
  'Print': 'طباعة',
  'Refresh': 'تحديث',
  'Search': 'بحث',
  'Filter': 'تصفية',
  'Reset': 'إعادة تعيين',
  'Submit': 'إرسال',
  'Back': 'رجوع',
  'Next': 'التالي',
  'Previous': 'السابق',
  'Actions': 'إجراءات',
  'Status': 'الحالة',
  'Active': 'نشط',
  'Inactive': 'غير نشط',
  'Suspended': 'موقوف',
  'Pending': 'قيد الانتظار',
  'Paid': 'مدفوعة',
  'Refunded': 'مرتجع',
  'Cancelled': 'ملغاة',
  'All': 'الكل',
  'All Statuses': 'كل الحالات',
  'All Merchants': 'كل المتاجر',
  'All Branches': 'كل الفروع',
  'All Categories': 'كل الأقسام',
  'Active Only': 'النشط فقط',
  'Inactive Only': 'غير النشط فقط',
  'Global Only (All)': 'عام للكل فقط',
  'Description': 'الوصف',
  'Name': 'الاسم',
  'Email': 'البريد الإلكتروني',
  'Phone': 'الهاتف',
  'Address': 'العنوان',
  'Date': 'التاريخ',
  'Date & Time': 'التاريخ والوقت',
  'Price': 'السعر',
  'Stock': 'المخزون',
  'Stocks': 'المخزون',
  'Quantity': 'الكمية',
  'Total': 'الإجمالي',
  'Subtotal': 'المجموع الفرعي',
  'Category': 'القسم',
  'Categories': 'الأقسام',
  'Branch': 'الفرع',
  'Branch:': 'الفرع:',
  'Branches': 'الفروع',
  'Merchant': 'التاجر',
  'Merchants': 'التجار',
  'Role': 'الدور',
  'Roles': 'الأدوار',
  'Permissions': 'الصلاحيات',
  'Details': 'التفاصيل',
  'Notes': 'ملاحظات',
  'Type': 'النوع',
  'Value': 'القيمة',
  'Barcode': 'الباركود',
  'SKU': 'الرمز',
  'Loading...': 'جاري التحميل...',
  'No results.': 'لا توجد نتائج.',

  // Dashboard
  'Platform Dashboard': 'لوحة تحكم المنصة',
  'Store Dashboard': 'لوحة تحكم المتجر',
  'Platform Super Admin': 'إدارة المنصة',
  'Store Management': 'إدارة المتجر',
  'Overview': 'نظرة عامة',
  'Analytics': 'التحليلات',
  'Total Revenue': 'إجمالي الإيرادات',
  'Total Sales': 'إجمالي المبيعات',
  'Total Products': 'إجمالي المنتجات',
  'Total Merchants': 'إجمالي التجار',
  'Total Branches': 'إجمالي الفروع',
  'Active Merchants': 'التجار النشطون',
  'Live Branches': 'الفروع النشطة',
  'Customer Scans': 'عمليات المسح',
  'QR Scans': 'مسح الباركود',
  'Recent Activity': 'آخر النشاطات',
  'Recent Orders': 'أحدث الطلبات',
  'Fast Sellers': 'الأكثر مبيعاً',
  'Scanner Endpoint': 'رابط السكانر',
  'Open Scanner': 'فتح السكانر',
  'Mobile Scanner': 'سكانر الموبايل',
  'QR Lookups deployed': 'نقاط المسح المفعلة',

  // Products & Add-ons
  'Products': 'المنتجات',
  'Product Catalog': 'كتالوج المنتجات',
  'Product Hub': 'إدارة المنتجات',
  'Add Product': 'إضافة منتج',
  'Add New Product': 'إضافة منتج جديد',
  'Edit Product': 'تعديل المنتج',
  'Delete Product': 'حذف المنتج',
  'Product Name': 'اسم المنتج',
  'Bulk Price Adjust': 'تعديل الأسعار جماعياً',
  'Add-ons': 'الإضافات',
  'Product Add-ons': 'إضافات المنتجات',
  'Add Add-on': 'إضافة جديدة',
  'Rows per page': 'صفوف لكل صفحة',

  // Merchants & Branches
  'Add Merchant': 'إضافة تاجر',
  'Create Merchant': 'إنشاء تاجر',
  'Edit Merchant': 'تعديل تاجر',
  'Merchant Name': 'اسم التاجر',
  'Business Type': 'نوع النشاط',
  'Currency': 'العملة',
  'Store Branches': 'فروع المتجر',
  'Add Branch': 'إضافة فرع',
  'Create Branch': 'إنشاء فرع',
  'Edit Branch': 'تعديل الفرع',
  'Branch Name': 'اسم الفرع',
  'QR Code': 'كود QR',
  'QR Status': 'حالة الـ QR',
  'Download QR': 'تحميل الـ QR',
  'Print QR': 'طباعة الـ QR',

  // Services
  'Services': 'الخدمات',
  'Service Categories': 'تصنيفات الخدمات',
  'Sub Services': 'الخدمات الفرعية',
  'Add Category': 'إضافة تصنيف',
  'Create Category': 'إنشاء التصنيف',
  'Category Name': 'اسم التصنيف',
  'Assigned Branch': 'الفرع المرتبط',
  'Linked Services': 'الخدمات المرتبطة',
  'Add Service': 'إضافة خدمة',
  'Create Service': 'إنشاء خدمة',
  'Add Sub Service': 'إضافة خدمة فرعية',
  'No service categories found': 'لا توجد تصنيفات خدمات',

  // Invoices & Fees
  'Invoices': 'الفواتير',
  'Issued Invoices': 'الفواتير المصدرة',
  'Invoice Designer': 'تصميم الفاتورة',
  'WhatsApp Receipts': 'فواتير واتساب',
  'Issue New Invoice': 'إصدار فاتورة جديدة',
  'Issue New Tax Invoice': 'إصدار فاتورة ضريبية جديدة',
  'Fees & Taxes': 'الرسوم والضرائب',
  'Add Fee': 'إضافة رسم / ضريبة',
  'Add Tax / Fee': 'إضافة ضريبة / رسم',
  'Create Fee': 'إنشاء رسم',
  'Percentage': 'نسبة مئوية',
  'Fixed': 'مبلغ ثابت',

  // Reports, Staff, Users, Roles, Audit, Excel, Settings
  'Reports': 'التقارير',
  'Reports & Analytics': 'التقارير والتحليلات',
  'Cashiers & Staff': 'الكاشير والموظفين',
  'Staff': 'الموظفين',
  'Add Staff': 'إضافة موظف',
  'Add Cashier': 'إضافة كاشير',
  'Roles & Users': 'الأدوار والمستخدمين',
  'Users': 'المستخدمين',
  'Add User': 'إضافة مستخدم',
  'Add Role': 'إضافة دور',
  'Create Role': 'إنشاء دور',
  'Audit Logs': 'سجل العمليات',
  'Excel Operations': 'عمليات الإكسل',
  'Import Excel': 'استيراد إكسل',
  'Export Excel': 'تصدير إكسل',
  'Settings': 'الإعدادات',
  'Profile': 'الملف الشخصي',
  'Account': 'الحساب',
  'Appearance': 'المظهر',
  'Notifications': 'الإشعارات',
  'Display': 'العرض',
  'Log out': 'تسجيل الخروج',
  'Sign out': 'تسجيل الخروج',
  'Feedback': 'الملاحظات',
  'Help Center': 'مركز المساعدة',
  'Light': 'فاتح',
  'Dark': 'داكن',
  'System': 'النظام',
}

// Build reverse map AR -> EN for pages authored primarily in Arabic
const AR_TO_EN: Record<string, string> = {
  'ربط واتساب لإرسال الفواتير': 'WhatsApp Receipts Setup',
  'فواتير واتساب': 'WhatsApp Receipts',
  'إرسال الفواتير تلقائياً عبر واتساب': 'Direct WhatsApp Invoice Delivery',
  'متصل الآن': 'Connected',
  'غير متصل': 'Disconnected',
  'جاري الاتصال...': 'Connecting...',
  'في انتظار مسح QR': 'Waiting for QR Scan',
  'ربط واتساب عبر QR Code': 'Connect WhatsApp via QR Code',
  'فصل الاتصال': 'Disconnect',
  'اختبار الإرسال': 'Send Test Message',
  'حفظ': 'Save',
  'إلغاء': 'Cancel',
  'تحديث': 'Refresh',
}

for (const [en, ar] of Object.entries(EN_TO_AR)) {
  if (!AR_TO_EN[ar]) {
    AR_TO_EN[ar] = en
  }
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'SVG'])
const originalTextMap = new WeakMap<Text, string>()

function translateNode(node: Text, lang: 'ar' | 'en') {
  const parent = node.parentElement
  if (!parent) return
  if (SKIP_TAGS.has(parent.tagName)) return
  if (parent.closest('[data-no-translate="true"]')) return

  let orig = originalTextMap.get(node)
  const current = node.nodeValue || ''

  if (orig === undefined) {
    orig = current
    originalTextMap.set(node, orig)
  } else {
    // If React dynamically updated the text to a new string that isn't our translated value, refresh original
    const expectedAr = mapText(orig, 'ar')
    const expectedEn = mapText(orig, 'en')
    if (current !== orig && current !== expectedAr && current !== expectedEn) {
      orig = current
      originalTextMap.set(node, orig)
    }
  }

  const next = mapText(orig, lang)
  if (next !== current) {
    node.nodeValue = next
  }
}

function mapText(raw: string, lang: 'ar' | 'en'): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > 80) return raw

  const dict = lang === 'ar' ? EN_TO_AR : AR_TO_EN
  const hit = dict[trimmed]
  if (!hit) return raw

  // Preserve leading/trailing whitespace
  const leading = raw.match(/^\s*/)?.[0] || ''
  const trailing = raw.match(/\s*$/)?.[0] || ''
  return `${leading}${hit}${trailing}`
}

function walkAndTranslate(root: Node, lang: 'ar' | 'en') {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  while (current) {
    translateNode(current as Text, lang)
    current = walker.nextNode()
  }
}

export function BilingualAutoTranslator() {
  const { dir } = useDirection()
  const lang: 'ar' | 'en' = dir === 'rtl' ? 'ar' : 'en'

  React.useEffect(() => {
    const root = document.body
    if (!root) return

    let isApplying = false
    const run = () => {
      if (isApplying) return
      isApplying = true
      try {
        walkAndTranslate(root, lang)
      } finally {
        isApplying = false
      }
    }

    run()

    let rafId = 0
    const observer = new MutationObserver(() => {
      if (isApplying) return
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(run)
    })

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [lang])

  return null
}
