// all requirements 
const userdata = require("../models/usermodel.js");
const crypto = require("crypto");
const { get_access_token, Give_user_info, getCookie, getTempCookie } = require("../services/service.js");
const strict = require("assert/strict");
const session_model = require("../models/session.model.js")
const sendEmail = require("../services/email.js")
const otp_model = require("../models/otp.js")
const { generate_OTp, generateEmailTemplate } = require("../utils/otp.js")

// giving functionalities 
// first oen to handle incoming data 
async function handleinputs(req, res) { //getting the info from the request s body 
  const { username, email, password } = req.body;

  // checking ifd they already exist 
  const checkForUser = await userdata.find({ $or: [{ email: email }] });
  if (checkForUser.length > 0) {
    console.log(checkForUser)
    res.json({ status: `user alraedy exists ` })
  }
  else {

    //getting the password , using bcrypt algo to convert password . now getting it in only hex format
    //bcrypt is a separate npm package providing musch stronger hashing 
    const hashed_password = crypto.createHash("sha512").update(password).digest("hex");

    //creating  user  in the database 
    const data = await userdata.create({
      username: username,
      email: email,
      password: hashed_password
    });

    //opt part generating opt , getting html and entrying data 
    const get_otp = generate_OTp();
    const hash_OTP = crypto.createHash("sha512").update(get_otp).digest("hex");
    const html = generateEmailTemplate(get_otp)
    const opt_data = await otp_model.create({
      email: email,
      user: data._id,
      OTP: hash_OTP,
    });

    const temp_cookie = getTempCookie(data);
    res.cookie("TempCookie", temp_cookie);
    await sendEmail(email, "OTP Verification", `your otp is ${get_otp}`, html);
    // showing the results 

    res.json({ status: `user ${username} has been created ;verified : ${data.verified}  ` });
  }
}

//this function would run on every action to take to authenticate
async function authorization_handler(req, res) {

  // checking the headers of teh request . it should have authorization . 
  // the reason for placing  ? is that if we dont have the authorization s data wer gonna have a crash 
  // this is just like a if condition . if there is something in the authorization then do this . just a if 
  // condition in short , splitting on the basis of space the authorization is like the following 
  // "Bearer dhqfhowifhowf....." ==> ["Bearer" , "dhqfhowifhowf......"]

  const data_from_header = req.headers.authorization?.split(" ")[1];

  //calling the function to verify token 

  const decoded = Give_user_info(data_from_header);

  // if token exists then following thing gets executed 
  console.log(decoded)
  if (decoded) {
    res.json({ status: `user ${decoded.username} has been verified with the token : \n ${data_from_header} and the result is ${decoded} ` });
  } else if (!decoded) {
    res.json({ status: `user not found!!` })
  }

}

