import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function addDeals() {
  try {
    console.log('🗑️ Clearing existing deals...')
    await prisma.deal.deleteMany({})

    console.log('✨ Creating 16 new deals...')

    const deals = await Promise.all([
      // Groceries
      prisma.deal.create({
        data: {
          product: 'Olive oil (1L)',
          store: 'Migros',
          oldPrice: 280.0,
          newPrice: 210.0,
          discount: 25.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'Taksim, İstanbul',
          },
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          category: 'groceries',
          imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Fresh bread (5 pack)',
          store: 'BİM',
          oldPrice: 50.0,
          newPrice: 35.0,
          discount: 30.0,
          location: {
            lat: 41.0154,
            lng: 28.9784,
            address: 'Şişli, İstanbul',
          },
          validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          category: 'groceries',
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Chicken breast (1kg)',
          store: 'Şok',
          oldPrice: 180.0,
          newPrice: 144.0,
          discount: 20.0,
          location: {
            lat: 41.0422,
            lng: 29.0094,
            address: 'Beşiktaş, İstanbul',
          },
          validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          category: 'groceries',
          imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Rice (5kg)',
          store: 'A101',
          oldPrice: 200.0,
          newPrice: 170.0,
          discount: 15.0,
          location: {
            lat: 40.9903,
            lng: 29.0233,
            address: 'Kadıköy, İstanbul',
          },
          validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          category: 'groceries',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Fresh vegetables bundle',
          store: 'CarrefourSA',
          oldPrice: 120.0,
          newPrice: 84.0,
          discount: 30.0,
          location: {
            lat: 41.0255,
            lng: 28.9742,
            address: 'Mecidiyeköy, İstanbul',
          },
          validUntil: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          category: 'groceries',
          imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Cheese (500g)',
          store: 'Migros',
          oldPrice: 150.0,
          newPrice: 120.0,
          discount: 20.0,
          location: {
            lat: 41.0350,
            lng: 28.9845,
            address: 'Nişantaşı, İstanbul',
          },
          validUntil: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          category: 'groceries',
          imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400',
          isActive: true,
        },
      }),

      // Electronics
      prisma.deal.create({
        data: {
          product: 'Wireless earbuds',
          store: 'Teknosa',
          oldPrice: 1500.0,
          newPrice: 1050.0,
          discount: 30.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'İstiklal Caddesi, İstanbul',
          },
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          category: 'electronics',
          imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'USB-C charging cable',
          store: 'Vatan Bilgisayar',
          oldPrice: 200.0,
          newPrice: 140.0,
          discount: 30.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'Mecidiyeköy, İstanbul',
          },
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          category: 'electronics',
          imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400',
          isActive: true,
        },
      }),

      // Dining
      prisma.deal.create({
        data: {
          product: '2-for-1 Pizza deal',
          store: 'Dominos',
          oldPrice: 400.0,
          newPrice: 200.0,
          discount: 50.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'Taksim, İstanbul',
          },
          validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          category: 'dining',
          imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Burger combo meal',
          store: 'Burger King',
          oldPrice: 250.0,
          newPrice: 175.0,
          discount: 30.0,
          location: {
            lat: 40.9903,
            lng: 29.0233,
            address: 'Kadıköy, İstanbul',
          },
          validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          category: 'dining',
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
          isActive: true,
        },
      }),

      // Healthcare
      prisma.deal.create({
        data: {
          product: 'Multivitamin (60 tablets)',
          store: 'Eczane Plus',
          oldPrice: 280.0,
          newPrice: 210.0,
          discount: 25.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'Şişli, İstanbul',
          },
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'healthcare',
          imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
          isActive: true,
        },
      }),

      // Clothing
      prisma.deal.create({
        data: {
          product: 'Winter jacket',
          store: 'Defacto',
          oldPrice: 800.0,
          newPrice: 480.0,
          discount: 40.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'Cevahir AVM, İstanbul',
          },
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          category: 'clothing',
          imageUrl: 'https://images.unsplash.com/photo-1548126032-079b20c5f8e3?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Sports shoes',
          store: 'Decathlon',
          oldPrice: 600.0,
          newPrice: 420.0,
          discount: 30.0,
          location: {
            lat: 41.0422,
            lng: 29.0094,
            address: 'Beşiktaş, İstanbul',
          },
          validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          category: 'clothing',
          imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
          isActive: true,
        },
      }),

      // Entertainment
      prisma.deal.create({
        data: {
          product: 'Movie tickets (2 people)',
          store: 'Cinemaximum',
          oldPrice: 300.0,
          newPrice: 180.0,
          discount: 40.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'Zorlu Center, İstanbul',
          },
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          category: 'entertainment',
          imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Gym membership (1 month)',
          store: 'Fit Club',
          oldPrice: 500.0,
          newPrice: 350.0,
          discount: 30.0,
          location: {
            lat: 40.9903,
            lng: 29.0233,
            address: 'Kadıköy, İstanbul',
          },
          validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          category: 'entertainment',
          imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
          isActive: true,
        },
      }),
      prisma.deal.create({
        data: {
          product: 'Coffee beans (250g)',
          store: 'Starbucks',
          oldPrice: 180.0,
          newPrice: 135.0,
          discount: 25.0,
          location: {
            lat: 41.0082,
            lng: 28.9784,
            address: 'Taksim, İstanbul',
          },
          validUntil: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          category: 'groceries',
          imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
          isActive: true,
        },
      }),
    ])

    console.log(`✅ Created ${deals.length} deals across multiple categories`)
    console.log('📍 Deals are located in various Istanbul neighborhoods')
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

addDeals()
