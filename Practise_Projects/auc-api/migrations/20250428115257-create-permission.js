"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("permissions", {
      id: {
        autoIncrement: true,
        type: Sequelize.DataTypes.SMALLINT,
        allowNull: false,
        primaryKey: true,
      },
      uuid: {
        type: Sequelize.DataTypes.UUID,
        unique: true,
        allowNull: false,
        comment: "Unique Identifier",
      },
      module_id: {
        type: Sequelize.DataTypes.BIGINT,  // Primary key of modules
        allowNull: false,
      },
      permission_name: {
        type: Sequelize.DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: "Unique permission name",
      },
      permission_key: {
        type: Sequelize.DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: "Unique permission key",
      },
      status: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        comment: "0: Inactive, 1: Active, 2: Deleted",
      },
      created_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        comment: "created_by : Primary key of users table",
      },
      updated_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
        comment: "updated_by : Primary key of users table",
      },
      deleted_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
        comment: "deleted_by : Primary key of users table",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
        comment: "Default created_at timezone UTC",
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
        comment: "Default updated_at timezone UTC",
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
        comment: "Default deleted_at timezone UTC",
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("permissions");
  },
};
