const user = require("../../models/user.js");
const validator = require("validator");
const bcrypt = require("bcrypt");
require("dotenv").config();
const Jwt = require("jsonwebtoken");
const { mailSender } = require("../../utils/mailSender.js");
const Response = require("../../utils/Response.js");
const nodeCache  = require("../../utils/nodeCache.js");
const axios = require("axios");
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const url = "https://ipgeolocation.abstractapi.com/v1";
    const abstractApiKey = process.env.abstractapiKey;
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
    } else if (users.accountLock) {
      nodeCache.del("getLockUser");
      Response(
        res,
        false,
        "Your Accout is locked contact admin@devglimpse.com",
        423
      );
      return;
    }
    let isPasswordMatch = await bcrypt.compare(password, users.password);

    if (!isPasswordMatch) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Reset counter if the last attempt was more than 30 minutes ago
      if (
        users.wrongPasswdAttempt.lastAttemptTime &&
        users.wrongPasswdAttempt.lastAttemptTime < thirtyMinutesAgo
      ) {
        users.wrongPasswdAttempt.attempts = 0;
        users.wrongPasswdAttempt.lastAttemptTime = undefined;
        await users.save();
      }

      // Always increment attempt counter (was a dead-zone on first failure before)
      users.wrongPasswdAttempt.attempts += 1;
      users.wrongPasswdAttempt.lastAttemptTime = new Date();

      if (users.wrongPasswdAttempt.attempts >= 4) {
        users.accountLock = true;
        await users.save();
        nodeCache.del("getLockUser");
        Response(
          res,
          false,
          "Your account is locked. Contact support@cleverpentester.com",
          423
        );
        return;
      }

      await users.save();
      const remaining = 4 - users.wrongPasswdAttempt.attempts;
      Response(
        res,
        false,
        `Wrong password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        401
      );
      return;
    } else {
      users.wrongPasswdAttempt.attempts = 0;
      users.wrongPasswdAttempt.lastAttemptTime = undefined;
      await users.save();
      const ipAddress = (
        req.headers["cf-connecting-ip"] ||
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        ""
      ).split(",");
      const config = {
        method: "get",
        url: `${url}?api_key=${abstractApiKey}&ip_address=${ipAddress[0].trim()}`,
      };
      
      let responseData;
      await axios(config)
        .then((response) => {
          responseData = response.data;
          // console.log(responseData);
        })
        .catch((error) => {
          (responseData = {
            ip_address: "NA",
            city: "NA",
            region: "NA",
            country: "NA",
          }),
            console.error(error.message);
        });
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

    h2 {
      font-family: 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;
      font-weight: 500;
      font-size: 20px;
      color: #4f545c;
      letter-spacing: 0.27px;
    }

    p {
      font-size: 16px;
      line-height: 24px;
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

    a {
      text-decoration: none;
      color: #5865f2;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
</head>

<body>

  <div class="container">
    <h2>Hey ${users.firstName},</h2>
    <p>Someone tried to log into your CipherGuard account from a new location. If this is you, you can ignore this message. </p>
    <p><strong>Date:</strong> ${currentDate}<br>
    <p><strong>IP Address:</strong> ${responseData.ip_address}<br>
    <strong>Location:</strong> ${responseData.city}, ${responseData.region}, ${responseData.country}</p>
    <p class="alert">New Login Detected</p>
    <p>If this wasn’t you, please contact our support team. <strong>support@cleverpentester.com</strong>.</p>
    <div class="footer">
      <p>Best,<br><a href="https://cleverpentester.com" target="_blank">The CipherGuard team</a></p>
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + (12 * 60 * 60 * 1000)), // 12 hours
      };
      res
        .cookie("token", token, options)
        .status(200)
        .json({
          success: true,
          message: `Welcome back ${users.firstName}`,
          // Token intentionally not returned in body — lives in httpOnly cookie only
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
    // if (error.message === "Unexpected end of JSON input") {
    //   return NextResponse.json(
    //     { success: false, message: "Data can't be empty" },
    //     { status: 406 }
    //   );
    // }
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
