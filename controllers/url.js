const Url = require("../models/url");
const generateUrlEndpoint = require("../helpers/generateUrlEndpoint");

// Handle creation of a short URL
async function handleCreateShortUrl(req, res) {
  try {
    const { longUrl } = req.body;
    const userId = res.locals.UserId;
    console.log(userId);

    // Input validation
    if (!longUrl) {
      return res.status(400).json({ error: "Long URL is required" });
    }

    // Generate unique short URL
    let shortUrl;
    let existingUrl;
    do {
      shortUrl = generateUrlEndpoint();
      existingUrl = await Url.findOne({ shortUrl });
    } while (existingUrl);

    // Ensure URL has a protocol
    let fullLongUrl = longUrl;
    if (!/^https?:\/\//i.test(fullLongUrl)) {
      fullLongUrl = `http://${longUrl}`;
    }

    // Create new URL entry in database
    await Url.create({
      shortUrl: shortUrl,
      longUrl: fullLongUrl,
      createdBy: userId,
    });

    // Return Success message
    return res.status(201).json({
      message: "Short URL created successfully",
      shortUrl: shortUrl,
    });
  } catch (error) {
    console.error("Error in handleCreateShortUrl:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Handle deletion of a short URL
async function handleDeleteShortLink(req, res) {
  try {
    const shortUrl = req.params.id;

    // Get user ID from res.locals
    const userId = res.locals.UserId;

    // Find the URL document in the database
    const urlDocument = await Url.findOne({ shortUrl });

    // Check if the URL exists
    if (!urlDocument) {
      return res.status(400).json({ error: "Short URL not found" });
    }

    // Check if the current user is the creator of the URL
    const urlCreatorId = urlDocument.createdBy.toString();
    if (urlCreatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this URL" });
    }

    // Delete the URL document
    await Url.findByIdAndDelete(urlDocument._id);

    // Send success response
    return res.status(200).json({ message: "Short URL deleted successfully" });
  } catch (error) {
    console.error("Error in handleDeleteShortLink:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get all URLs created by the logged-in user
async function handleGetAllLinks(req, res) {
  try {
    const userId = res.locals.UserId;

    // Find all URLs created by the user
    const userUrls = await Url.find({ createdBy: userId });

    // Check if any URLs were found
    if (userUrls.length === 0) {
      return res.status(204).json({ message: "No URLs found for this user" });
    }

    // Send the found URLs as a response
    return res.status(200).json({
      message: "URLs retrieved successfully",
      urls: userUrls,
    });
  } catch (error) {
    console.error("Error in handleGetAllLinks:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Handle editing of a longUrl for an existing short URL
async function handleEditLink(req, res) {
  try {
    const shortUrl = req.params.id;

    // Extract new long URL from request body
    const { newLongUrl } = req.body;

    // Validate input
    if (!newLongUrl) {
      return res.status(400).json({ error: "New long URL is required" });
    }

    // Ensure URL has a protocol
    let updatedLongUrl = newLongUrl;
    if (!/^https?:\/\//i.test(updatedLongUrl)) {
      updatedLongUrl = `http://${newLongUrl}`;
    }

    const userId = res.locals.UserId;

    // Find the URL document in the database
    const urlDocument = await Url.findOne({ shortUrl });

    // Check if the URL exists
    if (!urlDocument) {
      return res.status(400).json({ error: "Short URL not found" });
    }

    const urlCreatorId = urlDocument.createdBy.toString();

    // Check if the current user is the creator of the URL
    if (urlCreatorId !== userId) {
      return res
        .status(400)
        .json({ error: "Not authorized to update this URL" });
    }

    // Update the URL document
    await Url.findByIdAndUpdate(urlDocument.id, { longUrl: updatedLongUrl });

    // Send success response
    return res.status(200).json({ message: "URL updated successfully" });
  } catch (error) {
    console.error("Error in handleEditLink:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  handleCreateShortUrl,
  handleDeleteShortLink,
  handleGetAllLinks,
  handleEditLink,
};
