const { ObjectId } = require('mongodb');

const mongodb = require('../data/database');
const { DB_NAME } = require('../config/db.config');

const borrowingCollection = () => mongodb.getdatabase().db(DB_NAME).collection('borrowingRecords');
const booksCollection = () => mongodb.getdatabase().db(DB_NAME).collection('books');

const canManageBorrow = (record, requester) => {
  const ownerId = record.userId.toString();
  return requester.role === 'admin' || requester.userId === ownerId;
};

const getAll = async (req, res) => {
  try {
    const query = {};

    if (req.query.userId) {
      if (req.user.role !== 'admin' && req.query.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Cannot view records for other users' });
      }
      query.userId = new ObjectId(req.query.userId);
    } else if (req.user.role !== 'admin') {
      query.userId = new ObjectId(req.user.userId);
    }

    const records = await borrowingCollection().find(query).sort({ borrowDate: -1 }).toArray();
    return res.status(200).json(records);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch borrowing records' });
  }
};

const create = async (req, res) => {
  try {
    const { bookId, dueDate } = req.body;
    if (!bookId || !dueDate) {
      return res.status(400).json({ error: 'bookId and dueDate are required' });
    }

    const bookObjectId = new ObjectId(bookId);
    const bookUpdate = await booksCollection().updateOne(
      { _id: bookObjectId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } }
    );

    if (bookUpdate.matchedCount === 0) {
      return res.status(400).json({ error: 'Book unavailable or not found' });
    }

    const record = {
      bookId: bookObjectId,
      userId: new ObjectId(req.user.userId),
      borrowDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      returnDate: null,
      status: 'borrowed',
      fines: 0
    };

    const result = await borrowingCollection().insertOne(record);
    return res.status(201).json({ message: 'Book borrowed', id: result.insertedId });
  } catch {
    return res.status(500).json({ error: 'Failed to create borrowing record' });
  }
};

const returnBorrow = async (req, res) => {
  try {
    const record = await borrowingCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!record) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }

    if (!canManageBorrow(record, req.user)) {
      return res.status(403).json({ error: 'Not allowed to return this record' });
    }

    if (record.status === 'returned') {
      return res.status(400).json({ error: 'Book was already returned' });
    }

    await Promise.all([
      borrowingCollection().updateOne(
        { _id: record._id },
        {
          $set: {
            status: 'returned',
            returnDate: new Date().toISOString(),
            fines: Math.max(Number.parseFloat(req.body.fines) || 0, 0)
          }
        }
      ),
      booksCollection().updateOne({ _id: record.bookId }, { $inc: { availableCopies: 1 } })
    ]);

    return res.status(200).json({ message: 'Book returned' });
  } catch {
    return res.status(500).json({ error: 'Failed to return book' });
  }
};

const remove = async (req, res) => {
  try {
    const record = await borrowingCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!record) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }

    if (!canManageBorrow(record, req.user)) {
      return res.status(403).json({ error: 'Not allowed to delete this record' });
    }

    if (record.status === 'borrowed') {
      await booksCollection().updateOne({ _id: record.bookId }, { $inc: { availableCopies: 1 } });
    }

    await borrowingCollection().deleteOne({ _id: record._id });
    return res.status(200).json({ message: 'Borrowing record deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete borrowing record' });
  }
};

module.exports = {
  getAll,
  create,
  returnBorrow,
  remove
};
