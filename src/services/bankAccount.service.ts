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
}

export const bankAccountService = new BankAccountService()
