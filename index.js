import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;

/* ---------- Utility Functions ---------- */
const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);

/* ---------- Health API ---------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL,
  });
});

/* ---------- BFHL API ---------- */
app.post("/bfhl", async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        error: "Exactly one key is required",
      });
    }

    const key = keys[0];
    const value = req.body[key];
    let data;

    switch (key) {
      case "fibonacci":
        if (!Number.isInteger(value) || value < 0)
          throw new Error("Invalid fibonacci input");

        data = [];

        let a = 0,
          b = 1;
        for (let i = 0; i < value; i++) {
          data.push(a);
          [a, b] = [b, a + b];
        }
        break;

      case "prime":
        if (!Array.isArray(value)) throw new Error("Prime input must be array");

        data = value.filter((n) => Number.isInteger(n) && isPrime(n));
        break;

      case "lcm":
        if (!Array.isArray(value) || value.length === 0)
          throw new Error("Invalid LCM input");

        data = value.reduce((acc, cur) => lcm(acc, cur));
        break;

      case "hcf":
        if (!Array.isArray(value) || value.length === 0)
          throw new Error("Invalid HCF input");

        data = value.reduce((acc, cur) => gcd(acc, cur));
        break;

      case "AI":
        if (typeof value !== "string")
          throw new Error("AI input must be string");

        const aiRes = await axios.post(
          "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
          {
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Answer the following question in exactly ONE WORD only.\nQuestion: ${value}`,
                  },
                ],
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": process.env.GEMINI_API_KEY,
            },
          },
        );

        data =
          aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(
            /[^a-zA-Z]/g,
            "",
          ) || "Unknown";

        break;

      default:
        throw new Error("Invalid key");
    }

    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data,
    });
  } catch (err) {
    res.status(400).json({
      is_success: false,
      error: err.message,
    });
  }
});

/* ---------- Server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
