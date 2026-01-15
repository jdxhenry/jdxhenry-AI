
import { Transaction, Budget, UserPreferences, Category, Currency, RecurringTemplate, CategoryType } from './types.ts';
import { securityService } from './securityService.ts';

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

async function getEncryptedItem<T>(key: string, defaultValue: T): Promise<T> {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  const decrypted = await securityService.decrypt(data);
  try {
    return JSON.parse(decrypted);
  } catch {
    return defaultValue;
  }
}

async function setEncryptedItem(key: string, value: any) {
  const encrypted = await securityService.encrypt(JSON.stringify(value));
  localStorage.setItem(key, encrypted);
}

export const storageService = {
  getCategories: async (): Promise<CategoryType[]> => {
    return await getEncryptedItem(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  },

  addCategory: async (name: string) => {
    const categories = await storageService.getCategories();
    if (!categories.includes(name)) {
      categories.push(name);
      await setEncryptedItem(KEYS.CATEGORIES, categories);
    }
  },

  deleteCategory: async (name: string) => {
    const categories = await storageService.getCategories();
    const filtered = categories.filter(c => c !== name);
    await setEncryptedItem(KEYS.CATEGORIES, filtered);
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return await getEncryptedItem(KEYS.TRANSACTIONS, []);
  },

  saveTransaction: async (transaction: Transaction) => {
    const transactions = await storageService.getTransactions();
    transactions.unshift(transaction);
    await setEncryptedItem(KEYS.TRANSACTIONS, transactions);
  },

  deleteTransaction: async (id: string) => {
    const transactions = await storageService.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await setEncryptedItem(KEYS.TRANSACTIONS, filtered);
  },

  getRecurringTemplates: async (): Promise<RecurringTemplate[]> => {
    return await getEncryptedItem(KEYS.RECURRING, []);
  },

  saveRecurringTemplate: async (template: RecurringTemplate) => {
    const templates = await storageService.getRecurringTemplates();
    templates.push(template);
    await setEncryptedItem(KEYS.RECURRING, templates);
  },

  updateRecurringTemplate: async (updated: RecurringTemplate) => {
    const templates = await storageService.getRecurringTemplates();
    const index = templates.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      templates[index] = updated;
      await setEncryptedItem(KEYS.RECURRING, templates);
    }
  },

  deleteRecurringTemplate: async (id: string) => {
    const templates = await storageService.getRecurringTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await setEncryptedItem(KEYS.RECURRING, filtered);
  },

  getBudgets: async (): Promise<Budget[]> => {
    return await getEncryptedItem(KEYS.BUDGETS, DEFAULT_BUDGETS);
  },

  saveBudgets: async (budgets: Budget[]) => {
    await setEncryptedItem(KEYS.BUDGETS, budgets);
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const data = localStorage.getItem(KEYS.PREFERENCES);
    // Preferences aren't encrypted in this version to allow immediate layout sizing, 
    // but you could encrypt them too for total lockdown.
    return data ? JSON.parse(data) : DEFAULT_PREFS;
  },

  savePreferences: (prefs: UserPreferences) => {
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  clearAll: () => {
    localStorage.clear();
  }
};
