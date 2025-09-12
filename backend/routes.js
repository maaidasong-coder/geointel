import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { mockProcess } from "./mockProcessor.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// in-memory store (replace with DB in production)
const CASES = {};

/**
 * POST /api/v1/cases
 * Accepts a media file and notes, returns case id and starts processing (mock)
 */
router.post("/cases", upload.single("media"), async (req, res) => {
  try {
    const id = `CASE-${Date.now()}`;
    const filename = req.file?.originalname || "upload";
    const notes = req.body?.notes || "";
    CASES[id] = {
      case_id: id,
      status: "processing",
      created_at: new Date().toISOString(),
      media: [{ media_id: uuidv4(), filename, size: req.file?.size || 0 }],
      notes
    };
    // start background mock processing and update CASES
    mockProcess(id, req.file).then((result) => {
      CASES[id] = { ...CASES[id], ...result, status: "completed" };
    }).catch((err) => {
      CASES[id].status = "failed";
      CASES[id].error = String(err);
    });

    res.json({ case_id: id, status: "processing" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * GET /api/v1/cases/:id
 */
router.get("/cases/:id", (req, res) => {
  const id = req.params.id;
  if (!CASES[id]) return res.status(404).json({ error: "not found" });
  res.json(CASES[id]);
});

export default router;
