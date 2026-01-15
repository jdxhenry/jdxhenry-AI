
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
  Tag
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell as RechartsCell,
  Tooltip
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

// --- Helper for Formatting ---
const formatCurrency = (val: number) => {
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toString();
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
  
  // Background Scanning State
  const [detectedSMS, setDetectedSMS] = useState<ParsedSMS | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<Partial<Transaction & { frequency: RecurringFrequency }> | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  // Form States (for manual entry)
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>(Category.GROCERIES);
  const [isExpenseMode, setIsExpenseMode] = useState(true);
  const [newFrequency, setNewFrequency] = useState<RecurringFrequency>(RecurringFrequency.NONE);
  
  // Custom Category State
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

  // --- Background SMS Scanning Service (Simulation) ---
  useEffect(() => {
    const backgroundScanner = setInterval(() => {
      if (detectedSMS || pendingTransaction || editingTemplate) return;
      if (Math.random() < 0.10) {
        const smsText = getSimulatedSMS();
        const parsed = parseSMS(smsText);
        if (parsed) setDetectedSMS(parsed);
      }
    }, 15000);
    return () => clearInterval(backgroundScanner);
  }, [detectedSMS, pendingTransaction, editingTemplate]);

  const totalExpense = useMemo(() => transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalIncome = useMemo(() => transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPercent = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsedPercent = Math.min(100, (totalExpense / prefs.totalMonthlyIncome) * 100);

  const startConfirmation = (custom?: Partial<Transaction & { frequency: RecurringFrequency }>) => {
    const title = custom?.title || newTitle;
    const amountStr = custom?.amount?.toString() || newAmount;
    const amount = parseFloat(amountStr);
    const category = custom?.category || (isExpenseMode ? newCategory : Category.INCOME);
    const isExpense = custom?.isExpense ?? isExpenseMode;
    const frequency = custom?.frequency || newFrequency;

    if (!title || isNaN(amount) || amount <= 0) return;

    setPendingTransaction({
      title,
      amount,
      category,
      isExpense,
      frequency
    });
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

    setNewTitle('');
    setNewAmount('');
    setPendingTransaction(null);
    setView('dashboard');
  };

  const finalizeTemplateUpdate = () => {
    if (!editingTemplate) return;
    storageService.updateRecurringTemplate(editingTemplate);
    setRecurringTemplates(storageService.getRecurringTemplates());
    setEditingTemplate(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Delete this transaction?')) {
      storageService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDeleteRecurring = (id: string) => {
    if (confirm('Stop this recurring payment?')) {
      storageService.deleteRecurringTemplate(id);
      setRecurringTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleAddCategory = () => {
    if (!customCategoryName.trim()) return;
    storageService.addCategory(customCategoryName.trim());
    setCategories(storageService.getCategories());
    setCustomCategoryName('');
  };

  const handleDeleteCategory = (name: string) => {
    if (confirm(`Remove the "${name}" category? Existing transactions will keep this category but it won't be available for new ones.`)) {
      storageService.deleteCategory(name);
      setCategories(storageService.getCategories());
    }
  };

  const renderDashboard = () => (
    <div className="bg-white min-h-screen pb-32 pt-4 px-6 space-y-8 animate-in fade-in duration-500">
      {/* Background Task Notification */}
      {detectedSMS && (
        <div className="fixed top-6 left-6 right-6 z-[100] animate-in slide-in-from-top-full duration-500">
          <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">New UPI SMS</p>
                <p className="text-sm font-bold truncate max-w-[140px]">{prefs.currency}{detectedSMS.amount} at {detectedSMS.title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDetectedSMS(null)} className="p-2 text-slate-400 hover:text-white"><X size={18}/></button>
              <button 
                onClick={() => startConfirmation(detectedSMS as any)} 
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-blue-500/20"
              >
                Review <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <span className="text-slate-800 font-bold tracking-widest text-sm uppercase">Private</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-800"><Moon size={24} /></button>
          <button onClick={() => setView('settings')} className="text-slate-800"><Settings size={24} /></button>
        </div>
      </header>

      {/* Main Budget Visual */}
      <div className="relative flex justify-center py-4">
        <div className="w-72 h-72 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Used', value: totalExpense },
                  { name: 'Remaining', value: Math.max(0, prefs.totalMonthlyIncome - totalExpense) }
                ]}
                cx="50%" cy="50%"
                innerRadius={110}
                outerRadius={125}
                startAngle={225}
                endAngle={-45}
                paddingAngle={0}
                dataKey="value"
                cornerRadius={10}
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
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">of {prefs.currency}{prefs.totalMonthlyIncome.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income', value: `${prefs.currency}${formatCurrency(totalIncome)}` },
          { label: 'Expenses', value: `${prefs.currency}${formatCurrency(totalExpense)}` },
          { label: 'Savings', value: `${savingsPercent}%`, color: 'text-blue-600' }
        ].map((card, i) => (
          <div key={i} className="bg-white border border-slate-50 rounded-2xl p-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)] text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
            <p className={`text-lg font-black tracking-tight ${card.color || 'text-slate-900'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Category Summaries */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Category Summaries</h2>
          <button onClick={() => setView('history')} className="text-sm font-bold text-blue-600">See All</button>
        </div>
        <div className="space-y-4">
          {budgets.slice(0, 4).map((b) => {
            const spent = transactions
              .filter(t => t.category === b.category && t.isExpense)
              .reduce((sum, t) => sum + t.amount, 0);
            const perc = (spent / b.limitAmount) * 100;
            const subtitle = b.category === Category.HOUSING ? "20% of monthly budget" : 
                             b.category === Category.GROCERIES ? "Essential items" :
                             b.category === Category.TRANSPORT ? "Daily commute" : "Allocated spend";
            return (
              <div key={b.category} className="flex items-center gap-4">
                <CategoryIcon category={b.category} />
                <div className="flex-1">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-base font-bold text-slate-900">{b.category}</p>
                      <p className="text-xs font-medium text-slate-400">{subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900">{prefs.currency}{spent.toLocaleString()}</p>
                      <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-slate-800" style={{ width: `${Math.min(100, perc)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-slate-50 p-6 rounded-3xl flex gap-4">
        <div className="shrink-0 text-slate-400"><Lock size={20} /></div>
        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
          Your financial data is stored locally on this device. End-to-end encryption ensures privacy. No data is shared with third parties.
        </p>
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
            autoFocus type="number" inputMode="decimal"
            value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
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
          <div className="relative">
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Weekly Groceries" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 focus:outline-none"/>
            <button 
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                const parsed = parseSMS(text);
                if (parsed) { setNewAmount(parsed.amount.toString()); setNewTitle(parsed.title); setIsExpenseMode(parsed.isExpense); }
              }} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-[10px] font-bold uppercase"
            >
              Paste SMS
            </button>
          </div>
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Frequency (Optional)</label>
           <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {Object.values(RecurringFrequency).map(f => (
                <button 
                  key={f}
                  onClick={() => setNewFrequency(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all shrink-0 ${newFrequency === f ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
        {isExpenseMode && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
            <div className="grid grid-cols-4 gap-3">
              {categories.map(cat => (
                <button key={cat} onClick={() => setNewCategory(cat)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${newCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' : 'bg-slate-50 text-slate-400'}`}>
                  <CategoryIcon category={cat} className="!p-0 !bg-transparent !text-inherit" />
                  <span className="text-[8px] font-bold uppercase truncate w-full text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => startConfirmation()} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 active:scale-95 transition-all mt-6">Continue</button>
    </div>
  );

  const renderConfirmationModal = () => {
    if (!pendingTransaction) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setPendingTransaction(null)}/>
        <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
          <div className="flex flex-col items-center space-y-6">
            <CategoryIcon category={pendingTransaction.category!} />
            <div className="w-full text-center space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Transaction</h3>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-bold text-slate-300">{prefs.currency}</span>
                <input 
                  type="number"
                  value={pendingTransaction.amount}
                  onChange={(e) => setPendingTransaction({...pendingTransaction, amount: parseFloat(e.target.value) || 0})}
                  className="text-4xl font-black text-slate-900 bg-transparent border-none outline-none w-1/2 text-center"
                />
              </div>
            </div>
            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Label</label>
                <input 
                  type="text"
                  value={pendingTransaction.title}
                  onChange={(e) => setPendingTransaction({...pendingTransaction, title: e.target.value})}
                  className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
                  <select 
                    value={pendingTransaction.category}
                    onChange={(e) => setPendingTransaction({...pendingTransaction, category: e.target.value})}
                    className="w-full bg-slate-50 rounded-xl py-3 px-3 text-xs font-bold text-slate-800 focus:outline-none appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Frequency</label>
                  <select 
                    value={pendingTransaction.frequency}
                    onChange={(e) => setPendingTransaction({...pendingTransaction, frequency: e.target.value as RecurringFrequency})}
                    className="w-full bg-slate-50 rounded-xl py-3 px-3 text-xs font-bold text-slate-800 focus:outline-none appearance-none"
                  >
                    {Object.values(RecurringFrequency).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex w-full gap-3">
              <button onClick={() => setPendingTransaction(null)} className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50">Cancel</button>
              <button onClick={finalizeSave} className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTemplateModal = () => {
    if (!editingTemplate) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setEditingTemplate(null)}/>
        <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
          <div className="flex flex-col items-center space-y-6">
            <CategoryIcon category={editingTemplate.category} />
            <div className="w-full text-center space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit Recurring Template</h3>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-bold text-slate-300">{prefs.currency}</span>
                <input 
                  type="number"
                  value={editingTemplate.amount}
                  onChange={(e) => setEditingTemplate({...editingTemplate, amount: parseFloat(e.target.value) || 0})}
                  className="text-4xl font-black text-slate-900 bg-transparent border-none outline-none w-1/2 text-center"
                />
              </div>
            </div>
            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Title</label>
                <input 
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({...editingTemplate, title: e.target.value})}
                  className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Frequency</label>
                  <select 
                    value={editingTemplate.frequency}
                    onChange={(e) => setEditingTemplate({...editingTemplate, frequency: e.target.value as RecurringFrequency})}
                    className="w-full bg-slate-50 rounded-xl py-3 px-3 text-xs font-bold text-slate-800 focus:outline-none appearance-none"
                  >
                    {Object.values(RecurringFrequency).filter(f => f !== RecurringFrequency.NONE).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
                  <select 
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                    className="w-full bg-slate-50 rounded-xl py-3 px-3 text-xs font-bold text-slate-800 focus:outline-none appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex w-full gap-3">
              <button onClick={() => setEditingTemplate(null)} className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50">Cancel</button>
              <button onClick={finalizeTemplateUpdate} className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 shadow-lg shadow-blue-500/20">Update</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="bg-white min-h-screen px-6 pb-24 pt-6 space-y-6 animate-in fade-in duration-300">
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
    <div className="bg-white min-h-screen px-6 pb-32 pt-6 space-y-10 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-slate-400"><ChevronLeft size={28} /></button>
        <h1 className="text-2xl font-black text-slate-900">Setup</h1>
      </div>

      <div className="space-y-12">
        {/* Category Management Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Tag size={18}/></div>
            <h2 className="text-lg font-bold text-slate-800">Categories</h2>
          </div>
          <div className="space-y-4">
             <div className="bg-slate-50 p-4 rounded-3xl space-y-4">
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={customCategoryName} 
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="New category name..."
                    className="flex-1 bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                   />
                   <button 
                    onClick={handleAddCategory}
                    className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                   >
                     <Plus size={20}/>
                   </button>
                </div>
                <div className="flex flex-wrap gap-2">
                   {categories.map(cat => {
                     const isDefault = Object.values(Category).includes(cat as any);
                     return (
                       <div key={cat} className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-tight ${isDefault ? 'bg-slate-200 text-slate-600' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          <span>{cat}</span>
                          {!isDefault && (
                            <button onClick={() => handleDeleteCategory(cat)} className="hover:text-red-500 transition-colors">
                              <X size={14}/>
                            </button>
                          )}
                       </div>
                     );
                   })}
                </div>
             </div>
          </div>
        </section>

        {/* Recurring Management Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Repeat size={18}/></div>
            <h2 className="text-lg font-bold text-slate-800">Recurring Payments</h2>
          </div>
          <div className="space-y-4">
            {recurringTemplates.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-3xl text-center">
                <p className="text-xs font-bold text-slate-400">No recurring templates set up.</p>
              </div>
            ) : (
              recurringTemplates.map(template => (
                <div key={template.id} className="bg-white border border-slate-50 shadow-sm p-4 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CategoryIcon category={template.category} className="!p-2.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900">{template.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{template.frequency}</span>
                        <span className="text-slate-300">•</span>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10}/> Last: {new Date(template.lastProcessedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingTemplate(template)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                      <Edit3 size={18}/>
                    </button>
                    <button onClick={() => handleDeleteRecurring(template.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
             <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Settings size={18}/></div>
             <h2 className="text-lg font-bold text-slate-800">Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Monthly Income Target</label>
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                <span className="text-xl font-bold text-slate-300">{prefs.currency}</span>
                <input type="number" value={prefs.totalMonthlyIncome} onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const iVal = isNaN(val) ? 0 : val;
                  const newP = {...prefs, totalMonthlyIncome: iVal};
                  setPrefs(newP); storageService.savePreferences(newP);
                }} className="w-full bg-transparent border-none font-black text-slate-800 focus:outline-none"/>
              </div>
            </div>
            
            <button onClick={() => { if(confirm('Wipe all local data?')) { storageService.clearAll(); window.location.reload(); } }} className="w-full py-5 text-red-500 bg-red-50 rounded-3xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Erase All Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100">
      <div className="max-w-md mx-auto min-h-screen bg-white relative overflow-x-hidden">
        <main className="min-h-screen">
          {view === 'dashboard' && renderDashboard()}
          {view === 'history' && renderHistory()}
          {view === 'add' && renderAdd()}
          {view === 'insights' && (
            <div className="p-10 text-center text-slate-400 font-bold space-y-4 animate-in fade-in">
               <TrendingUp size={48} className="mx-auto text-slate-200" />
               <p>Deeper trends and insights coming in next update.</p>
            </div>
          )}
          {view === 'settings' && renderSettings()}
        </main>
        {view !== 'add' && <Navbar current={view} setView={setView} />}
        {renderConfirmationModal()}
        {renderTemplateModal()}
      </div>
    </div>
  );
}
