const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs").promises;
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" });

// Load environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Helper function to send an email using Nodemailer
async function sendEmail({ to, cc, bcc, subject, message, attachments }) {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    service: "gmail", // Change as needed (e.g., 'smtp.office365.com' for Outlook)
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // Prepare attachments for Nodemailer
  const nodemailerAttachments = await Promise.all(
    attachments.map(async (file) => {
      const fileContent = await fs.readFile(file.path);
      return {
        filename: file.originalname,
        content: fileContent,
      };
    })
  );

  // Email options
  const mailOptions = {
    from: EMAIL_USER,
    to,
    cc,
    bcc,
    subject,
    html: message,
    attachments: nodemailerAttachments,
  };

  // Send email
  await transporter.sendMail(mailOptions);
}

// API route to handle email sending with attachments
app.post("/send", upload.array("attachments"), async (req, res) => {
  const { to, cc, bcc, subject, message } = req.body;
  const attachments = req.files;

  if (!to || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
  }

  try {
    await sendEmail({ to, cc, bcc, subject, message, attachments });

    // Cleanup uploaded files
    attachments.forEach((file) => {
      fs.unlink(file.path);
    });

    res
      .status(200)
      .json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

// Serve the frontend
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
