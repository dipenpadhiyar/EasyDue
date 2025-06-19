export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string; // ISO date string
}

export interface ExpenseRecord {
  id: string;
  customerId: string;
  year: number;
  month: number; // 1-12
  amount: number;
  paid: boolean;
  dateAdded: string; // ISO date string
  lastUpdated: string; // ISO date string
}

export type Theme = "light" | "dark" | "system";
