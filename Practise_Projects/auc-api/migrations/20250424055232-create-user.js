"use strict";

const { sequelize } = require("../models");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        autoIncrement: true,
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        comment: "Primary key",
      },
      client_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
        comment: "Client ID",
      },
      uuid: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        unique: true,
        comment: "Unique Identifier",
      },
      unique_id: {
        type: Sequelize.DataTypes.STRING(50),
        allowNull: true,
      },
      first_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true,
        comment: "First name",
      },
      last_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true,
        comment: "Last name",
      },
      email: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
        comment: "Email",
      },
      phone_no: {
        type: Sequelize.DataTypes.STRING(25),
        allowNull: true,
        comment: "Phone no",
      },
      password: {
        type: Sequelize.DataTypes.STRING(150),
        allowNull: false,
        comment: "Password (Hashed)",
      },
      debt_head_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
      },
      user_type: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
      role_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
      },
      profile_img: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true,
        comment: "Profile Image URL",
      },
      date_of_birth: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
        comment: "Birth date",
      },
      device_token: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "Device Token",
      },
      device_type: {
        type: Sequelize.SMALLINT,
        allowNull: true,
        comment: "1:iPhone, 2:Android",
      },
      address1: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Address 1",
      },
      address2: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Address 2",
      },
      address3: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Address 3",
      },
      town: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "Town",
      },
      country: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "Country",
      },
      postal_code: {
        type: Sequelize.DataTypes.ARRAY(Sequelize.STRING),
        allowNull: true,
        comment: "Array of postal codes for debt collectors",
      },
      status: {
        type: Sequelize.DataTypes.SMALLINT,
        defaultValue: 0,
        comment: "0: Active, 1: Inactive, 2:Deleted",
      },
      reset_password_token: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      reset_password_expires: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
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
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
