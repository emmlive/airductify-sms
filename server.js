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
  TWILIO_NUMBER,       // 👉 your Twilio number (814...)
  YOUR_PHONE_NUMBER    // 👉 your personal verified number (815...)
} = process.env;

let client = null;

try {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log("✅ Twilio initialized");
} catch (err) {
  console.error("❌ Twilio init failed:", err.message);
}

/* =====================================================
   HELPER: FORMAT PHONE (VERY IMPORTANT)
===================================================== */
function formatPhone(phone) {
  if (!phone) return null;

  // remove spaces, dashes, etc.
  let cleaned = phone.replace(/\D/g, "");

  // if 10 digits → add US country code
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
      body: "🔥 Test SMS working!",
      from: TWILIO_NUMBER,
      to: YOUR_PHONE_NUMBER,
    });

    res.send("✅ SMS sent: " + message.sid);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

/* =====================================================
   LEAD ROUTE (MAIN FIX HERE)
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
       🔥 SEND SMS TO YOU (NOT TO ITSELF)
    ========================================== */

    const message = await client.messages.create({
      body: messageBody,
      from: TWILIO_NUMBER,        // ✅ ALWAYS Twilio number
      to: YOUR_PHONE_NUMBER,      // ✅ YOU RECEIVE LEAD
    });

    /* ==========================================
       🔁 OPTIONAL: CONFIRMATION TO USER
    ========================================== */

    await client.messages.create({
      body: "✅ Thanks! Airductify received your request. We'll contact you shortly.",
      from: TWILIO_NUMBER,
      to: formattedPhone,         // ✅ USER GETS CONFIRMATION
    });

    console.log("📩 Lead SMS sent:", message.sid);

    return res.json({
      success: true,
      sid: message.sid,
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
