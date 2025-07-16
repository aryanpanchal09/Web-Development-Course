'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('organizations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        comment: "Unique Identifier",
      },
      // owner_id: {
      //   type: Sequelize.BIGINT,
      //   allowNull: false
      // },
      org_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      org_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      org_email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      org_phone: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      org_website: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.DataTypes.SMALLINT,
        defaultValue: 0,
        comment: "0: Active, 1: Inactive, 2:Deleted",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: "created_at : Default timezone UTC",
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: "updated_at : Default timezone UTC",
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
        comment: "deleted_at : Default timezone UTC",
      },
      created_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('organizations');
  }
};