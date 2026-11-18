import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function clearData() {
  console.log('🧹 Clearing all data except user "sherif"...')

  // 1. Delete dependent models
  const deletedLogs = await prisma.auditLog.deleteMany()
  const deletedScans = await prisma.customerScan.deleteMany()
  const deletedAddons = await prisma.productAddon.deleteMany()
  const deletedSubServices = await prisma.subService.deleteMany()
  const deletedServiceItems = await prisma.serviceItem.deleteMany()
  const deletedServiceCategories = await prisma.serviceCategory.deleteMany()
  const deletedProducts = await prisma.product.deleteMany()
  const deletedCategories = await prisma.category.deleteMany()
  const deletedBranches = await prisma.branch.deleteMany()

  // 2. Disconnect sherif user from any merchant before deleting merchants
  await prisma.user.updateMany({
    where: { username: 'sherif' },
    data: { merchantId: null },
  })

  // 3. Delete all other users except sherif
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      username: { not: 'sherif' },
    },
  })

  // 4. Delete all merchants
  const deletedMerchants = await prisma.merchant.deleteMany()

  // 5. Ensure sherif user exists
  const existingSherif = await prisma.user.findUnique({
    where: { username: 'sherif' },
  })

  if (!existingSherif) {
    const hashedPassword = await bcrypt.hash('123456', 10)
    await prisma.user.create({
      data: {
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
    console.log('👤 Created Super Admin user "sherif".')
  } else {
    console.log('👤 Retained existing Super Admin user "sherif".')
  }

  console.log('✅ Cleanup Summary:')
  console.log(`- Deleted Audit Logs: ${deletedLogs.count}`)
  console.log(`- Deleted Customer Scans: ${deletedScans.count}`)
  console.log(`- Deleted Add-ons: ${deletedAddons.count}`)
  console.log(`- Deleted Sub-services: ${deletedSubServices.count}`)
  console.log(`- Deleted Service Items: ${deletedServiceItems.count}`)
  console.log(`- Deleted Service Categories: ${deletedServiceCategories.count}`)
  console.log(`- Deleted Products: ${deletedProducts.count}`)
  console.log(`- Deleted Categories: ${deletedCategories.count}`)
  console.log(`- Deleted Branches: ${deletedBranches.count}`)
  console.log(`- Deleted Merchants: ${deletedMerchants.count}`)
  console.log(`- Deleted Other Users: ${deletedUsers.count}`)
  console.log('🚀 Database now contains only user "sherif"!')
}

clearData()
  .catch((e) => {
    console.error('❌ Error clearing data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
