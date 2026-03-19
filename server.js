const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

// ✅ CRITICAL: MUST BE FIRST
app.use(cors({
  origin: "*", // TEMPORARY to confirm fix
}));

app.use(express.json());

// ✅ Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Health
app.get("/", (req, res) => {
  res.send("Airductify SMS Server Running 🚀");
});

// Test
app.get("/send-sms", async (req, res) => {
  try {
    const message = await client.messages.create({
      body: "🔥 Airductify test SMS working!",
      from: process.env.TWILIO_NUMBER,
      to: process.env.YOUR_PHONE_NUMBER,
    });

    res.send("✅ SMS sent: " + message.sid);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// Lead route
app.post("/lead", async (req, res) => {
  try {
    const { name, phone, service } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({ success: false });
    }

    const message = await client.messages.create({
      body: `🔥 New Lead:
Name: ${name}
Phone: ${phone}
Service: ${service}`,
      from: process.env.TWILIO_NUMBER,
      to: process.env.YOUR_PHONE_NUMBER,
    });

    res.json({
      success: true,
      sid: message.sid
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
