"use strict";
const { Model } = require("sequelize");
const customertransaction = require("./customertransaction");
const customerdebt = require("./customerdebt");

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.hasMany(models.CustomerDebt, {
        foreignKey: "customer_id",
        as: "debt"
      });
      Customer.hasMany(models.CustomerTransaction, {
        foreignKey: "customer_id",
        as: "transactions"
      });
      Customer.belongsTo(models.Organization, {
        foreignKey: "organization_id",
        as: "organization",
      });

      Customer.hasMany(models.UserComment, {
        foreignKey: 'customer_id',
        as: 'comments'});
      Customer.hasMany(models.SiteVisitReport, {
        foreignKey: "customer_id",
      });

    }
  }

  Customer.init(
    {
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
      business_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone_no: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      organization_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      contact_person_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contact_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Customer",
      tableName: "customers",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Customer;
};
