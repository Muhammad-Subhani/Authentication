const express = require("express");
// creating the router 
const router = express.Router();
// getting all the functions
const { handleinputs, authorization_handler, create_new_token } = require("../controllers/control.js")
// requests
// here the exact path is /api/auth/register
router.post("/register", handleinputs);
router.get("/get_me", authorization_handler)
router.get("/refreshtoken", create_new_token)
// exporting the router 

module.exports = router;

