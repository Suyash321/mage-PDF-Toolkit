// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fetch = require("node-fetch");
const FormData = require("form-data");

// DEBUG: Log API Keys
console.log("RemoveBG Key:", process.env.REMOVEBG_API_KEY ? "YES" : "NO");
console.log("Gemini Key:", process.env.GEMINI_API_KEY ? "YES" : "NO");

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
const PORT = process.env.PORT || 3001;

// -----------------------------
// DEFAULT EXAM SIZES (20+ exams)
// photo + signature with width/height/maxKB
// -----------------------------
const DEFAULT_EXAM_SIZES = {
  "JEE Main": {
    photo: { width: 350, height: 450, maxKB: 100 },
    signature: { width: 160, height: 50, maxKB: 30 },
  },
  NEET: {
    photo: { width: 350, height: 450, maxKB: 100 },
    signature: { width: 160, height: 50, maxKB: 30 },
  },
  SSC: {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  "SSC CGL": {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  UPSC: {
    photo: { width: 300, height: 350, maxKB: 40 },
    signature: { width: 200, height: 80, maxKB: 20 },
  },
  "UPSC CSE": {
    photo: { width: 300, height: 350, maxKB: 40 },
    signature: { width: 200, height: 80, maxKB: 20 },
  },
  GATE: {
    photo: { width: 240, height: 320, maxKB: 50 },
    signature: { width: 200, height: 60, maxKB: 20 },
  },
  "RRB NTPC": {
    photo: { width: 300, height: 400, maxKB: 50 },
    signature: { width: 200, height: 60, maxKB: 30 },
  },
  "RRB Group D": {
    photo: { width: 300, height: 400, maxKB: 50 },
    signature: { width: 200, height: 60, maxKB: 30 },
  },
  "Railway JE": {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  "IBPS PO": {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  "IBPS Clerk": {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  "SBI PO": {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  "SBI Clerk": {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  NDA: {
    photo: { width: 300, height: 350, maxKB: 40 },
    signature: { width: 200, height: 80, maxKB: 20 },
  },
  CDS: {
    photo: { width: 300, height: 350, maxKB: 40 },
    signature: { width: 200, height: 80, maxKB: 20 },
  },
  AFCAT: {
    photo: { width: 300, height: 350, maxKB: 40 },
    signature: { width: 200, height: 80, maxKB: 20 },
  },
  "DRDO Tech": {
    photo: { width: 300, height: 400, maxKB: 50 },
    signature: { width: 200, height: 60, maxKB: 30 },
  },
  DRDO: {
    photo: { width: 300, height: 400, maxKB: 50 },
    signature: { width: 200, height: 60, maxKB: 30 },
  },
};

// ---------------------------------------
// OPTIONAL: Gemini call (if key present)
// ---------------------------------------
async function getExamSizesFromGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("⚠️ No GEMINI_API_KEY found, using defaults.");
    return DEFAULT_EXAM_SIZES;
  }

  const MODEL = "models/gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${key}`;

  const prompt = `
You are an assistant that must reply ONLY with pure JSON (no text, no markdown).

Give passport-style image requirements in pixels and max size (KB)
for the following Indian government exams. For EACH exam, include both
"photo" and "signature" objects.

Use EXACTLY this JSON structure (same keys, similar values):

${JSON.stringify(DEFAULT_EXAM_SIZES, null, 2)}

Rules:
- Output MUST be valid JSON.
- NO explanation, NO extra text, NO markdown, ONLY JSON.
`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("❌ Gemini HTTP error:", response.status, errText);
      return DEFAULT_EXAM_SIZES;
    }

    const data = await response.json();

    if (data.error) {
      console.error("❌ Gemini logical error:", data.error);
      return DEFAULT_EXAM_SIZES;
    }

    const candidates = data.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      console.error("❌ Gemini: no candidates in response:", JSON.stringify(data, null, 2));
      return DEFAULT_EXAM_SIZES;
    }

    let text = "";
    const parts = candidates[0].content?.parts;
    if (Array.isArray(parts)) {
      text = parts.map((p) => p.text || "").join("");
    }

    if (!text) {
      console.error(
        "❌ Gemini: candidates[0] has no text parts:",
        JSON.stringify(candidates[0], null, 2)
      );
      return DEFAULT_EXAM_SIZES;
    }

    let clean = text.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("❌ Failed to JSON.parse Gemini output, using defaults. Output was:", clean);
      return DEFAULT_EXAM_SIZES;
    }

    console.log("✅ Gemini exam sizes loaded.");
    return parsed;
  } catch (err) {
    console.error("❌ Gemini Exception:", err.message);
    return DEFAULT_EXAM_SIZES;
  }
}

// -----------------------------
// CACHE EXAM SIZES ON STARTUP
// -----------------------------
let cachedExamSizes = null;

(async () => {
  cachedExamSizes = await getExamSizesFromGemini();
  console.log("📐 Initial exam sizes keys:", Object.keys(cachedExamSizes || {}));
})();

// -----------------------------
// EXAM SIZES ENDPOINT
// -----------------------------
app.get("/api/exam-sizes", async (req, res) => {
  try {
    if (cachedExamSizes) {
      return res.json({ examSizes: cachedExamSizes });
    }
    const sizes = await getExamSizesFromGemini();
    cachedExamSizes = sizes;
    res.json({ examSizes: sizes });
  } catch (err) {
    console.error("Exam sizes endpoint error:", err);
    res.json({ examSizes: DEFAULT_EXAM_SIZES });
  }
});

// ---------------------------------------------------------
// REMOVE.BG PROXY (same as your existing code)
// ---------------------------------------------------------
app.post("/api/remove-bg", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const form = new FormData();
    form.append("image_file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append("size", "auto");
    form.append("format", "png");

    console.log("Sending to remove.bg...");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("remove.bg error:", response.status, text);
      return res.status(response.status).send(text);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
});

// -----------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
