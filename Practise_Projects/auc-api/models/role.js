"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.belongsToMany(models.Permission, {
        through: "RolePermission",
        foreignKey: "role_id",
      });
      Role.hasMany(models.User, {
        foreignKey: "role_id",
        as: "users",
      });
    }
  }
  Role.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.SMALLINT,
        allowNull: false,
        primaryKey: true,
      },
      uuid: {
        unique: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      role_name: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      role_key: {
        type: DataTypes.STRING(50),
        unique: true,
        validate: {
          is: /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
        },
        allowNull: false,
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
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "roles",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );
  return Role;
};
