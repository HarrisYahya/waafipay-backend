import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

/* ===============================
   CORS CONFIG
================================ */
app.use(
  cors({
    origin: "https://vitimiinonline.netlify.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.options("*", cors());

/* ===============================
   BODY PARSER
================================ */
app.use(express.json());

/* ===============================
   HEALTH CHECK - RAILWAY-FRIENDLY
================================ */
app.get("/", (req, res) => {
  const accept = req.headers.accept || "";

  // If browser requests HTML, send friendly page
  if (accept.includes("text/html")) {
    return res.send(`
      <h1>✅ WaafiPay Backend Alive</h1>
      <p>Use <code>/waafipay/confirm</code> for POST requests.</p>
    `);
  }

  // Otherwise, respond with JSON for API clients
  return res.json({
    status: "OK",
    message: "WaafiPay backend alive",
  });
});

/* ===============================
   WAAFI PAY CONFIRM ENDPOINT
================================ */
app.post("/waafipay/confirm", async (req, res) => {
  try {
    const {
      phone,
      amount,
      merchantUid,
      apiUserId,
      apiKey,
      referenceId,
    } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const payload = {
      schemaVersion: "1.0",
      requestId: Date.now().toString(),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid,
        apiUserId,
        apiKey,
        paymentMethod: "MWALLET_ACCOUNT",
        payerInfo: { accountNo: phone },
        transactionInfo: {
          referenceId,
          invoiceId: referenceId,
          amount,
          currency: "USD",
          description: "Order payment",
        },
      },
    };

    const response = await fetch("https://api.waafipay.net/asm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("WaafiPay Error:", error);
    return res.status(500).json({
      success: false,
      message: "WaafiPay request failed",
    });
  }
});

/* ===============================
   CATCH-ALL ROUTE (SAFE)
================================ */
app.get("*", (req, res) => {
  res.status(404).json({ error: "Route not found, use / or /waafipay/confirm" });
});

/* ===============================
   SERVER START
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ WaafiPay backend running on port ${PORT}`);
});