//this will create new access & refresh token after the access expires
async function create_new_token(req, res) {

  //getting the older cookie 
  const refresh_token = req.cookies.RefreshToken;

  //if no older cookie
  if (!refresh_token) return res.status(401).json({ msg: "you are unauthorizied" })
  const hashed_cookie = crypto.createHash("sha512").update(refresh_token).digest("hex");
  const resfromDB = await session_model.findOne({
    RefreshTokenHash: hashed_cookie,
    revoked: false
  })
  if (!resfromDB) {
    return res.status.json({ status: "You got no specific refresh token " })
  }

  //if there is a cookie then fetch its data which is used to create more tokens 
  const decoded_data = Give_user_info(refresh_token);

  // creating the new refresh token 
  const new_refresh_token = getCookie(decoded_data);
  const newhashed = crypto.createHash("sha512").update(new_refresh_token).digest("hex");
  resfromDB.RefreshTokenHash = newhashed;
  await resfromDB.save();

  // now using the data from the cookie to create another access key 
  const new_access_token = get_access_token({ ...decoded_data, session_id: resfromDB._id });
  res.cookie("RefreshToken", new_refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  //sending the access key 
  res.status(200).json({ accesstoken: new_access_token });
  console.log(Give_user_info(new_access_token));

}

//this is logout from one device function
async function logout_function(req, res) {

  //getting the refresh token hash it then check that session having same hashed refresh token and is revoked false then => true
  const cookie_brow = req.cookies.RefreshToken;
  const hashed_cookie = crypto.createHash("sha512").update(cookie_brow).digest("hex");
  const resfromDB = await session_model.findOne({
    RefreshTokenHash: hashed_cookie,
    revoked: false
  });
  if (!resfromDB) {
    return res.status(401).json({ status: "no result in the session" })
  }
  resfromDB.revoked = true;
  await resfromDB.save();
  res.clearCookie("RefreshToken");
  res.status(200).json({ status: "Logout successfully !!" });
}

// this is function for logout from all devices 
async function logout_from_all(req, res) {
  // all those sessions for one specific user for all of them set revoked to true 
  const refresh_token = req.cookies.RefreshToken;
  const decoded = Give_user_info(refresh_token);
  await session_model.updateMany(decoded.id, {
    revoked: false
  }, {
    revoked: true
  });
  clearCookie("RefreshToken");
  res.status(200).json({ status: "Logout from all devices " })
}

// this is login function
async function login(req, res) {
  // getting email password checking if verified checking if password is true then generate refresh & access token 
  const { email, password } = req.body;
  const user = await userdata.findOne({ email: email }).lean();
  if (!user) {
    return res.status(401).json({ status: "No Such User !" });
  }
  if (!user.verified) {
    res.status(200).json({ status: ` you are not verified` })
  }
  const hashed_passwrod = crypto.createHash("sha512").update(password).digest("hex");
  if (user.password != hashed_passwrod) {
    return res.status(200).json({ status: "Invalid password" });
  }
  const refresh_token = getCookie(user);
  const hashed_cookie = crypto.createHash("sha512").update(refresh_token).digest("hex");
  const session_token = await session_model.create({
    user: user._id,
    ip: req.ip,
    RefreshTokenHash: hashed_cookie,
    userAgent: req.headers["user-agent"],
    revoked: false
  });
  console.log({ ...user });
  const new_access_token = get_access_token({ ...user, session_id: session_token._id });
  res.cookie("RefreshToken", refresh_token, {
    secure: true,
    sameSite: true,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.status(200).json({ status: `logged IN succesfully your access token is ${new_access_token}` })

}

//this function to aunthenticate the email then delete the OTPS then generate the access&refresh token 
async function validate_Otp(req, res) {
  const temp_token = req.cookies.TempCookie;
  const data = Give_user_info(temp_token);
  const { OTP } = req.body;
  const hashed_Otp = crypto.createHash("sha512").update(OTP).digest("hex");
  const data_from_otp = await otp_model.findOne({ OTP: hashed_Otp, user: data._id });
  if (!data_from_otp) {
    res.status(200).json({ status: `Either Email is wrong or OTP ` })
  }
  const verify_user = await userdata.findByIdAndUpdate(
    data._id, // first apply filter 
    { verified: true }, // set the verified to fale 
    { new: true } // return the corrected object 
  ).lean();
  await otp_model.deleteMany({ user: data._id })
  // now generating refresh token session_token and access token 
  const refresh_token = getCookie(verify_user);
  const hashed_cookie = crypto.createHash("sha512").update(refresh_token).digest("hex");
  const session_token = await session_model.create({
    user: verify_user._id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    RefreshTokenHash: hashed_cookie,
    revoked: false
  });
  const new_access_token = get_access_token({ ...verify_user, session_id: session_token._id });
  res.cookie("RefreshToken", refresh_token, {
    secure: true,
    sameSite: true,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.clearCookie("TempCookie");
  res.status(200).json({ status: `logged IN and verified succesfully succesfully your access token is ${new_access_token}` })


}
// exporting all the functionalities
module.exports = {
  authorization_handler,
  create_new_token,
  handleinputs,
  logout_function,
  logout_from_all,
  login,
  validate_Otp
}
