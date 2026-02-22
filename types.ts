export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
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
