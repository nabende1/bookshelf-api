require('dns').setDefaultResultOrder('ipv4first');

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./swagger-output.json');
const configurePassport = require('./config/passport.config');
const {
  isProd,
  CORS_ALLOWED_ORIGINS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX
} = require('./config/security.config');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

const createApp = () => {
  const app = express();

  configurePassport(passport);

  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (!isProd && CORS_ALLOWED_ORIGINS.length === 0) {
        return callback(null, true);
      }

      if (CORS_ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  };

  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });

  morgan.token('requestId', (req) => req.requestId);

  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });

  app
    .use(helmet())
    .use(cors(corsOptions))
    .use(limiter)
    .use(morgan(':method :url :status :response-time ms reqId=:requestId'))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(passport.initialize());

  app.get('/swagger.json', (req, res) => {
    const forwardedProto = req.get('x-forwarded-proto');
    const scheme = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;

    res.json({
      ...swaggerDocument,
      host: req.get('host'),
      schemes: [scheme]
    });
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: '/swagger.json'
      }
    })
  );

  app.use('/', require('./routes'));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp
};
