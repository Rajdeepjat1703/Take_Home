import "dotenv/config";
import express from "express";
import cors from "cors";
import { receiptRouter } from "./routes/receiptRoutes";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api", receiptRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
