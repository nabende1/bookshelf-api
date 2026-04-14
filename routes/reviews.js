const express = require('express');

const reviewsController = require('../controllers/reviews');
const {
  ensureObjectIdParam,
  validate,
  reviewsQuerySchema,
  reviewCreateSchema,
  reviewUpdateSchema
} = require('../middleware/validation');

const router = express.Router();

router.get('/', validate(reviewsQuerySchema, 'query'), reviewsController.getAll);
router.get('/:id', ensureObjectIdParam('id'), reviewsController.getSingle);
router.post('/', validate(reviewCreateSchema), reviewsController.create);
router.put(
  '/:id',
  ensureObjectIdParam('id'),
  validate(reviewUpdateSchema),
  reviewsController.update
);
router.delete('/:id', ensureObjectIdParam('id'), reviewsController.remove);

module.exports = router;
