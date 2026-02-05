export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string; // Tailwind class like 'bg-red-500'
  keywords: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO String for easier serialization
  type: TransactionType;
}

export interface ParsedInput {
  amount: number | null;
  description: string;
  guessedCategory: Category | null;
  type: TransactionType;
}

export type ViewState = 'dashboard' | 'history' | 'add' | 'stats' | 'settings';

export interface AppSettings {
  monthlyLimit: number;
  userName: string;
}