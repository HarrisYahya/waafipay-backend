import express from "express";
import fetch from "node-fetch";

const app = express();

/* =========================
   🔐 MANUAL CORS (FINAL FIX)
   ========================= */
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://vitimiinonline.netlify.app"
  );
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // 🔥 THIS IS THE KEY
  }

  next();
});

app.use(express.json());

/* =========================
   ✅ WaafiPay confirm route
   ========================= */
app.post("/waafipay/confirm", async (req, res) => {
  try {
    const payload = req.body;

    const url =
      process.env.WAAFIPAY_ENV === "live"
        ? "https://api.waafipay.com/asm"
        : "https://sandbox.waafipay.com/asm";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("WaafiPay error:", err);
    return res.status(500).json({
      status: "ERROR",
      message: "Backend execution failed",
    });
  }
});

/* =========================
   🚀 Railway port
   ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("WaafiPay backend running on port", PORT);
});