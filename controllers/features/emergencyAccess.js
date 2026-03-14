const Response = require("../../utils/Response.js");
const User = require("../../models/user.js");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { mailSender } = require("../../utils/mailSender.js");
const Jwt = require("jsonwebtoken");

exports.addEmergencyAccess = async (req, res) => {
  try {
    const verifyToken = req.user;
    const { email, confirmPassword, password } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!validator.isEmail(email)) {
      Response(res, false, "Enter valid email id.", 422);
      return;
    } else if (confirmPassword.length < 8) {
      Response(res, false, "Password is too short. minimum length is 8.", 422);
      return;
    } else if (!passwordRegex.test(password)) {
      Response(
        res,
        false,
        "Password must contain at least one lowercase letter, one uppercase letter, and one special symbol.",
        422
      );
    }
    const hashPassword = await bcrypt.hash(password, 10);
    try {
      await User.findByIdAndUpdate(
        verifyToken.id,
        { emergencyMail: email, emergencyAccessPasswd: hashPassword },
        { new: true }
      );
      Response(res, true, "Emergency Access added successfully", 200);
      return;
    } catch (error) {
      Response(res, false, "Emergency Email is already registered", 422);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};

exports.emergencyLogin = async (req, res) => {
  try {
    const { emergencyMail, password } = req.body;
    if (!emergencyMail || !password) {
      Response(res, false, "Enter all fields", 422);
      return;
    }
    if (!validator.isEmail(emergencyMail)) {
      Response(res, false, "Enter valid email id.", 422);
      return;
    }
    const users = await User.findOne({ emergencyAccess: emergencyMail });
    if (!users) {
      Response(res, false, "Emergency email not found.", 404);
      return;
    } else if (users.accountLock) {
      Response(
        res,
        false,
        "Your Accout is locked contact admin@devglimpse.com",
        423
      );
      return;
    }
    const isPasswordMatch = await bcrypt.compare(
      password,
      users.emergencyAccessPasswd
    );

    if (!isPasswordMatch) {
      // Check if lastAttemptTime is older than the current time
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (users.wrongPasswdAttempt.lastAttemptTime < thirtyMinutesAgo) {
        // Reset attempts to 0 and set lastAttemptTime to undefined
        users.wrongPasswdAttempt.attempts = 0;
        users.wrongPasswdAttempt.lastAttemptTime = undefined;
        await users.save();
      }
      if (
        users.wrongPasswdAttempt.attempts === 4 &&
        users.wrongPasswdAttempt.lastAttemptTime
      ) {
        users.accountLock = true;
        await users.save();
        Response(
          res,
          false,
          "Your Accout is locked contact admin@devglimpse.com",
          423
        );
        return;
      } else if (users.wrongPasswdAttempt.lastAttemptTime) {
        users.wrongPasswdAttempt.attempts += 1;
        await users.save();
        Response(
          res,
          false,
          `wrong password you left ${users.wrongPasswdAttempt.attempts} out of 4`,
          401
        );
        return;
      }
    } else {
      users.wrongPasswdAttempt.attempts *= 0;
      users.wrongPasswdAttempt.lastAttemptTime = undefined;
      await users.save();
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
        "Login from new device",
        `
        <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Alert</title>
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
    <h1>Login Alert</h1>
    <p>Dear ${users.firstName},</p>
    <p>We noticed a login to your account from a new device on ${currentDate}. If this was you, you can ignore this
      message. If you didn't log in, please take immediate action to secure your account.</p>
    <p class="alert">New Login Detected</p>
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
      users.token = token;
      await users.save();
      const options = {
        httpOnly: true,
        expires: new Date(Date.now() + 4 + 24 * 60 * 60 * 1000),
      };
      res
        .cookie("token", token, options)
        .status(200)
        .json({
          success: true,
          message: `Welcome back ${users.firstName}`,
          data: token,
        });
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
