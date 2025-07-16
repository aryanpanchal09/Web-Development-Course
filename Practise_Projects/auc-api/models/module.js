"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Module extends Model {
    static associate(models) {
      Module.hasMany(models.Permission, { foreignKey: "module_id", as: "permissions" });
    }
  }

  Module.init(
    {
      id: {
        type: DataTypes.SMALLINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      module_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      module_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i,
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
    },
    {
      sequelize,
      modelName: "Module",
      tableName: "modules",
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Module;
};
