const User = require("../../models/user.js");
const secureNotes = require("../../models/secureNotes.js");
const CryptoJS = require("crypto-js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");
exports.createNote = async (req, res) => {
  try {
    const { name, note, favorite, lockNote } = req.body;
    const vaultPin = req.vaultPin;
    const userEmail = req.user.email;
    if (!name) {
      Response(res, false, "enter note name", 422);
      return;
    } else if (!note) {
      Response(res, false, "note will not be empty", 422);
      return;
    }
    const verifyUser = req.user;
    const user = await User.findById(verifyUser.id);
    const createNote = async (name, note, encrypt) => {
      const newNote = await secureNotes.create({
        name: name,
        notes: note,
        favorite: favorite ? true : false,
        encrypt: encrypt,
        email: userEmail,
      });
      await User.findByIdAndUpdate(
        user._id,
        {
          $push: { secureNotes: newNote._id },
        },
        { new: true }
      );
    };
    if (lockNote === true) {
      const encryptNote = await CryptoJS.AES.encrypt(note, vaultPin).toString();
      await createNote(name, encryptNote, true);
      nodeCache.del("getAllNote");
      nodeCache.del("favoriteNotes");
      Response(res, true, "Note added successfully", 200);
      return;
    } else {
      await createNote(name, note, false);
      nodeCache.del("getAllNote");
      nodeCache.del("favoriteNotes");
      Response(res, true, "Note added successfully", 200);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
