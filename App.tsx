import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { SmartInput } from './components/SmartInput';
import { HistoryView } from './components/HistoryView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { Transaction, ViewState } from './types';
import { Toaster, toast } from 'sonner';
import { Home, List, Plus, PieChart } from 'lucide-react';

const STORAGE_KEY = 'fluxo_v2_data';
const SALARY_KEY = 'fluxo_v2_salary';
const PERCENT_KEY = 'fluxo_v2_percent';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // New Budget States
  const [monthlySalary, setMonthlySalary] = useState<number>(() => {
    const saved = localStorage.getItem(SALARY_KEY);
    return saved ? parseFloat(saved) : 5000;
  });
  
  const [safetyPercentage, setSafetyPercentage] = useState<number>(() => {
    const saved = localStorage.getItem(PERCENT_KEY);
    return saved ? parseFloat(saved) : 70; // Default 70%
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Derived Limit
  const monthlyLimit = useMemo(() => {
    return monthlySalary * (safetyPercentage / 100);
  }, [monthlySalary, safetyPercentage]);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(SALARY_KEY, monthlySalary.toString());
    localStorage.setItem(PERCENT_KEY, safetyPercentage.toString());
  }, [monthlySalary, safetyPercentage]);

  const updateBudgetConfig = (salary: number, percent: number) => {
    setMonthlySalary(salary);
    setSafetyPercentage(percent);
    toast.success('Configuração de orçamento atualizada!');
  };

  // Dynamic Theme Engine
  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }, [transactions]);

  useEffect(() => {
    const root = document.documentElement;
    if (balance >= 0) {
        root.style.setProperty('--theme-color', '#00e676');
        root.style.setProperty('--theme-soft', 'rgba(0, 230, 118, 0.08)');
        root.style.setProperty('--theme-glow', 'rgba(0, 230, 118, 0.25)');
    } else {
        root.style.setProperty('--theme-color', '#ff4081');
        root.style.setProperty('--theme-soft', 'rgba(255, 64, 129, 0.08)');
        root.style.setProperty('--theme-glow', 'rgba(255, 64, 129, 0.25)');
    }
  }, [balance]);

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        ...t
    };
    setTransactions(prev => [newTx, ...prev]);
    setIsInputOpen(false);
    toast.success(t.type === 'income' ? 'Receita adicionada' : 'Gasto registrado');
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const importTransactions = (newItems: Transaction[]) => {
      setTransactions(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const unique = newItems.filter(t => !existingIds.has(t.id));
          if (unique.length === 0) {
              toast.info('Nenhuma transação nova encontrada.');
              return prev;
          }
          const combined = [...unique, ...prev];
          combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          toast.success(`${unique.length} transações importadas!`);
          return combined;
      });
  };

  const deleteTransaction = (id: string) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.info('Item removido');
  };

  const clearTransactions = () => {
      setTransactions([]);
      localStorage.removeItem(STORAGE_KEY);
  };

  const updateCategory = (id: string, newCategoryId: string, updateSimilar: boolean) => {
      setTransactions(prev => {
          const target = prev.find(t => t.id === id);
          if (!target) return prev;
          const updated = prev.map(t => {
             if (t.id === id) return { ...t, categoryId: newCategoryId };
             if (updateSimilar && t.description.toLowerCase().trim() === target.description.toLowerCase().trim()) {
                 return { ...t, categoryId: newCategoryId };
             }
             return t;
          });
          toast.success('Categoria atualizada');
          return updated;
      });
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-black text-white selection:bg-theme selection:text-black">
      <div className="w-full max-w-[480px] h-[100dvh] flex flex-col relative overflow-hidden bg-background md:border-x md:border-white/5 md:shadow-2xl">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[60%] bg-theme opacity-[0.08] blur-[150px] pointer-events-none transition-colors duration-1000 will-change-transform" />

          <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-24">
            {view === 'dashboard' && (
                <Dashboard 
                    balance={balance} 
                    transactions={transactions} 
                    monthlyLimit={monthlyLimit}
                    onOpenHistory={() => setView('history')}
                    onOpenSettings={() => setView('settings')}
                    onTransactionClick={setSelectedTransaction}
                />
            )}
            {view === 'stats' && <StatsView transactions={transactions} />}
            {view === 'history' && (
                <HistoryView 
                    transactions={transactions} 
                    onDelete={deleteTransaction} 
                    onBack={() => setView('dashboard')}
                    onImport={importTransactions}
                    onTransactionClick={setSelectedTransaction}
                />
            )}
            {view === 'settings' && (
                <SettingsView 
                    currentSalary={monthlySalary}
                    currentPercent={safetyPercentage}
                    onUpdateConfig={updateBudgetConfig}
                    onClearData={clearTransactions} 
                    onBack={() => setView('dashboard')} 
                />
            )}
          </main>

          <div className="absolute bottom-6 left-0 w-full px-4 z-50 pointer-events-none">
             <div className="glass rounded-[28px] p-2 flex items-center justify-between shadow-glass pointer-events-auto backdrop-blur-2xl">
                <button onClick={() => setView('dashboard')} className={`flex-1 h-12 rounded-[22px] flex items-center justify-center transition-all duration-300 ${view === 'dashboard' ? 'text-theme bg-white/5' : 'text-white/40'}`}>
                    <Home className="w-6 h-6" />
                </button>
                <button onClick={() => setView('stats')} className={`flex-1 h-12 rounded-[22px] flex items-center justify-center transition-all duration-300 ${view === 'stats' ? 'text-theme bg-white/5' : 'text-white/40'}`}>
                    <PieChart className="w-6 h-6" />
                </button>
                <div className="mx-2">
                    <button onClick={() => setIsInputOpen(true)} className="w-14 h-14 rounded-full bg-theme text-black shadow-glow flex items-center justify-center transition-transform active:scale-95">
                        <Plus className="w-7 h-7" strokeWidth={3} />
                    </button>
                </div>
                <button onClick={() => setView('history')} className={`flex-1 h-12 rounded-[22px] flex items-center justify-center transition-all duration-300 ${view === 'history' ? 'text-theme bg-white/5' : 'text-white/40'}`}>
                    <List className="w-6 h-6" />
                </button>
             </div>
          </div>

          {isInputOpen && <SmartInput history={transactions} onClose={() => setIsInputOpen(false)} onSubmit={addTransaction} />}
          {selectedTransaction && <TransactionDetailsModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onDelete={deleteTransaction} onUpdate={updateCategory} />}
          <Toaster position="top-center" theme="dark" />
      </div>
    </div>
  );
};

export default App;