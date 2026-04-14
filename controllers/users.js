const { ObjectId } = require('mongodb');

const mongodb = require('../data/database');
const { DB_NAME } = require('../config/db.config');
const { sanitizeText } = require('../middleware/validation');

const usersCollection = () => mongodb.getdatabase().db(DB_NAME).collection('users');

const sanitizeUserPayload = (payload) => {
  const userDoc = {};

  if (payload.displayName !== undefined) {
    userDoc.displayName = sanitizeText(payload.displayName);
  }

  if (payload.email !== undefined) {
    userDoc.email = sanitizeText(payload.email).toLowerCase();
  }

  if (payload.avatarUrl !== undefined) {
    userDoc.avatarUrl = sanitizeText(payload.avatarUrl);
  }

  if (payload.role !== undefined) {
    userDoc.role = payload.role === 'admin' ? 'admin' : 'user';
  }

  if (payload.oauthId !== undefined) {
    userDoc.oauthId = sanitizeText(payload.oauthId);
  }

  return userDoc;
};

const getAll = async (req, res) => {
  try {
    const users = await usersCollection()
      .find({})
      .project({ oauthId: 1, displayName: 1, email: 1, avatarUrl: 1, role: 1, joinedDate: 1 })
      .sort({ joinedDate: -1 })
      .toArray();

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getSingle = async (req, res) => {
  try {
    const user = await usersCollection().findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { oauthId: 1, displayName: 1, email: 1, avatarUrl: 1, role: 1, joinedDate: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await usersCollection().findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      joinedDate: user.joinedDate,
      role: user.role || 'user'
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const create = async (req, res) => {
  try {
    const payload = sanitizeUserPayload(req.body);
    const timestamp = Date.now();

    const userDoc = {
      oauthId: payload.oauthId || `manual-${payload.email}-${timestamp}`,
      displayName: payload.displayName,
      email: payload.email,
      avatarUrl: payload.avatarUrl || '',
      role: payload.role || 'user',
      joinedDate: new Date().toISOString()
    };

    const result = await usersCollection().insertOne(userDoc);
    return res.status(201).json({ message: 'User created', id: result.insertedId });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'User with the same email or oauthId already exists' });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

const update = async (req, res) => {
  try {
    const updateDoc = sanitizeUserPayload(req.body);

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No valid fields supplied for update' });
    }

    const result = await usersCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User updated' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'User with the same email or oauthId already exists' });
    }
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

const updateMe = async (req, res) => {
  try {
    const updateDoc = sanitizeUserPayload(req.body);

    delete updateDoc.role;
    delete updateDoc.oauthId;

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No valid fields supplied for update' });
    }

    const result = await usersCollection().updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'Profile updated' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'User with the same email already exists' });
    }
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

const remove = async (req, res) => {
  try {
    const userObjectId = new ObjectId(req.params.id);

    const [userResult] = await Promise.all([
      usersCollection().deleteOne({ _id: userObjectId }),
      mongodb.getdatabase().db(DB_NAME).collection('reviews').deleteMany({ userId: userObjectId }),
      mongodb
        .getdatabase()
        .db(DB_NAME)
        .collection('borrowingRecords')
        .deleteMany({ userId: userObjectId })
    ]);

    if (userResult.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};

const removeMe = async (req, res) => {
  try {
    const userObjectId = new ObjectId(req.user.userId);

    const [userResult] = await Promise.all([
      usersCollection().deleteOne({ _id: userObjectId }),
      mongodb.getdatabase().db(DB_NAME).collection('reviews').deleteMany({ userId: userObjectId }),
      mongodb
        .getdatabase()
        .db(DB_NAME)
        .collection('borrowingRecords')
        .deleteMany({ userId: userObjectId })
    ]);

    if (userResult.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'Profile deleted' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return res.status(500).json({ error: 'Failed to delete profile' });
  }
};

module.exports = {
  getAll,
  getSingle,
  getMe,
  create,
  update,
  updateMe,
  remove,
  removeMe
};
