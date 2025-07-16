'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Organization extends Model {
    static associate(models) {
      // Organization has many Users
      this.hasMany(models.User, { foreignKey: 'organization_id', as: 'users' });

      // Organization belongs to one User (owner)
      // this.belongsTo(models.User, { foreignKey: 'owner_id', as: 'owner' });
    }
  }

  Organization.init(
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      org_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      org_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      org_email: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      org_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      org_website: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      // owner_id: {  // Primary key of user
      //   type: DataTypes.BIGINT,
      //   allowNull: false,
      // },
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
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
    },
    {
      sequelize,
      modelName: 'Organization',
      tableName: 'organizations',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Organization;
};
