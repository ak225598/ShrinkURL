const nodemailer = require("nodemailer");
const User = require("../models/user");
const bcryptjs = require("bcryptjs");

const sendEmail = async ({ email, emailType, userId, username }) => {
  try {
    // Create a hashed token
    const hashedToken = await bcryptjs.hash(userId.toString(), 10);

    // Update user document based on email type
    if (emailType === "VERIFY") {
      await User.findByIdAndUpdate(userId, {
        verifyToken: hashedToken,
        verifyTokenExpiry: Date.now() + 24 * 60 * 60 * 1000, // Valid for 24 hrs only
      });
    } else if (emailType === "RESET") {
      await User.findByIdAndUpdate(userId, {
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
      });
    }

    // Configure email transporter
    const transport = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      service: process.env.MAILER_SERVICE,
      port: process.env.MAILER_PORT,
      secure: true,
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD,
      },
    });


    // Email content
    const mailOptions = {
      from: process.env.MAILER_EMAIL,
      to: email,
      subject: emailType === "VERIFY"
        ? "Verify Your ShrinkURL Account"
        : "Reset Your ShrinkURL Password",
      html: `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0f0f0; color: #333;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: #2c3e50; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">ShrinkURL</h1>
            </div>
            <div style="padding: 30px 20px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">Hello ${username},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">
                ${emailType === "VERIFY" 
                  ? "Welcome to ShrinkURL! We're excited to have you on board. To start shortening your links and tracking their performance, please verify your email address." 
                  : "We received a request to reset your ShrinkURL account password. If you didn't make this request, please ignore this email."}
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">Please click the button below to ${emailType === "VERIFY" ? "verify your email address" : "reset your password"}:</p>
              <p style="text-align: center;">
                <a href="${process.env.DOMAIN}/${emailType === "VERIFY" ? "verifyEmail" : "resetPassword"}?token=${hashedToken}" style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: #fff; text-decoration: none; font-weight: bold; border-radius: 4px;">
                  ${emailType === "VERIFY" ? "Verify Email" : "Reset Password"}
                </a>
              </p>
              <p style="margin: 20px 0 10px; font-size: 14px; color: #7f8c8d; text-align: center;">Or copy and paste this link:</p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #3498db; word-break: break-all; text-align: center;">
                ${process.env.DOMAIN}/${emailType === "VERIFY" ? "verifyEmail" : "resetPassword"}?token=${hashedToken}
              </p>
              <p style="margin: 20px 0 0; font-size: 14px; color: #7f8c8d; text-align: center; line-height: 1.5;">This link will expire in 24 hours for security reasons.</p>
            </div>
            <div style="background-color: #ecf0f1; padding: 20px;">
              <h2 style="margin: 0 0 15px; font-size: 18px; color: #2c3e50; text-align: center;">Why Choose ShrinkURL?</h2>
              <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #34495e; line-height: 1.6;">
                <li>Shorten long URLs instantly</li>
                <li>Track clicks and analyze your link performance</li>
                <li>Secure and reliable link management</li>
              </ul>
            </div>
            <div style="background-color: #2c3e50; color: #bdc3c7; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
              <div style="margin: 0; font-size: 12px; line-height: 1.5;">&copy; 2024 ShrinkURL. All rights reserved.</div>
              <div style="margin: 10px 0 0; font-size: 12px; line-height: 1.5;">If you didn't create a ShrinkURL account, please ignore this email.</div>
            </div>
          </div>
        </body>
      `,
    };

    // Send the email
    const mailresponse = await transport.sendMail(mailOptions);
    return mailresponse;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = sendEmail;