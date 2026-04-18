const express = require("express");
const logs_router = express.Router();
const { logout_function, logout_from_all, login, validate_Otp } = require("../controllers/control.js")
// "/auth/logout"
logs_router.get("/logout", logout_function);
// "/auth/logoutAll"
logs_router.get("/logoutAll", logout_from_all);
// "/auth/login"
logs_router.post("/login", login);
// "/auth/verifyOtp"
logs_router.post("/verifyOtp", validate_Otp)
module.exports = logs_router;
