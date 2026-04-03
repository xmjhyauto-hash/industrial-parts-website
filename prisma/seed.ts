import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  })

  // Create default site settings
  const settings = [
    { key: 'site_name', value: 'Industrial Parts Co.' },
    { key: 'seller_email', value: 'sales@example.com' },
    { key: 'seller_phone', value: '+65 1234 5678' },
    { key: 'seller_address', value: 'Singapore' },
  ]

  for (const setting of settings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  // Create sample categories
  const categories = [
    { name: 'Automation Control', slug: 'automation-control', description: 'Industrial automation and control equipment' },
    { name: 'PLC & Controllers', slug: 'plc-controllers', description: 'Programmable logic controllers and controllers' },
    { name: 'HMI & Displays', slug: 'hmi-displays', description: 'Human machine interfaces and display panels' },
    { name: 'Sensors', slug: 'sensors', description: 'Industrial sensors and transducers' },
    { name: 'Drives & Motors', slug: 'drives-motors', description: 'Variable frequency drives and motors' },
    { name: 'Power Supply', slug: 'power-supply', description: 'Industrial power supplies and UPS' },
    { name: 'Networking', slug: 'networking', description: 'Industrial networking equipment' },
    { name: 'Safety Equipment', slug: 'safety-equipment', description: 'Industrial safety equipment' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
