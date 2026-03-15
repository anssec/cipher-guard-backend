const user = require("../../models/user.js");
const validator = require("validator");
const bcrypt = require("bcrypt");
const Jwt = require("jsonwebtoken");
const { mailSender } = require("../../utils/mailSender.js");
const Response = require("../../utils/Response.js");
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      Response(res, false, "Enter all fields", 422);
      return;
    }
    if (!validator.isEmail(email)) {
      Response(res, false, "Enter valid email id.", 422);
      return;
    }
    const users = await user.findOne({ email: email }).select("+password");
    if (!users) {
      Response(res, false, "user not found. Please register first", 404);
      return;
    } else if (users.role != "admin") {
      Response(res, false, "Login is restricted to administrators only", 405);
      return;
    }
    let isPasswordMatch = await bcrypt.compare(password, users.password);
    if (!isPasswordMatch) {
      Response(res, false, "Enter correct Password", 404);
      return;
    } else {
      const currentDate = new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
      await mailSender(
        users.email,
        "Login Alert",
        `
              <!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login from new device</title>
        <style>
          /* Add your styles here */
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
      
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
      
          h1 {
            color: #262626;
          }
      
          p {
            font-size: 16px;
            line-height: 1.5;
            color: #262626;
          }
      
          .alert {
            display: inline-block;
            padding: 8px 16px;
            font-size: 18px;
            font-weight: bold;
            background-color: #e74c3c;
            color: #fff;
            border-radius: 4px;
          }
      
          .footer {
            border-top: 2px solid #ccc;
            padding-top: 20px;
            margin-top: 20px;
          }
        </style>
      </head>
      
      <body>
      
        <div class="container">
          <h1>Login from new device</h1>
          <p>Dear ${users.firstName},</p>
      
          <p>We noticed a login to your account from a new device on ${currentDate}.</p>
          <p class="alert">New Login Detected</p>
          <p>If this was you, you can ignore this message. If you didn't log in, please take immediate action to secure your account.</p>
          <p>If you have any concerns or need assistance, please contact our support team.</p>
          <div class="footer">
            <p>Best,<br><a href="https://devglimpse.com" target="_blank">The CipherGuard team</a></p>
          </div>
        </div>
      
      </body>
      
      </html>
      
              `
      );
      const payload = {
        email: users.email,
        id: users._id,
        role: users.role,
      };
      const token = Jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "6h",
      });
      const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      res
        .cookie("token", token, options)
        .status(200)
        .json({
          success: true,
          message: `Welcome back ${users.firstName}`,
          data: token,
          profile: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImg: users.profileImg,
          },
        });
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
