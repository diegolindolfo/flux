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
  recurringId?: string;
}

export interface ParsedInput {
  amount: number | null;
  description: string;
  guessedCategory: Category | null;
  type: TransactionType;
}

// ── Recurring ────────────────────────────────────────────────────────────────
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  active: boolean;
  lastApplied: string | null;
  createdAt: string;
}

// ── Goals ────────────────────────────────────────────────────────────────────
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
  createdAt: string;
}

// ── Category Budgets ─────────────────────────────────────────────────────────
export interface CategoryBudget {
  categoryId: string;
  monthlyLimit: number;
  alertAt: number;
}

// ── View ─────────────────────────────────────────────────────────────────────
export type ViewState = 'dashboard' | 'history' | 'stats' | 'settings' | 'recurring' | 'goals';

export interface AppSettings {
  monthlyLimit: number;
  userName: string;
}

// ── Stats Period ─────────────────────────────────────────────────────────────
export type StatsPeriod = '1m' | '3m' | '6m' | '1y' | 'all';
