const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'BookShelf API',
    description: 'Library management API with books, reviews, users, and borrowing records',
    version: '1.0.0'
  },
  host: 'localhost:8080',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
      name: 'Books',
      description: 'Book catalog endpoints'
    },
    {
      name: 'Reviews',
      description: 'Book review endpoints'
    },
    {
      name: 'Users',
      description: 'User profile endpoints'
    },
    {
      name: 'Borrowing',
      description: 'Borrowing record endpoints'
    },
    {
      name: 'Auth',
      description: 'OAuth and authentication endpoints'
    }
  ],
  definitions: {
    Book: {
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '9780735211292',
      genre: 'Self-help',
      publisher: 'Avery',
      publishYear: 2018,
      pages: 320,
      language: 'English',
      description: 'A practical guide to habit formation.',
      coverUrl: 'https://example.com/covers/atomic-habits.jpg',
      availableCopies: 5
    },
    Review: {
      bookId: '674a1b2c3d4e5f67890abcde',
      userId: '674a1b2c3d4e5f67890ab111',
      rating: 5,
      comment: 'Excellent and practical read.',
      reviewDate: '2026-04-11T10:00:00.000Z',
      helpfulCount: 0
    },
    BorrowingRecord: {
      bookId: '674a1b2c3d4e5f67890abcde',
      userId: '674a1b2c3d4e5f67890ab111',
      borrowDate: '2026-04-11T10:00:00.000Z',
      dueDate: '2026-04-21T10:00:00.000Z',
      returnDate: null,
      status: 'borrowed',
      fines: 0
    },
    AuthResponse: {
      token: 'jwt-token',
      user: {
        userId: '674a1b2c3d4e5f67890ab111',
        email: 'student@example.com',
        displayName: 'Student Name',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'user'
      }
    },
    SuccessResponse: {
      message: 'Operation completed',
      id: '674a1b2c3d4e5f67890abcde'
    },
    ErrorResponse: {
      error: 'Error message here'
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
