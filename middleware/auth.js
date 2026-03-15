const jwt = require("jsonwebtoken");
const Response = require("../utils/Response.js");
require("dotenv").config();
const CryptoJS = require("crypto-js");
//auth
exports.auth = async (req, res, next) => {
  try {
    //extract token
    const token0 = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");
    // console.log(token0)
    if (!token0) {
      Response(res, false, "Token Is missing", 401);
      return;
    }

    //verify the token
    try {
      const decode = jwt.verify(token0, process.env.JWT_SECRET);
      req.user = decode;
    } catch (error) {
      console.log(error);
      if (error.message == "jwt expired") {
        Response(res, false, "session expired, Login again", 404);
        return;
      }
      Response(res, false, "Token Is Invalid", 404);
      return;
    }
    next();
  } catch (error) {
    console.log(error.message);
    Response(
      res,
      false,
      "Something went wrong while validating the token",
      401
    );
    return;
  }
};
//isAuthUser
exports.isAuthUser = async (req, res, next) => {
  try {
    //extract token
    const user = req.user;
    if (user.role !== "user") {
      Response(res, false, "only user access this route", 401);
      return;
    }

    next();
  } catch (error) {
    console.log(error.message);
    Response(
      res,
      false,
      "Something went wrong while validating the token",
      401
    );
    return;
  }
};
//verify Auth Pin
exports.verifyAuthPin = async (req, res, next) => {
  try {
    const vaultAuth = req.header("Authorization")?.replace("Bearer ", "");
    const decode = CryptoJS.AES.decrypt(
      vaultAuth,
      process.env.SECUREPIN
    ).toString(CryptoJS.enc.Utf8);
    req.vaultPin = decode;
    next();
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Enter Vault Pin", 401);
    return;
  }
};
//isAuthAdmin
exports.isAuthAdmin = async (req, res, next) => {
  try {
    //extract token
    const user = req.user;
    if (user.role !== "admin") {
      Response(res, false, "only Admin access this route", 401);
      return;
    }

    next();
  } catch (error) {
    console.log(error.message);
    Response(
      res,
      false,
      "Something went wrong while validating the token",
      401
    );
    return;
  }
};
