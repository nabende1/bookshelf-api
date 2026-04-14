const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({
    message: 'BookShelf API server running',
    endpoints: {
      books: 'GET /books',
      reviews: 'GET /reviews',
      users: 'GET /users',
      borrowing: 'GET /borrowing'
    }
  });
});
router.use('/books', require('./books'));
router.use('/reviews', require('./reviews'));
router.use('/users', require('./users'));
router.use('/borrowing', require('./borrowing'));

module.exports = router;
