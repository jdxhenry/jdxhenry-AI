
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
  Download
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
  Category, 
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
    case Category.HOUSING: return <div className={baseClass}><Home size={22} /></div>;
    case Category.GROCERIES: return <div className={baseClass}><ShoppingCart size={22} /></div>;
    case Category.TRANSPORT: return <div className={baseClass}><Car size={22} /></div>;
    case Category.LEISURE: return <div className={baseClass}><Coffee size={22} /></div>;
    case Category.HEALTHCARE: return <div className={baseClass}><HeartPulse size={22} /></div>;
    case Category.UTILITIES: return <div className={baseClass}><Zap size={22} /></div>;
    case Category.INCOME: return <div className={baseClass}><Banknote size={22} /></div>;
    case Category.OTHER: return <div className={baseClass}><MoreHorizontal size={22} /></div>;
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
      <div>
        <p className="font-bold text-slate-800 text-sm">{transaction.title}</p>
        <p className="text-[11px] text-slate-400 font-medium">{new Date(transaction.date).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className={`font-bold ${transaction.isExpense ? 'text-slate-900' : 'text-emerald-600'}`}>
          {transaction.isExpense ? '-' : '+'}{currency}{transaction.amount.toLocaleString()}
        </p>
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
  const [pendingTransaction, setPendingTransaction] = useState<Partial<Transaction & { frequency: RecurringFrequency }> | null>(null);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>(Category.GROCERIES);
  const [isExpenseMode, setIsExpenseMode] = useState(true);
  const [newFrequency, setNewFrequency] = useState<RecurringFrequency>(RecurringFrequency.NONE);
  const [customCategoryName, setCustomCategoryName] = useState('');

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
      if (!smsPermission || detectedSMS || pendingTransaction) return;
      if (Math.random() < 0.15) {
        const smsText = getSimulatedSMS();
        const parsed = parseSMS(smsText);
        if (parsed) setDetectedSMS(parsed);
      }
    }, 15000);
    return () => clearInterval(backgroundScanner);
  }, [detectedSMS, pendingTransaction, smsPermission]);

  const totalExpense = useMemo(() => transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalIncome = useMemo(() => transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPercent = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsedPercent = Math.min(100, (totalExpense / prefs.totalMonthlyIncome) * 100);

  // --- Insights ---
  const insightsData = useMemo(() => {
    const expenses = transactions.filter(t => t.isExpense);
    
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

    const categoryBreakdown = categories.map((cat, idx) => {
      const sum = expenses
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat, amount: sum, fill: CHART_COLORS[idx % CHART_COLORS.length] };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    return { timeSeriesData, categoryBreakdown };
  }, [transactions, categories, timeRange]);

  const startConfirmation = (custom?: Partial<Transaction & { frequency: RecurringFrequency }>) => {
    const title = custom?.title || newTitle;
    const amountStr = custom?.amount?.toString() || newAmount;
    const amount = parseFloat(amountStr);
    const category = custom?.category || (isExpenseMode ? newCategory : Category.INCOME);
    const isExpense = custom?.isExpense ?? isExpenseMode;
    const frequency = custom?.frequency || newFrequency;
    if (!title || isNaN(amount) || amount <= 0) return;
    setPendingTransaction({ title, amount, category, isExpense, frequency });
    setDetectedSMS(null);
  };

  const finalizeSave = async () => {
    if (!pendingTransaction) return;
    const t: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      title: pendingTransaction.title!,
      amount: pendingTransaction.amount!,
      category: pendingTransaction.category!,
      date: new Date().toISOString(),
      isExpense: pendingTransaction.isExpense!,
      paymentMethod: PaymentMethod.CASH,
    };
    await storageService.saveTransaction(t);
    setTransactions(prev => [t, ...prev]);
    if (pendingTransaction.frequency && pendingTransaction.frequency !== RecurringFrequency.NONE) {
      const template: RecurringTemplate = {
        id: Math.random().toString(36).substr(2, 9),
        title: t.title,
        amount: t.amount,
        category: t.category,
        isExpense: t.isExpense,
        paymentMethod: t.paymentMethod,
        frequency: pendingTransaction.frequency,
        lastProcessedDate: t.date,
        startDate: t.date
      };
      await storageService.saveRecurringTemplate(template);
      setRecurringTemplates(prev => [...prev, template]);
    }
    setNewTitle(''); setNewAmount(''); setPendingTransaction(null); setView('dashboard');
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
              <button onClick={() => startConfirmation(detectedSMS as any)} className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1">Review <ArrowRight size={14}/></button>
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
        <div className="flex items-center gap-4">
          <button className="text-slate-800"><Moon size={24} /></button>
          <button onClick={() => setView('settings')} className="text-slate-800"><Settings size={24} /></button>
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
    <div className="bg-slate-50 min-h-screen px-4 pb-32 pt-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-2xl font-black text-slate-900">Trends</h1>
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
          {(['daily', 'weekly', 'monthly'] as const).map((r) => (
            <button 
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeRange === r ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <Tag size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">Top Category</h2>
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
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[80px]">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{prefs.currency}{formatCurrency(item.amount)}</span>
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
                interval={timeRange === 'daily' ? 6 : 0}
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

  const renderHistory = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Vault History</h1>
      <div className="space-y-1">
        {transactions.map(t => (
          <TransactionRow key={t.id} transaction={t} currency={prefs.currency} onDelete={id => storageService.deleteTransaction(id).then(() => setTransactions(prev => prev.filter(p => p.id !== id)))} />
        ))}
      </div>
    </div>
  );

  const renderAdd = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-8 animate-in slide-in-from-bottom-full duration-500">
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
      <div className="space-y-6">
        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Label" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 focus:outline-none"/>
        <button onClick={() => startConfirmation()} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-sm uppercase tracking-widest mt-6 shadow-xl shadow-blue-500/20">Encrypt & Save</button>
      </div>
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
          </div>
        </section>
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
             <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Settings size={18}/></div>
             <h2 className="text-lg font-bold text-slate-800">Preferences</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
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
        {pendingTransaction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPendingTransaction(null)}/>
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex flex-col items-center space-y-6">
                <CategoryIcon category={pendingTransaction.category!} />
                <div className="w-full text-center space-y-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Entry</h3>
                  <p className="text-3xl font-black text-slate-900">{prefs.currency}{pendingTransaction.amount}</p>
                </div>
                <button onClick={finalizeSave} className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600">Save Securely</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
