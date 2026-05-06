# Receipt Parser App

Minimal full-stack take-home app for parsing receipt images with an LLM, correcting extracted fields inline, and saving results locally.

## What was built

- `backend/` (Node.js + TypeScript + Express)
  - `POST /api/parse-receipt` accepts JPG/PNG via multipart form-data, sends image to Groq, and returns structured receipt JSON
  - `POST /api/save-receipt` saves corrected receipt data
  - `GET /api/receipts` lists saved receipts
  - JSON-file storage at `backend/data/receipts.json`
- `frontend/` (React + TypeScript + Vite)
  - Upload receipt image
  - Display extracted merchant, date, items, and total
  - Inline edit for all fields
  - Highlight potentially uncertain fields (simple heuristic)
  - Save corrected receipt and view saved receipts list
- Root scripts for single-command local run.

## Run locally

1. Add your API key:
   -  `backend/.env` (or set env vars in your shell).
2. Start both frontend + backend (single command):
   - `npm run dev`
   - First run auto-installs `backend` and `frontend` dependencies via `predev`.
4. Open:
   - Frontend: `http://localhost:5173`
   - Backend health: `http://localhost:4000/health`

## API shape

Expected parsed JSON:

```json
{
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "string", "amount": 0.0 }
  ],
  "total": 0.0
}
```

## LLM usage

- Uses Groq's OpenAI-compatible Chat Completions API with image input.
- Prompt enforces strict JSON output and normalization rules.
- Server validates parseable JSON and required shape.
- If output is malformed:
  - Retries once
  - On second failure, returns a backend error response.

## Tradeoffs

- Chose JSON-file persistence over SQLite to keep setup friction low and scope focused on parsing/correction flow.
- Used lightweight heuristic highlighting instead of full confidence scoring.
- Kept styling intentionally minimal to focus on UX and correctness.

## Future improvements

- Add stronger schema validation (e.g. Zod) with richer validation errors.
- Add receipt image storage + link to each saved record.
- Add confidence estimation from model tokens/logprobs where available.
- Add tests for parse retry behavior and API validation.
- Add pagination and search on saved receipts.

## One product critique

The current correction UX works but is still form-like; a side-by-side image + extracted text overlay would make manual verification much faster and reduce cognitive load for item-level corrections.
