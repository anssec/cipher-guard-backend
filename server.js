const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connectDB } = require("./config/database.js");
const Auth = require("./routes/auth.js");
const Note = require("./routes/note.js");
const passwdVault = require("./routes/passwordVault.js");
const features = require("./routes/features.js");
const admin = require("./routes/admin.js");
const Response = require("./utils/Response.js");
const PORT = process.env.PORT || 7000;
dotenv.config();
const app = express();
app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);
});
app.use(express.json());
app.use(cookieParser());
connectDB();
app.use(
  cors({
    origin: process.env.FRONTENDURL,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: "Content-Type,Authorization",
  })
);

//routes Import
app.get("/", (req, res) => {
  Response(res, true, "Api is Working", 200);
  
  return;
});
app.use("/api/auth", Auth);
app.use("/api/note", Note);
app.use("/api/passwordVault", passwdVault);
app.use("/api/features", features);
app.use("/api/admin", admin);

module.exports = app;
