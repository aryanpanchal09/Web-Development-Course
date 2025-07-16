const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const {
  Customer,
  Client,
  User,
  CustomerDebt,
  CustomerTransaction,
} = require("../models");

// Add new transaction endpoint
router.post("/add", async (req, res) => {
  try {
    const {
      customer_id,
      client_id,
      amount_paid,
      payment_date,
      payment_method = "manual",
    } = req.body;

    // Validate required fields
    if (!customer_id || !client_id || amount_paid == null || !payment_date) {
      return res.sendInvalidRequest(
        "Missing required fields: customer_id, client_id, amount_paid, payment_date"
      );
    }

    // Validate amount is positive
    if (amount_paid <= 0) {
      return res.sendInvalidRequest("Payment amount must be greater than 0");
    }

    // Check if customer exists
    const customer = await Customer.findOne({
      where: { uuid: customer_id },
    });
    if (!customer) {
      return res.sendResourceNotFound("Customer not found");
    }

    // Check if client exists
    const client = await Client.findOne({
      where: { uuid: client_id },
    });
    if (!client) {
      return res.sendResourceNotFound("Client not found");
    }

    // Get customer's current debt
    const customerDebt = await CustomerDebt.findOne({
      where: {
        customer_id: customer.id,
        client_id: client.id,
      },
    });

    if (!customerDebt) {
      return res.sendResourceNotFound("No debt record found for this customer");
    }

    const totalDebt = customerDebt.debt_amount;
    const minimumPayment = totalDebt * 0.3; // 30% of total debt

    // Validate payment amount
    if (amount_paid > totalDebt) {
      return res.sendInvalidRequest(
        `Payment amount cannot exceed total debt amount of ${totalDebt}`
      );
    }

    if (amount_paid < minimumPayment) {
      return res.sendInvalidRequest(
        `Minimum payment amount must be at least 30% of total debt (${minimumPayment})`
      );
    }

    // Create transaction
    const transaction = await CustomerTransaction.create({
      customer_id: customer.id,
      client_id: client.id,
      user_id: req.user.id, // Already logged in user
      amount_paid: parseFloat(amount_paid),
      payment_date: new Date(payment_date),
      payment_method,
      status: 1,
    });

    await CustomerDebt.update(
      {
        pending_amount: Sequelize.literal(
          `CAST(pending_amount AS DECIMAL(10,2)) - ${amount_paid}`
        ),
      },
      {
        where: {
          customer_id: customer.id,
          client_id: client.id,
        },
      }
    );

    return res.sendSuccess(transaction, "Transaction created successfully");
  } catch (error) {
    logger.error("Error creating transaction:", error);
    return res.sendError(error.message);
  }
});

// List transactions endpoint
router.get("/list", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customer_id,
      client_id,
      user_id,
      start_date,
      end_date,
    } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (customer_id) where.customer_id = customer_id;
    if (client_id) where.client_id = client_id;
    if (user_id) where.user_id = user_id;
    if (start_date || end_date) {
      where.payment_date = {};
      if (start_date) where.payment_date[Op.gte] = new Date(start_date);
      if (end_date) where.payment_date[Op.lte] = new Date(end_date);
    }

    const { count, rows: transactions } =
      await CustomerTransaction.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["payment_date", "DESC"]],
        attributes: { exclude: ['id'] },
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["uuid", "first_name", "last_name", "email"],
          },
          {
            model: User,
            as: "collector",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
      });

    return res.sendSuccess(
      {
        transactions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
      "Transactions fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching transactions:", error);
    return res.sendError(error.message);
  }
});

module.exports = router;
