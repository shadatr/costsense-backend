import { Router } from 'express'
import { categoryController } from '@/controllers/category.controller'
import { validate } from '@/middleware/validation'
import { createCategorySchema, updateCategorySchema } from '@/utils/validators'
import { authenticate } from '@/middleware/auth'

const router = Router()
router.use(authenticate)

router.post('/', validate(createCategorySchema), categoryController.create.bind(categoryController))
router.get('/', categoryController.findAll.bind(categoryController))
router.get('/:id', categoryController.findById.bind(categoryController))
router.patch('/:id', validate(updateCategorySchema), categoryController.update.bind(categoryController))
router.delete('/:id', categoryController.delete.bind(categoryController))

export default router
