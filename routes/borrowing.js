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

// #swagger.tags = ['Borrowing']
// #swagger.summary = 'Create a new borrowing record'
// #swagger.parameters['body'] = {
//   in: 'body',
//   required: true,
//   schema: { $ref: '#/definitions/BorrowingRecord' }
// }
router.post('/', validate(borrowingCreateSchema), borrowingController.create);

// #swagger.tags = ['Borrowing']
// #swagger.summary = 'Return a borrowed book'
// #swagger.parameters['body'] = {
//   in: 'body',
//   required: false,
//   schema: { $ref: '#/definitions/BorrowingRecord' }
// }
router.put(
  '/:id/return',
  ensureObjectIdParam('id'),
  validate(borrowingReturnSchema),
  borrowingController.returnBorrow
);
router.delete('/:id', ensureObjectIdParam('id'), borrowingController.remove);

module.exports = router;
