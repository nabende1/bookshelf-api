const express = require('express');

const borrowingController = require('../controllers/borrowing');
const { authenticate } = require('../middleware/auth');
const {
  ensureObjectIdParam,
  validate,
  borrowingQuerySchema,
  borrowingCreateSchema,
  borrowingReturnSchema
} = require('../middleware/validation');

const router = express.Router();

router.get('/', authenticate, validate(borrowingQuerySchema, 'query'), borrowingController.getAll);
router.post('/', authenticate, validate(borrowingCreateSchema), borrowingController.create);
router.put(
  '/:id/return',
  authenticate,
  ensureObjectIdParam('id'),
  validate(borrowingReturnSchema),
  borrowingController.returnBorrow
);
router.delete('/:id', authenticate, ensureObjectIdParam('id'), borrowingController.remove);

module.exports = router;
