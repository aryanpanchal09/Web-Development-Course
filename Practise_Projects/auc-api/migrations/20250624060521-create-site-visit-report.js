'use strict';
const { DataTypes } = require("sequelize");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('site_visit_reports', {
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
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      client_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      customer_debt_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      site_visit_date: Sequelize.DATEONLY,
      site_visit_time_in: Sequelize.TIME,
      site_visit_time_out: Sequelize.TIME,
      site_picture: Sequelize.ARRAY(Sequelize.STRING),
      site_visit_notes: Sequelize.STRING,
      other_notes: Sequelize.STRING,
      service_address: Sequelize.TEXT,
      date_of_visit: Sequelize.DATEONLY,
      utility_visited: Sequelize.STRING,
      balance_to_be_resolved: Sequelize.STRING,
      direct_debit_status: Sequelize.STRING,
      letter_of_intent_left: Sequelize.STRING,
      letter_before_action_left: Sequelize.STRING,
      shutter_type: Sequelize.STRING,
      person_spoken_to: Sequelize.STRING,
      vulnerable_customer: Sequelize.STRING,
      is_the_business_trading: Sequelize.STRING,
      meter_reading_obtained: Sequelize.STRING,
      location: Sequelize.STRING,
      signs_of_meter_tampering: Sequelize.STRING,
      refused_acess: Sequelize.STRING,
      unable_to_locate_meter: Sequelize.STRING,
      acess_blocked: Sequelize.STRING,
      steps_taken_to_locate_meter: Sequelize.STRING,
      shared_supply: Sequelize.STRING,
      smart_meter_required: Sequelize.STRING,
      "3rd_party_warrant_required": Sequelize.STRING,
      meter_read_1: Sequelize.STRING,
      meter_read_2: Sequelize.STRING,
      meter_read_3: Sequelize.STRING,
      meter_read_4: Sequelize.STRING,
      meter_read_5: Sequelize.STRING,
      new_business_name: Sequelize.STRING,
      new_tenant_name: Sequelize.STRING,
      landline: Sequelize.STRING,
      mobile: Sequelize.STRING,
      COT_meter_readings: {
        type: DataTypes.STRING,
        field: 'COT_meter_readings',
      },
      lease_agreement: Sequelize.STRING,
      identification: Sequelize.STRING,
      new_signage: Sequelize.STRING,
      COT_letter_left: {
        type: DataTypes.STRING,
        field: 'COT_letter_left',
      },
      BMO_form: {
        type: DataTypes.STRING,
        field: 'BMO_form',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('site_visit_reports');
  }
};
