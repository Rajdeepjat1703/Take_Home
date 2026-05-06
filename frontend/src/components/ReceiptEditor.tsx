import type { ParsedReceipt } from "../types";

type Props = {
  receipt: ParsedReceipt;
  uncertain: Set<string>;
  onChange: (next: ParsedReceipt) => void;
};

export default function ReceiptEditor({ receipt, uncertain, onChange }: Props) {
  const updateItem = (index: number, key: "name" | "amount", value: string) => {
    const items = [...receipt.items];
    items[index] = {
      ...items[index],
      [key]: key === "amount" ? Number(value || 0) : value
    };
    onChange({ ...receipt, items });
  };

  const addItem = () => onChange({ ...receipt, items: [...receipt.items, { name: "", amount: 0 }] });
  const removeItem = (index: number) =>
    onChange({ ...receipt, items: receipt.items.filter((_, itemIndex) => itemIndex !== index) });

  return (
    <section>
      <h2>Extracted Receipt</h2>
      <label>
        Merchant
        <input
          className={uncertain.has("merchant") ? "uncertain" : ""}
          value={receipt.merchant}
          onChange={(e) => onChange({ ...receipt, merchant: e.target.value })}
        />
      </label>
      <label>
        Date
        <input
          className={uncertain.has("date") ? "uncertain" : ""}
          value={receipt.date}
          onChange={(e) => onChange({ ...receipt, date: e.target.value })}
          placeholder="YYYY-MM-DD"
        />
      </label>

      <div className="items-header">
        <h3>Line Items</h3>
        <button type="button" onClick={addItem}>
          + Add Item
        </button>
      </div>

      {receipt.items.map((item, index) => (
        <div key={`${index}-${item.name}`} className="item-row">
          <input
            className={uncertain.has(`item-name-${index}`) ? "uncertain" : ""}
            value={item.name}
            placeholder="Item name"
            onChange={(e) => updateItem(index, "name", e.target.value)}
          />
          <input
            className={uncertain.has(`item-amount-${index}`) ? "uncertain" : ""}
            type="number"
            step="0.01"
            value={item.amount}
            onChange={(e) => updateItem(index, "amount", e.target.value)}
          />
          <button type="button" onClick={() => removeItem(index)}>
            Remove
          </button>
        </div>
      ))}

      <label>
        Total
        <input
          className={uncertain.has("total") ? "uncertain" : ""}
          type="number"
          step="0.01"
          value={receipt.total}
          onChange={(e) => onChange({ ...receipt, total: Number(e.target.value || 0) })}
        />
      </label>
    </section>
  );
}
