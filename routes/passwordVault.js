const express = require("express");
const {
  createPasswd,
} = require("../controllers/passwordVault/createPasswd.js");
const {
  generatePasswd,
} = require("../controllers/passwordVault/generatePasswd.js");
const { auth, isAuthUser, verifyAuthPin } = require("../middleware/auth.js");
const {
  generateUsername,
} = require("../controllers/passwordVault/generateUsername.js");
const {
  deleteSavedPasswd,
} = require("../controllers/passwordVault/deleteSavedPasswd.js");
const {
  getSavedPasswd,
} = require("../controllers/passwordVault/getSavedPasswd.js");
const {
  updateSavedPasswd,
} = require("../controllers/passwordVault/updateSavedPasswd.js");
const {
  decodePasswd,
} = require("../controllers/passwordVault/decodeSelectedPasswd.js");
const router = express.Router();

router.post("/createPasswd", auth, isAuthUser, verifyAuthPin, createPasswd);
router.post("/generatePasswd", auth, isAuthUser, generatePasswd);
router.post("/generateUsername", auth, isAuthUser, generateUsername);
router.post(
  "/deletePasswd/:id",
  auth,
  isAuthUser,
  verifyAuthPin,
  deleteSavedPasswd
);
router.put(
  "/updateSavedPasswd/:id",
  auth,
  isAuthUser,
  verifyAuthPin,
  updateSavedPasswd
);

router.post("/getAllPasswd", auth, isAuthUser, verifyAuthPin, getSavedPasswd);
router.post("/decodePasswd", auth, isAuthUser, verifyAuthPin, decodePasswd);
module.exports = router;
