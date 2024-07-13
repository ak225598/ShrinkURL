const express = require("express");
const userController = require("../controllers/user");
const userRouter = express.Router();

// Authentication routes
userRouter.post("/signup", userController.handleUserSignUp);
userRouter.post("/login", userController.handleUserLogin);
userRouter.post("/logout", userController.handleUserLogout);

// User operations routes
userRouter.get("/", userController.handleGetUserDetails);
userRouter.post("/verify-email", userController.handleUserEmailVerification);

// Password management routes
userRouter.post("/request-password-reset", userController.handleRequestPasswordReset);
userRouter.post("/change-password", userController.handleChangePassword);

module.exports = userRouter;
