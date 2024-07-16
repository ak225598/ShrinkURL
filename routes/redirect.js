const express = require("express");
const redirectController = require("../controllers/redirect");
const redirectRouter = express.Router();

redirectRouter.get("/:id", redirectController.handleRedirectionToLongUrl);

module.exports = redirectRouter;
