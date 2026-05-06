import OpenAI from "openai";
import type { ParsedReceipt } from "../types";

const prompt = `Extract structured data from this receipt image.

Return ONLY valid JSON in this format:
{
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "string", "amount": number }
  ],
  "total": number
}

Rules:
- Ignore taxes/subtotals unless clearly items
- Normalize date format
- Ensure numbers are floats
- If uncertain, still return best guess`;

const client = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
  : null;

function parseJsonResponse(content: string): ParsedReceipt {
  const parsed = JSON.parse(content) as ParsedReceipt;
  if (
    typeof parsed.merchant !== "string" ||
    typeof parsed.date !== "string" ||
    typeof parsed.total !== "number" ||
    !Array.isArray(parsed.items)
  ) {
    throw new Error("Invalid JSON structure from model.");
  }

  parsed.items = parsed.items
    .filter((item) => typeof item?.name === "string" && typeof item?.amount === "number")
    .map((item) => ({ name: item.name, amount: Number(item.amount) }));
  parsed.total = Number(parsed.total);

  return parsed;
}

async function callModel(imageBase64: string, mimeType: string): Promise<ParsedReceipt> {
  if (!client) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ]
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Model returned empty output.");
  }

  return parseJsonResponse(text);
}

export async function parseReceiptWithRetry(imageBase64: string, mimeType: string): Promise<ParsedReceipt> {
  try {
    return await callModel(imageBase64, mimeType);
  } catch (error) {
    try {
      return await callModel(imageBase64, mimeType);
    } catch {
      throw new Error(
        `Unable to parse model output as valid JSON after retry. Original error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
