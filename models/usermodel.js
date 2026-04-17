const mongoose = require("mongoose");
const { type } = require("node:os");
// creating the schema 
const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "You should give name "],
  },
  email: {
    type: String,
    required: [true, "You should give the email "],
    unique: [true, "the email must be unique"],
  },
  password: {
    type: String,
    required: [true, "give password"],
    unique: [true, "The password must be unique "]
  },
  verified: {
    type: Boolean,
    default: false
  },
});
const user_model = mongoose.model("Users", userschema);
module.exports = user_model;
