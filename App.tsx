
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
  ChevronDown
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

// --- Helper for Formatting ---
const formatCurrency = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return Math.round(val).toLocaleString();
};

// --- Components ---

const Navbar: React.FC<{ current: ViewState; setView: (v: ViewState) => void }> = ({ current, setView }) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'history', icon: Calendar, label: 'History' },
    { id: 'insights', icon: TrendingUp, label: 'Trends' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-8 py-4 pb-8 flex justify-between items-center z-50">
      {items.map(({ id, icon: Icon, label }) => (
        <button 
          key={id}
          onClick={() => setView(id as ViewState)}
          className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${current === id ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Icon size={24} strokeWidth={current === id ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">{label}</span>
        </button>
      ))}
      <div className="relative">
        <button 
          onClick={() => setView('add')}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-500/40 active:scale-90 transition-transform flex items-center justify-center -mt-10"
        >
          <Plus size={32} />
        </button>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">Wallets</span>
      </div>
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
  const [prefs, setPrefs] = useState<UserPreferences>(storageService.getPreferences());
  const [smsPermission, setSmsPermission] = useState<boolean>(() => {
    return localStorage.getItem('sms_detection_enabled') === 'true';
  });
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Background Scanning State
  const [detectedSMS, setDetectedSMS] = useState<ParsedSMS | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<Partial<Transaction & { frequency: RecurringFrequency }> | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>(Category.GROCERIES);
  const [isExpenseMode, setIsExpenseMode] = useState(true);
  const [newFrequency, setNewFrequency] = useState<RecurringFrequency>(RecurringFrequency.NONE);
  const [customCategoryName, setCustomCategoryName] = useState('');

  useEffect(() => {
    setTransactions(storageService.getTransactions());
    setBudgets(storageService.getBudgets());
    setRecurringTemplates(storageService.getRecurringTemplates());
    setCategories(storageService.getCategories());
    processRecurringTransactions();
  }, []);

  const processRecurringTransactions = () => {
    const templates = storageService.getRecurringTemplates();
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
      localStorage.setItem('budget_tracker_recurring', JSON.stringify(updatedTemplates));
      setRecurringTemplates(updatedTemplates);
    }
  };

  useEffect(() => {
    const backgroundScanner = setInterval(() => {
      if (!smsPermission || detectedSMS || pendingTransaction || editingTemplate) return;
      if (Math.random() < 0.15) {
        const smsText = getSimulatedSMS();
        const parsed = parseSMS(smsText);
        if (parsed) setDetectedSMS(parsed);
      }
    }, 15000);
    return () => clearInterval(backgroundScanner);
  }, [detectedSMS, pendingTransaction, editingTemplate, smsPermission]);

  const totalExpense = useMemo(() => transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalIncome = useMemo(() => transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPercent = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsedPercent = Math.min(100, (totalExpense / prefs.totalMonthlyIncome) * 100);

  // --- Enhanced Insights / Trends Data Calculation ---
  const insightsData = useMemo(() => {
    const expenses = transactions.filter(t => t.isExpense);
    
    // Time Series grouping
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

    // Category breakdown
    const categoryBreakdown = categories.map((cat, idx) => {
      const sum = expenses
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat, amount: sum, fill: CHART_COLORS[idx % CHART_COLORS.length] };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    return { timeSeriesData, categoryBreakdown };
  }, [transactions, categories, timeRange]);

  const handleToggleSMS = () => {
    const nextState = !smsPermission;
    setSmsPermission(nextState);
    localStorage.setItem('sms_detection_enabled', String(nextState));
  };

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

  const finalizeSave = () => {
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
    storageService.saveTransaction(t);
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
      storageService.saveRecurringTemplate(template);
      setRecurringTemplates(prev => [...prev, template]);
    }
    setNewTitle(''); setNewAmount(''); setPendingTransaction(null); setView('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Delete this transaction?')) {
      storageService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleAddCategory = () => {
    if (!customCategoryName.trim()) return;
    storageService.addCategory(customCategoryName.trim());
    setCategories(storageService.getCategories());
    setCustomCategoryName('');
  };

  const handleDeleteCategory = (name: string) => {
    if (confirm(`Remove "${name}"?`)) {
      storageService.deleteCategory(name);
      setCategories(storageService.getCategories());
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
              <button onClick={() => startConfirmation(detectedSMS as any)} className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">Review <ArrowRight size={14}/></button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20"><ShieldCheck size={24} /></div>
          <span className="text-slate-800 font-bold tracking-widest text-sm uppercase">Private</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-800"><Moon size={24} /></button>
          <button onClick={() => setView('settings')} className="text-slate-800"><Settings size={24} /></button>
        </div>
      </header>

      {!smsPermission && (
        <div className="bg-blue-600 rounded-[2rem] p-6 text-white space-y-4 shadow-xl shadow-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl"><Sparkles size={24} /></div>
            <div><h3 className="font-black text-lg">Smart Sync</h3><p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Log expenses automatically</p></div>
          </div>
          <button onClick={handleToggleSMS} className="w-full bg-white text-blue-600 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest">Enable Smart Detection</button>
        </div>
      )}

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
            <p className="text-xs font-semibold text-slate-400 mb-1">Budget Used</p>
            <p className="text-6xl font-black text-slate-900 tracking-tighter">{Math.round(budgetUsedPercent)}%</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{prefs.currency}{totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income', value: `${prefs.currency}${formatCurrency(totalIncome)}` },
          { label: 'Expenses', value: `${prefs.currency}${formatCurrency(totalExpense)}` },
          { label: 'Savings', value: `${savingsPercent}%`, color: 'text-blue-600' }
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

      {/* Top Category Card (Image Style) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <Tag size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">Top Category</h2>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
             <div className="flex items-center gap-1 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold">
               <Calendar size={12}/> Recent <ChevronDown size={12}/>
             </div>
             <MoreHorizontal size={18} />
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
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[80px]">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{prefs.currency}{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <button className="text-[10px] font-bold text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg mt-2 uppercase tracking-widest">More Details ...</button>
          </div>
        </div>
      </div>

      {/* Spending Velocity Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Spending Velocity</h2>
          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
            <ArrowUpRight size={14}/> +12.5%
          </div>
        </div>
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
                formatter={(value: number) => [`${prefs.currency}${value.toLocaleString()}`, 'Spent']}
              />
              <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmtTrends)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight Card */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex items-center gap-4 shadow-xl">
        <div className="bg-blue-600 p-3 rounded-2xl">
          <Sparkles size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm">Smart Summary</h4>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Your daily average is <span className="text-white font-bold">{prefs.currency}{Math.round(totalExpense / 30)}</span>. Most of your money goes to <span className="text-blue-400 font-bold uppercase">{insightsData.categoryBreakdown[0]?.name || 'uncategorized'}</span> items.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAdd = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-8 animate-in slide-in-from-bottom-full duration-500">
      <div className="flex justify-between items-center">
        <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-slate-400"><ChevronLeft size={28} /></button>
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-widest">New Entry</h1>
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
        <button onClick={() => { setIsExpenseMode(true); setNewCategory(Category.GROCERIES); }} className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${isExpenseMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Expense</button>
        <button onClick={() => { setIsExpenseMode(false); setNewCategory(Category.INCOME); }} className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${!isExpenseMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Income</button>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Label</label>
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Weekly Groceries" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 focus:outline-none"/>
        </div>
        {isExpenseMode && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
            <div className="grid grid-cols-4 gap-3">
              {categories.map(cat => (
                <button key={cat} onClick={() => setNewCategory(cat)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${newCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <CategoryIcon category={cat} className="!p-0 !bg-transparent !text-inherit" />
                  <span className="text-[8px] font-bold uppercase truncate w-full text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => startConfirmation()} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-sm uppercase tracking-widest mt-6 shadow-xl shadow-blue-500/20">Continue</button>
    </div>
  );

  const renderConfirmationModal = () => {
    if (!pendingTransaction) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPendingTransaction(null)}/>
        <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
          <div className="flex flex-col items-center space-y-6">
            <CategoryIcon category={pendingTransaction.category!} />
            <div className="w-full text-center space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Transaction</h3>
              <p className="text-3xl font-black text-slate-900">{prefs.currency}{pendingTransaction.amount}</p>
            </div>
            <div className="flex w-full gap-3">
              <button onClick={() => setPendingTransaction(null)} className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50">Cancel</button>
              <button onClick={finalizeSave} className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Timeline</h1>
      <div className="space-y-6">
        {transactions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold">No entries found</div>
        ) : (
          ['This Month', 'Earlier'].map(group => {
            const filtered = group === 'This Month' 
              ? transactions.filter(t => new Date(t.date).getMonth() === new Date().getMonth())
              : transactions.filter(t => new Date(t.date).getMonth() !== new Date().getMonth());
            if (filtered.length === 0) return null;
            return (
              <div key={group} className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{group}</h3>
                <div className="space-y-1">
                  {filtered.map(t => <TransactionRow key={t.id} transaction={t} currency={prefs.currency} onDelete={handleDeleteTransaction} />)}
                </div>
              </div>
            );
          })
        )}
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
            <div className="p-2 bg-blue-600 text-white rounded-lg"><MessageSquare size={18}/></div>
            <h2 className="text-lg font-bold text-slate-800">Smart Detection</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between py-2">
              <div><p className="text-xs font-bold text-slate-900">SMS Sync</p></div>
              <button onClick={handleToggleSMS} className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${smsPermission ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${smsPermission ? 'translate-x-6' : 'translate-x-0'}`} /></button>
            </div>
          </div>
        </section>
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1"><div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Settings size={18}/></div><h2 className="text-lg font-bold text-slate-800">Preferences</h2></div>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Display Currency</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(Currency).map(([key, symbol]) => (
                <button key={key} onClick={() => { const newP = {...prefs, currency: symbol as Currency}; setPrefs(newP); storageService.savePreferences(newP); }} className={`py-3 rounded-xl text-lg font-bold transition-all ${prefs.currency === symbol ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>{symbol}</button>
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
        {renderConfirmationModal()}
      </div>
    </div>
  );
}
