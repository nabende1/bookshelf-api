const { ObjectId } = require('mongodb');

const mongodb = require('../data/database');
const { DB_NAME } = require('../config/db.config');
const { sanitizeText } = require('../middleware/validation');

const reviewsCollection = () => mongodb.getdatabase().db(DB_NAME).collection('reviews');
const booksCollection = () => mongodb.getdatabase().db(DB_NAME).collection('books');

const getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.bookId) {
      query.bookId = new ObjectId(req.query.bookId);
    }

    const items = await reviewsCollection().find(query).sort({ reviewDate: -1 }).toArray();
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

const getSingle = async (req, res) => {
  try {
    const review = await reviewsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return res.status(500).json({ error: 'Failed to fetch review' });
  }
};

const create = async (req, res) => {
  try {
    const { bookId, rating, comment, userId } = req.body;

    if (!bookId || rating === undefined || !userId) {
      return res.status(400).json({ error: 'bookId, rating, and userId are required' });
    }

    const numericRating = Number.parseInt(rating, 10);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const targetBook = await booksCollection().findOne({ _id: new ObjectId(bookId) });
    if (!targetBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const review = {
      bookId: new ObjectId(bookId),
      userId: new ObjectId(userId),
      rating: numericRating,
      comment: sanitizeText(comment || ''),
      reviewDate: new Date().toISOString(),
      helpfulCount: 0
    };

    const result = await reviewsCollection().insertOne(review);
    return res.status(201).json({ message: 'Review created', id: result.insertedId });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ error: 'Failed to create review' });
  }
};

const update = async (req, res) => {
  try {
    const review = await reviewsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updateDoc = {};
    if (req.body.rating !== undefined) {
      const numericRating = Number.parseInt(req.body.rating, 10);
      if (numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      updateDoc.rating = numericRating;
    }
    if (req.body.comment !== undefined) {
      updateDoc.comment = sanitizeText(req.body.comment);
    }
    if (req.body.helpfulCount !== undefined) {
      updateDoc.helpfulCount = Math.max(Number.parseInt(req.body.helpfulCount, 10) || 0, 0);
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No valid review fields supplied for update' });
    }

    await reviewsCollection().updateOne({ _id: review._id }, { $set: updateDoc });
    return res.status(200).json({ message: 'Review updated' });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ error: 'Failed to update review' });
  }
};

const remove = async (req, res) => {
  try {
    const review = await reviewsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await reviewsCollection().deleteOne({ _id: review._id });
    return res.status(200).json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
};

module.exports = {
  getAll,
  getSingle,
  create,
  update,
  remove
};
