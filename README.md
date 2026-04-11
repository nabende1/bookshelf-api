# BookShelf API

BookShelf API is a Node.js and MongoDB backend for catalog management, reviews, and borrowing operations.

## Setup

1. Install dependencies:

   npm install

2. Configure environment variables:

   Copy .env.example to .env and set values for your environment.

3. Start development server:

   npm run dev

4. Seed sample books (optional):

   npm run seed

5. Open Swagger docs:

   http://localhost:8080/api-docs

6. Run automated tests:

   npm test

## Environment

BookShelf can share the same MongoDB Atlas cluster as other projects while using its own database name:

- MONGODB_URI=<same cluster URI>
- DB_NAME=bookshelfDB
- JWT_SECRET=<secret>
- JWT_EXPIRES_IN=2h
- NODE_ENV=production|development
- TRUST_PROXY=true (set true on Render/proxy deployments)
- CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
- RATE_LIMIT_WINDOW_MS=900000
- RATE_LIMIT_MAX=100

## Auth (GitHub OAuth)

Configure these environment variables first:

- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_CALLBACK_URL=http://localhost:8080/auth/callback
- FRONTEND_URL (optional redirect URL that receives token in query string)
- ADMIN_EMAILS (optional comma-separated admin emails)

OAuth endpoints:

- GET /auth/github (starts GitHub login)
- GET /auth/callback (GitHub redirect target)
- GET /auth/failure

Swagger/API clients calling /auth/github with application/json receive a helper JSON response instead of cross-origin redirect. Use a browser URL: /auth/github?redirect=true

If FRONTEND_URL is configured, callback redirects there with token and user info query params.
If FRONTEND_URL is empty, callback returns JSON with token and user object.

## Seed Data

The seed command upserts sample books into the books collection using ISBN as the unique key, so running it multiple times is safe.

## Production Hardening Included

- Helmet security headers
- Global rate limiting
- Configurable strict CORS policy
- Request ID response header and request logging
- Centralized 404 and error handlers with sanitized error responses
- Automatic MongoDB index creation on startup

## Automated Tests

- Integration tests are in the tests folder and cover auth behavior, RBAC, validation failures, and books CRUD.
- The first test run may take longer because mongodb-memory-server can download a MongoDB binary.
