"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("modules", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      module_name: {
        type: Sequelize.STRING(100),
        unique: true,
        comment: "Unique Module name",
      },
      module_key: {
        type: Sequelize.STRING(100),
        unique: true,
        comment: "Unique Module key, auto-generated slug of module name",
      },
      status: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        comment: "0: Inactive, 1: Active, 2: Deleted",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: "Default created_at timezone UTC",
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        comment: "Default updated_at timezone UTC",
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
        comment: "Default deleted_at timezone UTC",
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
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("modules");
  },
};
