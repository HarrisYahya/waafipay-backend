import express from "express";
import fetch from "node-fetch";

const app = express();

/* =========================
   CORS (already confirmed working)
   ========================= */
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://vitimiinonline.netlify.app"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});

app.options("*", (_, res) => res.sendStatus(204));
app.use(express.json());

/* =========================
   WaafiPay Confirm
   ========================= */
app.post("/waafipay/confirm", async (req, res) => {
  try {
    console.log("Incoming payload:", req.body);

    const waafiUrl =
      process.env.WAAFIPAY_ENV === "live"
        ? "https://api.waafipay.com/asm"
        : "https://sandbox.waafipay.com/asm";

    const waafiResponse = await fetch(waafiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const text = await waafiResponse.text();

    console.log("WaafiPay raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        status: "ERROR",
        message: "Invalid response from WaafiPay",
        raw: text,
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Backend crash:", err);
    return res.status(500).json({
      status: "ERROR",
      message: "Server crashed",
    });
  }
});

/* =========================
   Start server
   ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("WaafiPay backend running on", PORT)
);