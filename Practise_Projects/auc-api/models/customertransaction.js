"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CustomerTransaction extends Model {
    static associate(models) {
      // Belongs to User (debt collector)
      CustomerTransaction.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "collector",
      });

      // Belongs to Customer
      CustomerTransaction.belongsTo(models.Customer, {
        foreignKey: "customer_id",
        as: "customer",
      });
    }
  }

  CustomerTransaction.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false,
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
      modelName: "CustomerTransaction",
      tableName: "customer_transactions",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return CustomerTransaction;
};
