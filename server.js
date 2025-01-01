const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("@microsoft/microsoft-graph-client");
const multer = require("multer");
const fs = require("fs").promises;
require("isomorphic-fetch");
require("dotenv").config();

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" });

// Load environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;

// Helper function to get an OAuth token
async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("scope", "https://graph.microsoft.com/.default");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Helper function to send an email using Microsoft Graph
async function sendEmail({ to, cc, bcc, subject, message, attachments }) {
  const token = await getAccessToken();

  const client = Client.init({
    authProvider: (done) => {
      done(null, token);
    },
  });

  // Prepare attachments for Microsoft Graph API
  const graphAttachments = await Promise.all(
    attachments.map(async (file) => {
      const fileContent = await fs.readFile(file.path);
      return {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: file.originalname,
        contentBytes: fileContent.toString("base64"),
      };
    })
  );

  const email = {
    message: {
      subject: subject,
      body: {
        contentType: "HTML",
        content: message,
      },
      toRecipients: to ? [{ emailAddress: { address: to } }] : [],
      ccRecipients: cc ? [{ emailAddress: { address: cc } }] : [],
      bccRecipients: bcc ? [{ emailAddress: { address: bcc } }] : [],
      attachments: graphAttachments, // Include attachments here
    },
  };

  await client.api("/me/sendMail").post(email);
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
