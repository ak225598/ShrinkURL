const express = require("express");
const urlController = require("../controllers/url");
const urlRouter = express.Router();

urlRouter.post("/", urlController.handleCreateShortUrl);
urlRouter.get("/", urlController.handleGetAllLinks);
urlRouter.delete("/:id", urlController.handleDeleteShortLink);
urlRouter.put("/:id", urlController.handleEditLink);

module.exports = urlRouter;
