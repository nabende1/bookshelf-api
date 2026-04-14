const { ObjectId } = require('mongodb');
const { z } = require('zod');

const isValidObjectId = (value) => ObjectId.isValid(value);

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId');

const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.') || source,
          message: issue.message
        }))
      });
    }

    req[source] = result.data;
    return next();
  };

const ensureObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName];
  if (!isValidObjectId(value)) {
    return res.status(400).json({ error: `Invalid ${paramName} format` });
  }
  return next();
};

const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const booksQuerySchema = z.object({
  genre: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const bookCreateSchema = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  isbn: z.string().trim().min(10),
  genre: z.string().trim().min(1),
  publisher: z.string().trim().min(1),
  publishYear: z.coerce.number().int().min(0),
  pages: z.coerce.number().int().min(1),
  language: z.string().trim().min(1),
  description: z.string().trim().max(5000).optional().default(''),
  coverUrl: z.string().trim().url(),
  availableCopies: z.coerce.number().int().min(0)
});

const bookUpdateSchema = bookCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required for update'
});

const reviewsQuerySchema = z.object({
  bookId: objectIdSchema.optional()
});

const reviewCreateSchema = z.object({
  bookId: objectIdSchema,
  userId: objectIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default('')
});

const reviewUpdateSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(2000).optional(),
    helpfulCount: z.coerce.number().int().min(0).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update'
  });

const borrowingQuerySchema = z.object({
  userId: objectIdSchema.optional()
});

const borrowingCreateSchema = z.object({
  bookId: objectIdSchema,
  dueDate: z.string().datetime()
});

const borrowingReturnSchema = z.object({
  fines: z.coerce.number().min(0).optional()
});

const userCreateSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  avatarUrl: z.string().trim().url().optional().default(''),
  role: z.enum(['user', 'admin']).optional().default('user'),
  oauthId: z.string().trim().min(3).optional()
});

const userAdminUpdateSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().optional(),
    avatarUrl: z.string().trim().url().optional(),
    role: z.enum(['user', 'admin']).optional(),
    oauthId: z.string().trim().min(3).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update'
  });

const userUpdateSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().optional(),
    avatarUrl: z.string().trim().url().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update'
  });

module.exports = {
  isValidObjectId,
  objectIdSchema,
  validate,
  ensureObjectIdParam,
  sanitizeText,
  booksQuerySchema,
  bookCreateSchema,
  bookUpdateSchema,
  reviewsQuerySchema,
  reviewCreateSchema,
  reviewUpdateSchema,
  borrowingQuerySchema,
  borrowingCreateSchema,
  borrowingReturnSchema,
  userCreateSchema,
  userAdminUpdateSchema,
  userUpdateSchema
};
