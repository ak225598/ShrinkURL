const Url = require("../models/url");
const UAParser = require("ua-parser-js");

// Handles redirection from a short URL to its corresponding long URL
async function handleRedirectionToLongUrl(req, res) {
  try {
    const shortUrl = req.params.id;
    const url = await Url.findOne({ shortUrl });

    if (!url) {
      return res.status(400).json({ error: "Short URL not found" });
    }

    // Parse User-Agent to get device information
    const parser = new UAParser(req.headers["user-agent"]);
    const deviceInfo = parser.getResult();

    // Determine device type
    let deviceType;
    if (deviceInfo.device.type === "mobile") {
      deviceType = "mobileClicks";
    } else if (deviceInfo.device.type === "tablet") {
      deviceType = "tabletClicks";
    } else {
      deviceType = "desktopClicks";
    }

    // Increment the total clicks and the specific device type count
    await Url.findByIdAndUpdate(url._id, {
      $inc: {
        totalClicks: 1,
        [deviceType]: 1,
      },
    });

    // Ensure long URL has a protocol
    let redirectedUrl = url.longUrl;
    if (!/^https?:\/\//i.test(redirectedUrl)) {
      redirectedUrl = `http://${redirectedUrl}`;
    }

    // Redirect the user to the Long url
    res.redirect(redirectedUrl);
  } catch (error) {
    console.error("Error in handleRedirectionToLongUrl:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  handleRedirectionToLongUrl,
};
