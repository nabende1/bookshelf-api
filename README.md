# BookShelf API

A simple REST API for managing books, reviews, and borrowing records. Built with Node.js, Express, and MongoDB.

## What does it do?

- Browse and manage a library of books
- Leave reviews on books
- Track who has borrowed which book
- Log in with your GitHub account
- Admins can manage users

## Requirements

Before you start, make sure you have these installed:

- [Node.js](https://nodejs.org) (version 18 or higher)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works fine)
- A [GitHub OAuth App](https://github.com/settings/developers) for login

## Getting Started

**1. Clone the repo and install packages**

```bash
git clone <your-repo-url>
cd bookshelf-api
npm install
```

**2. Create your `.env` file**

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Open `.env` and update these values:

```
MONGODB_URI=        # your MongoDB Atlas connection string
DB_NAME=bookshelfDB
JWT_SECRET=         # any long random string (used to sign login tokens)
GITHUB_CLIENT_ID=   # from your GitHub OAuth App
GITHUB_CLIENT_SECRET= # from your GitHub OAuth App
GITHUB_CALLBACK_URL=http://localhost:8080/auth/callback
```

**3. Start the server**

```bash
npm run dev
```

The server runs at `http://localhost:8080`.

**4. Open the API docs**

Visit `http://localhost:8080/api-docs` in your browser to see and test all available endpoints.

## Logging In

This API uses GitHub to log in. Here is how it works:

1. Open `http://localhost:8080/auth/github` in your browser
2. You will be redirected to GitHub to approve access
3. After approving, you get back a **token**
4. Copy that token and use it as a `Bearer` token in the `Authorization` header for protected requests

Example header:
```
Authorization: Bearer <your token here>
```

## Optional: Add Sample Books

Run this once to load some example books into your database:

```bash
npm run seed
```

You can run it multiple times safely — it will not create duplicates.

## Running Tests

```bash
npm test
```

The first run might be slow because it downloads a small in-memory MongoDB binary for testing. Subsequent runs are faster.

## Project Structure

```
bookshelf-api/
├── controllers/   # Business logic for each resource
├── routes/        # URL definitions
├── middleware/    # Auth checks, validation, error handling
├── config/        # App configuration
├── data/          # Database connection
├── tests/         # Automated tests
└── app.js         # Main app setup
```

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start server with auto-reload |
| `npm test` | Run all tests |
| `npm run seed` | Load sample books |
| `npm run swagger` | Regenerate API docs |
| `npm run lint` | Check code for errors |
