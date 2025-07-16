const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', (req, res, next) => {
  /* console.log('In another middleware'); */

  res.sendFile(path.join(/* __dirname */ rootDir, 'views', 'add-product.html'));
  /* '<form action="/admin/product" method="POST"><input type="text" name="title"><button type="submit">Add Product</button></form>' */
});

// /admin/add-product => POST
router.post('/add-product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});

module.exports = router;
