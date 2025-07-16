'use strict';
const { config } = require('../generals.js');

const dbConfig = {
  development: {
    username: config.pguser,
    password: config.pgpassword,
    database: config.pgdatabase,
    host: config.pghost,
    dialect: config.pgdialect,
    dialectOptions: {
      bigNumberStrings: true,
      /*       ssl: {
        require: true,
        rejectUnauthorized: false
      } */
    },
  },
};

module.exports = dbConfig;
