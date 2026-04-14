const express = require('express');
const passport = require('passport');

const authController = require('../controllers/auth');
const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = require('../config/auth.config');

const router = express.Router();

router.get('/github-info', authController.getGithubAuthUrl);

// Login endpoint (alias for /github)
router.get('/login', (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Start login with GitHub OAuth'
  // #swagger.description = 'Redirects to GitHub for authentication. Returns token after successful login.'
  // #swagger.responses[200] = { description: 'OAuth helper response for API clients' }
  // #swagger.responses[302] = { description: 'Redirect to GitHub OAuth' }
  // #swagger.responses[500] = { description: 'GitHub OAuth not configured on server' }
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GitHub OAuth is not configured on the server' });
  }

  const acceptHeader = req.get('accept') || '';
  if (acceptHeader.includes('application/json')) {
    const loginPath = '/auth/login?redirect=true';
    return res.status(200).json({
      message:
        'OAuth login requires browser navigation. Open loginPath in a browser tab to continue.',
      loginPath,
      loginUrl: `${req.protocol}://${req.get('host')}${loginPath}`
    });
  }

  return passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});

router.get('/github', (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Start GitHub OAuth flow'
  // #swagger.description = 'Returns JSON helper in API clients and redirects to GitHub in browser flow.'
  // #swagger.parameters['redirect'] = { in: 'query', description: 'Set to true to force redirect flow.', type: 'boolean' }
  // #swagger.responses[200] = { description: 'OAuth helper response for API clients' }
  // #swagger.responses[302] = { description: 'Redirect to GitHub OAuth' }
  // #swagger.responses[500] = { description: 'GitHub OAuth not configured on server' }
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GitHub OAuth is not configured on the server' });
  }

  const acceptHeader = req.get('accept') || '';
  if (acceptHeader.includes('application/json')) {
    const loginPath = '/auth/github?redirect=true';
    return res.status(200).json({
      message:
        'OAuth login requires browser navigation. Open loginPath in a browser tab to continue.',
      loginPath,
      loginUrl: `${req.protocol}://${req.get('host')}${loginPath}`
    });
  }

  return passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});

router.get(
  '/callback',
  (req, res, next) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'GitHub OAuth callback'
    // #swagger.description = 'Handles the redirect from GitHub after user authorises the app. Not intended to be called directly from API clients.'
    // #swagger.responses[200] = { description: 'Authentication successful, returns JWT and user object' }
    // #swagger.responses[302] = { description: 'Redirects to FRONTEND_URL with token if configured' }
    // #swagger.responses[401] = { description: 'Authentication failed or denied' }
    // #swagger.responses[500] = { description: 'Internal Server Error' }
    const acceptHeader = req.get('accept') || '';
    if (acceptHeader.includes('application/json') && !req.query.code) {
      return res.status(200).json({
        message:
          'This endpoint receives the GitHub OAuth redirect. It cannot be called directly. Start login at loginUrl.',
        loginUrl: `${req.protocol}://${req.get('host')}/auth/github`
      });
    }
    return passport.authenticate('github', { failureRedirect: '/auth/failure', session: false })(
      req,
      res,
      next
    );
  },
  authController.authCallback
);
router.get('/failure', authController.authFailure);

// Logout endpoint
router.post('/logout', authController.logout);

module.exports = router;
