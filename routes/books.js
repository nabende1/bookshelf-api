const express = require('express');

const booksController = require('../controllers/books');
const { authenticate, requireAdmin } = require('../middleware/auth');
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
router.post('/', authenticate, requireAdmin, validate(bookCreateSchema), booksController.create);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  ensureObjectIdParam('id'),
  validate(bookUpdateSchema),
  booksController.update
);
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  ensureObjectIdParam('id'),
  booksController.remove
);

module.exports = router;
