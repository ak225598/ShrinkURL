const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const sendEmail = require("../helpers/mailer");
dotenv.config();

// Handle user sign-up
async function handleUserSignUp(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for existing user
    const isExistingUser = await User.findOne({ email: email });
    if (isExistingUser) {
      return res.status(400).json({ error: "User already exists" });
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

// Handle user login
async function handleUserLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and Password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found. Please sign up" });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ error: "Please verify your email to Login" });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Wrong password" });
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

// Handle user logout
async function handleUserLogout(req, res) {
  try {
    // Clear the authentication cookie
    res.cookie("auth", "", {
      maxAge: new Date(0),
    });

    // Return success response
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get details of the authenticated user
async function handleGetUserDetails(req, res) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;

    // Check if cookie exists
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(400).json({ error: "Authentication required" });
    }
    const token = cookie.split("=")[1];

    // Verify the JWT token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secretKey);
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Fetch user details from database
    const userId = decodedToken.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Return success response with user details
    return res.status(200).json({
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error("Error in handleUserDetails:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// Handle user email verification
async function handleUserEmailVerification(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    // Mark the user as verifed and remove the verification token from the db
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Return success response
    return res.status(200).json({ message: "Email verification successful" });
  } catch (error) {
    console.error("Error in handleUserEmailVerification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Handle user account deletion
async function handleAccountDeletion(req, res) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // Check if cookie exists
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(400).json({ error: "Authentication required" });
    }
    const token = cookie.split("=")[1];

    // Verify the JWT token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secretKey);
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Fetch user details from database
    const userId = decodedToken.id;
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Wrong password" });
    }

    // Delete the user from the database
    await User.findByIdAndDelete(userId);

    // Clear authentication cookie
    res.cookie("auth", "", {
      maxAge: new Date(0),
    });
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error in Account deletion:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Handle password reset request
async function handleRequestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Send user an email to reset the password
    await sendEmail({
      email: user.email,
      emailType: "RESET",
      userId: user._id,
      username: user.name,
    });

    // Return success response
    return res
      .status(200)
      .json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Error in handleUserResetPasswordReq:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Handle password change
async function handleChangePassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and Password are required" });
    }

    // Find user by forgot password token
    const user = await User.findOne({
      forgotPasswordToken: token,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Generate salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user document with the new hashed password
    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save();

    // Return success response
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in handleUserChangePassword:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  // Authentication
  handleUserSignUp,
  handleUserLogin,
  handleUserLogout,

  // User operations
  handleGetUserDetails,
  handleUserEmailVerification,
  handleAccountDeletion,

  // Password management
  handleRequestPasswordReset,
  handleChangePassword,
};
