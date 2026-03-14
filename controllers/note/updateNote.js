const secureNotes = require("../../models/secureNotes.js");
const CryptoJS = require("crypto-js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");
exports.updateNote = async (req, res) => {
  try {
    const { name, note, favorite } = req.body;
    const vaultPin = req.vaultPin;
    const id = req.params.id;
    const updateNotes = {};
    if (name) {
      updateNotes.name = name;
    }
    if (note) {
      updateNotes.notes = await CryptoJS.AES.encrypt(note, vaultPin).toString();
    }
    if (favorite) {
      updateNotes.favorite = favorite;
    }
    try {
      await secureNotes.findByIdAndUpdate(id, updateNotes, {
        new: true,
      });
      nodeCache.del("getAllNote");
      nodeCache.del("favoriteNotes");
      Response(res, true, "Note updated successfully", 200);
      return;
    } catch (error) {
      Response(res, false, "Note not found", 404);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
