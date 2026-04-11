const mongodb = require('./data/database');
const { ensureIndexes } = require('./data/indexes');
const { NODE_ENV } = require('./config/security.config');
const { createApp } = require('./app');

const app = createApp();
const port = process.env.PORT || 8080;

mongodb.initDb((err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  } else {
    ensureIndexes()
      .then(() => {
        app.listen(port, () => {
          console.log(`Database connected and Server running on port ${port} (${NODE_ENV})`);
          console.log(`Swagger UI: http://localhost:${port}/api-docs`);
        });
      })
      .catch((indexError) => {
        console.error('Failed to ensure MongoDB indexes:', indexError.message);
        process.exit(1);
      });
  }
});
