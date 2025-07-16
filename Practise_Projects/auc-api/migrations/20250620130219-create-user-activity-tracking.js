'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_activity_trackings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      logged_in_user: {
        type: Sequelize.STRING
      },
      api_name: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      switch_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_activity_trackings');
  }
};