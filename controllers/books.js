const { ObjectId } = require('mongodb');

const mongodb = require('../data/database');
const { DB_NAME } = require('../config/db.config');
const { sanitizeText } = require('../middleware/validation');

const booksCollection = () => mongodb.getdatabase().db(DB_NAME).collection('books');

const getAll = async (req, res) => {
  try {
    const { genre, author, title, page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);

    const query = {};
    if (genre) query.genre = { $regex: sanitizeText(genre), $options: 'i' };
    if (author) query.author = { $regex: sanitizeText(author), $options: 'i' };
    if (title) query.title = { $regex: sanitizeText(title), $options: 'i' };

    const collection = booksCollection();
    const [items, total] = await Promise.all([
      collection
        .find(query)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      collection.countDocuments(query)
    ]);

    return res.status(200).json({
      data: items,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({ error: 'Failed to fetch books' });
  }
};

const getSingle = async (req, res) => {
  try {
    const collection = booksCollection();
    const book = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return res.status(500).json({ error: 'Failed to fetch book' });
  }
};

const create = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      genre,
      publisher,
      publishYear,
      pages,
      language,
      description,
      coverUrl,
      availableCopies
    } = req.body;

    if (
      !title ||
      !author ||
      !isbn ||
      !genre ||
      !publisher ||
      !publishYear ||
      !pages ||
      !language ||
      !coverUrl ||
      availableCopies === undefined
    ) {
      return res.status(400).json({ error: 'Missing required fields for book creation' });
    }

    const book = {
      title: sanitizeText(title),
      author: sanitizeText(author),
      isbn: sanitizeText(isbn),
      genre: sanitizeText(genre),
      publisher: sanitizeText(publisher),
      publishYear: Number.parseInt(publishYear, 10),
      pages: Number.parseInt(pages, 10),
      language: sanitizeText(language),
      description: sanitizeText(description || ''),
      coverUrl: sanitizeText(coverUrl),
      availableCopies: Number.parseInt(availableCopies, 10)
    };

    if (book.publishYear < 0 || book.pages <= 0 || book.availableCopies < 0) {
      return res.status(400).json({ error: 'Invalid numeric values for book fields' });
    }

    const result = await booksCollection().insertOne(book);
    return res.status(201).json({ message: 'Book created', id: result.insertedId });
  } catch (error) {
    console.error('Error creating book:', error);
    return res.status(500).json({ error: 'Failed to create book' });
  }
};

const update = async (req, res) => {
  try {
    const allowedFields = [
      'title',
      'author',
      'isbn',
      'genre',
      'publisher',
      'publishYear',
      'pages',
      'language',
      'description',
      'coverUrl',
      'availableCopies'
    ];

    const updateDoc = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No valid fields supplied for update' });
    }

    [
      'title',
      'author',
      'isbn',
      'genre',
      'publisher',
      'language',
      'description',
      'coverUrl'
    ].forEach((field) => {
      if (updateDoc[field] !== undefined) {
        updateDoc[field] = sanitizeText(updateDoc[field]);
      }
    });

    ['publishYear', 'pages', 'availableCopies'].forEach((field) => {
      if (updateDoc[field] !== undefined) {
        updateDoc[field] = Number.parseInt(updateDoc[field], 10);
      }
    });

    const result = await booksCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json({ message: 'Book updated' });
  } catch (error) {
    console.error('Error updating book:', error);
    return res.status(500).json({ error: 'Failed to update book' });
  }
};

const remove = async (req, res) => {
  try {
    const result = await booksCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    return res.status(200).json({ message: 'Book deleted' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return res.status(500).json({ error: 'Failed to delete book' });
  }
};

module.exports = {
  getAll,
  getSingle,
  create,
  update,
  remove
};
