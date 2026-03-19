const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

// ✅ CORS (keep open for now)
app.use(cors({ origin: "*" }));

app.use(express.json());

// ✅ Validate ENV before using Twilio
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_NUMBER,
  YOUR_PHONE_NUMBER
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error("❌ Missing Twilio credentials");
}

let client = null;

try {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
} catch (err) {
  console.error("❌ Twilio init failed:", err.message);
}

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Airductify SMS Server Running");
});

// Test route
app.get("/send-sms", async (req, res) => {
  if (!client) {
    return res.status(500).send("Twilio not initialized");
  }

  try {
    const message = await client.messages.create({
      body: "🔥 Test SMS working!",
      from: TWILIO_NUMBER,
      to: YOUR_PHONE_NUMBER,
    });

    res.send("✅ SMS sent: " + message.sid);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Lead route
app.post("/lead", async (req, res) => {
  if (!client) {
    return res.status(500).json({ success: false, error: "Twilio not ready" });
  }

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
      from: TWILIO_NUMBER,
      to: YOUR_PHONE_NUMBER,
    });

    res.json({ success: true, sid: message.sid });

  } catch (err) {
    console.error("❌ SMS error:", err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
