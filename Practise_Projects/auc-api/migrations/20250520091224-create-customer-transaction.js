"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("customer_transactions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      client_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      amount_paid: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("customer_transactions");
  },
};
