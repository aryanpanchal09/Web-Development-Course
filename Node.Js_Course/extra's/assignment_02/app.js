const path = require('path');

const express = require('express');
const app = express();

const adminRoutes = require('./routes/admin');
const todoRoutes = require('./routes/todo');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', adminRoutes);
app.use('/users', todoRoutes);

app.listen(8000);
