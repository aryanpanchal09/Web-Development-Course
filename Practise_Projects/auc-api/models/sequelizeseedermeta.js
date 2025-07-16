"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SequalizeSeederMeta extends Model {
    static associate() {
    }
  }
  SequalizeSeederMeta.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.SMALLINT,
        allowNull: false,
        primaryKey: true,
      },
      file_path: {
        type: DataTypes.STRING(1000),
        unique: true,
        allowNull: false,
      },
      file_size: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      file_created_at: {
        allowNull: false,
        type: DataTypes.DATE(6),
      },
      file_modified_at: {
        allowNull: false,
        type: DataTypes.DATE(6),
      },
      file_modified_at_ms: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      is_modified: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      },
    },
    {
      sequelize,
      modelName: "SequalizeSeederMeta",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      tableName: "sequalize_seeder_metas",
    }
  );
  return SequalizeSeederMeta;
};
