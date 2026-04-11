const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);

const { MongoClient } = require('mongodb');

let database;
let client;

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

const initDb = (callback) => {
  if (database) {
    console.log('Database is already initialized!');
    return callback(null, database);
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const error = new Error('MONGODB_URI is not defined in environment variables');
    console.error('Configuration error:', error.message);
    return callback(error);
  }

  console.log('Attempting to connect to MongoDB...');

  const encodedUri = encodeMongoURI(uri);

  const clientOptions = {
    family: 4,
    retryWrites: true,
    writeConcern: { w: 'majority' },
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  };

  client = new MongoClient(encodedUri, clientOptions);

  client
    .connect()
    .then((connectedClient) => {
      database = connectedClient;
      console.log('Connected to MongoDB successfully.');
      callback(null, database);
    })
    .catch((err) => {
      let errorMessage = err.message;
      if (errorMessage.includes('mongodb')) {
        errorMessage = errorMessage.replace(
          /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g,
          'mongodb://***:***@'
        );
      }

      console.error('MongoDB connection error:', errorMessage);

      const sanitizedError = new Error(errorMessage);
      sanitizedError.originalError = err;
      callback(sanitizedError);
    });
};

const getdatabase = () => {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
};

const closeDatabase = async () => {
  if (client) {
    try {
      await client.close();
      database = undefined;
      client = undefined;
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }
  }
};

process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  initDb,
  getdatabase,
  closeDatabase
};
