const express = require("express");
const twilio = require("twilio");

const app = express();

/* =====================================================
   🔥 CORS FIX
===================================================== */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.options("*", (req, res) => res.sendStatus(200));

/* =====================================================
   BODY PARSER
===================================================== */
app.use(express.json());

/* =====================================================
   ENV + TWILIO INIT
===================================================== */
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  YOUR_PHONE_NUMBER // your personal number (receives leads)
} = process.env;

/* 🔥 USE MESSAGING SERVICE (NOT FROM NUMBER) */
const MESSAGING_SERVICE_SID = "MG189133f6aa922820e0d586b9d2ae19e7";

let client = null;

try {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log("✅ Twilio initialized");
} catch (err) {
  console.error("❌ Twilio init failed:", err.message);
}

/* =====================================================
   HELPER: FORMAT PHONE
===================================================== */
function formatPhone(phone) {
  if (!phone) return null;

  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    cleaned = "1" + cleaned;
  }

  return "+" + cleaned;
}

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/", (req, res) => {
  res.send("🚀 Airductify SMS Server Running");
});

/* =====================================================
   TEST ROUTE
===================================================== */
app.get("/send-sms", async (req, res) => {
  try {
    const message = await client.messages.create({
      body: "🔥 Airductify test SMS working!",
      messagingServiceSid: MESSAGING_SERVICE_SID,
      to: YOUR_PHONE_NUMBER,
    });

    res.send("✅ SMS sent: " + message.sid);
  } catch (err) {
    console.error("❌ Test SMS error:", err.message);
    res.status(500).send(err.message);
  }
});

/* =====================================================
   LEAD ROUTE
===================================================== */
app.post("/lead", async (req, res) => {
  try {
    const { name, phone, service, zip } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const formattedPhone = formatPhone(phone);

    const messageBody = `
🔥 NEW LEAD

👤 Name: ${name}
📞 Phone: ${formattedPhone}
🛠 Service: ${service}
📍 ZIP: ${zip || "N/A"}
    `;

    /* ==========================================
       📩 SEND LEAD TO YOU
    ========================================== */
    const leadMessage = await client.messages.create({
      body: messageBody,
      messagingServiceSid: MESSAGING_SERVICE_SID,
      to: YOUR_PHONE_NUMBER,
    });

    /* ==========================================
       🔁 CONFIRMATION TO CUSTOMER
    ========================================== */
    await client.messages.create({
      body: "✅ Airductify: We received your request. We'll contact you shortly.",
      messagingServiceSid: MESSAGING_SERVICE_SID,
      to: formattedPhone,
    });

    console.log("📩 Lead SMS:", leadMessage.sid);

    return res.json({
      success: true,
      sid: leadMessage.sid,
    });

  } catch (err) {
    console.error("❌ SMS ERROR:", err.message);

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
