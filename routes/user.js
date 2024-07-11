const express = require("express");
const userControllers = require("../controllers/user");
const userRouter = express.Router();

userRouter.post("/signup", userControllers.handleSignUp);
userRouter.post("/login", userControllers.handleLogin);

module.exports = userRouter;
