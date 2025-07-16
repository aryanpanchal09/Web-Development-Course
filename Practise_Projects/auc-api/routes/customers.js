const express = require('express');
const router = express.Router();
const fs = require('fs');
const { Parser } = require('json2csv');
const { upload, handleMulterError } = require('../utils/multer');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const {
  CustomerDebt,
  sequelize,
  User,
  Customer,
  Client,
  ClientCsvFormat,
  DebtAllocationRule,
  UserComment,
  CustomerCSVFile,
  SiteVisitReport,
} = require('../models');
const { Sequelize } = require('sequelize');
const {
  parseDate,
  sanitizeCurrencyString,
  sampleCSVHeaders,
  dummyCustomers,
  parsePostalCodes,
  parseCustomerFile,
  activityTracking,
  matchesRule,
} = require('../utils/helper');
const path = require('path');
const { roleAccess, checkIfUserActive } = require('../middlewares/auth');

const getDebtCollectors = async () => {
  const collectors = await User.findAll({
    where: {
      user_type: {
        [Op.or]: ['debt_head', 'debt_collector'],
      },
    },
    attributes: ['id', 'postal_code'],
    raw: true,
  });

  if (collectors.length === 0) {
    throw new Error('No debt collectors found in the system');
  }

  return collectors;
};

