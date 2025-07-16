const path = require('path');
const express = require('express');

const rootDir = require('../util/path');

const router = express.Router();

router.get('/', (req, res, next) => {
  /* console.log('In another middleware'); */
  /* res.send('<h1>Hello from express!</h1>'); */
  /* res.sendFile('/views/shop.html'); -> will not work as it requires absolute path */
  res.sendFile(
    path.join(rootDir, 'views', 'shop.html')
  ); /* it detects the operating system  */
});

module.exports = router;
