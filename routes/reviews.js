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

// #swagger.tags = ['Reviews']
// #swagger.summary = 'Create a new review'
// #swagger.parameters['body'] = {
//   in: 'body',
//   required: true,
//   schema: { $ref: '#/definitions/Review' }
// }
router.post('/', validate(reviewCreateSchema), reviewsController.create);

// #swagger.tags = ['Reviews']
// #swagger.summary = 'Update review by ID'
// #swagger.parameters['body'] = {
//   in: 'body',
//   required: true,
//   schema: { $ref: '#/definitions/Review' }
// }
router.put(
  '/:id',
  ensureObjectIdParam('id'),
  validate(reviewUpdateSchema),
  reviewsController.update
);
router.delete('/:id', ensureObjectIdParam('id'), reviewsController.remove);

module.exports = router;
