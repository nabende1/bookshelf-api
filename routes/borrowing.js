const express = require('express');

const borrowingController = require('../controllers/borrowing');
const {
  ensureObjectIdParam,
  validate,
  borrowingQuerySchema,
  borrowingCreateSchema,
  borrowingReturnSchema
} = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(borrowingQuerySchema, 'query'), borrowingController.getAll);
router.post('/', validate(borrowingCreateSchema), borrowingController.create);
router.put(
  '/:id/return',
  ensureObjectIdParam('id'),
  validate(borrowingReturnSchema),
  borrowingController.returnBorrow
);
router.delete('/:id', ensureObjectIdParam('id'), borrowingController.remove);

module.exports = router;
