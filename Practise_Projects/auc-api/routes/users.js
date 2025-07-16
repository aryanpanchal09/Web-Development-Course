const express = require('express');
const router = express.Router();
const { Op, where } = require('sequelize');
const validate = require('../middlewares/validate');
const {
  verifyAuthToken,
  roleAccess,
  checkIfUserActive,
} = require('../middlewares/auth');
const {
  paginationQuery,
  parsePostalCodes,
  parseDate,
  parseUserFile,
  generateNextId,
  activityTracking,
} = require('../utils/helper');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const bcrypt = require('bcryptjs');
const { upload, handleMulterError } = require('../utils/multer');
const logger = require('../utils/logger');
const {
  User,
  Role,
  Customer,
  CustomerDebt,
  Client,
  SiteVisitReport,
} = require('../models');
const {
  addDebCollectorSchema,
  updateDebCollectorSchema,
} = require('../validations/user.validation');
const { error } = require('console');
const { getSocketIO } = require('../utils/socket');

router.post(
  '/import-csv',
  roleAccess(['admin']),
  upload.single('file'),
  handleMulterError,
  async (req, res) => {
    try {
      if (!req.file) return res.sendInvalidRequest('Please upload a file');

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const filePath = req.file.path;

      const result = await parseUserFile(filePath, fileExtension);
      const { records, errors, headers } = result;

      if (!headers?.length)
        return res.sendInvalidRequest('Uploaded file has no headers');
      if (!records?.length)
        return res.sendInvalidRequest(
          'No valid records found in uploaded file'
        );

      const createdUsers = [];
      const existingEmails = new Set();

      for (const row of records) {
        try {
          const existingUser = await User.findOne({
            where: { email: row.email },
          });

          if (existingUser) {
            errors.push(`User with email ${row.email} already exists.`);
            existingEmails.add(row.email);
            continue;
          }
          const hashedPassword = await bcrypt.hash(row.password, 10);

          const user = await User.create({
            uuid: row.uuid,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone_no: row.phone_no,
            user_type: row.user_type,
            role_id: row.role_id,
            organization_id: row.organization_id,
            profile_img: row.profile_img,
            date_of_birth: parseDate(row.date_of_birth),
            device_token: row.device_token,
            device_type: row.device_type,
            address1: row.address1,
            address2: row.address2,
            address3: row.address3,
            town: row.town,
            country: row.country,
            postal_code: parsePostalCodes(row.postal_code),
            status: row.status || 1,
            password: hashedPassword,
          });

          createdUsers.push(user);
        } catch (err) {
          errors.push(`Error creating user ${row.email}: ${err.message}`);
        }
      }

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      return res.sendSuccess({
        message: 'CSV processed successfully',
        created: createdUsers.length,
        existing: existingEmails.size,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      return res.sendError('Error processing file: ' + err.message);
    }
  }
);

router.post('/export-csv', roleAccess(['admin']), async (req, res) => {
  try {
    const uuids = req.body?.uuids;
    const where = uuids?.length ? { uuid: uuids } : {};
    const users = await User.findAll({
      where,
      attributes: {
        exclude: [
          'id',
          'password',
          'reset_password_token',
          'reset_password_expires',
          'created_at',
          'updated_at',
          'deleted_at',
        ],
      },
      raw: true,
    });

    if (!users.length) {
      return res.sendResourceNotFound('No user data found to export.');
    }

    const fields = Object.keys(users[0]);
    const parser = new Parser({ fields });
    const csv = parser.parse(users);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users-export.csv'
    );
    activityTracking(req, 'User data exported to CSV');
    return res.status(200).send(csv);
  } catch (error) {
    logger.error('CSV parsing error:', parseError);
    return res.sendError('Error generating CSV: ' + parseError.message);
  }
});

router.post(
  '/add/debt-collector',
  validate(addDebCollectorSchema),
  checkIfUserActive,
  roleAccess(['admin', 'debt_head']),
  async (req, res) => {
    try {
      const userType = req.body?.user_type;
      const debtHeadUuid = req.body?.debt_head_id;
      const rawPostalCodes = req.body.postal_code;
      if (userType === 'debt_head' && debtHeadUuid) {
        return res.sendInvalidRequest('Debt Head cannot have a debt_head_id');
      }

      let debtHeadId = null;
      if (userType == 'debt_collector' && debtHeadUuid) {
        const debtHead = await User.findOne({
          where: { uuid: debtHeadUuid },
        });
        debtHeadId = debtHead?.id;
      }

      if (req.user?.role == 'debt_head') {
        debtHeadId = req.user?.id;
      }

      if (req.user?.role == 'debt_head' && userType === 'admin') {
        return res.sendInvalidRequest('You are not authorized to create admin');
      }
      if (userType === 'admin' && req.user?.role !== 'admin') {
        return res.sendInvalidRequest('Only admins can create another admin');
      }
      const userRole = await Role.findOne({ where: { role_key: userType } });

      if (!userRole) {
        return res.sendResourceNotFound('User role not exists');
      }

      const userExists = await User.findOne({
        where: { email: req.body.email },
      });
      if (userExists) {
        return res.sendDuplicate('Email already exists in the system');
      }

      // const parsedPostalCodes = parsePostalCodes(req.body.postal_code);
      // if (!parsedPostalCodes.length) {
      //   return res.sendInvalidRequest("Invalid or missing postal codes");
      // }
      // const existingPostal = await User.findOne({
      //   where: {
      //     postal_code: {
      //       [Op.overlap]: parsedPostalCodes,
      //     },
      //   },
      // });
      // if (existingPostal) {
      //   return res.sendInvalidRequest("One or more postal codes already assigned to another user");
      // }
      const userData = await User.findOne({
        where: { client_id: null },
        attributes: ['unique_id'],
        order: [['id', 'DESC']],
        limit: 1,
      });

      const nextUniqueId = generateNextId(
        userData ? userData.unique_id : null,
        'user'
      );

      const userObj = {
        ...req.body,
        role_id: userRole.id,
        debt_head_id: debtHeadId,
        user_type: userType,
        unique_id: nextUniqueId,
      };

      let user = await User.create(userObj);
      user.debt_head_id = req.body?.debt_head_id;
      activityTracking(req, 'Debt collector created');
      return res.sendCreated(user, 'User created successfully');
    } catch (error) {
      logger.error('Error while singup user:', error);
      return res.sendError(error);
    }
  }
);

router.put(
  '/update/debt-collector/:userId',
  validate(updateDebCollectorSchema),
  checkIfUserActive,
  roleAccess(['admin', 'debt_head']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { debt_head_id: newDebtHeadUuid } = req.body;

      const debtCollectorRole = await Role.findOne({
        where: { role_key: 'debt_collector' },
      });
      if (!debtCollectorRole) {
        return res.sendResourceNotFound('Debt-collector role not found');
      }

      const user = await User.findOne({ where: { uuid: userId } });
      if (!user) {
        return res.sendResourceNotFound('Debt-collector not found');
      }
      if (user.user_type === 'admin' && req.user.role !== 'admin') {
        return res.sendInvalidRequest('You are not authorized to update admin');
      }

      if (user.user_type === 'debt_head' && newDebtHeadUuid) {
        return res.sendInvalidRequest(
          'Debt Head cannot be assigned a debt_head_id'
        );
      }

      if (req.body.email && req.body.email !== user.email) {
        const emailTaken = await User.findOne({
          where: { email: req.body.email },
        });
        if (emailTaken) {
          return res.sendDuplicate('That e-mail is already in use');
        }
      }
      if (req.body.postal_code) {
        const parsedPostalCodes = parsePostalCodes(req.body.postal_code);
        if (!parsedPostalCodes.length) {
          return res.sendError('Invalid or missing postal codes');
        }
        const existingPostal = await User.findOne({
          where: {
            postal_code: {
              [Op.overlap]: parsedPostalCodes,
            },
            id: {
              [Op.ne]: user.id,
            },
          },
        });

        if (existingPostal) {
          return res.sendInvalidRequest(
            'One or more postal codes already assigned to another user'
          );
        }
      }
      const updateFields = { ...req.body };
      if (newDebtHeadUuid) {
        const currentDebtHead = await User.findOne({
          where: { id: user.debt_head_id },
        });

        if (!currentDebtHead || currentDebtHead.uuid !== newDebtHeadUuid) {
          const newDebtHead = await User.findOne({
            where: { uuid: newDebtHeadUuid },
          });

          if (!newDebtHead) {
            return res.sendResourceNotFound('New debt head ID is invalid');
          }

          updateFields.debt_head_id = newDebtHead.id;
        } else {
          delete updateFields.debt_head_id;
        }
      }

      await user.update(updateFields);
      activityTracking(req, 'Debt-collector updated');
      return res.sendSuccess(user, 'Debt-collector updated successfully');
    } catch (error) {
      logger.error('Error while updating debt-collector:', error);
      return res.sendError(error);
    }
  }
);

