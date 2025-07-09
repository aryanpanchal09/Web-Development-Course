const http = require("http");

const routes = require("./routes");

/* function rqListener(req, res) {}
http.creaseServer(); */

/* Alternative way to write the code that way */
const server = http.createServer((req, res) => {
  /*   const url = req.url;
  const method = req.method; */
});

server.listen(3000);
