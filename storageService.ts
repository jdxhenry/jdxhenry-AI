
import { Transaction, Budget, UserPreferences, Category, Currency, RecurringTemplate, CategoryType } from './types';

const KEYS = {
  TRANSACTIONS: 'budget_tracker_transactions',
  BUDGETS: 'budget_tracker_budgets',
  PREFERENCES: 'budget_tracker_preferences',
  RECURRING: 'budget_tracker_recurring',
  CATEGORIES: 'budget_tracker_categories'
};

const DEFAULT_CATEGORIES: CategoryType[] = [
  Category.HOUSING,
  Category.GROCERIES,
  Category.TRANSPORT,
  Category.LEISURE,
  Category.UTILITIES,
  Category.HEALTHCARE,
  Category.OTHER
];

const DEFAULT_PREFS: UserPreferences = {
  currency: Currency.INR,
  isDarkMode: false,
  totalMonthlyIncome: 75000
};

const DEFAULT_BUDGETS: Budget[] = [
  { category: Category.HOUSING, limitAmount: 20000 },
  { category: Category.GROCERIES, limitAmount: 10000 },
  { category: Category.TRANSPORT, limitAmount: 5000 },
  { category: Category.LEISURE, limitAmount: 5000 },
  { category: Category.UTILITIES, limitAmount: 3000 },
  { category: Category.HEALTHCARE, limitAmount: 2000 },
];

export const storageService = {
  getCategories: (): CategoryType[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  },

  addCategory: (name: string) => {
    const categories = storageService.getCategories();
    if (!categories.includes(name)) {
      categories.push(name);
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    }
  },

  deleteCategory: (name: string) => {
    const categories = storageService.getCategories();
    const filtered = categories.filter(c => c !== name);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(filtered));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  saveTransaction: (transaction: Transaction) => {
    const transactions = storageService.getTransactions();
    transactions.unshift(transaction);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  deleteTransaction: (id: string) => {
    const transactions = storageService.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
  },

  getRecurringTemplates: (): RecurringTemplate[] => {
    const data = localStorage.getItem(KEYS.RECURRING);
    return data ? JSON.parse(data) : [];
  },

  saveRecurringTemplate: (template: RecurringTemplate) => {
    const templates = storageService.getRecurringTemplates();
    templates.push(template);
    localStorage.setItem(KEYS.RECURRING, JSON.stringify(templates));
  },

  updateRecurringTemplate: (updated: RecurringTemplate) => {
    const templates = storageService.getRecurringTemplates();
    const index = templates.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      templates[index] = updated;
      localStorage.setItem(KEYS.RECURRING, JSON.stringify(templates));
    }
  },

  deleteRecurringTemplate: (id: string) => {
    const templates = storageService.getRecurringTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(KEYS.RECURRING, JSON.stringify(filtered));
  },

  getBudgets: (): Budget[] => {
    const data = localStorage.getItem(KEYS.BUDGETS);
    return data ? JSON.parse(data) : DEFAULT_BUDGETS;
  },

  saveBudgets: (budgets: Budget[]) => {
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
  },

  getPreferences: (): UserPreferences => {
    const data = localStorage.getItem(KEYS.PREFERENCES);
    return data ? JSON.parse(data) : DEFAULT_PREFS;
  },

  savePreferences: (prefs: UserPreferences) => {
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  clearAll: () => {
    localStorage.clear();
  }
};
