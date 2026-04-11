process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.CORS_ALLOWED_ORIGINS = '';

const DB_NAME = 'bookshelfTestDB';
process.env.DB_NAME = DB_NAME;

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongodb = require('../data/database');
const { ensureIndexes } = require('../data/indexes');
const { createApp } = require('../app');

let mongoServer;
let app;
let db;
let adminToken;
let userToken;
let adminId;
let userId;

const initDb = () =>
  new Promise((resolve, reject) => {
    mongodb.initDb((err) => {
      if (err) return reject(err);
      return resolve();
    });
  });

test.before(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60000
    }
  });
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.DB_NAME = DB_NAME;

  await initDb();
  await ensureIndexes();

  app = createApp();
  db = mongodb.getdatabase().db(DB_NAME);

  adminId = new ObjectId();
  userId = new ObjectId();

  await db.collection('users').insertMany([
    {
      _id: adminId,
      oauthId: 'oauth-admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      avatarUrl: '',
      role: 'admin',
      joinedDate: new Date().toISOString()
    },
    {
      _id: userId,
      oauthId: 'oauth-user',
      displayName: 'Regular User',
      email: 'user@example.com',
      avatarUrl: '',
      role: 'user',
      joinedDate: new Date().toISOString()
    }
  ]);

  adminToken = jwt.sign(
    {
      userId: adminId.toString(),
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'admin'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  userToken = jwt.sign(
    {
      userId: userId.toString(),
      email: 'user@example.com',
      displayName: 'Regular User',
      role: 'user'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

test.after(async () => {
  await mongodb.closeDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('auth routes return expected responses', async () => {
  const infoRes = await request(app).get('/auth/github-info');
  assert.equal(infoRes.status, 200);

  const githubRes = await request(app).get('/auth/github');
  assert.ok([302, 500].includes(githubRes.status));

  const failureRes = await request(app).get('/auth/failure');
  assert.equal(failureRes.status, 401);
});

test('books RBAC and CRUD flow works', async () => {
  const basePayload = {
    title: 'Integration Testing Guide',
    author: 'QA Team',
    isbn: `9780000${Date.now()}`,
    genre: 'Testing',
    publisher: 'Class Press',
    publishYear: 2024,
    pages: 250,
    language: 'English',
    description: 'Test book for integration suite.',
    coverUrl: 'https://example.com/testing-book.jpg',
    availableCopies: 3
  };

  const unauthRes = await request(app).post('/books').send(basePayload);
  assert.equal(unauthRes.status, 401);

  const forbiddenRes = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${userToken}`)
    .send(basePayload);
  assert.equal(forbiddenRes.status, 403);

  const createRes = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(basePayload);
  assert.equal(createRes.status, 201);
  assert.ok(createRes.body.id);

  const createdId = createRes.body.id;

  const getRes = await request(app).get(`/books/${createdId}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.title, basePayload.title);

  const updateRes = await request(app)
    .put(`/books/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ availableCopies: 10 });
  assert.equal(updateRes.status, 200);

  const verifyRes = await request(app).get(`/books/${createdId}`);
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyRes.body.availableCopies, 10);

  const deleteRes = await request(app)
    .delete(`/books/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(deleteRes.status, 200);
});

test('users admin CRUD and auth protection work', async () => {
  const forbiddenListRes = await request(app)
    .get('/users')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(forbiddenListRes.status, 403);

  const listRes = await request(app).get('/users').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.body));

  const createRes = await request(app)
    .post('/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      displayName: 'Created User',
      email: `created-${Date.now()}@example.com`,
      avatarUrl: 'https://example.com/avatar.png',
      role: 'user'
    });
  assert.equal(createRes.status, 201);

  const createdUserId = createRes.body.id;

  const getSingleRes = await request(app)
    .get(`/users/${createdUserId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(getSingleRes.status, 200);

  const updateRes = await request(app)
    .put(`/users/${createdUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ displayName: 'Updated User', role: 'admin' });
  assert.equal(updateRes.status, 200);

  const meRes = await request(app).get('/users/me').set('Authorization', `Bearer ${userToken}`);
  assert.equal(meRes.status, 200);

  const deleteRes = await request(app)
    .delete(`/users/${createdUserId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(deleteRes.status, 200);
});

test('get and getAll routes are covered across collections', async () => {
  const seedBookId = new ObjectId();
  const seedReviewId = new ObjectId();
  const seedBorrowId = new ObjectId();

  await db.collection('books').insertOne({
    _id: seedBookId,
    title: 'Coverage Book',
    author: 'Coverage Author',
    isbn: `9781111${Date.now()}`,
    genre: 'Testing',
    publisher: 'Coverage Press',
    publishYear: 2025,
    pages: 180,
    language: 'English',
    description: 'Seed book for GET coverage tests.',
    coverUrl: 'https://example.com/coverage-book.jpg',
    availableCopies: 2
  });

  await db.collection('reviews').insertOne({
    _id: seedReviewId,
    bookId: seedBookId,
    userId,
    rating: 4,
    comment: 'Seed review',
    reviewDate: new Date().toISOString(),
    helpfulCount: 0
  });

  await db.collection('borrowingRecords').insertOne({
    _id: seedBorrowId,
    bookId: seedBookId,
    userId,
    borrowDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: null,
    status: 'borrowed',
    fines: 0
  });

  const booksGetAllRes = await request(app).get('/books');
  assert.equal(booksGetAllRes.status, 200);
  assert.ok(Array.isArray(booksGetAllRes.body.data));

  const booksGetSingleRes = await request(app).get(`/books/${seedBookId.toString()}`);
  assert.equal(booksGetSingleRes.status, 200);

  const reviewsGetAllRes = await request(app).get('/reviews');
  assert.equal(reviewsGetAllRes.status, 200);
  assert.ok(Array.isArray(reviewsGetAllRes.body));

  const reviewsGetSingleRes = await request(app).get(`/reviews/${seedReviewId.toString()}`);
  assert.equal(reviewsGetSingleRes.status, 200);

  const usersGetAllRes = await request(app)
    .get('/users')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(usersGetAllRes.status, 200);

  const usersGetSingleRes = await request(app)
    .get(`/users/${userId.toString()}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(usersGetSingleRes.status, 200);

  const borrowingGetAllRes = await request(app)
    .get('/borrowing')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(borrowingGetAllRes.status, 200);
  assert.ok(Array.isArray(borrowingGetAllRes.body));
});

test('validation middleware rejects bad payloads', async () => {
  const invalidBookRes = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Bad Book' });
  assert.equal(invalidBookRes.status, 400);
  assert.equal(invalidBookRes.body.error, 'Validation failed');

  const invalidReviewRes = await request(app)
    .post('/reviews')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ bookId: 'not-an-object-id', rating: 20 });
  assert.equal(invalidReviewRes.status, 400);
});
