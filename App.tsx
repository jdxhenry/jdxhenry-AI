
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
  Wallet
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
const CHART_COLORS = ['#EC4899', '#F59E0B', '#64748B', '#4F46E5', '#10B981', '#8B5CF6', '#F97316', '#06B6D4'];

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
        onClick={() => setView('settings')}
        className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${current === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <Settings size={24} strokeWidth={current === 'settings' ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-tight">Setup</span>
      </button>
    </nav>
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
    default: return <div className={baseClass}><Box size={22} /></div>;
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
  const [smsPermission, setSmsPermission] = useState<boolean>(() => {
    return localStorage.getItem('sms_detection_enabled') === 'true';
  });
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Background Scanning State
  const [detectedSMS, setDetectedSMS] = useState<ParsedSMS | null>(null);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>(Object.keys(CATEGORY_MAP)[1]); // Default Food & Groceries
  const [newSubCategory, setNewSubCategory] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [isExpenseMode, setIsExpenseMode] = useState(true);
  const [newFrequency, setNewFrequency] = useState<RecurringFrequency>(RecurringFrequency.NONE);

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
      processRecurringTransactions(rts);
    };
    init();
  }, []);

  const processRecurringTransactions = async (templates: RecurringTemplate[]) => {
    const now = new Date();
    let updatedTemplates = [...templates];
    let newTxns: Transaction[] = [];

    updatedTemplates = updatedTemplates.map(template => {
      let lastDate = new Date(template.lastProcessedDate);
      let nextDate = new Date(lastDate);

      if (template.frequency === RecurringFrequency.DAILY) nextDate.setDate(lastDate.getDate() + 1);
      if (template.frequency === RecurringFrequency.WEEKLY) nextDate.setDate(lastDate.getDate() + 7);
      if (template.frequency === RecurringFrequency.MONTHLY) nextDate.setMonth(lastDate.getMonth() + 1);

      if (now >= nextDate && template.frequency !== RecurringFrequency.NONE) {
        const newT: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          title: `[Recurring] ${template.title}`,
          amount: template.amount,
          category: template.category,
          subCategory: template.subCategory,
          date: nextDate.toISOString(),
          isExpense: template.isExpense,
          paymentMethod: template.paymentMethod
        };
        newTxns.push(newT);
        storageService.saveTransaction(newT);
        return { ...template, lastProcessedDate: nextDate.toISOString() };
      }
      return template;
    });

    if (newTxns.length > 0) {
      setTransactions(prev => [...newTxns, ...prev]);
      for (const t of updatedTemplates) {
        await storageService.updateRecurringTemplate(t);
      }
      setRecurringTemplates(updatedTemplates);
    }
  };

  useEffect(() => {
    const backgroundScanner = setInterval(() => {
      if (!smsPermission || detectedSMS) return;
      if (Math.random() < 0.15) {
        const smsText = getSimulatedSMS();
        const parsed = parseSMS(smsText);
        if (parsed) setDetectedSMS(parsed);
      }
    }, 15000);
    return () => clearInterval(backgroundScanner);
  }, [detectedSMS, smsPermission]);

  const totalExpense = useMemo(() => transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalIncome = useMemo(() => transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPercent = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsedPercent = Math.min(100, (totalExpense / prefs.totalMonthlyIncome) * 100);

  const insightsData = useMemo(() => {
    const expenses = transactions.filter(t => t.isExpense);
    const totalExpensesSum = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    let timeSeriesData = [];
    if (timeRange === 'daily') {
      timeSeriesData = [...Array(30)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        const dailySum = expenses
          .filter(t => new Date(t.date).toDateString() === d.toDateString())
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: dateStr, amount: dailySum };
      });
    } else if (timeRange === 'weekly') {
      timeSeriesData = [...Array(12)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (11 - i) * 7);
        const label = `W${12-i}`;
        const weeklySum = expenses
          .filter(t => {
            const txDate = new Date(t.date);
            const diffTime = Math.abs(d.getTime() - txDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: label, amount: weeklySum };
      });
    } else if (timeRange === 'monthly') {
      timeSeriesData = [...Array(6)].map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const monthStr = d.toLocaleDateString(undefined, { month: 'short' });
        const monthlySum = expenses
          .filter(t => {
            const txDate = new Date(t.date);
            return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: monthStr, amount: monthlySum };
      });
    }

    const categoryBreakdown = Object.keys(CATEGORY_MAP).map((cat, idx) => {
      const sum = expenses
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      return { 
        name: cat, 
        amount: sum, 
        fill: CHART_COLORS[idx % CHART_COLORS.length],
        percentage: totalExpensesSum > 0 ? ((sum / totalExpensesSum) * 100).toFixed(1) : "0"
      };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    return { timeSeriesData, categoryBreakdown, totalExpensesSum };
  }, [transactions, timeRange]);

  const handleSaveDirectly = async (custom?: Partial<Transaction & { frequency: RecurringFrequency }>) => {
    const amountStr = custom?.amount?.toString() || newAmount;
    const amount = parseFloat(amountStr);
    const category = custom?.category || newCategory;
    const subCategory = custom?.subCategory || newSubCategory;
    const paymentMethod = custom?.paymentMethod || newPaymentMethod;
    const isExpense = custom?.isExpense ?? isExpenseMode;
    const frequency = custom?.frequency || newFrequency;
    
    const title = custom?.title || newTitle || (subCategory !== '' ? subCategory : category);

    if (isNaN(amount) || amount <= 0) return;

    const t: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      title: title || (subCategory || category),
      amount: amount,
      category: category,
      subCategory: subCategory,
      date: new Date().toISOString(),
      isExpense: isExpense,
      paymentMethod: paymentMethod || PaymentMethod.UPI,
    };

    try {
      await storageService.saveTransaction(t);
      setTransactions(prev => [t, ...prev]);

      if (frequency && frequency !== RecurringFrequency.NONE) {
        const template: RecurringTemplate = {
          id: Math.random().toString(36).substr(2, 9),
          title: t.title,
          amount: t.amount,
          category: t.category,
          subCategory: t.subCategory,
          isExpense: t.isExpense,
          paymentMethod: t.paymentMethod,
          frequency: frequency,
          lastProcessedDate: t.date,
          startDate: t.date
        };
        await storageService.saveRecurringTemplate(template);
        setRecurringTemplates(prev => [...prev, template]);
      }
      
      setNewTitle(''); 
      setNewAmount(''); 
      setDetectedSMS(null);
      setView('dashboard');
      setNewSubCategory('');
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save transaction securely.");
    }
  };

  const renderDashboard = () => (
    <div className="bg-white min-h-screen pb-32 pt-4 px-6 space-y-8 animate-in fade-in duration-500">
      {detectedSMS && (
        <div className="fixed top-6 left-6 right-6 z-[100] animate-in slide-in-from-top-full duration-500">
          <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl"><Bell size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">New UPI SMS</p>
                <p className="text-sm font-bold truncate max-w-[140px]">{prefs.currency}{detectedSMS.amount} at {detectedSMS.title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDetectedSMS(null)} className="p-2 text-slate-400 hover:text-white"><X size={18}/></button>
              <button onClick={() => handleSaveDirectly({ ...detectedSMS, paymentMethod: PaymentMethod.UPI } as any)} className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1">Add <ArrowRight size={14}/></button>
            </div>
          </div>
        </div>
      )}

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
      </header>

      <div className="relative flex justify-center py-4">
        <div className="w-72 h-72 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Used', value: totalExpense },
                  { name: 'Remaining', value: Math.max(0, prefs.totalMonthlyIncome - totalExpense) }
                ]}
                cx="50%" cy="50%" innerRadius={110} outerRadius={125} startAngle={225} endAngle={-45} paddingAngle={0} dataKey="value" cornerRadius={10}
              >
                <RechartsCell fill="#3b82f6" stroke="none" />
                <RechartsCell fill="#f1f5f9" stroke="none" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-slate-400 mb-1">Budget Spent</p>
            <p className="text-6xl font-black text-slate-900 tracking-tighter">{Math.round(budgetUsedPercent)}%</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{prefs.currency}{totalExpense.toLocaleString()}</p>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
            <p className={`text-lg font-black tracking-tight ${card.color || 'text-slate-900'}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="bg-white min-h-screen px-4 pb-32 pt-6 space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-lg font-bold text-slate-900">Expenses by Category</h1>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 w-full max-w-xs">
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
      </div>

      <div className="flex flex-col items-center gap-8 py-4">
        <div className="w-full h-64 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={insightsData.categoryBreakdown}
                cx="50%" cy="50%" 
                innerRadius={70} 
                outerRadius={95} 
                paddingAngle={4} 
                dataKey="amount" 
                cornerRadius={8} 
                stroke="none"
              >
                {insightsData.categoryBreakdown.map((entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <p className="text-4xl font-black text-slate-900 leading-none">{insightsData.categoryBreakdown.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">categories</p>
          </div>
        </div>

        <div className="w-full px-4 space-y-4">
          {insightsData.categoryBreakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-3.5 h-3.5 rounded-md shadow-sm" style={{ backgroundColor: item.fill }} />
                <span className="text-sm font-semibold text-slate-600 transition-colors group-hover:text-slate-900">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400">{item.percentage}%</span>
                <span className="text-sm font-black text-slate-900 min-w-[60px] text-right">{prefs.currency}{formatCurrency(item.amount)}</span>
              </div>
            </div>
          ))}
          
          {insightsData.categoryBreakdown.length === 0 && (
            <div className="py-12 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No data for this range</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4 mx-2">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spending Velocity</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={insightsData.timeSeriesData}>
              <defs>
                <linearGradient id="colorAmtTrends" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" axisLine={false} tickLine={false} 
                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                interval={timeRange === 'daily' ? 6 : 0}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmtTrends)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Vault History</h1>
      <div className="space-y-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
        {transactions.length === 0 ? (
          <p className="text-center text-slate-400 py-20 font-bold">No entries yet</p>
        ) : (
          transactions.map(t => (
            <TransactionRow key={t.id} transaction={t} currency={prefs.currency} onDelete={id => storageService.deleteTransaction(id).then(() => setTransactions(prev => prev.filter(p => p.id !== id)))} />
          ))
        )}
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
        <button onClick={() => { setIsExpenseMode(true); setNewCategory(Object.keys(CATEGORY_MAP)[1]); }} className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${isExpenseMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Expense</button>
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
            {(isExpenseMode ? Object.keys(CATEGORY_MAP).filter(k => k !== 'Income') : ['Income']).map(cat => (
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

        {newCategory && CATEGORY_MAP[newCategory] && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sub-category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_MAP[newCategory].map(sub => (
                <button
                  key={sub}
                  onClick={() => setNewSubCategory(sub)}
                  className={`px-3 py-2 rounded-full text-[9px] font-bold uppercase transition-all border ${newSubCategory === sub ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-transparent'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => handleSaveDirectly()} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-sm uppercase tracking-widest mt-6 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-transform">Encrypt & Save</button>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white min-h-screen px-6 pb-32 pt-6 space-y-10">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-slate-400"><ChevronLeft size={28} /></button>
        <h1 className="text-2xl font-black text-slate-900">Setup</h1>
      </div>
      <div className="space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-emerald-600 text-white rounded-lg"><Lock size={18}/></div>
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
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600"
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
                className="w-full py-3 text-red-500 text-[10px] font-bold uppercase tracking-widest"
              >
                Clear All Data
              </button>
          </div>
        </section>
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
             <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Settings size={18}/></div>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Monthly Income Target</label>
              <div className="flex items-center bg-white rounded-2xl p-4 gap-3 border border-slate-100">
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
          {view === 'settings' && renderSettings()}
        </main>
        {view !== 'add' && <Navbar current={view} setView={setView} />}
      </div>
    </div>
  );
}