// Only admin can change the status
router.put(
  '/change-status/:user_id',
  roleAccess(['admin']),
  async (req, res) => {
    try {
      const { user_id } = req.params;
      const { status } = req.body;

      const targetUser = await User.findOne({ where: { uuid: user_id } });
      if (req.params.user_id === targetUser.uuid) {
        return res.sendUnauthorized(
          'You are not allowed to deactivate your own account.'
        );
      }
      if (typeof status !== 'number' || ![0, 1].includes(status)) {
        return res.sendInvalidRequest('Invalid status');
      }
      if (!targetUser) {
        return res.sendResourceNotFound('User not found');
      }

      await targetUser.update({ status });

      return res.sendSuccess(
        {},
        `User has been ${
          status === 1 ? 'activated' : 'deactivated'
        } successfully`
      );
    } catch (error) {
      logger.error('Error toggling user status:', error);
      return res.sendError('Failed to change user status');
    }
  }
);

router.get(
  '/list/debt-collectors',
  checkIfUserActive,
  roleAccess(['admin', 'debt_head']),
  async (req, res) => {
    try {
      const pagination = paginationQuery(req);
      const search = req.query.search?.trim();
      const { debt_head_id } = req.query;
      if (pagination.type === 'Error') {
        return res.sendInvalidRequest(pagination.message);
      }

      const roles = await Role.findAll({
        where: {
          role_key: ['debt_collector', 'debt_head', 'admin'],
        },
      });

      if (!roles || roles.length === 0) {
        return res.sendResourceNotFound(
          'Debt Collector or Debt Head role not found'
        );
      }

      const roleIds = roles.map((role) => role.id);
      let debtHeadUserId = null;

      if (req.user.role === 'debt_head') {
        debtHeadUserId = req.user.id;
      } else if (debt_head_id) {
        const debtHeadUser = await User.findOne({
          where: { uuid: debt_head_id },
          attributes: ['id'],
        });

        if (!debtHeadUser) {
          return res.sendInvalidRequest('Invalid debt head UUID');
        }

        debtHeadUserId = debtHeadUser.id;
      }

      const { count, rows: collectors } = await User.findAndCountAll({
        where: {
          role_id: { [Op.in]: roleIds },
          ...(req.query.user_type && { user_type: req.query.user_type }),
          ...(debtHeadUserId && { debt_head_id: debtHeadUserId }),
          ...(search && {
            [Op.or]: [
              { first_name: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } },
            ],
          }),
        },
        attributes: {
          exclude: ['id', 'password'],
        },
        order: pagination.order,
        limit: pagination.limit,
        offset: pagination.offset,
      });

      return res.sendSuccess(collectors, 'Data fetched successfully', {
        pagination: {
          total: count,
          page: pagination.page,
          limit: pagination.limit,
          pages: Math.ceil(count / pagination.limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching debt collectors and debt heads:', error);
      return res.sendError(error.message);
    }
  }
);

router.get(
  '/fetch-debt-heads',
  checkIfUserActive,
  roleAccess(['admin', 'debt_head']),
  async (req, res) => {
    try {
      const pagination = paginationQuery(req);
      if (pagination.type === 'Error') {
        return res.sendInvalidRequest(pagination.message);
      }

      const debtHeads = await User.findAndCountAll({
        where: {
          user_type: 'debt_head',
          debt_head_id: null,
        },
        ...pagination,
      });

      return res.sendSuccess(debtHeads.rows, 'Data fetched successfully', {
        pagination: {
          total: debtHeads.count,
          page: pagination.page,
          limit: pagination.limit,
          pages: Math.ceil(debtHeads.count / pagination.limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching debt heads:', error);
      return res.sendError(error.message);
    }
  }
);

// fetch all debt head and debt collector for dropdown list
router.get(
  '/list/all_users',
  checkIfUserActive,
  roleAccess(['admin', 'debt_head', 'client']),
  async (req, res) => {
    try {
      const pagination = paginationQuery(req);
      if (pagination.type === 'Error') {
        return res.sendInvalidRequest(pagination.message);
      }

      const allUsers = await User.findAndCountAll({
        where: {
          user_type: {
            [Op.in]: ['debt_head', 'debt_collector'],
          },
        },
        ...pagination,
        order: [['created_at', 'DESC']],
        attributes: { exclude: ['password'] },
      });

      return res.sendSuccess(allUsers.rows, 'Data fetched successfully', {
        pagination: {
          total: allUsers.count,
          page: pagination.page,
          limit: pagination.limit,
          pages: Math.ceil(allUsers.count / pagination.limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching allUsers:', error);
      return res.sendError(error.message);
    }
  }
);

router.get('/fetch/:userId', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { uuid: req.params.userId },
      attributes: { exclude: ['id', 'password'] },
    });
    if (!user) {
      return res.sendResourceNotFound('User not found');
    }
    let finalUser = user;
    if (user.user_type === 'client') {
      finalUser = await User.findOne({
        where: { uuid: req.params.userId },
        attributes: { exclude: ['id', 'password'] },
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['first_name', 'last_name'],
          },
        ],
      });
    }

    return res.sendSuccess(finalUser, 'User found successfully');
  } catch (error) {
    logger.error('Error while fetch user:', error);
    return res.sendError(error);
  }
});

router.get('/profile', verifyAuthToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    let user;

    if (role === 'client') {
      user = await User.findOne({
        where: { client_id: id },
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Client,
            as: 'client',
            attributes: {
              exclude: ['id', 'created_at', 'updated_at', 'deleted_at'],
            },
          },
        ],
      });
    } else {
      user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });
    }
    if (!user) return res.sendResourceNotFound('User not found');
    const userJson = user.toJSON();
    const response = {
      ...userJson,
      role: role,
      ...(role === 'client' ? userJson.client || {} : {}),
    };
    delete response.client;

    return res.sendSuccess(response, 'Profile fetched successfully');
  } catch (error) {
    logger.error('Error in /profile:', error);
    return res.sendError('Internal server error');
  }
});

