"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CustomerDebt extends Model {
    static associate(models) {
      CustomerDebt.belongsTo(models.Customer, {
        foreignKey: "customer_id",
        as: "customer",
      });
      CustomerDebt.hasMany(models.SiteVisitReport, {
        foreignKey: "customer_debt_id",
        as: "site_visit_report"
      });

      CustomerDebt.hasMany(models.UserComment, {
        foreignKey: "customer_debt_id",
        as: "usercomment"
      });
      CustomerDebt.belongsTo(models.CustomerCSVFile, {
        foreignKey: "csv_file_id",
        as: "csv_file"
      });
      CustomerDebt.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user"
      });
      CustomerDebt.belongsTo(models.Client, {
        foreignKey: "client_id",
        as: "client"
      })
    }
  }
  CustomerDebt.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      client_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      csv_file_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      utility_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_id: { type: DataTypes.STRING, allowNull: true },
      group_id: { type: DataTypes.STRING, allowNull: true },
      group_name: { type: DataTypes.STRING, allowNull: true },
      validated: { type: DataTypes.BOOLEAN, defaultValue: false },
      site_address1: { type: DataTypes.STRING },
      site_address2: { type: DataTypes.STRING },
      site_address3: { type: DataTypes.STRING },
      site_address4: { type: DataTypes.STRING },
      site_postcode: { type: DataTypes.STRING },
      // Agent & Dates
      collecting_agent: { type: DataTypes.STRING },
      agent_assign_date: { type: DataTypes.DATE },
      region_code: { type: DataTypes.STRING },
      region_name: { type: DataTypes.STRING },

      // Amounts & Aging
      pending_15: { type: DataTypes.DECIMAL(20, 2) },
      pending_30: { type: DataTypes.DECIMAL(20, 2) },
      pending_60: { type: DataTypes.DECIMAL(20, 2) },
      pending_90: { type: DataTypes.DECIMAL(20, 2) },
      pending_120: { type: DataTypes.DECIMAL(20, 2) },
      pending_180: { type: DataTypes.DECIMAL(20, 2) },
      pending_181: { type: DataTypes.DECIMAL(20, 2) },
      total_outstanding_balance: { type: DataTypes.DECIMAL(20, 2) },
      only_payment: { type: DataTypes.DECIMAL(20, 2) },
      next_invoice_amount: { type: DataTypes.DECIMAL(20, 2) },
      next_invoice_due_date: { type: DataTypes.DATE },
      agreed_pp_amount: { type: DataTypes.DECIMAL(20, 2) },
      pending_amount: { type: DataTypes.DECIMAL(20, 2) },
      aging: { type: DataTypes.STRING },
      pending_days: { type: DataTypes.INTEGER },

      // Payments
      last_payment_date: { type: DataTypes.DATE },
      last_payment_amount: { type: DataTypes.DECIMAL(20, 2) },
      mode_of_payment: { type: DataTypes.STRING },
      charge_amount: { type: DataTypes.DECIMAL(20, 2) },
      charge_date: { type: DataTypes.DATE },
      supply_address: { type: DataTypes.STRING },
      billing_address1: { type: DataTypes.STRING },
      billing_address2: { type: DataTypes.STRING },
      billing_address3: { type: DataTypes.STRING },
      billing_address4: { type: DataTypes.STRING },
      billing_address: { type: DataTypes.STRING },

      // Letters & Disconnection
      first_letter_sent_date: { type: DataTypes.STRING },
      second_letter_sent_date: { type: DataTypes.STRING },
      notice_letter_sent_date: { type: DataTypes.STRING },
      isolation_letter_sent: { type: DataTypes.BOOLEAN },
      disconnection_date: { type: DataTypes.DATE },

      // Billing Info
      last_bill_date: { type: DataTypes.DATE },
      last_bill_amount: { type: DataTypes.DECIMAL(20, 2) },
      reconciled_amount: { type: DataTypes.DECIMAL(20, 2) },

      // Meter/Utility
      mpan: { type: DataTypes.STRING },
      mprn: { type: DataTypes.STRING },
      spid: { type: DataTypes.STRING },
      mop_mam: { type: DataTypes.STRING },
      electricity_meter_type: { type: DataTypes.STRING },
      gas_meter_type: { type: DataTypes.STRING },
      last_reading_ec: { type: DataTypes.STRING },
      actual_estimate_ec: { type: DataTypes.STRING },
      last_reading_gas: { type: DataTypes.STRING },
      actual_estimate_gas: { type: DataTypes.STRING },
      live_date: { type: DataTypes.DATE },
      elec_loss_date: { type: DataTypes.DATE },
      gas_loss_date: { type: DataTypes.DATE },

      // Flags & Status
      cng_customer: { type: DataTypes.BOOLEAN },
      profile_class: { type: DataTypes.STRING },
      ec_total_eac: { type: DataTypes.STRING },
      gas_total_eac: { type: DataTypes.STRING },
      energisation_status: { type: DataTypes.STRING },
      ct_wc: { type: DataTypes.STRING },
      meter_location_j0419: { type: DataTypes.STRING },
      meter_serial_number: { type: DataTypes.STRING },
      mandate_status: { type: DataTypes.STRING },
      is_aging: { type: DataTypes.BOOLEAN },
      is_debt: { type: DataTypes.BOOLEAN },
      is_force_stop: { type: DataTypes.BOOLEAN },
      is_query_open: { type: DataTypes.BOOLEAN },
      customer_status: { type: DataTypes.STRING },
      customer_status1: { type: DataTypes.STRING },
      cot_date: { type: DataTypes.DATE },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CustomerDebt",
      tableName: "customer_debts",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );


  return CustomerDebt;
};
