# Testing the BookShelf API

## Problem
The POST /books endpoint is returning a 500 error when trying to create a book.

## Root Cause Analysis
**Missing Authorization Token** - The POST /books endpoint requires:
1. Valid JWT token in the `Authorization` header
2. Admin role to create books

## How to Test

### Option 1: Use GitHub OAuth Login (Production)
1. Go to `https://bookshelf-api-1nnx.onrender.com/auth/github`
2. Authorize the application
3. Copy the token from the response
4. Use this token in the `Authorization: Bearer <token>` header

### Option 2: Use Local Development Server

```bash
# Start the dev server
npm run dev

# In another terminal, run the tests
npm test
```

The tests include a full authentication flow and demonstrate how to create books correctly.

### Option 3: Manual Testing with cURL

```bash
# First, get a token from GitHub OAuth
GITHUB_TOKEN="Your GitHub OAuth Token Here"

# Call POST /books with authentication
curl -X POST http://localhost:8080/books \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt, David Thomas",
    "isbn": "9780135957059",
    "genre": "Software Development",
    "publisher": "Addison-Wesley Professional",
    "publishYear": 2019,
    "pages": 352,
    "language": "English",
    "description": "A practical guide for software developers.",
    "coverUrl": "https://example.com/images/pragmatic-programmer.jpg",
    "availableCopies": 5
  }'
```

## Environment Setup for Production

Ensure these environment variables are set on Render:

```env
MONGODB_URI=your-mongodb-atlas-uri
DB_NAME=bookshelfDB
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=2h
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret
GITHUB_CALLBACK_URL=https://bookshelf-api-1nnx.onrender.com/auth/callback
NODE_ENV=production
```

## What the Error Logging Shows

After the recent improvements, errors will be logged to the console with details:
- `Error creating book: [detailed error message]`
- `Token verification failed: [JWT error details]`

Check the Render logs for these messages to diagnose production issues.

## API Documentation

Visit `https://bookshelf-api-1nnx.onrender.com/api-docs` to see all available endpoints and try them interactively.

## Test Results

All tests pass locally:
- ✔ Authentication flows work correctly
- ✔ Book CRUD operations (with admin token) work
- ✔ Role-based access control works
- ✔ Validation middleware rejects invalid data