router.put('/profile/update', verifyAuthToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    let user;
    if (role === 'client') {
      user = await User.findOne({
        where: { client_id: id },
        include: [{ model: Client, as: 'client' }],
      });
    } else {
      user = await User.findByPk(id);
    }
    if (!user) {
      return res.sendResourceNotFound('User not found');
    }

    // Allowed fields to update
    const userFields = [
      'phone_no',
      'profile_img',
      'date_of_birth',
      'device_token',
      'device_type',
    ];
    const clientFields = [
      'first_name',
      'last_name',
      'logo',
      'address1',
      'address2',
      'address3',
      'town',
      'country',
      'postal_code',
      'utility_type',
    ];
    const sharedFields =
      role === 'client'
        ? []
        : [
            'first_name',
            'last_name',
            'address1',
            'address2',
            'address3',
            'town',
            'country',
            'postal_code',
          ];
    [...userFields, ...sharedFields].forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field];
      }
    });
    if (role === 'client' && user.client) {
      clientFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          user.client[field] =
            typeof req.body[field] === 'string'
              ? req.body[field].trim()
              : req.body[field];
        }
      });
      await user.client.save();
    }
    await user.save();

    // Remove password from response
    const userData = user.toJSON();
    delete userData.password;
    activityTracking(req, 'User profile updated');
    return res.sendSuccess(userData, 'Profile updated successfully');
  } catch (error) {
    logger.error('Error updating profile:', error);
    return res.sendError('Failed to update profile');
  }
});

