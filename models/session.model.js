const mongoose = require("mongoose");
const { ref } = require("node:process");
const session_schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: [true, " user id required "]
  },
  RefreshTokenHash: {
    type: String,
    required: [true, "No refresh token here"],
  },
  ip: {
    type: String,
    required: [true, "no IP "],
  },
  userAgent: {
    type: String,
    required: [true, "no info about user decvice "] // gives the information about the user agent like chrome version 
  },
  revoked: {
    type: Boolean,
    default: false,
  }

}, { timestamps: true });

const session_model = mongoose.model("session", session_schema);
module.exports = session_model; 
