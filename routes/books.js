const express = require('express');

const booksController = require('../controllers/books');
const {
  ensureObjectIdParam,
  validate,
  booksQuerySchema,
  bookCreateSchema,
  bookUpdateSchema
} = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(booksQuerySchema, 'query'), booksController.getAll);
router.get('/:id', ensureObjectIdParam('id'), booksController.getSingle);

// #swagger.tags = ['Books']
// #swagger.summary = 'Create a new book'
// #swagger.parameters['body'] = {
//   in: 'body',
//   required: true,
//   schema: { $ref: '#/definitions/Book' }
// }
router.post('/', validate(bookCreateSchema), booksController.create);

// #swagger.tags = ['Books']
// #swagger.summary = 'Update book by ID'
// #swagger.parameters['body'] = {
//   in: 'body',
//   required: true,
//   schema: { $ref: '#/definitions/Book' }
// }
router.put(
  '/:id',
  ensureObjectIdParam('id'),
  validate(bookUpdateSchema),
  booksController.update
);
router.delete(
  '/:id',
  ensureObjectIdParam('id'),
  booksController.remove
);

module.exports = router;
