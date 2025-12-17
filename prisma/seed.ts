import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  })

  console.log('✅ Created user:', user.email)

  // Create user preferences
  const preferences = await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currency: 'TRY',
      language: 'tr',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      budgetAlerts: true,
      theme: 'light',
    },
  })

  console.log('✅ Created user preferences')

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Groceries',
        icon: '🛒',
        color: '#10B981',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Transportation',
        icon: '🚗',
        color: '#3B82F6',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Entertainment',
        icon: '🎬',
        color: '#8B5CF6',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Utilities',
        icon: '💡',
        color: '#F59E0B',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Healthcare',
        icon: '🏥',
        color: '#EF4444',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Dining',
        icon: '🍽️',
        color: '#EC4899',
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create bank accounts
  const bankAccounts = await Promise.all([
    prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: 'Ziraat Bankası',
        accountNumber: '1234567890',
        accountType: 'checking',
        balance: 15000.0,
        currency: 'TRY',
        isActive: true,
      },
    }),
    prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: 'İş Bankası',
        accountNumber: '0987654321',
        accountType: 'savings',
        balance: 50000.0,
        currency: 'TRY',
        isActive: true,
      },
    }),
    prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: 'Garanti BBVA',
        accountNumber: '5555666677',
        accountType: 'credit',
        balance: -5000.0,
        currency: 'TRY',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${bankAccounts.length} bank accounts`)

  // Create budget
  const startDate = new Date()
  startDate.setDate(1)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1)
  endDate.setDate(0)

  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      name: 'Monthly Budget - December',
      totalAmount: 30000.0,
      period: 'monthly',
      startDate,
      endDate,
      isActive: true,
    },
  })

  console.log('✅ Created budget')

  // Create category budgets
  const categoryBudgets = await Promise.all([
    prisma.categoryBudget.create({
      data: {
        budgetId: budget.id,
        categoryId: categories[0].id,
        amount: 8000.0,
      },
    }),
    prisma.categoryBudget.create({
      data: {
        budgetId: budget.id,
        categoryId: categories[1].id,
        amount: 5000.0,
      },
    }),
    prisma.categoryBudget.create({
      data: {
        budgetId: budget.id,
        categoryId: categories[2].id,
        amount: 3000.0,
      },
    }),
    prisma.categoryBudget.create({
      data: {
        budgetId: budget.id,
        categoryId: categories[3].id,
        amount: 4000.0,
      },
    }),
    prisma.categoryBudget.create({
      data: {
        budgetId: budget.id,
        categoryId: categories[4].id,
        amount: 2000.0,
      },
    }),
    prisma.categoryBudget.create({
      data: {
        budgetId: budget.id,
        categoryId: categories[5].id,
        amount: 4000.0,
      },
    }),
  ])

  console.log(`✅ Created ${categoryBudgets.length} category budgets`)

  // Create expenses with more variety for better analytics
  const expenseData = [
    // Groceries
    { categoryId: categories[0].id, amount: 1200.0, description: 'Weekly grocery shopping at Migros', date: '2024-12-01' },
    { categoryId: categories[0].id, amount: 950.0, description: 'Fresh produce and bakery', date: '2024-12-05' },
    { categoryId: categories[0].id, amount: 1800.0, description: 'Monthly bulk shopping', date: '2024-12-08' },
    { categoryId: categories[0].id, amount: 650.0, description: 'Vegetables and fruits at local market', date: '2024-12-12' },
    { categoryId: categories[0].id, amount: 1100.0, description: 'Weekly shopping at Carrefour', date: '2024-12-15' },

    // Transportation
    { categoryId: categories[1].id, amount: 2500.0, description: 'Monthly fuel', date: '2024-12-02' },
    { categoryId: categories[1].id, amount: 500.0, description: 'Public transport card', date: '2024-12-03' },
    { categoryId: categories[1].id, amount: 350.0, description: 'Taxi rides', date: '2024-12-07' },
    { categoryId: categories[1].id, amount: 400.0, description: 'Car maintenance', date: '2024-12-14' },

    // Entertainment
    { categoryId: categories[2].id, amount: 800.0, description: 'Cinema tickets and popcorn', date: '2024-12-06' },
    { categoryId: categories[2].id, amount: 650.0, description: 'Concert tickets', date: '2024-12-09' },
    { categoryId: categories[2].id, amount: 450.0, description: 'Netflix and Spotify subscriptions', date: '2024-12-01' },
    { categoryId: categories[2].id, amount: 550.0, description: 'Weekend activities', date: '2024-12-13' },

    // Utilities
    { categoryId: categories[3].id, amount: 1200.0, description: 'Electricity bill', date: '2024-12-01' },
    { categoryId: categories[3].id, amount: 800.0, description: 'Water bill', date: '2024-12-01' },
    { categoryId: categories[3].id, amount: 600.0, description: 'Internet bill', date: '2024-12-01' },
    { categoryId: categories[3].id, amount: 450.0, description: 'Natural gas bill', date: '2024-12-01' },

    // Healthcare
    { categoryId: categories[4].id, amount: 500.0, description: 'Pharmacy - medications', date: '2024-12-04' },
    { categoryId: categories[4].id, amount: 750.0, description: 'Doctor consultation', date: '2024-12-11' },

    // Dining
    { categoryId: categories[5].id, amount: 450.0, description: 'Dinner at Italian restaurant', date: '2024-12-07' },
    { categoryId: categories[5].id, amount: 320.0, description: 'Lunch with colleagues', date: '2024-12-10' },
    { categoryId: categories[5].id, amount: 280.0, description: 'Coffee and breakfast', date: '2024-12-11' },
    { categoryId: categories[5].id, amount: 600.0, description: 'Family dinner at steakhouse', date: '2024-12-14' },
    { categoryId: categories[5].id, amount: 180.0, description: 'Fast food delivery', date: '2024-12-16' },
    { categoryId: categories[5].id, amount: 220.0, description: 'Brunch at café', date: '2024-12-17' },
  ]

  const expenses = await Promise.all(
    expenseData.map((expense, index) =>
      prisma.expense.create({
        data: {
          userId: user.id,
          categoryId: expense.categoryId,
          bankAccountId: index % 3 === 0 ? bankAccounts[2].id : bankAccounts[0].id,
          amount: expense.amount,
          description: expense.description,
          date: new Date(expense.date),
        },
      })
    )
  )

  console.log(`✅ Created ${expenses.length} expenses`)

  // Create inflation data
  const inflationRates = await Promise.all([
    prisma.inflationRate.create({
      data: {
        date: new Date('2024-11-01'),
        rate: 61.5,
        predictedRate: 63.2,
        trend: 'up',
        source: 'TUIK',
        categoryRates: {
          food: 68.5,
          transport: 55.2,
          housing: 59.8,
          healthcare: 52.3,
        },
      },
    }),
    prisma.inflationRate.create({
      data: {
        date: new Date('2024-12-01'),
        rate: 64.8,
        predictedRate: 67.2,
        trend: 'up',
        source: 'TUIK',
        categoryRates: {
          food: 72.1,
          transport: 58.9,
          housing: 62.5,
          healthcare: 54.7,
        },
      },
    }),
  ])

  console.log(`✅ Created ${inflationRates.length} inflation rates`)

  // Create local deals
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
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
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
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
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
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
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
        validUntil: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
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
        validUntil: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days
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
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
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
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
        validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
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
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
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
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
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
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
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
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
        category: 'entertainment',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${deals.length} deals`)

  // Create savings tips
  const tips = await Promise.all([
    prisma.savingsTip.create({
      data: {
        title: 'Consider USDT for savings',
        description:
          'Convert 20% of your monthly savings to stablecoins to protect against inflation. Turkish exchanges like BtcTurk offer easy access.',
        icon: '🪙',
        priority: 'HIGH',
        category: 'CRYPTO',
        isActive: true,
      },
    }),
    prisma.savingsTip.create({
      data: {
        title: 'Buy groceries at Şok or BİM',
        description:
          'Switching to discount chains can save you ₺1,200-1,800 per month on groceries compared to premium stores.',
        icon: '🛍️',
        priority: 'HIGH',
        category: 'RETAIL',
        isActive: true,
      },
    }),
    prisma.savingsTip.create({
      data: {
        title: 'Use cashback credit cards',
        description:
          "Cards like Maximum or Bonus offer 2-5% cashback on categories like groceries and gas. That's ₺400+ monthly savings.",
        icon: '💳',
        priority: 'MEDIUM',
        category: 'BANKING',
        isActive: true,
      },
    }),
    prisma.savingsTip.create({
      data: {
        title: 'Use public transportation',
        description:
          'Switch from personal car to Istanbul Kart for daily commute. Can save ₺2,000+ per month on fuel and parking.',
        icon: '🚌',
        priority: 'MEDIUM',
        category: 'TRANSPORT',
        isActive: true,
      },
    }),
    prisma.savingsTip.create({
      data: {
        title: 'Buy in bulk at Metro',
        description:
          'Metro wholesale offers 20-30% savings on non-perishables. A ₺500 membership pays for itself in 2 months.',
        icon: '📦',
        priority: 'HIGH',
        category: 'RETAIL',
        isActive: true,
      },
    }),
    prisma.savingsTip.create({
      data: {
        title: 'Open a high-yield savings account',
        description:
          'Turkish banks offer 40-50% annual interest rates. Move emergency funds to maximize returns.',
        icon: '💰',
        priority: 'HIGH',
        category: 'BANKING',
        isActive: true,
      },
    }),
    prisma.savingsTip.create({
      data: {
        title: 'Use discount days',
        description:
          'Many stores have specific discount days. Migros has 40% off on Mondays, CarrefourSA on Thursdays.',
        icon: '📅',
        priority: 'MEDIUM',
        category: 'RETAIL',
        isActive: true,
      },
    }),
    prisma.savingsTip.create({
      data: {
        title: 'Split purchases with digital wallets',
        description:
          'Use Papara, ininal, or Tosla for extra cashback and installment options without interest.',
        icon: '📱',
        priority: 'LOW',
        category: 'BANKING',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${tips.length} savings tips`)

  console.log('🎉 Seed completed successfully!')
  console.log('\n📧 Test user credentials:')
  console.log('Email: test@example.com')
  console.log('Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
