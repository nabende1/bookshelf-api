const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  validate,
  ensureObjectIdParam,
  userCreateSchema,
  userAdminUpdateSchema,
  userUpdateSchema
} = require('../middleware/validation');

router.get('/me', authenticate, usersController.getMe);
router.put('/me', authenticate, validate(userUpdateSchema), usersController.updateMe);
router.delete('/me', authenticate, usersController.removeMe);

router.get('/', authenticate, requireAdmin, usersController.getAll);
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  ensureObjectIdParam('id'),
  usersController.getSingle
);
router.post('/', authenticate, requireAdmin, validate(userCreateSchema), usersController.create);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  ensureObjectIdParam('id'),
  validate(userAdminUpdateSchema),
  usersController.update
);
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  ensureObjectIdParam('id'),
  usersController.remove
);

module.exports = router;
