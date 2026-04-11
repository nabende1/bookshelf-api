const { DB_NAME } = require('../config/db.config');
const mongodb = require('./database');

const ensureIndexes = async () => {
  const db = mongodb.getdatabase().db(DB_NAME);

  await Promise.all([
    db.collection('books').createIndex({ isbn: 1 }, { unique: true }),
    db.collection('books').createIndex({ title: 1 }),
    db.collection('books').createIndex({ author: 1 }),
    db.collection('books').createIndex({ genre: 1 }),
    db.collection('reviews').createIndex({ bookId: 1, reviewDate: -1 }),
    db.collection('reviews').createIndex({ userId: 1 }),
    db.collection('users').createIndex({ oauthId: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('borrowingRecords').createIndex({ userId: 1, borrowDate: -1 }),
    db.collection('borrowingRecords').createIndex({ bookId: 1, status: 1 })
  ]);
};

module.exports = {
  ensureIndexes
};
