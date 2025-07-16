"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("role_permissions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      role_id: { // Primary key of roles
        type: Sequelize.BIGINT,
        allowNull: false
      },
      permission_id: { // Primary key of permissions
        type: Sequelize.BIGINT,
        allowNull: false
      },
      created_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        comment: "Primary key of users table",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
        comment: "Default timezone UTC",
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
        comment: "Default timezone UTC",
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("role_permissions");
  },
};
