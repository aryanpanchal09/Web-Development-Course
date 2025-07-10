const path = require('path');

const express = require('express');

const mainRoutes = require('./routes/index');

const app = express();

app.use(mainRoutes);

app.use(express.static(path.join(__dirname, 'public')));

/* app.use('/', (req, res, next) => {
  console.log('return something');
  next();
});

app.use('/users', (req, res, next) => {
  console.log('return something again');
  res.send('<h1>So this will write something on webpage</h1>');
});
 */
app.listen(3000);
