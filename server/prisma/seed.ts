import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting clean database seed (Sherif User Only)...')

  // 1. Clean existing records
  await prisma.auditLog.deleteMany()
  await prisma.customerScan.deleteMany()
  await prisma.subService.deleteMany()
  await prisma.serviceItem.deleteMany()
  await prisma.serviceCategory.deleteMany()
  await prisma.productAddon.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.merchant.deleteMany()
  await prisma.user.deleteMany({
    where: { username: { not: 'sherif' } },
  })

  // 2. Hash default password
  const hashedPassword = await bcrypt.hash('123456', 10)

  // 3. Upsert Super Admin User "sherif"
  const superAdmin = await prisma.user.upsert({
    where: { username: 'sherif' },
    update: {
      merchantId: null,
      status: 'Active',
      role: 'SUPER_ADMIN',
    },
    create: {
      id: 'user-super-admin',
      username: 'sherif',
      email: 'sherif@priceing.com',
      password: hashedPassword,
      name: 'Sherif Arafat',
      role: 'SUPER_ADMIN',
      status: 'Active',
      permissions: JSON.stringify({
        'products.view': true,
        'products.create': true,
        'products.edit': true,
        'products.delete': true,
        'categories.manage': true,
        'excel.import': true,
        'excel.bulk_edit': true,
        'excel.bulk_delete': true,
      }),
    },
  })
  console.log(`👤 Super Admin ready: ${superAdmin.username} (${superAdmin.name})`)
  console.log('✨ Database clean & ready with only user "sherif".')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
