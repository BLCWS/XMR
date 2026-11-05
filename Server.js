const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Unlock Device <onboarding@resend.dev>";

/* Health check for Render */
app.get("/health", (req, res) => res.sendStatus(200));

/* Main endpoint */
app.post("/api/send-unlock-email", async (req, res) => {
  const { email, brand, model, fullName } = req.body || {};

  if (!email || !fullName) {
    return res.status(400).json({ message: "Email and phone are required." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  const instructionsLink =
    `https://your-frontend-domain.com/instructions` +
    `?brand=${encodeURIComponent(brand || "")}` +
    `&model=${encodeURIComponent(model || "")}`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#182230;">
      <h2 style="color:#101828;">Your Unlock Request</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${fullName}</p>
      <p><strong>Link:</strong>
        <a href="${instructionsLink}" style="color:#f28b16;">Click here for instructions</a>
      </p>
      <p><strong>Instructions:</strong>
        Please open the link above to complete the unlock process for your
        <strong>${fullName}</strong>. Follow the steps shown on the page.
      </p>
      <hr style="border:none;border-top:1px solid #e4e7ec;margin:20px 0;">
      <p style="font-size:12px;color:#667085;">
        Unlock Your Device — Independent device support information.
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Unlock instructions for your ${fullName}`,
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
