import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

/* =========================
   MIDDLEWARE (SAFE)
========================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("WaafiPay backend alive ✅");
});

/* =========================
   CONFIRM PAYMENT
========================= */
app.post("/waafipay/confirm", async (req, res) => {
  try {
    const { phone, total, items } = req.body;

    // Basic validation
    if (!phone || !total || !items?.length) {
      return res.status(400).json({
        status: "ERROR",
        message: "Missing required fields",
      });
    }

    // Phone validation (UNCHANGED)
    if (!/^252\d{9}$/.test(phone)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid phone format. Use 252XXXXXXXXX",
      });
    }

    // 🔍 ENV CHECK (LOG ONLY – SAFE)
    console.log("ENV CHECK", {
      env: process.env.WAAFIPAY_ENV,
      merchant: !!process.env.WAAFIPAY_MERCHANT_UID,
      user: !!process.env.WAAFIPAY_API_USER_ID,
      key: !!process.env.WAAFIPAY_API_KEY,
    });

    const payload = {
      schemaVersion: "1.0",
      requestId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: process.env.WAAFIPAY_MERCHANT_UID,
        apiUserId: process.env.WAAFIPAY_API_USER_ID,
        apiKey: process.env.WAAFIPAY_API_KEY,
        paymentMethod: "MWALLET_ACCOUNT",
        payerInfo: {
          accountNo: phone,
        },
        transactionInfo: {
          referenceId: `ORDER-${Date.now()}`,
          invoiceId: `INV-${Date.now()}`,
          amount: total,
          currency: "USD",
          description: "Vitmiin Order Payment",
          items: items.map((i) => ({
            itemId: i.id,
            description: i.title,
            quantity: i.qty,
            price: i.price,
          })),
        },
      },
    };

    const waafiUrl =
      process.env.WAAFIPAY_ENV === "live"
        ? "https://api.waafipay.net/asm"
        : "https://sandbox.waafipay.net/asm";

    const r = await fetch(waafiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await r.json();

    if (result.responseCode !== "2001") {
      console.error("WaafiPay error:", result);
      return res.status(400).json({
        status: "ERROR",
        waafipay: result,
      });
    }

    return res.json({
      status: "SUCCESS",
      waafipay: result,
    });
  } catch (e) {
    console.error("Server error:", e);
    return res.status(500).json({
      status: "ERROR",
      message: "Server error",
    });
  }
});

/* =========================
   START SERVER (RAILWAY SAFE)
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("WaafiPay backend running on port", PORT)
);