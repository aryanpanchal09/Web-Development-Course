const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(logger);

app.get('/', (req, res) => {
  console.log('Here in Terminal');
  /* res.send("Hii in the browser"); */
  /* res.status(500).send("Hi in browser and 500 status code in console"); */
  /* res.json({ message: "json" }); */
  /* res.download("server.js"); */
  res.render('index', { text01: 'World' });
});

const userRouter = require('./routes/users.js');

app.use('/users', userRouter);

function logger(req, res, next) {
  console.log(req.originalUrl);
  next();
}

/* app.get('/users', (req, res) => {
  console.log('Users');
  res.send('User List');
});

app.get('/users/new', (req, res) => {
  res.send('Users New Form');
}); */

app.listen(3000);
