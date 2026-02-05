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
const BUDGET_KEY = 'fluxo_v2_budget';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(() => {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? parseFloat(saved) : 3000; // Default limit
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, monthlyLimit.toString());
  }, [monthlyLimit]);

  // Dynamic Theme Engine
  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }, [transactions]);

  useEffect(() => {
    const root = document.documentElement;
    if (balance >= 0) {
        root.style.setProperty('--theme-color', '#00e676');
        root.style.setProperty('--theme-soft', 'rgba(0, 230, 118, 0.15)');
        root.style.setProperty('--theme-glow', 'rgba(0, 230, 118, 0.2)');
    } else {
        root.style.setProperty('--theme-color', '#ff4081');
        root.style.setProperty('--theme-soft', 'rgba(255, 64, 129, 0.15)');
        root.style.setProperty('--theme-glow', 'rgba(255, 64, 129, 0.2)');
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
          let count = 0;
          const updated = prev.map(t => {
             if (t.id === id) {
                 count++;
                 return { ...t, categoryId: newCategoryId };
             }
             if (updateSimilar && t.description.toLowerCase().trim() === target.description.toLowerCase().trim()) {
                 count++;
                 return { ...t, categoryId: newCategoryId };
             }
             return t;
          });
          if (updateSimilar && count > 1) {
              toast.success(`${count} transações atualizadas!`);
          } else {
              toast.success('Categoria atualizada');
          }
          return updated;
      });
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-background text-white selection:bg-theme selection:text-black">
      <div className="w-full max-w-[480px] h-[100dvh] flex flex-col relative overflow-hidden bg-background md:border-x md:border-white/5 shadow-2xl">
          
          <div className="absolute top-0 left-0 w-full h-1/2 bg-theme opacity-[0.03] blur-[120px] pointer-events-none transition-colors duration-1000" />

          <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-4">
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
            {view === 'stats' && (
                <StatsView transactions={transactions} />
            )}
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
                    onClearData={clearTransactions} 
                    onBack={() => setView('dashboard')} 
                />
            )}
          </main>

          <div className="absolute bottom-6 left-0 w-full px-4 z-50 pointer-events-none">
             <div className="glass rounded-[28px] p-2 flex items-center justify-between shadow-glass pointer-events-auto">
                <button 
                    onClick={() => setView('dashboard')}
                    className={`flex-1 h-12 rounded-[20px] flex items-center justify-center transition-all duration-300 ${view === 'dashboard' ? 'text-theme bg-white/5' : 'text-white/40 hover:text-white'}`}
                >
                    <Home className="w-6 h-6" strokeWidth={2.5} />
                </button>

                <button 
                    onClick={() => setView('stats')}
                    className={`flex-1 h-12 rounded-[20px] flex items-center justify-center transition-all duration-300 ${view === 'stats' ? 'text-theme bg-white/5' : 'text-white/40 hover:text-white'}`}
                >
                    <PieChart className="w-6 h-6" strokeWidth={2.5} />
                </button>

                <div className="mx-2">
                    <button 
                        onClick={() => setIsInputOpen(true)}
                        className="w-14 h-14 rounded-full bg-theme text-black shadow-glow flex items-center justify-center transition-transform active:scale-95 hover:scale-105"
                    >
                        <Plus className="w-7 h-7" strokeWidth={3} />
                    </button>
                </div>

                <button 
                    onClick={() => setView('history')}
                    className={`flex-1 h-12 rounded-[20px] flex items-center justify-center transition-all duration-300 ${view === 'history' ? 'text-theme bg-white/5' : 'text-white/40 hover:text-white'}`}
                >
                    <List className="w-6 h-6" strokeWidth={2.5} />
                </button>
             </div>
          </div>

          {isInputOpen && (
              <SmartInput 
                  onClose={() => setIsInputOpen(false)} 
                  onSubmit={addTransaction}
              />
          )}

          {selectedTransaction && (
              <TransactionDetailsModal
                  transaction={selectedTransaction}
                  onClose={() => setSelectedTransaction(null)}
                  onDelete={deleteTransaction}
                  onUpdate={updateCategory}
              />
          )}

          <Toaster position="top-center" theme="dark" />
      </div>
    </div>
  );
};

export default App;