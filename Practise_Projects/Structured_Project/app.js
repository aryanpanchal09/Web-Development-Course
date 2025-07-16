const express = require('express');
const { sequelize, User } = require('./models');
const app = express();

app.use(express.json());

app.post('/users', async (req, res) => {
  const { name, email, role } = req.body;
  // console.log();
  try {
    const user = await User.create({ name, email, role });
    return res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

app.listen({ port: 5000 }, async () => {
  console.log('Server running on port 5000');
  await sequelize.authenticate;
  console.log('Database Synced!');
});

/* async function main() {
  await sequelize.sync({ force: true });
} 
main();*/
