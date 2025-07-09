const express = require('express');
const app = express();

app.use('/', (req, res, next) => {
  console.log('return something');
  next();
});

app.use('/users', (req, res, next) => {
  console.log('return something again');
  res.send('<h1>So this will write something on webpage</h1>');
});

app.listen(8000);
