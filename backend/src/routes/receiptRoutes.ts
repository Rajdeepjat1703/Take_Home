import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import { parseReceiptWithRetry } from "../services/llm";
import { getReceipts, saveReceipt } from "../storage/receiptStore";
import { ParsedReceipt } from "../types";

const upload = multer({ storage: multer.memoryStorage() });
export const receiptRouter = Router();

receiptRouter.post("/parse-receipt", upload.single("receipt"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "Receipt image is required." });
  }

  if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
    return res.status(400).json({ error: "Only JPG/PNG images are supported." });
  }

  try {
    const parsed = await parseReceiptWithRetry(file.buffer.toString("base64"), file.mimetype);
    return res.json({ data: parsed });
  } catch (error) {
    return res.status(502).json({
      error: "Failed to parse receipt with LLM.",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

receiptRouter.post("/save-receipt", (req, res) => {
  const body = req.body as ParsedReceipt | undefined;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const hasValidCore =
    typeof body.merchant === "string" &&
    typeof body.date === "string" &&
    typeof body.total === "number" &&
    Array.isArray(body.items);

  if (!hasValidCore) {
    return res.status(400).json({ error: "Receipt schema is invalid." });
  }

  const sanitizedItems = body.items
    .filter((item) => typeof item?.name === "string" && typeof item?.amount === "number")
    .map((item) => ({ name: item.name.trim(), amount: Number(item.amount) }));

  const saved = saveReceipt({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    merchant: body.merchant.trim(),
    date: body.date.trim(),
    items: sanitizedItems,
    total: Number(body.total)
  });

  return res.status(201).json({ data: saved });
});

receiptRouter.get("/receipts", (_req, res) => {
  return res.json({ data: getReceipts() });
});