router.post(
  '/upload-csv',
  roleAccess(['client']),
  upload.single('file'),
  handleMulterError,
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      if (!req.file) return res.sendInvalidRequest('Please upload a file');

      const client_id = req.user.id;
      if (!client_id)
        return res.sendInvalidRequest('client_id (UUID) is required in body');

      logger.info(`Processing file upload for client_id: ${client_id}`);

      const client = await Client.findOne({
        include: [
          {
            model: User,
            as: 'users',
            where: { client_id: client_id },
            required: true,
            attributes: [],
          },
        ],
        attributes: ['id', 'first_name', 'last_name', 'uuid', 'utility_type'],
      });

      if (!client) return res.sendInvalidRequest('Client does not exist');

      const format = await ClientCsvFormat.findOne({ where: { client_id } });
      const debtCollectors = await getDebtCollectors();
      if (!debtCollectors?.length) {
        logger.error('No debt collectors found in the system');
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.sendResourceNotFound(
          'No debt collectors found in the system'
        );
      }
      const originalName = path.parse(req.file.originalname).name;
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}_${String(
        today.getMonth() + 1
      ).padStart(2, '0')}_${today.getFullYear()}`;
      const newFileName = `${originalName}.csv`;

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const existingFile = await CustomerCSVFile.findOne({
        where: {
          file_name: {
            [Op.eq]: `${originalName}.csv`,
          },
          created_at: {
            [Op.gt]: fifteenDaysAgo,
          },
          client_id: client_id,
        },
      });

      if (existingFile) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.sendInvalidRequest(
          'A CSV file has been uploaded in the last 15 days. Please wait before uploading again.'
        );
      }

      const csvFile = await CustomerCSVFile.create(
        {
          client_id,
          file_name: newFileName,
          status: 'pending',
        },
        { transaction: t }
      );

      const customers = [],
        assignments = [],
        errors = [];
      const seenEmails = new Set();

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let records, headers;
      try {
        const result = await parseCustomerFile(req.file.path, fileExtension);
        records = result.records;
        headers = result.headers;
        errors.push(...result.errors);
      } catch (error) {
        return res.sendInvalidRequest(error.message);
      }

      if (!headers?.length)
        return res.sendInvalidRequest('Uploaded file has no headers');

      if (format) {
        const savedHeaders = format.header_mapping;
        const isHeaderMatch =
          Array.isArray(savedHeaders) &&
          Array.isArray(headers) &&
          savedHeaders.length === headers.length &&
          savedHeaders.every((val, idx) => val === headers[idx]);

        if (!isHeaderMatch)
          return res.sendInvalidRequest(
            'Uploaded file headers do not match the expected format'
          );
      }

      if (records.length === 0)
        return res.sendInvalidRequest(
          'File is empty or contains no valid records'
        );

      const rules = await DebtAllocationRule.findAll({
        where: { deleted_at: null },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
        ],
      });

      for (const row of records) {
        let customer;
        const customerPostcode = parsePostalCodes(row.site_postcode);
        [customer] = await Customer.findOrCreate({
          where: { email: row.email },
          defaults: {
            business_name: row.business_name,
            email: row.email,
            phone_no: row.phone_no,
            organization_id: row.organization_id,
            contact_person_name: row.contact_person_name,
            contact_number: row.contact_number,
            status: row.status || 1,
          },
          transaction: t,
        });
        customers.push(customer);

        let user_id = null;
        let assignedByAmount = false;
        let assignedByAging = false;

        for (const rule of rules) {
          const amount =
            parseFloat(
              row.total_outstanding_balance
                ?.toString()
                .replace(/[^0-9.-]+/g, '')
            ) || 0;
          const min =
            rule.min_amount !== null && rule.min_amount !== undefined
              ? parseFloat(rule.min_amount)
              : null;
          const max =
            rule.max_amount !== null && rule.max_amount !== undefined
              ? parseFloat(rule.max_amount)
              : null;

          if (
            (min === null || amount >= min) &&
            (max === null || amount <= max)
          ) {
            user_id = rule.user.id;
            assignedByAmount = true;
            break;
          }
        }

        if (!assignedByAmount) {
          for (const rule of rules) {
            if (rule.aging) {
              try {
                const ruleAging =
                  typeof rule.aging === 'string'
                    ? JSON.parse(rule.aging)
                    : rule.aging;
                let agingMatch = false;
                for (const key in ruleAging) {
                  if (ruleAging[key]) {
                    if (
                      row[key] &&
                      row[key] !== '0' &&
                      row[key] !== false &&
                      row[key] !== ''
                    ) {
                      agingMatch = true;
                    } else {
                      agingMatch = false;
                      break;
                    }
                  }
                }
                if (agingMatch) {
                  user_id = rule.user.id;
                  assignedByAging = true;
                  break;
                }
              } catch (e) {}
            }
          }
        }

        if (!assignedByAmount && !assignedByAging) {
          const customerPostcode = parsePostalCodes(row.site_postcode);
          for (const collector of debtCollectors) {
            const collectorPostcodes = parsePostalCodes(collector.postal_code);
            if (collectorPostcodes.includes(customerPostcode)) {
              user_id = collector.id;
              break;
            }
          }
        }
        const sanitizeIdentifier = (value) => {
          if (value === undefined || value === null || value === '')
            return null;
          let str = String(value).trim();
          if (/^-?\d+(\s\d+)*\.0+$/.test(str)) {
            str = str.replace(/\.0+$/, '');
          }
          return str;
        };

        let utility_type = null;
        if (row.mpan) utility_type = 'Electricity';
        else if (row.mprn) utility_type = 'Gas';
        else if (row.spid) utility_type = 'Water';

        await CustomerDebt.create(
          {
            customer_id: customer.id,
            client_id: client.id,
            utility_type,
            user_id: user_id,
            csv_file_id: csvFile.id,
            account_id: row.account_id,
            group_id: row.group_id,
            group_name: row.group_name,
            collecting_agent: row.collecting_agent,
            validated: row.validated === 'true',
            site_address1: row.site_address1,
            site_address2: row.site_address2,
            site_postcode: customerPostcode,
            billing_postcode: parsePostalCodes(row.billing_postcode),
            region_code: row.region_code,
            region_name: row.region_name,
            pending_15: sanitizeCurrencyString(row.pending_15),
            pending_30: sanitizeCurrencyString(row.pending_30),
            pending_60: sanitizeCurrencyString(row.pending_60),
            pending_90: sanitizeCurrencyString(row.pending_90),
            pending_120: sanitizeCurrencyString(row.pending_120),
            pending_180: sanitizeCurrencyString(row.pending_180),
            pending_181: sanitizeCurrencyString(row.pending_181),
            total_outstanding_balance: sanitizeCurrencyString(
              row.total_outstanding_balance
            ),
            only_payment: sanitizeCurrencyString(row.only_payment),
            next_invoice_amount: sanitizeCurrencyString(
              row.next_invoice_amount
            ),
            next_invoice_due_date: parseDate(row.next_invoice_due_date),
            agreed_pp_amount: sanitizeCurrencyString(row.agreed_pp_amount),
            pending_amount: sanitizeCurrencyString(row.pending_amount),
            debt_amount: sanitizeCurrencyString(row.debt_amount),
            aging: row.aging,
            pending_days: row.pending_days,
            last_payment_date: parseDate(row.last_payment_date),
            last_payment_amount: sanitizeCurrencyString(
              row.last_payment_amount
            ),
            mode_of_payment: row.mode_of_payment,
            charge_amount: sanitizeCurrencyString(row.charge_amount),
            charge_date: parseDate(row.charge_date),
            supply_address: row.supply_address,
            billing_address1: row.billing_address1,
            billing_address2: row.billing_address2,
            billing_address3: row.billing_address3,
            billing_address4: row.billing_address4,
            billing_address: row.billing_address,
            first_letter_sent_date: row.first_letter_sent_date,
            second_letter_sent_date: row.second_letter_sent_date,
            notice_letter_sent_date: row.notice_letter_sent_date,
            isolation_letter_sent: row.isolation_letter_sent === 'true',
            disconnection_date: parseDate(row.disconnection_date),
            last_bill_date: parseDate(row.last_bill_date),
            last_bill_amount: sanitizeCurrencyString(row.last_bill_amount),
            reconciled_amount: sanitizeCurrencyString(row.reconciled_amount),
            mpan: sanitizeIdentifier(row.mpan),
            mprn: sanitizeIdentifier(row.mprn),
            spid: sanitizeIdentifier(row.spid),
            mop_mam: row.mop_mam,
            electricity_meter_type: row.electricity_meter_type,
            gas_meter_type: row.gas_meter_type,
            last_reading_ec: row.last_reading_ec,
            actual_estimate_ec: row.actual_estimate_ec,
            last_reading_gas: row.last_reading_gas,
            actual_estimate_gas: row.actual_estimate_gas,
            live_date: parseDate(row.live_date),
            elec_loss_date: parseDate(row.elec_loss_date),
            gas_loss_date: parseDate(row.gas_loss_date),
            cng_customer: row.cng_customer === 'true',
            profile_class: row.profile_class,
            ec_total_eac: row.ec_total_eac || row.ec_totaleac,
            gas_total_eac: row.gas_total_eac || row.gas_totaleac,
            energisation_status: row.energisation_status,
            ct_wc: row.ct_wc,
            meter_location_j0419: row.meter_location_j0419,
            meter_serial_number: row.meter_serial_number,
            mandate_status: row.mandate_status,
            is_aging:
              row.is_aging?.toString().toLowerCase().trim() === 'yes' ||
              row.is_aging === true,
            is_debt:
              row.is_debt?.toString().toLowerCase().trim() === 'yes' ||
              row.is_debt === true,
            is_force_stop:
              row.is_force_stop?.toString().toLowerCase().trim() === 'yes' ||
              row.is_force_stop === true,
            is_query_open:
              row.is_query_open?.toString().toLowerCase().trim() === 'yes' ||
              row.is_query_open === true,
            customer_status: row.customer_status,
            customer_status1: row.customer_status1,
            cot_date: parseDate(row.cot_date),
          },
          { transaction: t }
        );
      }

      activityTracking(req, 'Customer CSV Uploaded');

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      await csvFile.update({ status: 'completed' }, { transaction: t });
      await t.commit();
      return res.sendSuccess({
        message: 'File uploaded and data saved successfully',
        count: records.length,
        totalCollectors: debtCollectors.length,
        assignmentsCount: assignments.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      logger.error('File upload error:', error);
      if (req.file && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      await t.rollback();
      return res.sendError('Error uploading file: ' + error.message);
    }
  }
);

router.get('/export-csv', roleAccess(['admin', 'client']), async (req, res) => {
  try {
    const parser = new Parser({ sampleCSVHeaders });
    const csv = parser.parse(dummyCustomers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sample-data.csv'
    );
    activityTracking(req, 'CSV Exported');
    return res.status(200).send(csv);
  } catch (error) {
    logger.error('CSV export error:', error);
    return res.sendError('Error exporting CSV: ' + error.message);
  }
});

router.get(
  '/list',
  checkIfUserActive,
  roleAccess(['admin', 'client', 'debt_collector', 'debt_head']),
  async (req, res) => {
    try {
      const {
        postal_code,
        client_id,
        user_id,
        search = '',
        page = 1,
        limit = 10,
        sort = 'DESC',
        site_visit_status,
      } = req.query;

      const parsedPage = Math.max(1, Number(page));
      const parsedLimit = Math.max(1, Number(limit));
      const offset = (parsedPage - 1) * parsedLimit;
      const searchTerm = search.trim();

      let clientId = null;
      if (req.user.role === 'client') {
        clientId = req.user.id;
      } else if (client_id) {
        const client = await Client.findOne({
          where: { uuid: client_id },
          attributes: ['id'],
        });
        if (!client) return res.sendResourceNotFound('Client not found');
        clientId = client.id;
      }

      let collectorIds = [];
      if (user_id) {
        const user = await User.findOne({
          where: { uuid: user_id },
          attributes: ['id', 'user_type'],
        });
        if (!user) return res.sendResourceNotFound('User not found');
        if (!['debt_collector', 'debt_head'].includes(user.user_type)) {
          return res.sendInvalidRequest(
            'Only debt heads or debt collectors can be used for filtering'
          );
        }
        if (user.user_type === 'debt_collector') {
          collectorIds = [user.id];
        } else {
          const rows = await User.findAll({
            where: { debt_head_id: user.id, user_type: 'debt_collector' },
            attributes: ['id'],
          });
          collectorIds = rows.map((r) => r.id);
          if (!collectorIds.length)
            return res.sendSuccess([], 'No customers found');
        }
      } else if (req.user.role === 'debt_collector') {
        collectorIds = [req.user.id];
      } else if (req.user.role === 'debt_head') {
        const collectors = await User.findAll({
          where: { debt_head_id: req.user.id, user_type: 'debt_collector' },
          attributes: ['id'],
        });
        collectorIds = collectors.map((c) => c.id);
        if (!collectorIds.length)
          return res.sendSuccess([], 'No customers found');
      }

      const whereDebt = {
        ...(clientId && { client_id: clientId }),
        ...(postal_code && { site_postcode: postal_code }),
      };
      if (collectorIds.length) whereDebt.user_id = { [Op.in]: collectorIds };

      const whereCustomer = {};
      if (searchTerm) {
        whereCustomer[Op.or] = [
          { business_name: { [Op.iLike]: `%${searchTerm}%` } },
          { contact_person_name: { [Op.iLike]: `%${searchTerm}%` } },
        ];
      }
      let siteVisitWhere = undefined;
      let siteVisitRequired = undefined;
      const status = (site_visit_status || '').toLowerCase();

      if (status === 'started') {
        siteVisitWhere = {
          site_visit_time_in: { [Op.not]: null },
          site_visit_time_out: null,
        };
        siteVisitRequired = true;
      } else if (status === 'completed') {
        siteVisitWhere = {
          site_visit_time_out: { [Op.not]: null },
        };
        siteVisitRequired = true;
      } else if (status === 'not_started') {
        siteVisitWhere = {};
        siteVisitRequired = false;
      }

      const { count, rows } = await Customer.findAndCountAll({
        where: whereCustomer,
        distinct: true,
        attributes: { exclude: ['id'] },
        include: [
          {
            model: CustomerDebt,
            as: 'debt',
            where: whereDebt,
            attributes: [
              'uuid',
              'site_postcode',
              'total_outstanding_balance',
              'created_at',
              'site_address1',
              'site_address2',
              'site_address3',
              'mpan',
              'mprn',
              'spid',
              'utility_type',
            ],
            include: [
              {
                model: Client,
                as: 'client',
                attributes: ['uuid', 'first_name', 'last_name', 'utility_type'],
              },
              {
                model: User,
                as: 'user',
                attributes: ['uuid', 'first_name', 'last_name'],
              },
              {
                model: SiteVisitReport,
                as: 'site_visit_report',
                order: [['created_at', 'DESC']],
                where: siteVisitWhere,
                required: siteVisitRequired,
                attributes: [
                  [
                    sequelize.literal(
                      `CASE WHEN site_visit_time_out IS NULL THEN 'started' ELSE 'completed' END`
                    ),
                    'site_visit_status',
                  ],
                ],
              },
            ],
          },
        ],
      });

      let list = rows.map((c) => {
        const obj = c.toJSON();
        const debts = obj.debt || [];
        debts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const debt = debts[0];
        delete obj.debt;
        if (debt) {
          obj.debt_id = debt.uuid;
          obj.site_address1 = debt.site_address1;
          obj.site_address2 = debt.site_address2;
          obj.site_address3 = debt.site_address3;
          obj.site_postcode = debt.site_postcode;
          if (debt.mpan) obj.mpan = debt.mpan;
          if (debt.mprn) obj.mprn = debt.mprn;
          if (debt.spid) obj.spid = debt.spid;
          obj.utility_type = debt.utility_type;
          obj.total_outstanding_balance = Number(
            debt.total_outstanding_balance
          );
          obj.client = debt.client;
          obj.debt_collector = debt.user;
          const rpt = debt.site_visit_report?.[0];
          obj.site_visit_status = rpt ? rpt.site_visit_status : null;
        }
        return obj;
      });
      if (status === 'not_started') {
        list = list.filter((obj) => obj.site_visit_status === null);
      }

      if (['ASC', 'DESC'].includes(sort.toUpperCase())) {
        const desc = sort.toUpperCase() === 'DESC';
        list.sort((a, b) =>
          desc
            ? (b.total_outstanding_balance ?? 0) -
              (a.total_outstanding_balance ?? 0)
            : (a.total_outstanding_balance ?? 0) -
              (b.total_outstanding_balance ?? 0)
        );
      }
      const paginatedList = list.slice(offset, offset + parsedLimit);
      const totalCount = status === 'not_started' ? list.length : count;

      return res.sendSuccess(
        paginatedList,
        paginatedList.length
          ? 'Customer list fetched successfully'
          : 'No customers found',
        {
          pagination: {
            total: totalCount,
            page: parsedPage,
            limit: parsedLimit,
            pages: Math.ceil(totalCount / parsedLimit),
          },
        }
      );
    } catch (error) {
      logger.error('Error while fetching customers:', error);
      return res.sendError(error);
    }
  }
);
// This is individual customer details API
router.get('/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.sendInvalidRequest('Customer ID must be provided');
    }

    const customer = await Customer.findOne({
      where: { uuid: customer_id },
      include: [
        {
          model: CustomerDebt,
          as: 'debt',
          attributes: { exclude: ['id', 'client_id', 'user_id'] },
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['uuid', 'first_name', 'last_name', 'utility_type'],
              required: true,
            },
          ],
        },
        {
          model: UserComment,
          as: 'comments',
          attributes: ['uuid', 'comment', 'created_at'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['uuid', 'first_name', 'last_name', 'email'],
            },
          ],
        },
      ],
    });

    if (!customer) {
      return res.sendResourceNotFound('Customer not found');
    }
    const assignment = await CustomerDebt.findOne({
      where: { customer_id: customer.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'first_name', 'last_name', 'email', 'phone_no'],
        },
      ],
    });
    const customerData = customer.toJSON();

    const response = {
      uuid: customerData.uuid,
      business_name: customerData.business_name,
      email: customerData.email,
      phone_no: customerData.phone_no,
      organization_id: customerData.organization_id,
      contact_person_name: customerData.contact_person_name,
      contact_number: customerData.contact_number,
      status: customerData.status,
      created_at: customerData.created_at,
      updated_at: customerData.updated_at,
      debt: customerData.debt,
      comments: customerData.comments,
      debt_collector: assignment ? assignment.user : null,
    };
    return res.sendSuccess(response, 'Customer fetched successfully');
  } catch (error) {
    logger.error('Error while fetching customer', error);
    return res.sendError(error);
  }
});

// Get recent debt for a customer and utility type
router.get(
  '/:customer_id/recent-debt',
  checkIfUserActive,
  roleAccess(['admin', 'client', 'debt_collector', 'debt_head']),
  async (req, res) => {
    try {
      const { utility_type } = req.query;
      const { customer_id } = req.params;
      const user = req.user;

      if (!customer_id || !utility_type) {
        return res.sendInvalidRequest(
          'customer_id and utility_type are required'
        );
      }

      const customer = await Customer.findOne({
        where: { uuid: customer_id },
        attributes: ['id', 'uuid', 'business_name', 'email', 'phone_no'],
      });
      if (!customer) {
        return res.sendResourceNotFound('Customer not found');
      }

      let debtWhere = {
        customer_id: customer.id,
      };
      if (utility_type) {
        debtWhere.utility_type = {
          [Op.iLike]: utility_type
            .toString()
            .toLowerCase()
            .replace(/^./, (c) => c.toUpperCase()),
        };
      }

      if (user.role === 'client') {
        debtWhere.client_id = user.id;
      } else if (user.role === 'debt_collector') {
        debtWhere.user_id = user.id;
      } else if (user.role === 'debt_head') {
        const collectors = await User.findAll({
          where: { debt_head_id: user.id, user_type: 'debt_collector' },
          attributes: ['id'],
        });
        const collectorIds = collectors.map((c) => c.id);
        if (!collectorIds.length) {
          return res.sendResourceNotFound(
            'No collectors found for this debt head'
          );
        }
        debtWhere.user_id = { [Op.in]: collectorIds };
      }
      const debt = await CustomerDebt.findOne({
        where: debtWhere,
        order: [['created_at', 'DESC']],
        attributes: {
          exclude: ['id', 'customer_id', 'user_id', 'client_id', 'csv_file_id'],
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: [
              'uuid',
              'business_name',
              'email',
              'phone_no',
              'contact_person_name',
              'contact_number',
              'organization_id',
              'status',
              'created_at',
              'updated_at',
            ],
          },
          {
            model: User,
            as: 'user',
            attributes: [
              'uuid',
              'first_name',
              'last_name',
              'email',
              'phone_no',
            ],
          },
          {
            model: Client,
            as: 'client',
            attributes: ['uuid', 'first_name', 'last_name', 'utility_type'],
          },
          {
            model: SiteVisitReport,
            as: 'site_visit_report',
            order: [['created_at', 'DESC']],
            attributes: [
              'site_visit_time_in',
              'site_visit_time_out',
              [
                sequelize.literal(
                  `CASE WHEN site_visit_time_out IS NULL THEN 'started' ELSE 'completed' END`
                ),
                'site_visit_status',
              ],
            ],
          },
          {
            model: UserComment,
            as: 'usercomment',
            attributes: ['uuid', 'comment', 'created_at'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['uuid', 'first_name', 'last_name', 'email'],
              },
            ],
          },
        ],
      });

      if (!debt) {
        return res.sendResourceNotFound('No debt found for this utility type');
      }

      const debtObj = debt.toJSON ? debt.toJSON() : debt;
      ['mpan', 'mprn', 'spid'].forEach((key) => {
        if (!debtObj[key]) delete debtObj[key];
      });
      if (debtObj.customer) {
        debtObj.customer_details = debtObj.customer;
        delete debtObj.customer;
      }
      if (!debtObj.usercomment || debtObj.usercomment.length === 0) {
        debtObj.usercomment = null;
      }
      if (
        !debtObj.site_visit_report ||
        debtObj.site_visit_report.length === 0
      ) {
        debtObj.site_visit_report = null;
        debtObj.site_visit_status = 'not_started';
      }

      return res.sendSuccess(
        debtObj,
        'Latest debt with related info fetched successfully'
      );
    } catch (error) {
      logger.error('Error fetching latest debt:', error);
      return res.sendError('Error fetching latest debt');
    }
  }
);

router.get(
  '/:customer_id/others-debts/export-csv',
  checkIfUserActive,
  roleAccess(['admin', 'client', 'debt_collector', 'debt_head']),
  async (req, res) => {
    try {
      const { customer_id } = req.params;
      const { utility_type } = req.query;
      const user = req.user;
      if (!customer_id || !utility_type) {
        return res.sendInvalidRequest(
          'customer_id and utility_type are required'
        );
      }

      const customer = await Customer.findOne({
        where: { uuid: customer_id },
        attributes: ['id', 'uuid', 'business_name', 'email', 'phone_no'],
      });
      if (!customer) {
        return res.sendResourceNotFound('Customer not found');
      }
      let debtWhere = {
        customer_id: customer.id,
      };
      if (utility_type) {
        debtWhere.utility_type = {
          [Op.iLike]: utility_type
            .toString()
            .toLowerCase()
            .replace(/^./, (c) => c.toUpperCase()),
        };
      }

      if (user.role === 'client') {
        debtWhere.client_id = user.id;
      } else if (user.role === 'debt_collector') {
        debtWhere.user_id = user.id;
      } else if (user.role === 'debt_head') {
        const collectors = await User.findAll({
          where: { debt_head_id: user.id, user_type: 'debt_collector' },
          attributes: ['id'],
        });
        const collectorIds = collectors.map((c) => c.id);
        if (!collectorIds.length) {
          return res.sendResourceNotFound(
            'No collectors found for this debt head'
          );
        }
        debtWhere.user_id = { [Op.in]: collectorIds };
      }

      const latestDebt = await CustomerDebt.findOne({
        where: debtWhere,
        order: [['created_at', 'DESC']],
        attributes: ['uuid'],
      });

      if (latestDebt) {
        debtWhere.uuid = { [Op.ne]: latestDebt.uuid };
      }

      const debts = await CustomerDebt.findAll({
        where: debtWhere,
        order: [['created_at', 'DESC']],
        attributes: {
          exclude: ['id', 'customer_id', 'user_id', 'client_id', 'csv_file_id'],
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: { exclude: ['id'] },
          },
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['id', 'password'] },
          },
          {
            model: Client,
            as: 'client',
            attributes: { exclude: ['id'] },
          },
          {
            model: SiteVisitReport,
            as: 'site_visit_report',
            order: [['created_at', 'DESC']],
            attributes: {
              exclude: ['id'],
              include: [
                'site_visit_time_in',
                'site_visit_time_out',
                [
                  sequelize.literal(
                    `CASE WHEN site_visit_time_out IS NULL THEN 'started' ELSE 'completed' END`
                  ),
                  'site_visit_status',
                ],
              ],
            },
          },
          {
            model: UserComment,
            as: 'usercomment',
            attributes: { exclude: ['id'] },
            include: [
              {
                model: User,
                as: 'user',
                attributes: { exclude: ['id'] },
              },
            ],
          },
        ],
      });

      return res.sendSuccess(
        debts,
        'All old debts (excluding latest) fetched successfully'
      );
    } catch (error) {
      logger.error('Error fetching old debts:', error);
      return res.sendError('Error fetching old debts: ' + error.message);
    }
    // Prepare data for CSV
    //     const debtsData = debts.map(debt => {
    //       const obj = debt.toJSON();
    //       // Flatten client details
    //       obj.client_name = obj.client?.first_name && obj.client?.last_name
    //         ? `${obj.client.first_name} ${obj.client.last_name}`
    //         : (obj.client?.first_name || "");
    //       obj.client_email = obj.client?.email || "";
    //       obj.client_phone = obj.client?.phone_no || "";
    //       // Flatten debt collector details
    //       obj.debt_collector_name = obj.user?.first_name && obj.user?.last_name
    //         ? `${obj.user.first_name} ${obj.user.last_name}`
    //         : (obj.user?.first_name || "");
    //       obj.debt_collector_email = obj.user?.email || "";
    //       obj.debt_collector_phone = obj.user?.phone_no || "";
    //       obj.site_visit_status = (obj.site_visit_report && obj.site_visit_report.length)
    //         ? obj.site_visit_report[0].site_visit_status
    //         : "not_started";
    //       obj.comments = obj.usercomment && obj.usercomment.length
    //         ? obj.usercomment.map(c => c.comment).join("; ")
    //         : "";
    //       // Remove nested objects
    //       delete obj.customer;
    //       delete obj.user;
    //       delete obj.client;
    //       delete obj.usercomment;
    //       delete obj.site_visit_report;
    //       return obj;
    //     });

    //     // Define CSV fields (customize as needed)
    //     const fields = [
    //       "account_id", "group_id", "collecting_agent",
    //       "pending_15", "pending_30", "pending_60", "pending_90", "pending_120", "pending_180", "pending_181",
    //       "total_outstanding_balance", "only_payment", "next_invoice_amount", "next_invoice_due_date", "agreed_pp_amount",
    //       "last_payment_date", "last_payment_amount", "mode_of_payment", "charge_amount", "charge_date",
    //       "mpan", "mprn", "spid", "mop_mam", "electricity_meter_type", "gas_meter_type", "last_reading_ec", "actual_estimate_ec",
    //       "last_reading_gas", "actual_estimate_gas", "live_date", "customer_status", "elec_loss_date", "gas_loss_date",
    //       "contact_person_name", "contact_number", "email", "site_address1", "site_address2", "site_address3", "site_address4",
    //       "site_postcode", "supply_address", "billing_address1", "billing_address2", "billing_address3", "billing_address4",
    //       "billing_postcode", "billing_address", "first_letter_sent_date", "second_letter_sent_date", "notice_letter_sent_date",
    //       "isolation_letter_sent", "disconnection_date", "cng_customer", "last_bill_date", "last_bill_amount", "reconciled_amount",
    //       "profile_class", "ec_total_eac", "gas_total_eac", "energisation_status", "ct_wc", "meter_location_j0419",
    //       "meter_serial_number", "mandate_status", "pending_days", "agent_assign_date", "region_code", "region_name",
    //       "is_aging", "is_debt", "is_force_stop", "is_query_open", "customer_status1", "cot_date", "validated",
    //       "site_visit_status", "comments",
    //       "client_name", "client_email", "client_phone",
    //       "debt_collector_name", "debt_collector_email", "debt_collector_phone"
    //     ];

    //     const parser = new Parser({ fields });
    //     const csv = parser.parse(debtsData);

    //     res.setHeader("Content-Type", "text/csv");
    //     res.setHeader(
    //       "Content-Disposition",
    //       `attachment; filename=debts-${customer_id}.csv`
    //     );
    //     activityTracking(req, "Customer debts CSV exported");
    //     return res.sendSuccess(debtsData,"ok")
    //   } catch (error) {
    //     logger.error("CSV export error:", error);
    //     return res.sendError("Error exporting CSV: " + error.message);
    //   }
  }
);

// Fetch site visit status for a customer debt for recent site visit report button
router.get('/site-visit/fetch-status', async (req, res) => {
  try {
    const { customer_id, customer_debt_id } = req.query;

    if (!customer_id || !customer_debt_id) {
      return res.sendError('customer_id and customer_debt_id are required');
    }
    const [customer, debt] = await Promise.all([
      Customer.findOne({ where: { uuid: customer_id }, attributes: ['id'] }),
      CustomerDebt.findOne({
        where: { uuid: customer_debt_id },
        attributes: ['id'],
      }),
    ]);

    const latestReport = await SiteVisitReport.findOne({
      where: {
        customer_id: customer.id,
        customer_debt_id: debt.id,
      },
      order: [['created_at', 'DESC']],
      attributes: ['site_visit_time_out'],
    });

    if (!latestReport) {
      return res.sendSuccess(
        { site_visit_status: 'not_started' },
        'No visit started yet.'
      );
    }

    const site_visit_status = !latestReport
      ? 'not_started'
      : latestReport.site_visit_time_out === null
      ? 'started'
      : 'completed';

    return res.sendSuccess(
      { site_visit_status },
      'Site visit reports fetched successfully'
    );
  } catch (error) {
    logger.error('Error checking site visit status:', error);
    return res.sendError('Could not check site visit status');
  }
});

router.get(
  '/list/postal_codes',
  roleAccess(['admin', 'client']),
  async (req, res) => {
    try {
      const postalCodes = await CustomerDebt.findAll({
        attributes: [
          [
            Sequelize.fn('DISTINCT', Sequelize.col('site_postcode')),
            'site_postcode',
          ],
        ],
        where: {
          site_postcode: {
            [Op.ne]: null,
          },
        },
        raw: true,
      });

      const codes = postalCodes.map((p) => p.site_postcode);

      return res.sendSuccess(codes, 'Postal codes fetched successfully');
    } catch (error) {
      logger.error('Error fetching postal codes', error);
      return res.sendError(error);
    }
  }
);

router.get(
  '/unassigned/list/:client_id',
  roleAccess(['admin', 'client']),
  async (req, res) => {
    try {
      const { search = '', page = 1, limit = 1000 } = req.query;
      const offset = (page - 1) * limit;
      const client_id = req.params.client_id;

      if (!client_id) {
        return res.sendInvalidRequest('client Id is required');
      }

      const client = await Client.findOne({
        where: { uuid: client_id },
      });

      if (!client) {
        return res.sendResourceNotFound('Client not found');
      }

      const { count, rows: customers } = await Customer.findAndCountAll({
        attributes: ['uuid', 'business_name'],
        include: [
          {
            model: CustomerDebt,
            as: 'debt',
            where: { user_id: null },
          },
        ],
        offset,
        limit,
      });

      // Grouping customers by site_postcode from debts
      const groupedByPostalCode = {};
      for (const customer of customers) {
        for (const debt of customer.debt) {
          const code = debt.site_postcode;
          if (!groupedByPostalCode[code]) {
            groupedByPostalCode[code] = [];
          }
          groupedByPostalCode[code].push({
            uuid: customer.uuid,
            business_name: customer.business_name,
          });
        }
      }

      return res.sendSuccess(
        {
          unassigned_customers: groupedByPostalCode,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit),
          },
        },
        'Unassigned customers grouped by site postcode'
      );
    } catch (error) {
      logger.error('Error fetching unassigned customers:', error);
      return res.sendError(
        error.message,
        'Error while fetching unassigned customers'
      );
    }
  }
);

router.post('/assign-to-collector', roleAccess(['admin']), async (req, res) => {
  try {
    const { postal_code, user_id, client_id, customer_debt_id } = req.body;

    if (
      !user_id ||
      !client_id ||
      !Array.isArray(customer_debt_id) ||
      customer_debt_id.length === 0
    ) {
      return res.sendInvalidRequest('One or more required id are missing.');
    }

    const [client, collector] = await Promise.all([
      Client.findOne({ where: { uuid: client_id } }),
      User.findOne({ where: { uuid: user_id } }),
    ]);

    if (!client) return res.sendResourceNotFound('Client not found');
    if (!collector) return res.sendResourceNotFound('Debt collector not found');

    const collectorPostalCodes = [...collector.postal_code];
    if (postal_code && !collectorPostalCodes.includes(postal_code)) {
      collectorPostalCodes.push(postal_code);
      await collector.update({ postal_code: collectorPostalCodes });
    }

    // Find the customers by their UUIDs
    let customerIds = req.body.customer_id;
    if (!Array.isArray(customerIds)) {
      customerIds = [customerIds];
    }
    const debts = await CustomerDebt.findAll({
      where: { uuid: { [Op.in]: customer_debt_id } },
      client_id: client.id,
    });

    if (debts.length !== debts.length) {
      // Some customers were not found
      const foundCustomerUuids = debts.map((c) => c.uuid);
      const notFoundUuids = customer_debt_id.filter(
        (uuid) => !foundCustomerUuids.includes(uuid)
      );
      return res.sendResourceNotFound(
        `The following customer IDs were not found: ${notFoundUuids.join(', ')}`
      );
    }

    const updated = [];

    // Assign customers to the collector
    for (const debt of debts) {
      await debt.update({ user_id: collector.id });
      updated.push(debt.uuid);
    }
    activityTracking(
      req,
      `Successfully updated ${updated.length} debts  to collector ${collector.uuid} for client ${client.uuid}`
    );
    return res.sendSuccess(
      {
        message: `Successfully updated ${updated.length} debts  to collector ${collector.uuid} for client ${client.uuid}`,
        updated_customer_uuids: updated,
      },
      'Customers updated successfully'
    );
  } catch (error) {
    logger.error('Error assigning customers to collector:', error);
    return res.sendError(error.message, 'Error assigning customers');
  }
});

// Transfer already asssigned customers to another debt collector/debt head one time or permanent
router.post('/transfer-customer', roleAccess(['admin']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { is_permanent = false, user_id, customer_debt_id } = req.body;

    if (
      !user_id ||
      !Array.isArray(customer_debt_id) ||
      customer_debt_id.length === 0
    ) {
      return res.sendInvalidRequest(
        "Both 'user_id' and 'customer_debt_id' are required"
      );
    }

    // Fetch new debt collector
    const newCollector = await User.findOne({ where: { uuid: user_id } });
    if (!newCollector) {
      return res.sendInvalidRequest('New user not found');
    }

    const newCollectorId = newCollector.id;
    const newCollectorPostals = new Set(
      (newCollector.postal_code || []).map((p) => p.replace(/\s/g, ''))
    );

    // Fetch customers debts
    const debts = await CustomerDebt.findAll({
      where: { uuid: { [Op.in]: customer_debt_id } },
      attributes: ['customer_id', 'site_postcode', 'user_id', 'id'],
    });

    if (!debts.length) {
      return res.sendResourceNotFound('No matching debts found');
    }
    // Track old collector postal codes
    const oldUserPostalMap = {};

    for (const debt of debts) {
      const postalCode = debt.site_postcode?.replace(/\s/g, '');
      const oldUserId = debt.user_id;

      await debt.update({ user_id: newCollectorId }, { transaction: t });

      if (is_permanent && postalCode) {
        newCollectorPostals.add(postalCode);

        if (oldUserId && oldUserId !== newCollectorId) {
          if (!oldUserPostalMap[oldUserId])
            oldUserPostalMap[oldUserId] = new Set();
          oldUserPostalMap[oldUserId].add(postalCode);
        }
      }
    }

    // Update new collector's postal codes
    if (is_permanent) {
      await User.update(
        { postal_code: Array.from(newCollectorPostals) },
        { where: { id: newCollectorId }, transaction: t }
      );

      // Update old collectors
      for (const [oldUserId, codesToRemoveSet] of Object.entries(
        oldUserPostalMap
      )) {
        const oldUser = await User.findByPk(oldUserId, { transaction: t });
        if (!oldUser) continue;

        const currentPostals = (oldUser.postal_code || []).map((p) =>
          p.replace(/\s/g, '')
        );
        const codesToRemove = Array.from(codesToRemoveSet);

        const updatedPostals = currentPostals.filter(
          (code) => !codesToRemove.includes(code)
        );

        await User.update(
          { postal_code: updatedPostals },
          { where: { id: oldUserId }, transaction: t }
        );
      }
    }

    await t.commit();
    return res.sendSuccess({}, 'Customers transferred successfully');
  } catch (error) {
    if (t) await t.rollback();
    logger.error('Error transferring customers:', error);
    return res.sendError('Server error during customer transfer');
  }
});

// Transfer postal codes from one debt collector to another
router.post(
  '/transfer-postal-codes',
  roleAccess(['admin']),
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { from_user_id, to_user_id, postal_codes } = req.body;

      if (
        !from_user_id ||
        !to_user_id ||
        !Array.isArray(postal_codes) ||
        postal_codes.length === 0
      ) {
        return res.sendInvalidRequest(
          {},
          'from_user_id, to_user_id and postal_codes are required'
        );
      }

      const [fromUser, toUser] = await Promise.all([
        User.findOne({ where: { uuid: from_user_id } }),
        User.findOne({ where: { uuid: to_user_id } }),
      ]);

      if (!fromUser || !toUser) {
        return res.sendInvalidRequest({}, 'One or both users not found');
      }
      const isAllPostalCodesValid = postal_codes.every((code) =>
        fromUser.postal_code.includes(code)
      );

      if (!isAllPostalCodesValid) {
        return res.sendInvalidRequest(
          {},
          'One or more postal codes are not exist for the from user'
        );
      }
      const updatedPostals = Array.from(
        new Set([...toUser.postal_code, ...postal_codes])
      );
      await User.update(
        { postal_code: updatedPostals },
        { where: { id: toUser.id }, transaction: t }
      );

      const remainingPostals = fromUser.postal_code.filter(
        (code) => !postal_codes.includes(code)
      );
      await User.update(
        { postal_code: remainingPostals },
        { where: { id: fromUser.id }, transaction: t }
      );

      await t.commit();
      return res.sendSuccess({}, 'Postal codes transferred successfully');
    } catch (err) {
      if (t) await t.rollback();
      console.error('Error transferring postal codes:', err);
      return res.sendError('Server error during postal code transfer');
    }
  }
);

module.exports = router;
