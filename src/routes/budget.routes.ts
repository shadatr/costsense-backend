import { Router } from 'express'
import { budgetController } from '@/controllers/budget.controller'
import { validate } from '@/middleware/validation'
import { createBudgetSchema, updateBudgetSchema } from '@/utils/validators'
import { authenticate } from '@/middleware/auth'

const router = Router()
router.use(authenticate)

router.post('/', validate(createBudgetSchema), budgetController.create.bind(budgetController))
router.get('/', budgetController.findAll.bind(budgetController))
router.get('/:id', budgetController.findById.bind(budgetController))
router.get('/:id/status', budgetController.getStatus.bind(budgetController))
router.patch('/:id', validate(updateBudgetSchema), budgetController.update.bind(budgetController))
router.delete('/:id', budgetController.delete.bind(budgetController))

export default router
