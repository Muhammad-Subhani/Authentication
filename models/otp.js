const mongoose = require("mongoose");
const { type } = require("node:os");
const Otp_Schema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Needed an email"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: [true, "needed the user "],
  },
  OTP: {
    type: String,
    required: [true, " needed an OTP "]
  }
}, { timestamps: true })
const Otp_model = mongoose.model("OTP", Otp_Schema);
module.exports = Otp_model;
