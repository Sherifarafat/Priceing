import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_DATA = [
  {
    category: {
      name: 'التوصيل والشحن',
      description: 'خدمات التوصيل السريع للمنازل والشركات داخل وخارج المنطقة',
    },
    services: [
      {
        name: 'توصيل الطلبات للمنزل',
        description: 'توصيل فوري وآمن لباب المنزل',
        subServices: [
          { name: 'توصيل سريع خلال 30 دقيقة (داخل المنطقة)', price: 25, description: 'توصيل فوري للطلبات السريعة' },
          { name: 'توصيل عادي خلال ساعتين', price: 15, description: 'توصيل اقتصادي داخل الحي' },
          { name: 'توصيل خارج المنطقة / مناطق مجاورة', price: 45, description: 'توصيل للمناطق البعيدة' },
        ],
      },
    ],
  },
  {
    category: {
      name: 'التغليف والهدايا',
      description: 'تغليف احترافي للهدايا والشنط الحرارية للحفاظ على المنتجات',
    },
    services: [
      {
        name: 'تغليف هدايا فاخر',
        description: 'ورق هدايا وشرائط وكارت إهداء',
        subServices: [
          { name: 'تغليف هدية قياسي + كارت إهداء', price: 30, description: 'ورق تغليف أنيق مع شريط' },
          { name: 'بوكس هدايا فاخر (حجم كبير)', price: 65, description: 'صندوق هدايا فخم جاهز للتقديم' },
        ],
      },
      {
        name: 'تغليف حراري وحفظ البرودة',
        description: 'شنط حرارية للمنتجات المبردة والمجمدة',
        subServices: [
          { name: 'شنطة حفظ برودة حرارية مع ثلج جاف', price: 35, description: 'تحافظ على التجميد حتى 3 ساعات' },
        ],
      },
    ],
  },
  {
    category: {
      name: 'تجهيز وتحضير خاص',
      description: 'خدمات التقطيع والطحن والتجهيز حسب طلب العميل',
    },
    services: [
      {
        name: 'طحن البن والبهارات طازج',
        description: 'طحن فوري بدرجة النعومة المطلوبة',
        subServices: [
          { name: 'طحن بن تركي / إسبريسو (للعبوة)', price: 10, description: 'طحن ناعم أو متوسط حسب الطلب' },
          { name: 'تجهيز وتقطيع أجبان ولحوم باردة', price: 20, description: 'تقطيع شرائح وتغليف فاكيوم' },
        ],
      },
      {
        name: 'تجهيز سلة مناسبات / رمضان',
        description: 'تجميع وترتيب كرتونة أو سلة منتجات مختارة',
        subServices: [
          { name: 'تجهيز وترتيب سلة مناسبات', price: 50, description: 'تجهيز كامل وتغليف سلوفان' },
        ],
      },
    ],
  },
  {
    category: {
      name: 'الصيانة والدعم الفني',
      description: 'تركيب وفحص الأجهزة الصغيرة والملحقات المنزلية',
    },
    services: [
      {
        name: 'فحص وتركيب أجهزة صغيرة',
        description: 'فحص فوري وضبط التشغيل',
        subServices: [
          { name: 'فحص وتجربة جهاز كهربائي صغير', price: 40, description: 'فحص كامل للتشغيل والأمان' },
          { name: 'تركيب فلتر مياه / ملحقات مطبخ', price: 120, description: 'تركيب وتجربة بواسطة فني مختص' },
          { name: 'تفعيل ضمان ممتد سنة إضافية', price: 95, description: 'ضمان استبدال وصيانة شامل' },
        ],
      },
    ],
  },
]

async function main() {
  const existingCount = await prisma.subService.count()
  if (existingCount >= 10) {
    console.log(`ℹ️ Services already seeded (${existingCount} sub-services). Skipping duplicate seed.`)
    return
  }

  let catsCreated = 0
  let servicesCreated = 0
  let subsCreated = 0

  for (const entry of SEED_DATA) {
    let cat = await prisma.serviceCategory.findFirst({
      where: { name: entry.category.name },
    })
    if (!cat) {
      cat = await prisma.serviceCategory.create({
        data: {
          name: entry.category.name,
          description: entry.category.description,
          branchId: null, // Global across all store branches
          status: 'Active',
        },
      })
      catsCreated++
    }

    for (const svc of entry.services) {
      let serviceItem = await prisma.serviceItem.findFirst({
        where: { name: svc.name, categoryId: cat.id },
      })
      if (!serviceItem) {
        serviceItem = await prisma.serviceItem.create({
          data: {
            categoryId: cat.id,
            name: svc.name,
            description: svc.description,
            status: 'Active',
          },
        })
        servicesCreated++
      }

      for (const sub of svc.subServices) {
        const exists = await prisma.subService.findFirst({
          where: { name: sub.name, serviceId: serviceItem.id },
        })
        if (!exists) {
          await prisma.subService.create({
            data: {
              serviceId: serviceItem.id,
              name: sub.name,
              price: sub.price,
              description: sub.description,
              status: 'Active',
            },
          })
          subsCreated++
        }
      }
    }
  }

  console.log(
    `✅ Seeded services successfully: +${catsCreated} categories, +${servicesCreated} services, +${subsCreated} sub-services`
  )
}

main()
  .catch((e) => {
    console.error('❌ Seed services error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
