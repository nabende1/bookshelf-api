const dotenv = require('dotenv');
const dns = require('dns');
const { MongoClient } = require('mongodb');

dotenv.config();
dns.setServers(['1.1.1.1', '8.8.8.8']);

const DB_NAME = process.env.DB_NAME || 'bookshelfDB';

const encodeMongoURI = (uri) => {
  if (!uri) return uri;

  try {
    const uriPattern = /^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/;
    const match = uri.match(uriPattern);

    if (match) {
      const [, protocol, username, password, rest] = match;
      const encodedUsername = encodeURIComponent(username);
      const encodedPassword = encodeURIComponent(password);
      return `${protocol}${encodedUsername}:${encodedPassword}@${rest}`;
    }
    return uri;
  } catch {
    return uri;
  }
};

const sampleBooks = [
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    genre: 'Self-help',
    publisher: 'Avery',
    publishYear: 2018,
    pages: 320,
    language: 'English',
    description: 'A practical guide to habit formation and behavior change.',
    coverUrl: 'https://example.com/covers/atomic-habits.jpg',
    availableCopies: 5
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    genre: 'Programming',
    publisher: 'Prentice Hall',
    publishYear: 2008,
    pages: 464,
    language: 'English',
    description: 'Principles and best practices for writing clean maintainable code.',
    coverUrl: 'https://example.com/covers/clean-code.jpg',
    availableCopies: 4
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    isbn: '9780201616224',
    genre: 'Programming',
    publisher: 'Addison-Wesley',
    publishYear: 1999,
    pages: 352,
    language: 'English',
    description: 'Classic book on software craftsmanship and practical thinking.',
    coverUrl: 'https://example.com/covers/pragmatic-programmer.jpg',
    availableCopies: 6
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    isbn: '9781455586691',
    genre: 'Productivity',
    publisher: 'Grand Central Publishing',
    publishYear: 2016,
    pages: 304,
    language: 'English',
    description: 'Rules for focused success in a distracted world.',
    coverUrl: 'https://example.com/covers/deep-work.jpg',
    availableCopies: 3
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn: '9780062315007',
    genre: 'Fiction',
    publisher: 'HarperOne',
    publishYear: 1988,
    pages: 208,
    language: 'English',
    description: 'A philosophical novel about destiny and self-discovery.',
    coverUrl: 'https://example.com/covers/the-alchemist.jpg',
    availableCopies: 7
  }
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required in .env');
  }

  const client = new MongoClient(encodeMongoURI(uri), {
    family: 4,
    serverSelectionTimeoutMS: 10000
  });

  try {
    await client.connect();
    const books = client.db(DB_NAME).collection('books');

    let upsertedCount = 0;
    for (const book of sampleBooks) {
      const result = await books.updateOne({ isbn: book.isbn }, { $set: book }, { upsert: true });
      if (result.upsertedCount > 0) {
        upsertedCount += 1;
      }
    }

    const totalCount = await books.countDocuments();
    console.log(
      `Seed complete. Added ${upsertedCount} new books. Total books in collection: ${totalCount}.`
    );
  } finally {
    await client.close();
  }
};

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
