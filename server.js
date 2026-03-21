const express = require("express");
const twilio = require("twilio");

const app = express();

/* =====================================================
   🔥 FORCE CORS (fixes your exact browser error)
===================================================== */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ✅ Handle preflight requests (CRITICAL for POST)
app.options("*", (req, res) => {
  return res.sendStatus(200);
});

/* =====================================================
   BODY PARSER
===================================================== */
app.use(express.json());

/* =====================================================
   ENV + TWILIO INIT (SAFE)
===================================================== */
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_NUMBER,
  YOUR_PHONE_NUMBER,
} = process.env;

let client = null;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error("❌ Missing Twilio credentials");
} else {
  try {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log("✅ Twilio initialized");
  } catch (err) {
    console.error("❌ Twilio init failed:", err.message);
  }
}

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/", (req, res) => {
  res.send("🚀 Airductify SMS Server Running");
});

/* =====================================================
   TEST ROUTE (BROWSER SAFE)
===================================================== */
app.get("/send-sms", async (req, res) => {
  if (!client) {
    return res.status(500).send("❌ Twilio not initialized");
  }

  try {
    const message = await client.messages.create({
      body: "🔥 Airductify test SMS working!",
      from: TWILIO_NUMBER,
      to: YOUR_PHONE_NUMBER,
    });

    console.log("✅ Test SMS:", message.sid);

    res.send("✅ SMS sent: " + message.sid);
  } catch (err) {
    console.error("❌ Test SMS Error:", err.message);
    res.status(500).send(err.message);
  }
});

/* =====================================================
   LEAD ROUTE (USED BY WEBSITE)
===================================================== */
app.post("/lead", async (req, res) => {
  if (!client) {
    return res.status(500).json({
      success: false,
      error: "Twilio not initialized",
    });
  }

  try {
    const { name, phone, service } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const message = await client.messages.create({
      body: `🔥 New Lead:
Name: ${name}
Phone: ${phone}
Service: ${service}`,
      from: TWILIO_NUMBER,
      to: YOUR_PHONE_NUMBER,
    });

    console.log("📩 Lead SMS:", message.sid);

    return res.json({
      success: true,
      sid: message.sid,
    });

  } catch (err) {
    console.error("❌ Lead SMS Error:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =====================================================
   START SERVER
===================================================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
