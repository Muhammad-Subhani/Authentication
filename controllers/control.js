const userdata = require("../models/usermodel.js");
const crypto = require("crypto");
const { get_access_token, Give_user_info, getCookie } = require("../services/service.js");
const strict = require("assert/strict");
const session_model = require("../models/session.model.js")
// giving functionalities 
// first oen to handle incoming data 

async function handleinputs(req, res) { //getting the info from the request s body 
  const { username, email, password } = req.body;

  // checking ifd they already exist 

  const checkForUser = await userdata.find({ $or: [{ username: username, email: email, password: password }] });

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


    // getting the refresh token 

    const Refresh_token_Cookie = getCookie(data);

    const RefreshToken_Hashed = crypto.createHash("sha512").update(Refresh_token_Cookie).digest("hex");
    // entry in session model 

    const session_entry = await session_model.create({
      user: data._id,
      RefreshTokenHash: RefreshToken_Hashed,
      userAgent: req.headers["user-agent"],
      ip: req.ip
    })
    //getting the access token 

    const Access_token = get_access_token({ ...data, session_id: session_entry._id });

    // seding the response 

    res.cookie("RefreshToken", Refresh_token_Cookie, {
      httpOnly: true,// this will not allow Js on client side to access the cookie  
      secure: true, // only HTTPS is used to parse the cookie not sent in plain text 
      sameSite: "strict", // only cookie is accessible when the request is from the relative server 
      maxAge: 7 * 24 * 60 * 60 * 1000  // maxAge demands time in milliseconds
    })

    // showing the results 

    res.json({ status: `user ${username} has been created ! and the token is ${Access_token}` });
  }
}




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

async function logout_function(req, res) {
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
async function logout_from_all(req, res) {
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

async function login(req, res) {

  const { email, password } = req.body;
  const user = await userdata.findOne({ email: email }).lean();
  if (!user) {
    return res.status(401).json({ status: "No Such User !" });
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
// exporting all the functionalities
module.exports = {
  authorization_handler,
  create_new_token,
  handleinputs,
  logout_function,
  logout_from_all,
  login,
}
