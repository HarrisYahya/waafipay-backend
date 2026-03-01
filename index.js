import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

/* =========================
   MIDDLEWARE (SAFE)
========================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

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

    // Phone validation
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

    // 🔒 SINGLE TIMESTAMP FOR ALL IDS
    const now = Date.now().toString();

    const payload = {
      schemaVersion: "1.0",
      requestId: now,
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
          referenceId: `ORDER-${now}`,
          invoiceId: `INV-${now}`,
          amount: total,
          currency: "SOS", // ⚡ LIVE currency fix
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
      console.error("WaafiPay error:", JSON.stringify(result, null, 2));
      return res.status(400).json({
        status: "ERROR",
        message: result.responseMsg || "WaafiPay rejected transaction",
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