const path = require('path');

const express = require('express');

const bodyParser = require('body-parser');

const app = express();

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

/* app.use('/', (req, res, next) => {
  console.log('This always run!');
  next();
}); */

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use((req, res, next) => {
  /* res.status(404).send('<h1>Page not found</h1>'); */
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

/*
app.use('/add-product', (req, res, next) => {
   console.log('In another middleware'); 
  res.send(
    '<form action="/product" method="POST"><input type="text" name="title"><button type="submit">Add Product</button></form>'
  );
});

app.post('/product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});

*/

/* app.use('/product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
}); */

/* app.use('/', (req, res, next) => {
  /* console.log('In another middleware'); 
  res.send('<h1>Hello from express!</h1>');
}); */

app.listen(3000);
