'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserComment extends Model {
    static associate(models) {
      UserComment.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      UserComment.belongsTo(models.Customer, {
        foreignKey: "customer_id",
        as: "customer",
      });
      UserComment.belongsTo(models.CustomerDebt, {
        foreignKey: "customer_debt_id",
        as: "debt",
      });
    }
  }
  UserComment.init({
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    customer_debt_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: "UserComment",
    tableName: "user_comments",
    timestamps: true,
    paranoid: false,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  });
  return UserComment;
};