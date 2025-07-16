"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("countries", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.SMALLINT,
      },
      uuid: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: "countries_uuid_key",
      },
      name: {
        unique: true,
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      country_code: {
        unique: true,
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      phone_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      status: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 1,
        comment: "0: Draft, 1: Active, 2: Inactive, 3:Deleted",
      },
      created_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
      },
      deleted_by: {
        type: Sequelize.DataTypes.BIGINT,
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
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("countries");
  },
};
