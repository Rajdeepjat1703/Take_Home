export type ReceiptItem = {
  name: string;
  amount: number;
};

export type ParsedReceipt = {
  merchant: string;
  date: string;
  items: ReceiptItem[];
  total: number;
};

export type SavedReceipt = ParsedReceipt & {
  id: string;
  createdAt: string;
};
