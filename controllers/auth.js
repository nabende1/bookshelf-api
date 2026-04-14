const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const mongodb = require('../data/database');
const { DB_NAME } = require('../config/db.config');
const { JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL, ADMIN_EMAILS } = require('../config/auth.config');
const { sanitizeText } = require('../middleware/validation');

const usersCollection = () => mongodb.getdatabase().db(DB_NAME).collection('users');

const getGithubAuthUrl = (req, res) => {
  return res.status(200).json({ message: 'Redirect to /auth/github to start GitHub OAuth login' });
};

const authCallback = async (req, res) => {
  try {
    const githubProfile = req.user;

    if (!githubProfile || !githubProfile.id) {
      return res.status(401).json({ error: 'GitHub authentication failed' });
    }

    const oauthId = sanitizeText(githubProfile.id);
    const email = sanitizeText(githubProfile.emails?.[0]?.value || '');
    const displayName = sanitizeText(githubProfile.displayName || githubProfile.username || '');
    const avatarUrl = sanitizeText(
      githubProfile.photos?.[0]?.value || githubProfile._json?.avatar_url || ''
    );

    if (!email || !displayName) {
      return res.status(400).json({ error: 'GitHub profile did not include required fields' });
    }

    const isAdminByEmail = ADMIN_EMAILS.includes(email.toLowerCase());

    const collection = usersCollection();
    const existingUser = await collection.findOne({ oauthId });
    const resolvedRole = existingUser?.role || (isAdminByEmail ? 'admin' : 'user');

    const updatePayload = {
      oauthId,
      email,
      displayName,
      avatarUrl,
      role: resolvedRole
    };

    await collection.updateOne(
      { oauthId },
      {
        $set: updatePayload,
        $setOnInsert: { joinedDate: new Date().toISOString() }
      },
      { upsert: true }
    );

    const user = await collection.findOne({ oauthId });

    const token = jwt.sign(
      {
        userId: new ObjectId(user._id).toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    if (FRONTEND_URL) {
      const callbackUrl = new URL(FRONTEND_URL);
      callbackUrl.searchParams.set('token', token);
      callbackUrl.searchParams.set('userId', user._id.toString());
      callbackUrl.searchParams.set('email', user.email);
      callbackUrl.searchParams.set('displayName', user.displayName);
      callbackUrl.searchParams.set('role', user.role || 'user');
      return res.redirect(callbackUrl.toString());
    }

    return res.status(200).json({
      token,
      user: {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Error in authentication callback:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const authFailure = (req, res) => {
  return res.status(401).json({ error: 'GitHub OAuth login failed' });
};

const logout = (req, res) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Logout user'
  // #swagger.description = 'JWT-based logout. Client should delete the token from local storage.'
  // #swagger.responses[200] = { description: 'Logout successful' }
  return res.status(200).json({ message: 'Logout successful. Please delete your token.' });
};

const getTestToken = (req, res) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Get test token (Development Only)'
  // #swagger.description = 'Returns a test JWT token for development/testing without needing actual GitHub login. Only available in development environment.'
  // #swagger.responses[200] = { description: 'Test token generated successfully' }
  // #swagger.responses[403] = { description: 'Not available in production' }
  
  const { NODE_ENV } = process.env;
  if (NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test token endpoint is only available in development' });
  }

  const testUserId = new ObjectId();
  const testToken = jwt.sign(
    {
      userId: testUserId.toString(),
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.status(200).json({
    token: testToken,
    user: {
      userId: testUserId.toString(),
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin'
    },
    note: 'This is a test token for development only. Expires in 2 hours.'
  });
};

module.exports = {
  getGithubAuthUrl,
  authCallback,
  authFailure,
  logout,
  getTestToken
};
