const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post("/lead", async (req, res) => {
  try {
    const { name, phone, service } = req.body;

    await client.messages.create({
      body: `🔥 New Lead:
Name: ${name}
Phone: ${phone}
Service: ${service}`,
      from: process.env.TWILIO_NUMBER,
      to: process.env.YOUR_PHONE_NUMBER,
    });

    res.status(200).send("SMS sent");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending SMS");
  }
});

app.get("/", (req, res) => {
  res.send("Airductify SMS Server Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
