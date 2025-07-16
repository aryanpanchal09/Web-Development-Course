"use strict";
const { generateHash } = require("../utils/helper.js");
const { Model } = require("sequelize");
const bcrypt = require('bcryptjs');


module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, { foreignKey: "role_id", as: "role" });
      User.belongsTo(models.Organization, {
        foreignKey: "organization_id",
        as: "organization",
      });

      User.hasMany(models.CustomerDebt, {
        foreignKey: "user_id",
        as: "customer_debts",
      }); // this user has many customer debts

      User.belongsTo(models.User, {
        foreignKey: "debt_head_id",
        as: "debt_head", // This user reports to debt_head
      });

      User.hasMany(models.User, {
        foreignKey: "debt_head_id",
        as: "subordinates", // All users reporting to this user
      });
      User.hasMany(models.blacklisttoken, {
        foreignKey: 'user_id',
        as: 'blacklist_tokens',

      });
      User.hasMany(models.SiteVisitReport, {
        foreignKey: "user_id",
      });
      User.hasMany(models.CustomerCSVFile, {
      foreignKey: "client_id",
      as: "uploaded_csvs"
      });

      User.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });

    }
  }

  User.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.BIGINT,
        allowNull: true, 
      },
      unique_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone_no: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      debt_head_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      user_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role_id: {
        type: DataTypes.BIGINT,
        allowNull: true, // Primary key of role
      },
      organization_id: {
        type: DataTypes.BIGINT,
        allowNull: true, // Primary key of organization
      },
      profile_img: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      date_of_birth: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      device_token: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      device_type: {
        type: DataTypes.SMALLINT,
        allowNull: true,
      },
      address1: DataTypes.STRING(200),
      address2: DataTypes.STRING(200),
      address3: DataTypes.STRING(200),
      town: DataTypes.STRING(200),
      country: DataTypes.STRING(200),
      postal_code: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      status: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
      reset_password_token: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        comment: "Token for resetting password",
      },
      reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: "Expiry time for reset token",
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
      }
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    }
  );

  const encryptPasswordIfChanged = async (user) => {
    if (user.changed("password")) {
      user.password = await generateHash(user.password);
    }
  };


  User.beforeCreate(encryptPasswordIfChanged);
  User.beforeUpdate(encryptPasswordIfChanged);

  return User;
};
