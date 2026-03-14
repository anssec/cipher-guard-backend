const bcrypt = require("bcrypt");
const validator = require("validator");
const { mailSender } = require("../../../utils/mailSender.js");
const otpGenerator = require("otp-generator");
const Jwt = require("jsonwebtoken");
const otp = require("../../../models/otp.js");
const Response = require("../../../utils/Response.js");
exports.sendOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, confirmPassword, password } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    //check input validation is in correct format
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Response(res, false, "Please fill in all required fields.", 422);
      return;
    } else if (!validator.isAlpha(firstName, "en-US", { ignore: " " })) {
      // Use isAlpha from the validator library to check if the name contains only alphabets
      Response(res, false, "first name should only contain alphabets.", 422);
      return;
    } else if (!validator.isAlpha(lastName, "en-US", { ignore: " " })) {
      // Use isAlpha from the validator library to check if the name contains only alphabets
      Response(res, false, "last name should only contain alphabets.", 422);
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
      return;
    } else if (confirmPassword !== password) {
      Response(res, false, "Password and Confirm Password is not equal.", 422);
      return;
    } else if (!validator.isEmail(email)) {
      Response(res, false, "Enter valid email id.", 422);
      return;
    }
    //add hashing to input password
    const hashPassword = await bcrypt.hash(password, 10);

    //generate 8 digit otp
    const OTP = otpGenerator.generate(8, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    //create generated otp in OTP schema
    await otp.create({
      email,
      otp: OTP,
    });

    //payload for jsonwebtoken
    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashPassword,
    };
    const data = Jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    //send otp via mail
    await mailSender(
      email,
      "Verify Your Email",
      `
      <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
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

    .otp {
      display: inline-block;
      padding: 8px 16px;
      font-size: 18px;
      font-weight: bold;
      background-color: #1a82e2;
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
    <h1>Email Verification</h1>
    <p>Thank you for signing up with CipherGuard. To complete your registration, please use the following One-Time Password (OTP):</p>
    <p class="otp">${OTP}</p>
    <p>This OTP is valid for 15 minutes. Do not share it with anyone for security reasons.</p>
    <p>If you did not sign up for CipherGuard, please ignore this email.</p>
    <div class="footer">
      <p>Best,<br><a href="https://cleverpentester.com" target="_blank">The CipherGuard team</a></p>
    </div>
  </div>

</body>

</html>

      `
    );
    //set user details to cookies
    const options = {
      httpOnly: true,
      expires: new Date(Date.now() + 30 * 60 * 1000),
    };
    return res.cookie("data", data, options).status(200).json({
      success: true,
      message: "otp send successfully",
      data: data,
    });
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
