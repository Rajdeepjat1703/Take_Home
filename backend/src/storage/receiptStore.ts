import fs from "fs";
import path from "path";
import { ReceiptRecord } from "../types";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "receipts.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getReceipts(): ReceiptRecord[] {
  ensureStore();
  const raw = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(raw) as ReceiptRecord[];
}

export function saveReceipt(receipt: ReceiptRecord): ReceiptRecord {
  const receipts = getReceipts();
  receipts.unshift(receipt);
  fs.writeFileSync(dataFile, JSON.stringify(receipts, null, 2), "utf-8");
  return receipt;
}
