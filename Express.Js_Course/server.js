const express = require("express");
const app = express();

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  console.log("Here in Terminal");
  /* res.send("Hii in the browser"); */
  /* res.status(500).send("Hi in browser and 500 status code in console"); */
  /* res.json({ message: "json" }); */
  /* res.download("server.js"); */
  res.render("index", { text: "World" });
});

app.listen(3000);
