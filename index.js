import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

/* =========================
   CORS (MUST BE FIRST)
========================= */
app.use(
  cors({
    origin: "https://vitimiinonline.netlify.app",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

/* =========================
   TEST ENDPOINT (OPTIONAL)
========================= */
app.get("/", (_, res) => {
  res.send("WaafiPay backend alive");
});

/* =========================
   WAAFIPAY CONFIRM
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
        MerchantUID: process.env.WAAFIPAY_MERCHANT_UID,
        ApiUserId: process.env.WAAFIPAY_API_USER_ID,
        ApiKey: process.env.WAAFIPAY_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const text = await waafiRes.text();
    console.log("WaafiPay raw:", text);

    return res.status(200).json(
      text ? JSON.parse(text) : { status: "ERROR", message: "Empty response" }
    );
  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({
      status: "ERROR",
      message: err.message,
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("WaafiPay backend running on port", PORT)
);