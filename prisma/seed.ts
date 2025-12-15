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

  // Create expenses
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[0].id,
        bankAccountId: bankAccounts[0].id,
        amount: 1200.0,
        description: 'Weekly grocery shopping at Migros',
        date: new Date('2024-12-01'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[0].id,
        bankAccountId: bankAccounts[0].id,
        amount: 950.0,
        description: 'Fresh produce and bakery',
        date: new Date('2024-12-05'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[0].id,
        bankAccountId: bankAccounts[2].id,
        amount: 1800.0,
        description: 'Monthly bulk shopping',
        date: new Date('2024-12-08'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[1].id,
        bankAccountId: bankAccounts[0].id,
        amount: 2500.0,
        description: 'Monthly fuel',
        date: new Date('2024-12-02'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[1].id,
        bankAccountId: bankAccounts[0].id,
        amount: 500.0,
        description: 'Public transport card',
        date: new Date('2024-12-03'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[2].id,
        bankAccountId: bankAccounts[2].id,
        amount: 800.0,
        description: 'Cinema tickets and popcorn',
        date: new Date('2024-12-06'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[2].id,
        bankAccountId: bankAccounts[0].id,
        amount: 650.0,
        description: 'Concert tickets',
        date: new Date('2024-12-09'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[3].id,
        bankAccountId: bankAccounts[0].id,
        amount: 1200.0,
        description: 'Electricity bill',
        date: new Date('2024-12-01'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[3].id,
        bankAccountId: bankAccounts[0].id,
        amount: 800.0,
        description: 'Water bill',
        date: new Date('2024-12-01'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[3].id,
        bankAccountId: bankAccounts[0].id,
        amount: 600.0,
        description: 'Internet bill',
        date: new Date('2024-12-01'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[4].id,
        bankAccountId: bankAccounts[0].id,
        amount: 500.0,
        description: 'Pharmacy - medications',
        date: new Date('2024-12-04'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[5].id,
        bankAccountId: bankAccounts[2].id,
        amount: 450.0,
        description: 'Dinner at Italian restaurant',
        date: new Date('2024-12-07'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[5].id,
        bankAccountId: bankAccounts[0].id,
        amount: 320.0,
        description: 'Lunch with colleagues',
        date: new Date('2024-12-10'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: categories[5].id,
        bankAccountId: bankAccounts[0].id,
        amount: 280.0,
        description: 'Coffee and breakfast',
        date: new Date('2024-12-11'),
      },
    }),
  ])

  console.log(`✅ Created ${expenses.length} expenses`)

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
