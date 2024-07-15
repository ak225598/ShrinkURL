const jwt = require("jsonwebtoken");

// Middleware function to authenticate user
const userAuth = async (req, res, next) => {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;

    // Check if the request has a cookie header
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(400).json({ error: "Please log in to continue" });
    }

    // Extract token from cookie
    const token = cookie.split("=")[1];

    // Verify the token using the secret key
    const isValidToken = jwt.verify(token, secretKey);
    if (!isValidToken) {
      return res.status(400).json({ error: "Invalid token" });
    }
    res.locals.UserId = isValidToken.id;
    next();
  } catch (error) {
    console.error("Error in user auth:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  userAuth,
};
