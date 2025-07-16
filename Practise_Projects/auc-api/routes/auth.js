const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Role, Organization, blacklisttoken } = require('../models');
const validate = require('../middlewares/validate');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { signupSchema, loginSchema } = require('../validations/user.validation');
const logger = require('../utils/logger');
const { generateNextId, activityTracking } = require('../utils/helper');
const { verifyAuthToken } = require('../middlewares/auth');

router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const adminRole = await Role.findOne({ where: { role_key: 'admin' } });
    if (!adminRole) {
      return res.sendResourceNotFound('Admin role not exists');
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      return res.sendDuplicate('Email already exists in the system');
    }

    const userData = await User.findOne({
      where: { client_id: null },
      attributes: ['unique_id'],
      order: [['unique_id', 'DESC']],
      limit: 1,
    });

    const nextUniqueId = generateNextId(
      userData ? userData.unique_id : null,
      'user'
    );

    let userObj = {
      ...req.body,
      role_id: adminRole.id,
      unique_id: nextUniqueId,
    };
    let user = await User.create(userObj);

    const orgObject = {
      org_name: req.body.org_name,
      org_name: req.body.org_name,
      org_email: req.body.org_email,
      org_phone: req.body.org_phone,
      org_website: req.body.org_website,
      // owner_id: user.id
    };

    const orgData = await Organization.create(orgObject);

    await user.update({ organization_id: orgData.id });

    return res.sendSuccess(user, 'User created successfully');
  } catch (error) {
    logger.error('Error while singup user:', error);
    return res.sendError(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.sendResourceNotFound('User does not exist');
    }
    if (user.status !== 1) {
      return res.sendUnauthorized(
        'Your account is deactivated. Please contact admin.'
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.sendLogin('Invalid credentials');
    }
    const userRole = await Role.findOne({ where: { id: user.role_id } });
    if (!userRole) {
      return res.sendError('User role not found');
    }
    let tokenObject = {
      id: userRole.role_key == 'client' ? user.client_id : user.id,
      email: user.email,
      role: userRole.role_key,
      uuid: user.uuid,
    };
    if (userRole.role_key === 'client') {
      tokenObject.client_id = user.id;
    }
    const token = jwt.sign(tokenObject, process.env.JWT_SECRET, {
      expiresIn: '20days',
    });
    await User.update({ token }, { where: { id: user.id } });
    activityTracking(req, 'User logged in');
    return res.sendSuccess(
      { token: token, uuid: user.uuid },
      'Login successful'
    );
  } catch (error) {
    logger.error('Error while login:', error);
    return res.sendError(error);
  }
});

router.post('/switch-role', verifyAuthToken, async (req, res) => {
  try {
    const { switch_to, target_uuid } = req.body;

    if (!switch_to || !target_uuid) {
      return res.sendInvalidRequest('switch_to and target_uuid are required.');
    }

    const currentUser = await User.findOne({ where: { uuid: req.user.uuid } });
    if (!currentUser) {
      return res.sendResourceNotFound('Current user not found.');
    }

    const targetUser = await User.findOne({ where: { uuid: target_uuid } });
    if (!targetUser) {
      return res.sendResourceNotFound('Target user not found.');
    }
    const currentRole = await Role.findOne({
      where: { id: currentUser.role_id },
    });
    const targetRole = await Role.findOne({
      where: { id: targetUser.role_id },
    });

    if (!currentRole || !targetRole) {
      return res.sendError('Role not found.');
    }

    let tokenPayload;
    if (switch_to === targetRole.role_key) {
      tokenPayload = {
        id: targetUser.id,
        email: targetUser.email,
        role: targetRole.role_key,
        uuid: targetUser.uuid,
        original_id: currentUser.id,
        original_email: currentUser.email,
        original_role: currentRole.role_key,
        original_uuid: currentUser.uuid,
        switched: true,
      };
      if (targetRole.role_key === 'client') {
        tokenPayload.id = targetUser.client_id;
      }
    } else {
      return res.sendInvalidRequest('Invalid switch_to value.');
    }

    console.log('tokenPayload :', tokenPayload);
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    return res.sendSuccess(
      { token, uuid: targetUser.uuid },
      'Role switched successfully.'
    );
  } catch (error) {
    logger.error(error);
    return res.sendError(error);
  }
});

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendUnauthorized('Token missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    // Decode token to get user id
    const user = await jwt.verify(token, process.env.JWT_SECRET);

    if (!user) {
      return res.sendUnauthorized('Invalid token or user mismatch');
    }

    // Save the token to blacklist
    await blacklisttoken.create({
      token,
      user_id: user.id,
    });

    return res.sendSuccess(null, 'Logout successful');
  } catch (error) {
    logger.error(error);
    return res.sendError('Logout failed');
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.sendInvalidRequest('Email is required.', 'email');

    const user = await User.findOne({ where: { email } });
    if (!user) return res.sendResourceNotFound('User not found.');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    user.reset_password_token = resetToken;
    user.reset_password_expires = tokenExpires;
    await user.save();

    return res.sendSuccess({ resetToken }, 'Reset token generated.');
  } catch (error) {
    return res.sendError(error);
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.sendInvalidRequest(
        'Reset token and new password are required.'
      );
    }

    const user = await User.findOne({
      where: {
        reset_password_token: resetToken,
        reset_password_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) return res.sendInvalidRequest('Invalid or expired token.');

    user.password = newPassword; // Will be hashed via Sequelize hook
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    return res.sendSuccess({}, 'Password reset successful.');
  } catch (error) {
    return res.sendError(error);
  }
});

module.exports = router;
