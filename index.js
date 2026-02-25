import express from "express";
import fetch from "node-fetch";

const app = express();

/* =========================
   CORS
========================= */
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://vitimiinonline.netlify.app"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  next();
});

app.options("*", (_, res) => res.sendStatus(204));
app.use(express.json());

/* =========================
   WaafiPay Confirm
========================= */
app.post("/waafipay/confirm", async (req, res) => {
  try {
    console.log("Incoming:", req.body);

    const waafiUrl =
      process.env.WAAFIPAY_ENV === "live"
        ? "https://api.waafipay.com/asm"
        : "https://sandbox.waafipay.com/asm";

    const waafiRes = await fetch(waafiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MerchantUID": process.env.WAAFIPAY_MERCHANT_UID,
        "ApiUserId": process.env.WAAFIPAY_API_USER_ID,
        "ApiKey": process.env.WAAFIPAY_API_KEY,
      },
      body: JSON.stringify(req.body),
      timeout: 15000,
    });

    const raw = await waafiRes.text();
    console.log("WaafiPay raw:", raw);

    if (!raw) {
      return res.status(502).json({
        status: "ERROR",
        message: "Empty response from WaafiPay",
      });
    }

    const data = JSON.parse(raw);
    return res.status(200).json(data);

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({
      status: "ERROR",
      message: err.message || "Server error",
    });
  }
});

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("WaafiPay backend running on port", PORT)
);