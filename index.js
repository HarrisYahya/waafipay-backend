import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// WaafiPay confirm endpoint
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
  } catch (error) {
    console.error("WaafiPay error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Backend execution failed",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("WaafiPay backend running on port", PORT);
});