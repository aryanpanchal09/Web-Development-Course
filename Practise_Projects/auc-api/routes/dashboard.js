const express = require("express");
const router = express.Router();
const { verifyAuthToken, roleAccess } = require("../middlewares/auth");
const { paginationQuery } = require("../utils/helper");
const { SiteVisitReport ,CustomerDebt, sequelize ,Customer, User, Client, Sequelize} = require("../models");
const logger = require("../utils/logger");
const { Op, where } = require("sequelize");

router.get("/recent-activity/list", verifyAuthToken, async (req, res) => {
  try {
    const pagination = paginationQuery(req); 
    if (pagination.type === "Error") {
      return res.sendError(pagination.message);
    }
    const { customer_id, customer_debt_id } = req.query;
    if ((customer_id && !customer_debt_id) || (!customer_id && customer_debt_id)) {
      return res.sendInvalidRequest("Both customer_id and customer_debt_id must be provided for filtering.");
    }
    const [customer, debt] = await Promise.all([
      customer_id ? Customer.findOne({ where: { uuid: customer_id }, attributes: ["id"] }) : Promise.resolve(null),
      customer_debt_id ? CustomerDebt.findOne({ where: { uuid: customer_debt_id }, attributes: ["id"] }) : Promise.resolve(null),
    ]);

    const where = {};
    if (customer) where.customer_id = customer.id;
    if (debt) where.customer_debt_id = debt.id;
    
    const { count, rows: reports } = await SiteVisitReport.findAndCountAll({
      where,
      attributes: {
        include: [
          [Sequelize.literal(`CASE WHEN site_visit_time_out IS NULL THEN 'started' ELSE 'completed' END`), 'site_visit_status'],
        ]
      },
      include: [
        {
          model: Customer,
          attributes: ["business_name","contact_person_name", "email","contact_number"],
        },
        {
          model: User,
          as:"user",
          attributes: ["first_name","last_name","email","phone_no","user_type"],
        }
      ],
      order: [["updated_at", "DESC"]],   // fetch recently updated visit reports to dashboard
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return res.sendSuccess(reports, "Site visit reports fetched successfully", {
      pagination: {
        total: count,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(count / pagination.limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching reports:", error);
    return res.sendError("Failed to fetch reports.");
  }
});



router.get("/recent-activity/fetch/:report_id", verifyAuthToken, async (req, res) => {
    const { report_id } = req.params;

    try {
        const report = await SiteVisitReport.findOne({
            where: { uuid:report_id }
        });

        if (!report) return res.sendResourceNotFound("Site visit report not found");

        return res.sendSuccess(report, "Report details fetched");
    } catch (error) {
        logger.error("Error fetching single report:", error);
        return res.sendError("Failed to fetch report");
    }
});

router.put("/recent-activity/update/:report_id", verifyAuthToken, async (req, res) => {
  const { report_id } = req.params;
  const updateData = req.body;

  if (!uuid) return res.sendInvalidRequest("Missing report UUID");

  try {
    const report = await SiteVisitReport.findOne({ where: { uuid:report_id } });

    if (!report) return res.sendResourceNotFound("Report not found");

    await report.update(updateData);

    return res.sendSuccess(null, "Report updated successfully");
  } catch (error) {
    logger.error("Error updating report:", error);
    return res.sendError("Failed to update report");
  }
});

router.get("/total-count", async (req, res) => {
  try {
    const where = { deleted_at: null };

    if (req.user.role === "client") {
      where.client_id = req.user.id;
    } else if (req.user.role === "debt_collector") {
      where.user_id = req.user.id;
    } else if (req.user.role === "debt_head") {
      const { rows: collectors } = await User.findAndCountAll({
        where: {
          debt_head_id: req.user.id,
        },
        attributes: {
          exclude: ["password"],
        },
      });
      const collectorsPlain = collectors.map(c => c.get({ plain: true }));
      if (collectorsPlain.length > 0) {
        const collectorIds = collectorsPlain.map(c => c.id);
        where.user_id = { [Op.in]: collectorIds };
      } else {
        where.user_id = null;
      }
    }
    
    const [totalDebt, uniqueCustomers] = await Promise.all([
      CustomerDebt.sum("total_outstanding_balance", { where }),
      CustomerDebt.count({
        distinct: true,
        col: "customer_id",
        where,
      }),
    ]);

    return res.sendSuccess({
      total_debt: totalDebt,
      total_customers: uniqueCustomers,
      total_recoverd: 0,
      total_pending: 0
    });

  } catch (error) {
    logger.error(error);
    return res.sendError("Something went wrong");
  }
});

router.get("/total-customers", async (req, res) => {
  try {
    const where = { deleted_at: null };

    // Pagination defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    // Role-based filtering
    if (req.user.role === "client") {
      where.client_id = req.user.id;
    } else if (req.user.role === "debt_collector") {
      where.user_id = req.user.id;
    } else if (req.user.role === "debt_head") {
      const collectors = await User.findAll({
        where: { debt_head_id: req.user.id },
        attributes: ["id"],
        raw: true,
      });

      const collectorIds = collectors.map(c => c.id);
      where.user_id = collectorIds.length > 0 ? { [Op.in]: collectorIds } : null;
    }

    // Count unique customers
    const totalGroups = await CustomerDebt.count({
      where,
      distinct: true,
      col: "customer_id",
    });

    // Now get paginated data
    const customerDebts = await CustomerDebt.findAll({
      where,
      attributes: [
        "customer_id",
        [sequelize.fn("SUM", sequelize.col("total_outstanding_balance")), "total_outstanding_balance"],
      ],
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["business_name", "contact_person_name"],
        },
      ],
      group: ["customer_id", "customer.id"],
      order: [[sequelize.literal("total_outstanding_balance"), "DESC"]],
      offset,
      limit,
    });

    const data = customerDebts.map((cd) => {
      const balance = (cd.dataValues.total_outstanding_balance || 0);
      return {
        name: cd.customer?.contact_person_name || "Unknown",
        total_outstanding_balance: balance,
        status: balance <= 0 ? "Paid" : "Pending",
      };
    });

    return res.sendSuccess({
      customers: data,
      pagination: {
        page,
        limit,
        total_customers: totalGroups,
        total_pages: Math.ceil(totalGroups / limit),
      },
    });

  } catch (error) {
    logger.error(error);
    return res.sendError("Failed to fetch top customers");
  }
});

router.get("/top-performing-clients", async (req, res) => {
  try {
    const where = { deleted_at: null };

    const results = await CustomerDebt.findAll({
      where,
      attributes: [
        "client_id",
        [sequelize.fn("SUM", sequelize.col("total_outstanding_balance")), "total_outstanding_balance"]
      ],
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["uuid", "first_name", "last_name"],
        }
      ],
      group: ["client_id", "client.id"],
      order: [[sequelize.literal("total_outstanding_balance"), "DESC"]],
    });

    const data = results.map((item) => ({
      uuid:item.client?.uuid,
      first_name: item.client?.first_name,
      last_name:item.client?.last_name,
      total_outstanding_balance: (item.dataValues.total_outstanding_balance || 0)
    }));

    return res.sendSuccess({ clients: data });

  } catch (error) {
    logger.error(error);
    return res.sendError("Failed to fetch outstanding balance by client");
  }
});





module.exports = router;