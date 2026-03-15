const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./config/database.js");
const Auth = require("./routes/auth.js");
const Note = require("./routes/note.js");
const passwdVault = require("./routes/passwordVault.js");
const features = require("./routes/features.js");
const admin = require("./routes/admin.js");
const Response = require("./utils/Response.js");
const PORT = process.env.PORT || 7000;
const app = express();

// Security headers (disables X-Powered-By, adds HSTS, X-Content-Type-Options, etc.)
app.use(helmet());

// Rate limiting for auth routes — max 15 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
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
app.use("/api/auth", authLimiter, Auth);
app.use("/api/note", Note);
app.use("/api/passwordVault", passwdVault);
app.use("/api/features", authLimiter, features);
app.use("/api/admin", authLimiter, admin);

connectDB();
app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);
});

module.exports = app;
