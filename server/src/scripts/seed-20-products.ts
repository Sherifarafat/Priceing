import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function makeValidEan13(first12: string): string {
  const digits = first12.replace(/\D/g, '').slice(0, 12).padEnd(12, '0')
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const n = Number(digits[i])
    sum += i % 2 === 0 ? n : n * 3
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return digits + String(checkDigit)
}

const TARGET_MERCHANT_ID = '234d4b03-0f42-4db0-ab1e-d929193b76bb' // BIM

const CATEGORIES = [
  { key: 'beverages', name: 'مشروبات' },
  { key: 'snacks', name: 'سناكس وحلويات' },
  { key: 'dairy', name: 'ألبان وجبن' },
  { key: 'grocery', name: 'بقالة ومعلبات' },
  { key: 'care', name: 'عناية ومنظفات' },
]

const PRODUCTS_TO_SEED = [
  {
    name: 'كوكاكولا كانز 330 مل',
    barcode: '5449000000996', // Real Coca-Cola 330ml EAN-13
    price: 15.0,
    stocks: 120,
    categoryKey: 'beverages',
    description: 'مشروب غازي كوكاكولا أوريجينال 330 مل',
    imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'سبرايت ليمون كانز 330 مل',
    barcode: '5449000014535', // Real Sprite 330ml EAN-13
    price: 15.0,
    stocks: 95,
    categoryKey: 'beverages',
    description: 'مشروب غازي سبرايت بالليمون المنعش 330 مل',
    imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'فانتا برتقال كانز 330 مل',
    barcode: '5449000011527', // Real Fanta Orange 330ml EAN-13
    price: 15.0,
    stocks: 80,
    categoryKey: 'beverages',
    description: 'مشروب غازي فانتا بنكهة البرتقال 330 مل',
    imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ريد بول مشروب طاقة 250 مل',
    barcode: '9002490100070', // Real Red Bull 250ml EAN-13
    price: 45.0,
    stocks: 60,
    categoryKey: 'beverages',
    description: 'مشروب الطاقة ريد بول الأصلي 250 مل',
    imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'مياه نستله بيور لايف 1.5 لتر',
    barcode: makeValidEan13('622103100001'),
    price: 10.0,
    stocks: 200,
    categoryKey: 'beverages',
    description: 'مياه شرب طبيعية معبأة 1.5 لتر',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'عصير جهينة مانجو 1 لتر',
    barcode: makeValidEan13('622100701122'),
    price: 38.0,
    stocks: 75,
    categoryKey: 'beverages',
    description: 'عصير مانجو طبيعي جهينة عبوة عائلية 1 لتر',
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'حليب جهينة كامل الدسم 1 لتر',
    barcode: makeValidEan13('622100700101'),
    price: 48.0,
    stocks: 90,
    categoryKey: 'dairy',
    description: 'حليب بقري طبيعي كامل الدسم 1 لتر',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'جبنة دومتي فيتا بلس 500 جم',
    barcode: makeValidEan13('622300026001'),
    price: 62.0,
    stocks: 55,
    categoryKey: 'dairy',
    description: 'جبنة بيضاء فيتا كريمية 500 جم',
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'زبادي طبيعي جهينة 105 جم',
    barcode: makeValidEan13('622100702215'),
    price: 9.5,
    stocks: 110,
    categoryKey: 'dairy',
    description: 'زبادي طازج طبيعي كامل الدسم',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'نسكافيه كلاسيك برطمان 100 جم',
    barcode: makeValidEan13('761303351754'),
    price: 165.0,
    stocks: 40,
    categoryKey: 'grocery',
    description: 'قهوة سريعة التحضير نسكافيه كلاسيك 100 جم',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'شاي ليبتون ناعم 250 جم',
    barcode: makeValidEan13('622115501340'),
    price: 72.0,
    stocks: 65,
    categoryKey: 'grocery',
    description: 'شاي أسود ناعم ليبتون العلامة الصفراء 250 جم',
    imageUrl: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'شوكولاتة نوتيلا بالبندق 350 جم',
    barcode: '8000500037560', // Real Ferrero Nutella 350g EAN-13
    price: 185.0,
    stocks: 35,
    categoryKey: 'snacks',
    description: 'كريمة البندق بالكاكاو نوتيلا الأصلية 350 جم',
    imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'بسكويت أوريو الأصلي 6 قطع',
    barcode: '7622210449283', // Real Oreo EAN-13
    price: 18.0,
    stocks: 130,
    categoryKey: 'snacks',
    description: 'بسكويت شوكولاتة محشو بكريمة الفانيليا',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'شوكولاتة سنيكرز بالفول السوداني 50 جم',
    barcode: '5000159461122', // Real Snickers EAN-13
    price: 32.0,
    stocks: 100,
    categoryKey: 'snacks',
    description: 'لوح شوكولاتة سنيكرز بالكراميل والفول السوداني',
    imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'شوكولاتة كيت كات 4 أصابع',
    barcode: makeValidEan13('761303504082'),
    price: 30.0,
    stocks: 95,
    categoryKey: 'snacks',
    description: 'ويفر مقرمش مغطى بشوكولاتة الحليب كيت كات',
    imageUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'شيبسي برينجلز أصلي 165 جم',
    barcode: '5053990156009', // Real Pringles Original EAN-13
    price: 95.0,
    stocks: 50,
    categoryKey: 'snacks',
    description: 'رقائق بطاطس برينجلز المقرمشة بالنكهة الأصلية',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'إندومي نودلز بنكهة الدجاج 75 جم',
    barcode: makeValidEan13('622300187001'),
    price: 12.0,
    stocks: 180,
    categoryKey: 'grocery',
    description: 'شعيرية سريعة التحضير بنكهة الدجاج',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'كاتشب طماطم هاينز 340 جم',
    barcode: makeValidEan13('622102400101'),
    price: 55.0,
    stocks: 60,
    categoryKey: 'grocery',
    description: 'صلصة كاتشب طماطم طبيعية هاينز 340 جم',
    imageUrl: 'https://images.unsplash.com/photo-1528750717929-32abb73d3bd9?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'صابون دوف كريم بيوتي بار 135 جم',
    barcode: makeValidEan13('871090869422'),
    price: 35.0,
    stocks: 85,
    categoryKey: 'care',
    description: 'صابون دوف بربع كريم مرطب للعناية بالبشرة',
    imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'سائل غسيل أطباق فيري ليمون 600 مل',
    barcode: makeValidEan13('800184128945'),
    price: 68.0,
    stocks: 70,
    categoryKey: 'care',
    description: 'سائل تنظيف الصحون فيري برائحة الليمون المنعش',
    imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=400&q=80',
  },
]

