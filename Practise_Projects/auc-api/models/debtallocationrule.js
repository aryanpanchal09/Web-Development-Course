'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DebtAllocationRule extends Model {
    static associate(models) {
      DebtAllocationRule.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user"
      })
    }
  }
  DebtAllocationRule.init({
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
    min_amount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_amount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    aging: {
      type: DataTypes.JSONB,
      allowNull: true
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
  }, {
    sequelize,
    modelName: "DebtAllocationRule",
    tableName: "debt_allocation_rules",
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",

  });
  return DebtAllocationRule;
};