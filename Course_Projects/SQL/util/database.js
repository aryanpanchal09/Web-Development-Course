const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'new_db',
  password: '@Aaryan03tech',
});

module.exports = pool.promise();
