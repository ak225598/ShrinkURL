const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const sendEmail = require("../helpers/mailer");
dotenv.config();

// Function to handle user sign-up
async function handleSignUp(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    console.log(req.body);

    // Check for existing user
    const isExistingUser = await User.findOne({ email: email });
    if (isExistingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });
    console.log(user);

    // Send a verification email to the user
    await sendEmail({
      email: user.email,
      emailType: "VERIFY",
      userId: user._id,
      username: user.name,
    });

    // Return success response
    return res.status(201).json({ message: "User successfully created" });
  } catch (error) {
    console.error("Sign up error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Function to handle user login
async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found. Please sign up" });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email to Login" });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // Generate a jwt token
    const secretkey = process.env.JWT_SECRET_KEY;
    const tokenData = {
      id: user._id,
      Name: user.name,
      email: user.email,
    };

    const token = jwt.sign(tokenData, secretkey, {
      expiresIn: "24h",
    });

    // Set cookie
    res.cookie("auth", token, {
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Return success response
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  handleSignUp,
  handleLogin,
};
