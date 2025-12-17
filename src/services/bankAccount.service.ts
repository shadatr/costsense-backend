import { prisma } from '@/config/database'
import { NotFoundError } from '@/utils/errors'
import logger from '@/utils/logger'

export class BankAccountService {
  async create(userId: string, data: any) {
    const bankAccount = await prisma.bankAccount.create({
      data: {
        ...data,
        userId,
      },
    })

    logger.info(`Bank account created: ${bankAccount.id} for user: ${userId}`)
    return bankAccount
  }

  async findAll(userId: string) {
    return await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    })
  }

  async findById(id: string, userId: string) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    })

    if (!bankAccount) {
      throw new NotFoundError('Bank account not found')
    }

    return bankAccount
  }

  async update(id: string, userId: string, data: any) {
    await this.findById(id, userId)

    const bankAccount = await prisma.bankAccount.update({
      where: { id },
      data,
    })

    logger.info(`Bank account updated: ${bankAccount.id}`)
    return bankAccount
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId)

    await prisma.bankAccount.delete({
      where: { id },
    })

    logger.info(`Bank account deleted: ${id}`)
    return { message: 'Bank account deleted successfully' }
  }

  async getSummary(userId: string) {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId, isActive: true },
    })

    let totalBalance = 0
    let checking = 0
    let savings = 0
    let creditDebt = 0

    accounts.forEach((account) => {
      const balance = Number(account.balance)
      if (account.accountType === 'checking') {
        checking += balance
        totalBalance += balance
      } else if (account.accountType === 'savings') {
        savings += balance
        totalBalance += balance
      } else if (account.accountType === 'credit') {
        creditDebt += Math.abs(balance)
        totalBalance -= Math.abs(balance)
      }
    })

    // Calculate monthly change (mock for now - would need historical data)
    const monthlyChange = {
      amount: totalBalance * 0.05, // Mock 5% increase
      percentage: 5,
    }

    return {
      totalBalance,
      accountBreakdown: {
        checking,
        savings,
        creditDebt,
      },
      netWorth: totalBalance,
      monthlyChange,
    }
  }

  async sync(id: string, userId: string) {
    await this.findById(id, userId)

    // Mock sync - in production this would call bank APIs
    logger.info(`Syncing bank account: ${id}`)

    return {
      message: 'Bank account synced successfully',
      lastSyncedAt: new Date().toISOString(),
    }
  }
}

export const bankAccountService = new BankAccountService()
