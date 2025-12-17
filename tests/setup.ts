import { PrismaClient } from '@prisma/client'

// Mock Prisma Client for tests
jest.mock('@/config/database', () => ({
  prisma: {
    inflationRate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    savingsTip: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userTip: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    userDeal: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
    },
    budget: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}))

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/costsense_test'

// Global test timeout
jest.setTimeout(10000)

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
})
