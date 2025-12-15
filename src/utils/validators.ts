import { z } from 'zod'

// Auth validation schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
})

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
})

// Expense validation schemas
export const createExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
    categoryId: z.string().cuid('Invalid category ID'),
    bankAccountId: z.string().cuid().optional(),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  }),
})

export const updateExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive').optional(),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
    categoryId: z.string().cuid('Invalid category ID').optional(),
    bankAccountId: z.string().cuid().optional().nullable(),
    isRecurring: z.boolean().optional(),
    recurrencePattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  }),
})

// Category validation schemas
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  }),
})

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').optional(),
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  }),
})

// Budget validation schemas
export const createBudgetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Budget name is required'),
    totalAmount: z.number().positive('Total amount must be positive'),
    period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    categoryBudgets: z
      .array(
        z.object({
          categoryId: z.string().cuid(),
          amount: z.number().positive(),
        })
      )
      .optional(),
  }),
})

export const updateBudgetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Budget name is required').optional(),
    totalAmount: z.number().positive('Total amount must be positive').optional(),
    period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
})

// Bank Account validation schemas
export const createBankAccountSchema = z.object({
  body: z.object({
    bankName: z.string().min(1, 'Bank name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    accountType: z.enum(['checking', 'savings', 'credit']).default('checking'),
    balance: z.number().default(0),
    currency: z.string().default('TRY'),
  }),
})

export const updateBankAccountSchema = z.object({
  body: z.object({
    bankName: z.string().min(1, 'Bank name is required').optional(),
    accountNumber: z.string().min(1, 'Account number is required').optional(),
    accountType: z.enum(['checking', 'savings', 'credit']).optional(),
    balance: z.number().optional(),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
})

// User validation schemas
export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
  }),
})

export const updateUserPreferencesSchema = z.object({
  body: z.object({
    currency: z.string().optional(),
    language: z.string().optional(),
    notificationsEnabled: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    budgetAlerts: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
  }),
})

// Query parameter validation
export const paginationSchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).optional(),
    offset: z.string().transform(Number).optional(),
  }),
})

export const dateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
})
