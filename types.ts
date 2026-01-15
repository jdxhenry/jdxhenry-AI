
export const Category = {
  HOUSING: 'Housing',
  GROCERIES: 'Groceries',
  TRANSPORT: 'Transport',
  LEISURE: 'Leisure',
  UTILITIES: 'Utilities',
  HEALTHCARE: 'Healthcare',
  INCOME: 'Income',
  OTHER: 'Other'
} as const;

export type CategoryType = string;

export enum Currency {
  INR = '₹',
  USD = '$',
  EUR = '€',
  GBP = '£'
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  WALLET = 'Wallet'
}

export enum RecurringFrequency {
  NONE = 'None',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  date: string;
  isExpense: boolean;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  isExpense: boolean;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  lastProcessedDate: string; // ISO string
  startDate: string;
}

export interface Budget {
  category: CategoryType;
  limitAmount: number;
}

export interface UserPreferences {
  currency: Currency;
  isDarkMode: boolean;
  totalMonthlyIncome: number;
}

export type ViewState = 'dashboard' | 'history' | 'add' | 'insights' | 'settings';