async function main() {
  const merchant = await prisma.merchant.findUnique({ where: { id: TARGET_MERCHANT_ID } })
  if (!merchant) {
    throw new Error('Target merchant BIM not found!')
  }

  // Create or find categories
  const categoryMap = new Map<string, string>()
  for (const cat of CATEGORIES) {
    let existing = await prisma.category.findFirst({
      where: { merchantId: merchant.id, name: cat.name },
    })
    if (!existing) {
      existing = await prisma.category.create({
        data: { merchantId: merchant.id, name: cat.name },
      })
    }
    categoryMap.set(cat.key, existing.id)
  }

  // Also add images to the 3 existing BIM products if they don't have images yet
  const existingImageUpdates: Record<string, { imageUrl: string; categoryKey: string }> = {
    '9614001216028': {
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      categoryKey: 'grocery',
    },
    '6223000553855': {
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
      categoryKey: 'snacks',
    },
    '6223001362067': {
      imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80',
      categoryKey: 'beverages',
    },
  }

  for (const [barcode, patch] of Object.entries(existingImageUpdates)) {
    const prod = await prisma.product.findFirst({
      where: { merchantId: merchant.id, barcode },
    })
    if (prod && (!prod.imageUrl || prod.imageUrl.trim() === '')) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          imageUrl: patch.imageUrl,
          categoryId: prod.categoryId || categoryMap.get(patch.categoryKey) || null,
        },
      })
    }
  }

  // Upsert the 20 new products
  let created = 0
  let updated = 0
  for (const item of PRODUCTS_TO_SEED) {
    const categoryId = categoryMap.get(item.categoryKey) || null
    const existing = await prisma.product.findFirst({
      where: { merchantId: merchant.id, barcode: item.barcode },
    })
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          price: item.price,
          stocks: item.stocks,
          description: item.description,
          imageUrl: item.imageUrl,
          categoryId,
          status: 'Active',
        },
      })
      updated++
    } else {
      await prisma.product.create({
        data: {
          merchantId: merchant.id,
          name: item.name,
          barcode: item.barcode,
          price: item.price,
          stocks: item.stocks,
          description: item.description,
          imageUrl: item.imageUrl,
          categoryId,
          status: 'Active',
          feeIds: '[]',
        },
      })
      created++
    }
  }

  const totalCount = await prisma.product.count({ where: { merchantId: merchant.id } })
  console.log(
    JSON.stringify(
      {
        merchant: merchant.name,
        created,
        updated,
        totalMerchantProducts: totalCount,
        sampleBarcodes: PRODUCTS_TO_SEED.map((p) => ({ name: p.name, barcode: p.barcode, price: p.price })),
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
