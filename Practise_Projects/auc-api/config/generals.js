"use strict";

require("dotenv").config();

module.exports.config = {
  jwtSecret: process.env.JWT_SECRET,

  port: process.env.PORT || 3000,

  pghost: process.env.PGHOST,
  pgport: process.env.PGPORT || 5432,
  pgdatabase: process.env.PGDATABASE,
  pguser: process.env.PGUSER,
  pgpassword: process.env.PGPASSWORD,
  pgdialect: process.env.DIALECT,

  awsAccessKey: process.env.AWS_ACCESS_KEY,
  awsSecretKey: process.env.AWS_SECRET_KEY,
  awsClientId: process.env.AWS_CLIENT_ID,
  awsPoolId: process.env.AWS_POOL_ID,
  awsRegion: process.env.AWS_REGION,

  secretKey16Byte: process.env.SECRET_KEY_16_BYTE,
  secretKey32Byte: process.env.SECRET_KEY_32_BYTE,

  saltRounds: process.env.SALT_ROUNDS,

  userRole: {
    User: 0,
    Admin: 1
  }
};
