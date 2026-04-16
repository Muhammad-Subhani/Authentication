// requiring jsonwebtoken 
const JWT = require("jsonwebtoken");
// getting teh secret key from the .env file 
const { JWT_SECRET } = require("../server.js");
// this will generate a cookie 
function get_access_token(obj) {
  return JWT.sign({
    id: obj._id,
    username: obj.username,
    email: obj.email,
    session_id: obj.session_id,
  }, JWT_SECRET, {
    expiresIn: "15m",
  });
}
// function to validate user from the cookie 
function Give_user_info(token) {
  try {
    return JWT.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
function getCookie(obj) {
  return JWT.sign({
    id: obj._id,
    username: obj.username,
    email: obj.email,
  }, JWT_SECRET, {
    expiresIn: "7d"
  });
}
//exporting the functions 
module.exports = {
  get_access_token,
  Give_user_info,
  getCookie,
}
