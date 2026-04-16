const express = require("express");
const logs_router = express.Router();
const { logout_function, logout_from_all, login } = require("../controllers/control.js")
// "/auth/logout"
logs_router.get("/logout", logout_function);
logs_router.get("/logoutAll", logout_from_all);
logs_router.post("/login", login);
module.exports = logs_router;
