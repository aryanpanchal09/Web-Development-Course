"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("customer_debts", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      client_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      user_id: {
        allowNull: true,
        type: Sequelize.BIGINT,
      },
      csv_file_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      utility_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      account_id: { type: Sequelize.STRING },
      group_id: { type: Sequelize.STRING },
      group_name: { type: Sequelize.STRING },
      validated: { type: Sequelize.BOOLEAN, defaultValue: false },

      site_address1: { type: Sequelize.TEXT },
      site_address2: { type: Sequelize.TEXT },
      site_address3: { type: Sequelize.TEXT },
      site_address4: { type: Sequelize.TEXT },
      site_postcode: { type: Sequelize.STRING },
      billing_postcode: { type: Sequelize.STRING },

      collecting_agent: { type: Sequelize.STRING },
      agent_assign_date: { type: Sequelize.DATE },
      region_code: { type: Sequelize.STRING },
      region_name: { type: Sequelize.STRING },

      pending_15: { type: Sequelize.DECIMAL(20, 2) },
      pending_30: { type: Sequelize.DECIMAL(20, 2) },
      pending_60: { type: Sequelize.DECIMAL(20, 2) },
      pending_90: { type: Sequelize.DECIMAL(20, 2) },
      pending_120: { type: Sequelize.DECIMAL(20, 2) },
      pending_180: { type: Sequelize.DECIMAL(20, 2) },
      pending_181: { type: Sequelize.DECIMAL(20, 2) },
      total_outstanding_balance: { type: Sequelize.DECIMAL(20, 2) },
      only_payment: { type: Sequelize.DECIMAL(20, 2) },
      next_invoice_amount: { type: Sequelize.DECIMAL(20, 2) },
      next_invoice_due_date: { type: Sequelize.DATE },
      agreed_pp_amount: { type: Sequelize.DECIMAL(20, 2) },
      pending_amount: { type: Sequelize.DECIMAL(20, 2) },
      aging: { type: Sequelize.STRING },
      pending_days: { type: Sequelize.INTEGER },

      last_payment_date: { type: Sequelize.DATE },
      last_payment_amount: { type: Sequelize.DECIMAL(20, 2) },
      mode_of_payment: { type: Sequelize.STRING },
      charge_amount: { type: Sequelize.DECIMAL(20, 2) },
      charge_date: { type: Sequelize.DATE },
      supply_address: { type: Sequelize.TEXT },

      billing_address1: { type: Sequelize.TEXT },

      billing_address2: { type: Sequelize.TEXT },

      billing_address3: { type: Sequelize.TEXT },

      billing_address4: { type: Sequelize.TEXT },


      billing_address: { type: Sequelize.TEXT },


      first_letter_sent_date: { type: Sequelize.STRING },
      second_letter_sent_date: { type: Sequelize.STRING },
      notice_letter_sent_date: { type: Sequelize.STRING },
      isolation_letter_sent: { type: Sequelize.BOOLEAN },

      disconnection_date: { type: Sequelize.DATE },

      last_bill_date: { type: Sequelize.DATE },
      last_bill_amount: { type: Sequelize.DECIMAL(20, 2) },
      reconciled_amount: { type: Sequelize.DECIMAL(20, 2) },

      mpan: { type: Sequelize.STRING },
      mprn: { type: Sequelize.STRING },
      spid: { type: Sequelize.STRING },
      mop_mam: { type: Sequelize.STRING },
      electricity_meter_type: { type: Sequelize.STRING },
      gas_meter_type: { type: Sequelize.STRING },
      last_reading_ec: { type: Sequelize.STRING },
      actual_estimate_ec: { type: Sequelize.STRING },
      last_reading_gas: { type: Sequelize.STRING },
      actual_estimate_gas: { type: Sequelize.STRING },
      live_date: { type: Sequelize.DATE },
      elec_loss_date: { type: Sequelize.DATE },
      gas_loss_date: { type: Sequelize.DATE },

      cng_customer: { type: Sequelize.BOOLEAN },
      profile_class: { type: Sequelize.STRING },
      ec_total_eac: { type: Sequelize.STRING },
      gas_total_eac: { type: Sequelize.STRING },
      energisation_status: { type: Sequelize.STRING },
      ct_wc: { type: Sequelize.STRING },
      meter_location_j0419: { type: Sequelize.STRING },
      meter_serial_number: { type: Sequelize.STRING },
      mandate_status: { type: Sequelize.STRING },
      is_aging: { type: Sequelize.BOOLEAN },
      is_debt: { type: Sequelize.BOOLEAN },
      is_force_stop: { type: Sequelize.BOOLEAN },
      is_query_open: { type: Sequelize.BOOLEAN },
      customer_status: { type: Sequelize.STRING },
      customer_status1: { type: Sequelize.STRING },
      cot_date: { type: Sequelize.DATE },



      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("customer_debts");
  },
};
