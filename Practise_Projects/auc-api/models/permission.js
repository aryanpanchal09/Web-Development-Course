"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      // Many-to-Many with Roles
      Permission.belongsToMany(models.Role, { through: "RolePermission", foreignKey: "permission_id", otherKey: "role_id", as: "roles" });

      // Belongs to a Module (assuming there's a modules table)
      Permission.belongsTo(models.Module, { foreignKey: "module_id", as: "module" });
    }
  }

  Permission.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      module_id: {
        type: DataTypes.BIGINT, // Primary key of module
        allowNull: false,
      },
      uuid: {
        type: DataTypes.UUID,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      permission_name: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      permission_key: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        validate: {
          is: /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, // kebab_case or snake_case
        },
      },
      status: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Permission",
      tableName: "permissions",
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Permission;
};
