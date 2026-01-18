
export const CATEGORY_MAP: Record<string, string[]> = {
  'Housing & Utilities': [
    'House rent', 'Maintenance charges', 'Property tax', 'Electricity bill', 
    'Water bill', 'Gas cylinder / piped gas', 'Internet (broadband / fiber)', 
    'Mobile recharge / postpaid bill', 'DTH / cable / OTT subscriptions'
  ],
  'Food & Groceries': [
    'Monthly groceries', 'Vegetables & fruits', 'Milk & dairy', 
    'Eating out / restaurants', 'Street food', 'Online food delivery (Swiggy, Zomato)', 
    'Office canteen'
  ],
  'Transportation': [
    'Fuel (petrol / diesel / CNG)', 'Public transport (bus, metro, train)', 
    'Auto / taxi (Ola, Uber)', 'Vehicle EMI', 'Vehicle servicing & repairs', 
    'Parking fees', 'Toll charges'
  ],
  'Health & Medical': [
    'Doctor consultations', 'Medicines', 'Lab tests', 'Hospital expenses', 
    'Health insurance premium', 'Fitness / gym', 'Yoga / wellness'
  ],
  'Education & Learning': [
    'School / college fees', 'Tuition / coaching', 'Online courses', 
    'Books & stationery', 'Exam fees'
  ],
  'Personal & Lifestyle': [
    'Clothing & footwear', 'Salon / parlour', 'Cosmetics & grooming', 
    'Accessories', 'Laundry / dry cleaning'
  ],
  'Entertainment & Leisure': [
    'Movies / theatre', 'OTT subscriptions', 'Games & apps', 'Hobbies', 'Travel & outings'
  ],
  'Travel & Vacation': [
    'Flight / train / bus tickets', 'Hotel / homestay', 'Local transport during travel', 
    'Food during travel', 'Sightseeing', 'Travel insurance'
  ],
  'Family & Social': [
    'Gifts (festivals, birthdays, weddings)', 'Donations / charity', 
    'Functions & ceremonies', 'Child expenses', 'Elder care'
  ],
  'Financial Commitments': [
    'Loan EMI (home, car, personal)', 'Credit card bill', 
    'Insurance premiums (life, vehicle)', 'Investments (SIP, RD, PPF, NPS)', 'Taxes'
  ],
  'Digital & Online': [
    'App subscriptions', 'Cloud storage', 'Software licenses', 'Domain / hosting'
  ],
  'Household & Miscellaneous': [
    'House help / maid salary', 'Repairs & maintenance', 'Furniture & appliances', 
    'Home décor', 'Pest control'
  ],
  'Emergency / Irregular': [
    'Medical emergencies', 'Repairs', 'Unexpected travel', 'Penalties / fines'
  ],
  'Income': ['Salary', 'Freelance', 'Investment Returns', 'Gift', 'Other Income']
};

export const Category = {
  HOUSING: 'Housing & Utilities',
  GROCERIES: 'Food & Groceries',
  TRANSPORT: 'Transportation',
  LEISURE: 'Entertainment & Leisure',
  UTILITIES: 'Housing & Utilities', // Compatibility
  HEALTHCARE: 'Health & Medical',
  INCOME: 'Income',
  OTHER: 'Household & Miscellaneous'
} as const;

export type CategoryType = string;

export enum Currency {
  INR = '₹',
  USD = '$',
  EUR = '€',
  GBP = '£'
}

export enum PaymentMethod {
  UPI = 'UPI',
  CASH = 'Cash',
  CARD = 'Card',
  NET_BANKING = 'Net Banking'
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
  subCategory?: string;
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
  subCategory?: string;
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

export type ViewState = 'dashboard' | 'history' | 'add' | 'insights' | 'budget' | 'setup';