router.post('/change-password', verifyAuthToken, async (req, res) => {
  try {
    const userId = req.user.id; // from JWT middleware
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.sendInvalidRequest(
        'Please provide both old and new passwords.'
      );
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.sendResourceNotFound('User not found.');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.sendLogin('Old password is incorrect.');
    }

    user.password = newPassword; // will be hashed by beforeSave hook
    await user.save();
    activityTracking(req, 'User password changed');
    return res.sendSuccess(null, 'Password changed successfully.');
  } catch (error) {
    logger.error('Change Password Error:', error);
    return res.sendError(error);
  }
});

router.post(
  '/site-visit/start',
  verifyAuthToken,
  checkIfUserActive,
  roleAccess(['debt_collector', 'debt_head']),
  async (req, res) => {
    try {
      const { user_id, customer_id, client_id, customer_debt_id } = req.body;

      if (!user_id || !customer_id || !client_id || !customer_debt_id) {
        return res.sendInvalidRequest('Missings fields');
      }
      const [user, customer, client, customerDebt] = await Promise.all([
        User.findOne({
          where: { uuid: user_id },
          attributes: ['id', 'first_name', 'last_name'],
        }),
        Customer.findOne({
          where: { uuid: customer_id },
          attributes: ['id', 'business_name'],
        }),
        Client.findOne({ where: { uuid: client_id } }),
        CustomerDebt.findOne({ where: { uuid: customer_debt_id } }),
      ]);

      if (!user || !customer || !client || !customerDebt) {
        return res.sendError('One or more uuid is invalid');
      }

      const report = await SiteVisitReport.create({
        user_id: user.id,
        customer_id: customer.id,
        client_id: client.id,
        customer_debt_id: customerDebt.id,
        site_visit_date: new Date().toISOString().slice(0, 10),
        site_visit_time_in: new Date().toTimeString().slice(0, 8),
      });

      getSocketIO()
        .to('admin')
        .emit('site-visit-started', {
          message: `Site visit started by ${user.first_name} ${user.last_name}`,
          customerName: customer.business_name,
          site_visit_date: new Date().toISOString().slice(0, 10),
          site_visit_time_in: new Date().toTimeString().slice(0, 8),
          type: 'start',
        });
      return res.sendSuccess(null, 'Timer started.');
    } catch (error) {
      logger.error('Error in starting visit:', error);
      res.sendError(error);
    }
  }
);

