const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db");
const cors = require("cors");
const userRouter = require("./routes/user");
const urlRouter = require("./routes/url");
const { userAuth } = require("./middlewares/auth");

// Load environment variables
dotenv.config();

// Initialize express application
const app = express();

// Connect to the database
connectDB();

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: true, credentials: true }));

// Routes
app.use("/user", userRouter);
app.use("/url", userAuth, urlRouter);

// PORT definition
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
