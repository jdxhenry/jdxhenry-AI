
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Settings, 
  Plus, 
  ShieldCheck, 
  Moon, 
  Sun,
  ShoppingCart,
  Car,
  Coffee,
  HeartPulse,
  Zap,
  Banknote,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Scan,
  Check,
  X,
  MessageSquare,
  Lock,
  ArrowRight,
  Bell,
  Home,
  Repeat,
  Edit3,
  Clock,
  Box,
  Tag,
  Sparkles,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Download,
  Book,
  Smartphone,
  Film,
  Plane,
  Heart,
  Briefcase,
  Monitor,
  Wrench,
  AlertTriangle,
  CreditCard,
  Wifi,
  Wallet,
  FolderPlus,
  Target
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell as RechartsCell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  ViewState, 
  Transaction, 
  Budget, 
  UserPreferences, 
  CATEGORY_MAP, 
  Currency, 
  PaymentMethod,
  RecurringFrequency,
  RecurringTemplate,
  CategoryType
} from './types.ts';
import { storageService } from './storageService.ts';
import { parseSMS, getSimulatedSMS, ParsedSMS } from './smsParser.ts';

// --- Constants ---
const CHART_COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#EC4899', '#64748B'];

const DEFAULT_PREFS: UserPreferences = {
  currency: Currency.INR,
  isDarkMode: false,
  totalMonthlyIncome: 75000
};

// --- Helper for Formatting ---
const formatCurrency = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return Math.round(val).toLocaleString();
};

const getMonthName = (date: Date) => {
  return date.toLocaleString('default', { month: 'long' });
};