router.put(
  '/site-visit/end',
  verifyAuthToken,
  checkIfUserActive,
  roleAccess(['debt_collector', 'debt_head']),
  async (req, res) => {
    const { user_id, client_id, customer_id, customer_debt_id, ...formData } =
      req.body;

    if (!user_id || !client_id || !customer_id || !customer_debt_id) {
      return res.sendInvalidRequest(
        'Required UUIDs: user_id, client_id, customer_id, customer_debt_id'
      );
    }

    try {
      const [customer, customerDebt, client, user] = await Promise.all([
        Customer.findOne({
          where: { uuid: customer_id },
          attributes: ['id', 'business_name'],
        }),
        CustomerDebt.findOne({ where: { uuid: customer_debt_id } }),
        Client.findOne({ where: { uuid: client_id } }),
        User.findOne({
          where: { uuid: user_id },
          attributes: ['id', 'first_name', 'last_name'],
        }),
      ]);

      if (!customer) return res.sendResourceNotFound('Customer not found');
      if (!customerDebt)
        return res.sendResourceNotFound('CustomerDebt not found');
      if (!client) return res.sendResourceNotFound('Client not found');
      if (!user) return res.sendResourceNotFound('user not found');

      const report = await SiteVisitReport.findOne({
        where: {
          user_id: user.id,
          client_id: client.id,
          customer_id: customer.id,
          customer_debt_id: customerDebt.id,
          site_visit_time_out: null,
        },
      });

      if (!report) {
        return res.sendResourceNotFound('No pending SiteVisitReport found.');
      }

      const updateData = {
        ...formData,
        site_visit_time_out: new Date().toTimeString().slice(0, 8),
      };

      await report.update(updateData);

      getSocketIO()
        .to('admin')
        .emit('site-visit-ended', {
          message: `Site visit completed by ${user.first_name} ${user.last_name}`,
          customerName: customer.business_name,
          site_visit_date: new Date().toISOString().slice(0, 10),
          site_visit_time_in: new Date().toTimeString().slice(0, 8),
          type: 'end',
        });
      return res.sendSuccess(null, 'Site visit data submitted');
    } catch (err) {
      return res.sendError(err.message);
    }
  }
);

module.exports = router;
