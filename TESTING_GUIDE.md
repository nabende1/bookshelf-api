# BookShelf API - CRUD Testing Documentation

## Quick Start

1. **Start the server:** `npm start`
2. **Visit Swagger UI:** http://localhost:8080/api-docs
3. **Use VS Code REST Client** (if installed): Open `TESTING.rest` file
4. **Or use cURL** from command line (see examples below)

---

## Testing Workflow

### Phase 1: Create Test User

**Request:**
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Test User",
    "email": "test@example.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "user"
  }'
```

**Expected Response (201):**
```json
{
  "message": "User created",
  "id": "69de397c0ea967309c79e97d"
}
```

**Save the ID as:** `USER_ID`

---

### Phase 2: Create Test Book

**Request:**
```bash
curl -X POST http://localhost:8080/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "isbn": "9780547928227",
    "genre": "Fantasy",
    "publisher": "Houghton Mifflin Harcourt",
    "publishYear": 1937,
    "pages": 310,
    "language": "English",
    "description": "A fantasy adventure novel.",
    "coverUrl": "https://example.com/hobbit.jpg",
    "availableCopies": 10
  }'
```

**Expected Response (201):**
```json
{
  "message": "Book created",
  "id": "69de397b0ea967309c79e97c"
}
```

**Save the ID as:** `BOOK_ID`

---

### Phase 3: Test GET Operations

**Get All Books:**
```bash
curl http://localhost:8080/books
```

**Get Single Book:**
```bash
curl http://localhost:8080/books/{BOOK_ID}
```

**Get All Users:**
```bash
curl http://localhost:8080/users
```

**Get Single User:**
```bash
curl http://localhost:8080/users/{USER_ID}
```

---

### Phase 4: Create Borrowing Record

**Request:**
```bash
curl -X POST http://localhost:8080/borrowing \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "{BOOK_ID}",
    "userId": "{USER_ID}",
    "dueDate": "2026-05-14T23:59:59.000Z"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Borrowing record created",
  "id": "69de397c0ea967309c79e97f"
}
```

**Save the ID as:** `BORROWING_ID`

---

### Phase 5: Create Review

**Request:**
```bash
curl -X POST http://localhost:8080/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "{BOOK_ID}",
    "userId": "{USER_ID}",
    "rating": 5,
    "comment": "Fantastic adventure story!"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Review created",
  "id": "69de397c0ea967309c79e97e"
}
```

**Save the ID as:** `REVIEW_ID`

---

### Phase 6: Test UPDATE Operations

**Update Book:**
```bash
curl -X PUT http://localhost:8080/books/{BOOK_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "availableCopies": 8,
    "description": "Updated description"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Book updated"
}
```

**Update User:**
```bash
curl -X PUT http://localhost:8080/users/{USER_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Test User",
    "role": "admin"
  }'
```

**Expected Response (200):**
```json
{
  "message": "User updated"
}
```

---

### Phase 7: Test DELETE Operations

**Delete Review:**
```bash
curl -X DELETE http://localhost:8080/reviews/{REVIEW_ID}
```

**Expected Response (200):**
```json
{
  "message": "Review deleted"
}
```

**Delete Borrowing Record:**
```bash
curl -X DELETE http://localhost:8080/borrowing/{BORROWING_ID}
```

**Expected Response (200):**
```json
{
  "message": "Borrowing record deleted"
}
```

**Delete Book:**
```bash
curl -X DELETE http://localhost:8080/books/{BOOK_ID}
```

**Expected Response (200):**
```json
{
  "message": "Book deleted"
}
```

**Delete User:**
```bash
curl -X DELETE http://localhost:8080/users/{USER_ID}
```

**Expected Response (200):**
```json
{
  "message": "User deleted"
}
```

---

## Error Testing

### Test Validation Errors (400)

**Missing Required Fields:**
```bash
curl -X POST http://localhost:8080/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "author",
      "message": "Required"
    },
    {
      "path": "isbn",
      "message": "Required"
    }
  ]
}
```

### Test Not Found Errors (404)

**Get Non-existent Resource:**
```bash
curl http://localhost:8080/books/invalid_id_12345
```

**Expected Response (400):**
```json
{
  "error": "Invalid id format"
}
```

---

## Collection Schemas

### Book Schema
```json
{
  "title": "string (required)",
  "author": "string (required)",
  "isbn": "string (required, min 10 chars)",
  "genre": "string (required)",
  "publisher": "string (required)",
  "publishYear": "number (required, >= 0)",
  "pages": "number (required, > 0)",
  "language": "string (required)",
  "description": "string (optional, max 5000)",
  "coverUrl": "string (required, valid URL)",
  "availableCopies": "number (required, >= 0)"
}
```

### User Schema
```json
{
  "displayName": "string (required, 1-100 chars)",
  "email": "string (required, valid email)",
  "avatarUrl": "string (optional, valid URL)",
  "role": "string (optional, 'user' or 'admin', default: 'user')"
}
```

### Review Schema
```json
{
  "bookId": "ObjectId (required)",
  "userId": "ObjectId (required)",
  "rating": "number (required, 1-5)",
  "comment": "string (optional)",
  "helpfulCount": "number (optional, default: 0)"
}
```

### Borrowing Record Schema
```json
{
  "bookId": "ObjectId (required)",
  "userId": "ObjectId (required)",
  "dueDate": "ISO string (required)",
  "fines": "number (optional, default: 0)"
}
```

---

## Query Parameters

### Books Pagination
```
GET /books?page=1&limit=20
GET /books?page=2&limit=50
```

### Books Filtering
```
GET /books?genre=Fiction
GET /books?author=Tolkien
GET /books?title=Hobbit
GET /books?genre=Fantasy&author=Tolkien
```

### Reviews Filtering
```
GET /reviews?bookId={BOOK_ID}
```

### Borrowing Filtering
```
GET /borrowing?userId={USER_ID}
```

---

## Tips for Testing

1. **Use Swagger UI** (http://localhost:8080/api-docs) for interactive testing
2. **VS Code REST Client Extension** - Open `TESTING.rest` and use "Send Request"
3. **Postman** - Import cURL commands
4. **Thunder Client** - VS Code extension for REST testing
5. **Always copy IDs** from response for subsequent requests
6. **Check validation** - Try sending incomplete payloads to test error handling
7. **Test pagination** - Try different page/limit values
8. **Test filtering** - Filter books and reviews by various parameters

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Validation failed or invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

