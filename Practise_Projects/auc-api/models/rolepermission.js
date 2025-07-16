"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      RolePermission.belongsTo(models.Role, { foreignKey: "role_id", as: "role" });
      RolePermission.belongsTo(models.Permission, { foreignKey: "permission_id", as: "permission" });
    }
  }

  RolePermission.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      role_id: { // Primary key of roles
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      permission_id: {  // Primary key of permissions
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      status: DataTypes.SMALLINT,
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      deleted_by: {
        type: DataTypes.BIGINT,
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
      },
      deleted_at: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "RolePermission",
      tableName: "role_permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt:"deleted_at"
    }
  );

  return RolePermission;
};
