"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sequalize_seeder_metas", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.SMALLINT,
      },
      file_path: {
        type: Sequelize.STRING(1000),
        allowNull: false,
        unique: true,
      },
      file_size: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_created_at: {
        type: Sequelize.DATE(6),
        allowNull: false,
      },
      file_modified_at: {
        type: Sequelize.DATE(6),
        allowNull: false,
      },
      file_modified_at_ms: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      is_modified: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        comment: "0: Inactive, 1: Active, 2: Deleted",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: "Default timezone UTC",
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        comment: "Default timezone UTC",
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("sequalize_seeder_metas");
  },
};
