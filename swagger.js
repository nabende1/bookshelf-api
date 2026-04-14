const fs = require('fs');
const path = require('path');
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
    }
  ],
  paths: {
    '/books/': {
      post: {
        tags: ['Books'],
        summary: 'Create a new book',
        parameters: [
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/Book' }
          }
        ]
      }
    },
    '/books/{id}': {
      put: {
        tags: ['Books'],
        summary: 'Update book by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string'
          },
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/Book' }
          }
        ]
      }
    },
    '/reviews/': {
      post: {
        tags: ['Reviews'],
        summary: 'Create a new review',
        parameters: [
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/Review' }
          }
        ]
      }
    },
    '/reviews/{id}': {
      put: {
        tags: ['Reviews'],
        summary: 'Update review by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string'
          },
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/Review' }
          }
        ]
      }
    },
    '/users/': {
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        parameters: [
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/User' }
          }
        ]
      }
    },
    '/users/{id}': {
      put: {
        tags: ['Users'],
        summary: 'Update user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string'
          },
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/User' }
          }
        ]
      }
    },
    '/users/me/{id}': {
      put: {
        tags: ['Users'],
        summary: 'Update my profile by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string'
          },
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/User' }
          }
        ]
      }
    },
    '/borrowing/': {
      post: {
        tags: ['Borrowing'],
        summary: 'Create a new borrowing record',
        parameters: [
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/BorrowingRecord' }
          }
        ]
      }
    },
    '/borrowing/{id}/return': {
      put: {
        tags: ['Borrowing'],
        summary: 'Return a borrowed book',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string'
          },
          {
            name: 'body',
            in: 'body',
            required: false,
            schema: { $ref: '#/definitions/BorrowingRecord' }
          }
        ]
      }
    }
  },

  definitions: {
    User: {
      displayName: 'John Doe',
      email: 'john@example.com',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'user'
    },
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

const ensureBodyParameter = (swaggerDoc, route, method, ref, required = true) => {
  if (!swaggerDoc.paths?.[route]?.[method]) return;

  const operation = swaggerDoc.paths[route][method];
  operation.parameters = operation.parameters || [];

  const bodyIndex = operation.parameters.findIndex((param) => param.in === 'body');
  const bodyParam = {
    name: 'body',
    in: 'body',
    required,
    schema: { $ref: ref }
  };

  if (bodyIndex >= 0) {
    operation.parameters[bodyIndex] = {
      ...operation.parameters[bodyIndex],
      ...bodyParam
    };
  } else {
    operation.parameters.push(bodyParam);
  }
};

const enforceBodyParameters = () => {
  const outputPath = path.resolve(__dirname, outputFile);
  const swaggerDoc = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  ensureBodyParameter(swaggerDoc, '/books/', 'post', '#/definitions/Book');
  ensureBodyParameter(swaggerDoc, '/books/{id}', 'put', '#/definitions/Book');
  ensureBodyParameter(swaggerDoc, '/reviews/', 'post', '#/definitions/Review');
  ensureBodyParameter(swaggerDoc, '/reviews/{id}', 'put', '#/definitions/Review');
  ensureBodyParameter(swaggerDoc, '/users/', 'post', '#/definitions/User');
  ensureBodyParameter(swaggerDoc, '/users/{id}', 'put', '#/definitions/User');
  ensureBodyParameter(swaggerDoc, '/users/me/{id}', 'put', '#/definitions/User');
  ensureBodyParameter(swaggerDoc, '/borrowing/', 'post', '#/definitions/BorrowingRecord');
  ensureBodyParameter(swaggerDoc, '/borrowing/{id}/return', 'put', '#/definitions/BorrowingRecord', false);

  fs.writeFileSync(outputPath, JSON.stringify(swaggerDoc, null, 2));
};

swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    enforceBodyParameters();
  })
  .catch((error) => {
    console.error('Swagger generation failed:', error);
    process.exit(1);
  });
