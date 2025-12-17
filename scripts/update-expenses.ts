import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function updateExpenses() {
  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (!user) {
      console.error('❌ Test user not found')
      process.exit(1)
    }

    console.log('🔄 Deleting old expenses...')
    await prisma.expense.deleteMany({
      where: { userId: user.id }
    })

    // Get categories
    const categories = await prisma.category.findMany()
    const categoryMap: any = {}
    categories.forEach((cat) => {
      const key = cat.name.toLowerCase().replace(/[^a-z]/g, '')
      categoryMap[key] = cat.id
    })

    // Get user's bank account
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { userId: user.id }
    })

    // Create expenses for December 2025 (current month)
    const expenses = [
      // December 2025 - 23 expenses
      { amount: 1200, description: 'Weekly grocery shopping', date: new Date(2025, 11, 15), categoryId: categoryMap.groceries },
      { amount: 950, description: 'Fresh produce market', date: new Date(2025, 11, 14), categoryId: categoryMap.groceries },
      { amount: 320, description: 'Gasoline refill', date: new Date(2025, 11, 16), categoryId: categoryMap.transport || categoryMap.transportation },
      { amount: 850, description: 'Electricity bill', date: new Date(2025, 11, 5), categoryId: categoryMap.utilities },
      { amount: 580, description: 'Pharmacy purchase', date: new Date(2025, 11, 9), categoryId: categoryMap.healthcare },
      { amount: 750, description: 'Movie tickets and snacks', date: new Date(2025, 11, 16), categoryId: categoryMap.entertainment },
      { amount: 890, description: 'Restaurant dinner', date: new Date(2025, 11, 15), categoryId: categoryMap.diningout || categoryMap.dining },
      { amount: 450, description: 'Bus pass renewal', date: new Date(2025, 11, 3), categoryId: categoryMap.transport || categoryMap.transportation },
      { amount: 1350, description: 'Supermarket shopping', date: new Date(2025, 11, 8), categoryId: categoryMap.groceries },
      { amount: 280, description: 'Taxi fare', date: new Date(2025, 11, 12), categoryId: categoryMap.transport || categoryMap.transportation },
      { amount: 720, description: 'Water bill', date: new Date(2025, 11, 6), categoryId: categoryMap.utilities },
      { amount: 620, description: 'Doctor consultation', date: new Date(2025, 11, 10), categoryId: categoryMap.healthcare },
      { amount: 950, description: 'Concert tickets', date: new Date(2025, 11, 13), categoryId: categoryMap.entertainment },
      { amount: 680, description: 'Lunch at cafe', date: new Date(2025, 11, 14), categoryId: categoryMap.diningout || categoryMap.dining },
      { amount: 380, description: 'Metro card top-up', date: new Date(2025, 11, 7), categoryId: categoryMap.transport || categoryMap.transportation },
      { amount: 1100, description: 'Weekly groceries', date: new Date(2025, 11, 11), categoryId: categoryMap.groceries },
      { amount: 540, description: 'Natural gas bill', date: new Date(2025, 11, 4), categoryId: categoryMap.utilities },
      { amount: 820, description: 'Prescription medication', date: new Date(2025, 11, 8), categoryId: categoryMap.healthcare },
      { amount: 490, description: 'Streaming subscription', date: new Date(2025, 11, 1), categoryId: categoryMap.entertainment },
      { amount: 1250, description: 'Dinner party', date: new Date(2025, 11, 12), categoryId: categoryMap.diningout || categoryMap.dining },
      { amount: 350, description: 'Parking fees', date: new Date(2025, 11, 9), categoryId: categoryMap.transport || categoryMap.transportation },
      { amount: 780, description: 'Bakery purchases', date: new Date(2025, 11, 13), categoryId: categoryMap.groceries },
      { amount: 150, description: 'Coffee shop', date: new Date(2025, 11, 15), categoryId: categoryMap.diningout || categoryMap.dining },

      // November 2025 - 7 expenses
      { amount: 1100, description: 'Monthly groceries', date: new Date(2025, 10, 25), categoryId: categoryMap.groceries },
      { amount: 420, description: 'Fuel refill', date: new Date(2025, 10, 22), categoryId: categoryMap.transport || categoryMap.transportation },
      { amount: 890, description: 'Electricity payment', date: new Date(2025, 10, 5), categoryId: categoryMap.utilities },
      { amount: 640, description: 'Medical checkup', date: new Date(2025, 10, 18), categoryId: categoryMap.healthcare },
      { amount: 580, description: 'Cinema outing', date: new Date(2025, 10, 20), categoryId: categoryMap.entertainment },
      { amount: 920, description: 'Restaurant meal', date: new Date(2025, 10, 23), categoryId: categoryMap.diningout || categoryMap.dining },
      { amount: 380, description: 'Public transport', date: new Date(2025, 10, 15), categoryId: categoryMap.transport || categoryMap.transportation },
    ]

    console.log('✨ Creating 30 expenses...')
    let count = 0
    for (const expense of expenses) {
      if (expense.categoryId) {
        await prisma.expense.create({
          data: {
            ...expense,
            userId: user.id,
            bankAccountId: bankAccount?.id
          }
        })
        count++
      }
    }

    console.log(`✅ Added ${count} expenses for test user`)
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

updateExpenses()
