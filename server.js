const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());

// ✅ Initialize Twilio client safely
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔍 Health check
app.get("/", (req, res) => {
  res.send("Airductify SMS Server Running 🚀");
});

// 🔥 TEST ROUTE (Browser-friendly)
app.get("/send-sms", async (req, res) => {
  try {
    const message = await client.messages.create({
      body: "🔥 Airductify test SMS working!",
      from: process.env.TWILIO_NUMBER,
      to: process.env.YOUR_PHONE_NUMBER,
    });

    console.log("Test SMS SID:", message.sid);
    res.send("✅ SMS sent: " + message.sid);
  } catch (error) {
    console.error("❌ Test SMS Error:", error);
    res.status(500).send("Error sending SMS");
  }
});

// 🚀 LEAD CAPTURE ROUTE (used by website)
app.post("/lead", async (req, res) => {
  try {
    const { name, phone, service } = req.body;

    // ✅ Basic validation
    if (!name || !phone || !service) {
      return res.status(400).send("Missing required fields");
    }

    const message = await client.messages.create({
      body: `🔥 New Lead:
Name: ${name}
Phone: ${phone}
Service: ${service}`,
      from: process.env.TWILIO_NUMBER,
      to: process.env.YOUR_PHONE_NUMBER,
    });

    console.log("📩 Lead SMS SID:", message.sid);

    res.status(200).json({
      success: true,
      message: "SMS sent",
      sid: message.sid,
    });

  } catch (error) {
    console.error("❌ Lead SMS Error:", error);
    res.status(500).json({
      success: false,
      error: "Error sending SMS",
    });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
