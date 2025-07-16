if (process.version != 'v22.13.1') {
    throw new Error(`Required Node js version is 22.13.1`);
}
require("dotenv").config();
const express = require("express");
require("./utils/responseFunction")(express);

const app = express();
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");

const { Server } = require("socket.io");
const { setSocketIO } = require("./utils/socket");
const { config } = require("./config/generals.js");
const { verifyAuthToken } = require("./middlewares/auth.js");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/hello", (req, res) => {
  res.send("Hello welcome to All Utility Collection (AUC)");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // actual domain
    methods: ["GET", "POST"]
  },
});
// JWT Auth for Socket.IO
setSocketIO(io);
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Token missing"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user to socket
    next();
  } catch (error) {
    return next(new Error("Invalid token"));
  }
});
// On Socket.IO client connection
io.on("connection", (socket) => {
  console.log(" Socket connected:", socket.user);

  // If admin, join the "admin" room
  if (socket.user.role === "admin") {
    socket.join("admin");
    console.log("Admin joined room: admin");
  }

  socket.on("disconnect", () => {
    console.log(" Socket disconnected:", socket.user?.id);
  });
});

app.use("/auth", require("./routes/auth"));
app.use(verifyAuthToken);
app.use("/users", require("./routes/users"));
app.use("/roles", require("./routes/roles"));
app.use("/customers", require("./routes/customers"));
app.use("/countries", require("./routes/countries"));
app.use("/client", require("./routes/client"));
app.use("/transactions", require("./routes/transaction"));
app.use("/dispositions", require("./routes/dispositions"));
app.use("/email-templates",require("./routes/emailTemplates.js"))
app.use("/dashboard",require("./routes/dashboard.js"))
app.use("/rules-allocation", require("./routes/rulesAllocation"));
app.use("/comments",require("./routes/usercomment.js"))

server.listen(config.port, () => {
  console.log(`App is listening on ${config.port}`);
});
