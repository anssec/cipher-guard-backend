const User = require("../../models/user.js");
const Response = require("../../utils/Response.js");
const { mailSender } = require("../../utils/mailSender.js");

exports.unBlockUser = async (req, res) => {
  try {
    const { id, unblock } = req.body;
    if (!id) {
      Response(res, false, "User ID is required", 422);
      return;
    }
    if (unblock === false) {
      const findBlockUserAndUnBlock = await User.findByIdAndUpdate(
        id,
        {
          wrongPasswdAttempt: { attempts: 0, lastAttemptTime: undefined },
          accountLock: unblock,
        },
        { new: true }
      );
      if (!findBlockUserAndUnBlock) {
        Response(res, false, "User not found", 404);
        return;
      }
      await mailSender(
        findBlockUserAndUnBlock.email,
        "Account Status",
        `
      <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Unblocked</title>
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

    .footer {
      border-top: 2px solid #ccc;
      padding-top: 20px;
      margin-top: 20px;
    }

    .footer p {
      margin: 0;
    }

    .footer a {
      color: #3498db;
      text-decoration: none;
    }
  </style>
</head>

<body>

  <div class="container">
    <h1>Account Unblocked</h1>
    <p>Dear ${findBlockUserAndUnBlock.firstName},</p>

    <p>We are pleased to inform you that your account has been successfully unblocked. You can now access your account
      and enjoy our services without any restrictions.</p>

    <p>If you have any questions or concerns, please feel free to contact our support team.</p>

    <div class="footer">
      <p>Best,<br><a href="https://devglimpse.com" target="_blank">The CipherGuard team</a></p>
    </div>
  </div>

</body>

</html>

      `
      );
      Response(
        res,
        true,
        `User unblock ${findBlockUserAndUnBlock.firstName}`,
        200
      );
      return;
    } else {
      Response(res, false, "Invalid unblock value", 422);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
