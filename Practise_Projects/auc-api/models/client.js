'use strict';

const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      Client.hasMany(models.SiteVisitReport, {
        foreignKey: 'client_id',
      });
      Client.hasMany(models.User, {
        foreignKey: 'client_id',
        as: 'users', // This client has many users
      });
    }
  }

  Client.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      unique_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address3: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      town: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      utility_type: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Client',
      timestamps: true,
      // paranoid: true,
      tableName: 'clients',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Client;
};
