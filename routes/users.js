const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const {
  validate,
  ensureObjectIdParam,
  userCreateSchema,
  userAdminUpdateSchema,
  userUpdateSchema
} = require('../middleware/validation');

router.get('/me', usersController.getMe);
router.put('/me/:id', ensureObjectIdParam('id'), validate(userUpdateSchema), usersController.updateMe);
router.delete('/me/:id', ensureObjectIdParam('id'), usersController.removeMe);

router.get('/', usersController.getAll);
router.get(
  '/:id',
  ensureObjectIdParam('id'),
  usersController.getSingle
);
router.post('/', validate(userCreateSchema), usersController.create);
router.put(
  '/:id',
  ensureObjectIdParam('id'),
  validate(userAdminUpdateSchema),
  usersController.update
);
router.delete(
  '/:id',
  ensureObjectIdParam('id'),
  usersController.remove
);

module.exports = router;