const isSameMonth = (d1: Date, d2: Date) => {
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

// --- Components ---

const Navbar: React.FC<{ current: ViewState; setView: (v: ViewState) => void }> = ({ current, setView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 pb-8 flex justify-around items-center z-50">
      <button 
        onClick={() => setView('dashboard')}
        className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${current === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <LayoutDashboard size={24} strokeWidth={current === 'dashboard' ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-tight">Home</span>
      </button>

      <button 
        onClick={() => setView('history')}
        className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${current === 'history' ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <Calendar size={24} strokeWidth={current === 'history' ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-tight">History</span>
      </button>

      <div className="flex flex-col items-center">
        <button 
          onClick={() => setView('add')}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-500/40 active:scale-90 transition-transform flex items-center justify-center -mt-10"
        >
          <Plus size={32} />
        </button>
        <span className="text-[10px] font-bold tracking-tight text-slate-400 mt-1">Add</span>
      </div>

      <button 
        onClick={() => setView('insights')}
        className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${current === 'insights' ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <TrendingUp size={24} strokeWidth={current === 'insights' ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-tight">Trends</span>
      </button>

      <button 
        onClick={() => setView('budget')}
        className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${current === 'budget' ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <Target size={24} strokeWidth={current === 'budget' ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-tight">Budget</span>
      </button>
    </nav>
  );
};

const MonthSelector: React.FC<{ selectedDate: Date; onChange: (d: Date) => void }> = ({ selectedDate, onChange }) => {
  const handlePrev = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    onChange(d);
  };
  const handleNext = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    onChange(d);
  };

  return (
    <div className="flex items-center justify-center gap-10 py-4 select-none">
      <button 
        onClick={handlePrev} 
        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 active:scale-95 transition-all hover:bg-slate-50"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <div className="text-center min-w-[150px]">
        <span className="text-lg font-bold text-slate-800 tracking-tight">
          {getMonthName(selectedDate)} {selectedDate.getFullYear()}
        </span>
      </div>
      <button 
        onClick={handleNext} 
        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 active:scale-95 transition-all hover:bg-slate-50"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const CategoryIcon: React.FC<{ category: CategoryType; className?: string }> = ({ category, className }) => {
  const baseClass = "p-2.5 rounded-xl bg-slate-50 text-slate-600 " + (className || "");
  switch (category) {
    case 'Housing & Utilities': return <div className={baseClass}><Home size={22} /></div>;
    case 'Food & Groceries': return <div className={baseClass}><ShoppingCart size={22} /></div>;
    case 'Transportation': return <div className={baseClass}><Car size={22} /></div>;
    case 'Health & Medical': return <div className={baseClass}><HeartPulse size={22} /></div>;
    case 'Education & Learning': return <div className={baseClass}><Book size={22} /></div>;
    case 'Personal & Lifestyle': return <div className={baseClass}><Briefcase size={22} /></div>;
    case 'Entertainment & Leisure': return <div className={baseClass}><Film size={22} /></div>;
    case 'Travel & Vacation': return <div className={baseClass}><Plane size={22} /></div>;
    case 'Family & Social': return <div className={baseClass}><Heart size={22} /></div>;
    case 'Financial Commitments': return <div className={baseClass}><Banknote size={22} /></div>;
    case 'Digital & Online': return <div className={baseClass}><Monitor size={22} /></div>;
    case 'Household & Miscellaneous': return <div className={baseClass}><Wrench size={22} /></div>;
    case 'Emergency / Irregular': return <div className={baseClass}><AlertTriangle size={22} /></div>;
    case 'Income': return <div className={baseClass}><Coins size={22} /></div>;
    default: return <div className={baseClass}><Tag size={22} /></div>;
  }
};

const TransactionRow: React.FC<{ 
  transaction: Transaction; 
  currency: Currency; 
  onDelete: (id: string) => void 
}> = ({ transaction, currency, onDelete }) => (
  <div className="group flex items-center justify-between p-4 bg-white rounded-2xl mb-3 border border-slate-50 shadow-sm active:bg-slate-50 transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${transaction.isExpense ? 'bg-slate-50 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}>
        <CategoryIcon category={transaction.category} className="!p-0 !bg-transparent" />
      </div>
      <div className="max-w-[150px]">
        <p className="font-bold text-slate-800 text-sm truncate">{transaction.title}</p>
        <div className="flex items-center gap-1">
          <p className="text-[10px] text-slate-400 font-medium truncate">
            {transaction.subCategory || transaction.category}
          </p>
          <span className="text-[8px] bg-slate-100 px-1 rounded uppercase font-bold text-slate-400">
            {transaction.paymentMethod}
          </span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className={`font-bold ${transaction.isExpense ? 'text-slate-900' : 'text-emerald-600'}`}>
          {transaction.isExpense ? '-' : '+'}{currency}{transaction.amount.toLocaleString()}
        </p>
        <p className="text-[9px] text-slate-300 font-medium">{new Date(transaction.date).toLocaleDateString()}</p>
      </div>
      <button 
        onClick={() => onDelete(transaction.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Fix: Added missing timeRange state for Insights view
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  
  // Form States
  const [newCatName, setNewCatName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('Food & Groceries');
  const [newSubCategory, setNewSubCategory] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [isExpenseMode, setIsExpenseMode] = useState(true);
  const [newFrequency] = useState<RecurringFrequency>(RecurringFrequency.NONE);

  // Background Scanning State
  const [detectedSMS, setDetectedSMS] = useState<ParsedSMS | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<Partial<Transaction & { frequency: RecurringFrequency }> | null>(null);

  useEffect(() => {
    const init = async () => {
      const txs = await storageService.getTransactions();
      const bgs = await storageService.getBudgets();
      const rts = await storageService.getRecurringTemplates();
      const cats = await storageService.getCategories();
      const p = await storageService.getPreferences();
      
      setTransactions(txs);
      setBudgets(bgs);
      setRecurringTemplates(rts);
      setCategories(cats);
      setPrefs(p);
    };
    init();
  }, []);

  // Filtered transactions for the current selection
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isSameMonth(new Date(t.date), selectedDate));
  }, [transactions, selectedDate]);

  const totalExpense = useMemo(() => filteredTransactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const totalIncome = useMemo(() => filteredTransactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPercent = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsedPercent = Math.min(100, (totalExpense / prefs.totalMonthlyIncome) * 100);

  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      if (t.isExpense) {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    });
    return map;
  }, [filteredTransactions]);

  const budgetAlerts = useMemo(() => {
    return budgets.map(b => {
      const spent = categorySpending[b.category] || 0;
      const percent = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      return { category: b.category, spent, limit: b.limitAmount, percent };
    }).filter(a => a.percent >= 80).sort((a, b) => b.percent - a.percent);
  }, [budgets, categorySpending]);

  const insightsData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.isExpense);
    
    let timeSeriesData = [];
    if (timeRange === 'daily') {
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      timeSeriesData = [...Array(daysInMonth)].map((_, i) => {
        const dayLabel = (i + 1).toString();
        const dailySum = expenses
          .filter(t => new Date(t.date).getDate() === i + 1)
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: dayLabel, amount: dailySum };
      });
    } else if (timeRange === 'weekly') {
      timeSeriesData = [1, 2, 3, 4].map((week) => {
        const weeklySum = expenses
          .filter(t => {
            const day = new Date(t.date).getDate();
            if (week === 1) return day <= 7;
            if (week === 2) return day > 7 && day <= 14;
            if (week === 3) return day > 14 && day <= 21;
            return day > 21;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: `W${week}`, amount: weeklySum };
      });
    } else if (timeRange === 'monthly') {
      timeSeriesData = [...Array(6)].map((_, i) => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() - (5 - i));
        const monthStr = d.toLocaleDateString(undefined, { month: 'short' });
        const monthlySum = transactions
          .filter(t => t.isExpense && isSameMonth(new Date(t.date), d))
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: monthStr, amount: monthlySum };
      });
    }

    const categoryBreakdown = categories.map((cat, idx) => {
      const sum = expenses
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat, amount: sum, fill: CHART_COLORS[idx % CHART_COLORS.length] };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    return { timeSeriesData, categoryBreakdown };
  }, [filteredTransactions, transactions, timeRange, categories, selectedDate]);

  const startConfirmation = (custom?: Partial<Transaction & { frequency: RecurringFrequency }>) => {
    const amountStr = custom?.amount?.toString() || newAmount;
    const amount = parseFloat(amountStr);
    const category = custom?.category || newCategory;
    const subCategory = custom?.subCategory || newSubCategory;
    const paymentMethod = custom?.paymentMethod || newPaymentMethod;
    const isExpense = custom?.isExpense ?? isExpenseMode;
    
    const title = custom?.title || newTitle || (subCategory !== '' ? subCategory : category);

    if (isNaN(amount) || amount <= 0) return;

    setPendingTransaction({ title, amount, category, subCategory, paymentMethod, isExpense });
    setDetectedSMS(null);
  };

  const finalizeSave = async () => {
    if (!pendingTransaction) return;
    
    const t: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      title: pendingTransaction.title || (pendingTransaction.subCategory || pendingTransaction.category!),
      amount: pendingTransaction.amount!,
      category: pendingTransaction.category!,
      subCategory: pendingTransaction.subCategory,
      date: new Date().toISOString(),
      isExpense: pendingTransaction.isExpense!,
      paymentMethod: pendingTransaction.paymentMethod || PaymentMethod.UPI,
    };

    try {
      await storageService.saveTransaction(t);
      setTransactions(prev => [t, ...prev]);
      setNewTitle(''); 
      setNewAmount(''); 
      setPendingTransaction(null); 
      setView('dashboard');
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await storageService.addCategory(newCatName.trim());
    const updated = await storageService.getCategories();
    setCategories(updated);
    setNewCatName('');
  };

  const handleDeleteCategory = async (name: string) => {
    if (name === 'Income' || name === 'Food & Groceries') return;
    if (!confirm(`Delete category "${name}"?`)) return;
    await storageService.deleteCategory(name);
    const updated = await storageService.getCategories();
    setCategories(updated);
  };

  const updateBudgetLimit = async (category: string, amount: number) => {
    const newBudgets = [...budgets];
    const index = newBudgets.findIndex(b => b.category === category);
    if (index !== -1) {
      newBudgets[index].limitAmount = amount;
    } else {
      newBudgets.push({ category, limitAmount: amount });
    }
    setBudgets(newBudgets);
    await storageService.saveBudgets(newBudgets);
  };

  const renderDashboard = () => (
    <div className="bg-white min-h-screen pb-32 pt-4 px-6 space-y-6 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20"><ShieldCheck size={24} /></div>
          <div>
            <span className="text-slate-800 font-bold tracking-widest text-[10px] uppercase block">Pro Wallet</span>
            <div className="flex items-center gap-1">
              <Lock size={10} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">AES-256 Encrypted</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-800 hover:scale-110 transition-transform"><Moon size={22} /></button>
          <button onClick={() => setView('setup')} className="text-slate-800 active:scale-90 transition-transform"><Settings size={22} /></button>
        </div>
      </header>

      <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />

      <div className="relative flex justify-center pt-2">
        <div className="w-64 h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Used', value: totalExpense },
                  { name: 'Remaining', value: Math.max(0, prefs.totalMonthlyIncome - totalExpense) }
                ]}
                cx="50%" cy="50%" innerRadius={100} outerRadius={115} startAngle={225} endAngle={-45} paddingAngle={0} dataKey="value" cornerRadius={10}
              >
                <RechartsCell fill="#3b82f6" stroke="none" />
                <RechartsCell fill="#f1f5f9" stroke="none" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-semibold text-slate-400 mb-0.5 uppercase tracking-widest">Spent this month</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{Math.round(budgetUsedPercent)}%</p>
            <p className="text-lg font-bold text-blue-600 mt-1">{prefs.currency}{totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income', value: `${prefs.currency}${formatCurrency(totalIncome)}` },
          { label: 'Spent', value: `${prefs.currency}${formatCurrency(totalExpense)}` },
          { label: 'Saved', value: `${savingsPercent}%`, color: 'text-blue-600' }
        ].map((card, i) => (
          <div key={i} className="bg-white border border-slate-50 rounded-2xl p-4 shadow-sm text-center space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
            <p className={`text-base font-black tracking-tight ${card.color || 'text-slate-900'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {budgetAlerts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget Alerts</h2>
            <div className="h-px flex-1 mx-4 bg-slate-50" />
          </div>
          <div className="space-y-3">
            {budgetAlerts.slice(0, 3).map((alert, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={alert.category} className="!p-2 !bg-white !shadow-sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{alert.category}</p>
                    <div className="w-32 h-1 bg-white rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${alert.percent > 100 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, alert.percent)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${alert.percent > 100 ? 'text-red-500' : 'text-orange-600'}`}>
                    {Math.round(alert.percent)}%
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    {prefs.currency}{alert.spent.toLocaleString()} / {prefs.currency}{alert.limit.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">Vault History</h1>
        <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />
      </div>
      <div className="space-y-1">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Clock size={48} className="mb-4 text-slate-200" />
            <p className="text-center text-slate-400 font-bold">No entries for this month</p>
          </div>
        ) : (
          filteredTransactions.map(t => (
            <TransactionRow key={t.id} transaction={t} currency={prefs.currency} onDelete={id => storageService.deleteTransaction(id).then(() => setTransactions(prev => prev.filter(p => p.id !== id)))} />
          ))
        )}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="bg-slate-50 min-h-screen px-4 pb-32 pt-6 space-y-6 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900 px-2">Trends</h1>
        <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />
      </div>

      <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm mx-2">
        {(['daily', 'weekly', 'monthly'] as const).map((r) => (
          <button 
            key={r}
            onClick={() => setTimeRange(r)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeRange === r ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <Tag size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">Top Categories</h2>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="w-32 h-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insightsData.categoryBreakdown}
                  cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={8} dataKey="amount" cornerRadius={6} stroke="none"
                >
                  {insightsData.categoryBreakdown.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {insightsData.categoryBreakdown.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{item.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900">{prefs.currency}{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Spending Velocity</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={insightsData.timeSeriesData}>
              <defs>
                <linearGradient id="colorAmtTrends" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" axisLine={false} tickLine={false} 
                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                interval={timeRange === 'daily' ? 4 : 0}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmtTrends)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="bg-white min-h-screen px-6 pb-32 pt-6 space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"><Target size={24} /></div>
        <h1 className="text-2xl font-black text-slate-900">Budget Setup</h1>
      </div>

      <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-8 shadow-inner">
        <div className="space-y-1">
          <p className="text-xs font-bold text-black uppercase tracking-widest ml-1">Monthly Goal Allocation</p>
          <p className="text-[10px] text-slate-500 font-medium ml-1">Set spending limits per category</p>
        </div>
        
        <div className="space-y-5">
          {categories.filter(c => c !== 'Income').map(cat => {
            const b = budgets.find(b => b.category === cat);
            return (
              <div key={cat} className="space-y-2 group">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-black">{cat}</span>
                  </div>
                  <span className="text-[11px] font-black text-blue-600">{prefs.currency}{b?.limitAmount.toLocaleString() || 0}</span>
                </div>
                <div className="relative flex items-center bg-white rounded-2xl p-4 gap-3 border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                  <span className="text-sm font-bold text-black opacity-40">{prefs.currency}</span>
                  <input 
                    type="number" 
                    defaultValue={b?.limitAmount || 0}
                    onBlur={(e) => updateBudgetLimit(cat, parseInt(e.target.value) || 0)}
                    className="bg-transparent border-none outline-none font-bold text-black w-full text-base placeholder:text-slate-300"
                    placeholder="Enter limit"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderAdd = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-8 animate-in slide-in-from-bottom-full duration-500 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center">
        <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-slate-400"><ChevronLeft size={28} /></button>
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Add Secure Entry</h1>
        <div className="w-8" />
      </div>
      
      <div className="text-center space-y-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Amount</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black text-slate-300">{prefs.currency}</span>
          <input 
            autoFocus type="number" inputMode="decimal" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
            placeholder="0" className="text-6xl font-black text-slate-900 bg-transparent border-none outline-none w-2/3 text-center [appearance:textfield] placeholder:text-slate-100"
          />
        </div>
      </div>

      <div className="flex bg-slate-50 p-1.5 rounded-2xl">
        <button onClick={() => { setIsExpenseMode(true); setNewCategory('Food & Groceries'); }} className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${isExpenseMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Expense</button>
        <button onClick={() => { setIsExpenseMode(false); setNewCategory('Income'); }} className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${!isExpenseMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Income</button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Label (Optional)</label>
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Starbucks Coffee" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 focus:outline-none"/>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
          <div className="grid grid-cols-4 gap-2">
            {[PaymentMethod.UPI, PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.NET_BANKING].map((method) => (
              <button
                key={method}
                onClick={() => setNewPaymentMethod(method)}
                className={`py-3 rounded-xl text-[9px] font-bold uppercase transition-all border ${newPaymentMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
          <div className="grid grid-cols-3 gap-3">
            {(isExpenseMode ? categories.filter(k => k !== 'Income') : ['Income']).map(cat => (
              <button 
                key={cat} 
                onClick={() => {
                  setNewCategory(cat);
                  setNewSubCategory('');
                }} 
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${newCategory === cat ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-transparent'}`}
              >
                <CategoryIcon category={cat} className={`!p-0 !bg-transparent ${newCategory === cat ? '!text-blue-600' : '!text-slate-400'}`} />
                <span className={`text-[8px] font-bold uppercase text-center leading-tight ${newCategory === cat ? 'text-blue-600' : 'text-slate-400'}`}>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => startConfirmation()} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-sm uppercase tracking-widest mt-6 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-transform">Encrypt & Save</button>
    </div>
  );

  const renderSetup = () => (
    <div className="bg-white min-h-screen px-6 pb-32 pt-6 space-y-10 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-full duration-400">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-slate-400 active:scale-90 transition-transform"><ChevronLeft size={28} /></button>
        <h1 className="text-2xl font-black text-slate-900">Setup</h1>
      </div>
      
      <div className="space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/20"><FolderPlus size={18}/></div>
            <h2 className="text-lg font-bold text-slate-800">Category Management</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-6">
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Create Custom Category</label>
               <div className="flex gap-2">
                 <input 
                    type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Subscriptions" 
                    className="flex-1 bg-white rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none border border-slate-100 shadow-sm"
                 />
                 <button onClick={handleAddCategory} className="bg-blue-600 text-white p-3 rounded-xl shadow-md shadow-blue-500/20 active:scale-90 transition-transform">
                   <Plus size={20} />
                 </button>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex flex-wrap gap-2">
                 {categories.map(cat => (
                   <div key={cat} className="flex items-center gap-2 bg-white py-2 pl-4 pr-2 rounded-full border border-slate-100 shadow-sm group">
                     <span className="text-[11px] font-bold text-slate-700">{cat}</span>
                     {cat !== 'Income' && cat !== 'Food & Groceries' && (
                       <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                         <X size={14} />
                       </button>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
             <div className="p-2 bg-slate-200 text-slate-700 rounded-lg"><Settings size={18}/></div>
             <h2 className="text-lg font-bold text-slate-800">Preferences</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Display Currency</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(Currency).map(([key, symbol]) => (
                  <button 
                    key={key} 
                    onClick={() => { 
                      const newP = {...prefs, currency: symbol as Currency}; 
                      setPrefs(newP); 
                      storageService.savePreferences(newP); 
                    }} 
                    className={`py-3 rounded-xl text-lg font-bold transition-all ${prefs.currency === symbol ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Monthly Income Target</label>
              <div className="flex items-center bg-white rounded-2xl p-4 gap-3 border border-slate-100 shadow-sm">
                <span className="font-bold text-slate-400">{prefs.currency}</span>
                <input 
                  type="number" 
                  value={prefs.totalMonthlyIncome} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const newP = {...prefs, totalMonthlyIncome: val};
                    setPrefs(newP);
                    storageService.savePreferences(newP);
                  }}
                  className="bg-transparent border-none outline-none font-bold text-slate-800 w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-md"><Lock size={18}/></div>
            <h2 className="text-lg font-bold text-slate-800">Security Vault</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
             <button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(transactions)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `private_vault.json`;
                  a.click();
                }}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-sm active:scale-95 transition-transform"
              >
                <Download size={14}/> Export Vault
              </button>
              <button 
                onClick={() => {
                   if(confirm('Wipe all local data? This cannot be undone.')) {
                     storageService.clearAll();
                     window.location.reload();
                   }
                }}
                className="w-full py-3 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear All Data
              </button>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto min-h-screen bg-white relative overflow-x-hidden shadow-2xl">
        <main className="min-h-screen">
          {view === 'dashboard' && renderDashboard()}
          {view === 'history' && renderHistory()}
          {view === 'add' && renderAdd()}
          {view === 'insights' && renderInsights()}
          {view === 'budget' && renderBudget()}
          {view === 'setup' && renderSetup()}
        </main>
        {view !== 'add' && view !== 'setup' && <Navbar current={view} setView={setView} />}
        {pendingTransaction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPendingTransaction(null)}/>
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex flex-col items-center space-y-6">
                <CategoryIcon category={pendingTransaction.category!} />
                <div className="w-full text-center space-y-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Entry</h3>
                  <p className="text-3xl font-black text-slate-900">{prefs.currency}{pendingTransaction.amount}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-full px-4">
                    {pendingTransaction.title}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest opacity-70">
                    {pendingTransaction.category} {pendingTransaction.subCategory && `• ${pendingTransaction.subCategory}`}
                  </p>
                </div>
                <button onClick={finalizeSave} className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 active:scale-[0.98] transition-transform shadow-lg shadow-blue-500/20">Save Securely</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
