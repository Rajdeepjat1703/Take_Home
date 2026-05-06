import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import ReceiptEditor from "./components/ReceiptEditor";
import type { ParsedReceipt, SavedReceipt } from "./types";

function getUncertainFields(data: ParsedReceipt): Set<string> {
  const uncertain = new Set<string>();
  if (!data.merchant || data.merchant.length < 2) uncertain.add("merchant");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) uncertain.add("date");
  if (!(data.total > 0)) uncertain.add("total");

  data.items.forEach((item, index) => {
    if (!item.name || item.name.length < 2) uncertain.add(`item-name-${index}`);
    if (!(item.amount > 0)) uncertain.add(`item-amount-${index}`);
  });

  return uncertain;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uncertain = useMemo(() => (receipt ? getUncertainFields(receipt) : new Set<string>()), [receipt]);

  const parseReceipt = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Select a JPG/PNG file first.");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", file);

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/parse-receipt", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Parse failed.");
      setReceipt(payload.data as ParsedReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse receipt.");
    } finally {
      setLoading(false);
    }
  };

  const saveReceipt = async () => {
    if (!receipt) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/save-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receipt)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Save failed.");

      setSuccess("Receipt saved.");
      await refreshReceipts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt.");
    } finally {
      setSaving(false);
    }
  };

  const refreshReceipts = async () => {
    const response = await fetch("/api/receipts");
    const payload = await response.json();
    if (response.ok) setSavedReceipts(payload.data as SavedReceipt[]);
  };

  return (
    <main className="container">
      <h1>Receipt Parser App</h1>
      <p>Upload a receipt image, review extraction, fix fields, and save.</p>

      <form onSubmit={parseReceipt} className="panel">
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Parsing..." : "Parse Receipt"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {receipt && (
        <div className="panel">
          <ReceiptEditor receipt={receipt} uncertain={uncertain} onChange={setReceipt} />
          <div className="row">
            <button onClick={saveReceipt} disabled={saving}>
              {saving ? "Saving..." : "Save Receipt"}
            </button>
            {uncertain.size > 0 && <small>{uncertain.size} fields may need review (highlighted).</small>}
          </div>
        </div>
      )}

      <section className="panel">
        <div className="row">
          <h2>Saved Receipts</h2>
          <button onClick={refreshReceipts}>Refresh</button>
        </div>
        {savedReceipts.length === 0 ? (
          <p>No receipts saved yet.</p>
        ) : (
          <ul>
            {savedReceipts.map((entry) => (
              <li key={entry.id}>
                {entry.merchant} - {entry.date} - ${entry.total.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
