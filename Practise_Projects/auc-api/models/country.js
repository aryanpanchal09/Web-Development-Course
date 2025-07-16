"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Country extends Model {
    static associate(models) {}
  }
  Country.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      uuid: {
        unique: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      name: {
        unique: true,
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      country_code: {
        unique: true,
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      phone_code: {
        type: DataTypes.STRING(4),
        allowNull: false,
      },
      status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
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
        allowNull: false,
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
      modelName: "Country",
      timestamps: true,
      tableName: "countries",
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Country;
};
