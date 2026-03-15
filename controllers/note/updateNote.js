const secureNotes = require("../../models/secureNotes.js");
const User = require("../../models/user.js");
const CryptoJS = require("crypto-js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");
exports.updateNote = async (req, res) => {
  try {
    const { name, note, favorite } = req.body;
    const vaultPin = req.vaultPin;
    const id = req.params.id;
    // BOLA check: verify the note belongs to this user
    const user = await User.findById(req.user.id);
    if (!user.secureNotes.some((noteId) => noteId.toString() === id)) {
      Response(res, false, "Not authorized to update this note", 403);
      return;
    }
    const existingNote = await secureNotes.findById(id);
    if (!existingNote) {
      Response(res, false, "Note not found", 404);
      return;
    }
    const updateNotes = {};
    if (name) {
      updateNotes.name = name;
    }
    if (note) {
      if (existingNote.encrypt) {
        updateNotes.notes = CryptoJS.AES.encrypt(note, vaultPin).toString();
      } else {
        updateNotes.notes = note;
      }
    }
    if (favorite === true || favorite === false) {
      updateNotes.favorite = favorite;
    }
    try {
      await secureNotes.findByIdAndUpdate(id, updateNotes, {
        new: true,
      });
      const userId = req.user.id;
      nodeCache.del(`getAllNote_${userId}`);
      nodeCache.del(`favoriteNotes_${userId}`);
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
