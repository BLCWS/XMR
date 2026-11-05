const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

// The sender (Resend requires this to be onboarding@resend.dev for testing)
const FROM_EMAIL = "Unlock Request <onboarding@resend.dev>";
// The receiver (You!)
const TO_EMAIL = "erickteayah@gmail.com";

app.get("/health", (req, res) => res.sendStatus(200));

app.post("/api/send-unlock-email", async (req, res) => {
  const { email, brand, model, fullName } = req.body || {};

  if (!email || !fullName) {
    return res.status(400).json({ message: "Email and phone are required." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#182230;">
      <h2 style="color:#101828;">New Unlock Request</h2>
      <p>A user has submitted a request to unlock a device.</p>
      <hr style="border:none;border-top:1px solid #e4e7ec;margin:20px 0;">
      <p><strong>User's Email:</strong> ${email}</p>
      <p><strong>Phone Requested:</strong> ${fullName}</p>
      <p><strong>Brand:</strong> ${brand}</p>
      <p><strong>Model:</strong> ${model}</p>
      <hr style="border:none;border-top:1px solid #e4e7ec;margin:20px 0;">
      <p style="font-size:12px;color:#667085;">
        Unlock Your Device — Automated Request
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL], // <--- SENDING TO YOU INSTEAD
      subject: `New Unlock Request: ${fullName}`,
      html
    });

    if (error) {
      return res.status(500).json({ message: error.message || "Email failed." });
    }

    return res.json({ ok: true, id: data && data.id });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
