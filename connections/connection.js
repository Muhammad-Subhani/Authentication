
const mongoose = require("mongoose");
const { connect } = require("node:http2");
async function connect_to_DB(path)
    {
  return  mongoose.connect(path);
}
 module.exports = {
    connect_to_DB,
}

