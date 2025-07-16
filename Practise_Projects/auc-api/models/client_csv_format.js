"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Client_csv_format extends Model {
    static associate(models) {
      Client_csv_format.belongsTo(models.Client, {
        foreignKey: "client_id",
        as: "client",
      });
    }
  }
  Client_csv_format.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.BIGINT,
        defaultValue: null,
        allowNull: true,
        primaryKey: true,
        references: {
          model: "clients",
          key: "id",
        },
      },
      header_mapping: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ClientCsvFormat",
      tableName: "client_csv_format",
      timestamps: true,
      underscored: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  return Client_csv_format;
};
