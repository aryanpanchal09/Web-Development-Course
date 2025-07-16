const Sequelize = require('sequelize');

const sequelize = new Sequelize('new_db', 'root', '@Aaryan03tech', {
  dialect: 'mysql',
  host: 'localhost',
});

module.exports = sequelize;
