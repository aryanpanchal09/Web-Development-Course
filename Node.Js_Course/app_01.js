/* const http = require('http'); */

/* const routes = require('./routes'); */

const express = require('express');

const app = express();

app.use('/', (req, res, next) => {
  console.log('In the terminal this always run');
  next();
});

app.use('/add-product', (req, res, next) => {
  console.log('In middleware!');
  res.send('<h1>The "Add Product" Page</h1>');
  /*  next(); */
});

app.use('/', (req, res, next) => {
  console.log('In middleware 01!');
  res.send('<h1>Hello from Express!</h1>');
});

/* console.log(routes.someText); */

/* function rqListener(req, res) {}
http.creaseServer(); */

/* Alternative way to write the code that way 
const server = http.createServer((req, res) => {
  /*   const url = req.url;
  const method = req.method; 
});*/

/* const server = http.createServer(routes.handler); */

/* const server = http.createServer(app);

server.listen(3000); */

app.listen(3000);
