import { Router } from 'express'
import { bankAccountController } from '@/controllers/bankAccount.controller'
import { validate } from '@/middleware/validation'
import { createBankAccountSchema, updateBankAccountSchema } from '@/utils/validators'
import { authenticate } from '@/middleware/auth'

const router = Router()
router.use(authenticate)

router.post('/', validate(createBankAccountSchema), bankAccountController.create.bind(bankAccountController))
router.get('/', bankAccountController.findAll.bind(bankAccountController))
router.get('/:id', bankAccountController.findById.bind(bankAccountController))
router.patch('/:id', validate(updateBankAccountSchema), bankAccountController.update.bind(bankAccountController))
router.delete('/:id', bankAccountController.delete.bind(bankAccountController))

export default router
