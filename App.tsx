import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { SmartInput } from './components/SmartInput';
import { HistoryView } from './components/HistoryView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { RecurringView } from './components/RecurringView';
import { GoalsView } from './components/GoalsView';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { InstallBanner, OfflineBadge, UpdateToast } from './components/PWAComponents';
import { usePWA, useShortcutAction } from './hooks/usePWA';
import {
  Transaction, ViewState, RecurringTransaction,
  Goal, CategoryBudget, RecurringFrequency
} from './types';
import { Toaster, toast } from 'sonner';
import { Home, List, Plus, PieChart, Repeat, Target } from 'lucide-react';

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEYS = {
  transactions:    'fluxo_v2_data',
  salary:          'fluxo_v2_salary',
  percent:         'fluxo_v2_percent',
  recurring:       'fluxo_v3_recurring',
  goals:           'fluxo_v3_goals',
  categoryBudgets: 'fluxo_v3_cat_budgets',
};

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shouldApplyRecurring(r: RecurringTransaction): boolean {
  if (!r.active) return false;
  const now = new Date();

  if (r.frequency === 'monthly') {
    if (now.getDate() < r.dayOfMonth) return false;
    if (!r.lastApplied) return true;
    const last = new Date(r.lastApplied);
    return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
  }
  if (r.frequency === 'weekly') {
    if (!r.lastApplied) return true;
    return Date.now() - new Date(r.lastApplied).getTime() >= 7 * 24 * 60 * 60 * 1000;
  }
  if (r.frequency === 'yearly') {
    if (!r.lastApplied) return true;
    const last = new Date(r.lastApplied);
    return last.getFullYear() !== now.getFullYear();
  }
  return false;
}

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // PWA
  const pwa = usePWA();
  const shortcutAction = useShortcutAction();

  useEffect(() => {
    if (shortcutAction === 'add-expense') setIsInputOpen(true);
    else if (shortcutAction === 'history') setView('history');
  }, [shortcutAction]);

  const showInstallBanner = useMemo(() => {
    if (!pwa.isInstallable || pwa.isInstalled) return false;
    const d = localStorage.getItem('pwa_install_dismissed');
    if (d && Date.now() - parseInt(d) < 7 * 24 * 60 * 60 * 1000) return false;
    return true;
  }, [pwa.isInstallable, pwa.isInstalled]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [monthlySalary, setMonthlySalary] = useState<number>(() => load(KEYS.salary, 5000));
  const [safetyPercentage, setSafetyPercentage] = useState<number>(() => load(KEYS.percent, 70));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load(KEYS.transactions, []));
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(() => load(KEYS.recurring, []));
  const [goals, setGoals] = useState<Goal[]>(() => load(KEYS.goals, []));
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(() => load(KEYS.categoryBudgets, []));

  const monthlyLimit = useMemo(() => monthlySalary * (safetyPercentage / 100), [monthlySalary, safetyPercentage]);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem(KEYS.transactions,    JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(KEYS.salary,          monthlySalary.toString()); }, [monthlySalary]);
  useEffect(() => { localStorage.setItem(KEYS.percent,         safetyPercentage.toString()); }, [safetyPercentage]);
  useEffect(() => { localStorage.setItem(KEYS.recurring,       JSON.stringify(recurring)); }, [recurring]);
  useEffect(() => { localStorage.setItem(KEYS.goals,           JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem(KEYS.categoryBudgets, JSON.stringify(categoryBudgets)); }, [categoryBudgets]);

  // ── Auto-apply recurring on load ───────────────────────────────────────────
  useEffect(() => {
    const toApply = recurring.filter(shouldApplyRecurring);
    if (toApply.length === 0) return;

    const newTxs: Transaction[] = toApply.map(r => ({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      amount: r.amount,
      description: r.description,
      categoryId: r.categoryId,
      type: r.type,
      recurringId: r.id,
    }));

    setTransactions(prev => [...newTxs, ...prev]);
    setRecurring(prev => prev.map(r =>
      toApply.find(a => a.id === r.id)
        ? { ...r, lastApplied: new Date().toISOString() }
        : r
    ));

    toast.success(`${toApply.length} recorrente(s) aplicada(s) automaticamente`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Dynamic Theme ──────────────────────────────────────────────────────────
  const balance = useMemo(
    () => transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0),
    [transactions]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (balance >= 0) {
      root.style.setProperty('--theme-color', '#00e676');
      root.style.setProperty('--theme-soft',  'rgba(0, 230, 118, 0.08)');
      root.style.setProperty('--theme-glow',  'rgba(0, 230, 118, 0.25)');
    } else {
      root.style.setProperty('--theme-color', '#ff4081');
      root.style.setProperty('--theme-soft',  'rgba(255, 64, 129, 0.08)');
      root.style.setProperty('--theme-glow',  'rgba(255, 64, 129, 0.25)');
    }
  }, [balance]);

  // ── Transaction actions ────────────────────────────────────────────────────
  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), ...t };
    setTransactions(prev => [newTx, ...prev]);
    setIsInputOpen(false);
    toast.success(t.type === 'income' ? 'Receita adicionada' : 'Gasto registrado');
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const importTransactions = (newItems: Transaction[]) => {
    setTransactions(prev => {
      const ids = new Set(prev.map(t => t.id));
      const unique = newItems.filter(t => !ids.has(t.id));
      if (unique.length === 0) { toast.info('Nenhuma transação nova.'); return prev; }
      const combined = [...unique, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      toast.success(`${unique.length} transações importadas!`);
      return combined;
    });
  };

  const deleteTransaction = (id: string) => { setTransactions(prev => prev.filter(t => t.id !== id)); toast.info('Item removido'); };

  const clearTransactions = () => { setTransactions([]); localStorage.removeItem(KEYS.transactions); };

  const updateCategory = (id: string, newCategoryId: string, updateSimilar: boolean) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      return prev.map(t => {
        if (t.id === id) return { ...t, categoryId: newCategoryId };
        if (updateSimilar && t.description.toLowerCase().trim() === target.description.toLowerCase().trim())
          return { ...t, categoryId: newCategoryId };
        return t;
      });
    });
    toast.success('Categoria atualizada');
  };

  // ── Recurring actions ──────────────────────────────────────────────────────
  const addRecurring = (r: Omit<RecurringTransaction, 'id' | 'createdAt' | 'lastApplied'>) => {
    setRecurring(prev => [...prev, { ...r, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), lastApplied: null }]);
  };

  const toggleRecurring = (id: string) => {
    setRecurring(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRecurring = (id: string) => {
    setRecurring(prev => prev.filter(r => r.id !== id));
  };

  const applyRecurringNow = (r: RecurringTransaction) => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      amount: r.amount,
      description: r.description,
      categoryId: r.categoryId,
      type: r.type,
      recurringId: r.id,
    };
    setTransactions(prev => [newTx, ...prev]);
    setRecurring(prev => prev.map(x => x.id === r.id ? { ...x, lastApplied: new Date().toISOString() } : x));
    toast.success(`"${r.description}" aplicado!`);
  };

  // ── Goal actions ───────────────────────────────────────────────────────────
  const addGoal = (g: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals(prev => [...prev, { ...g, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }]);
  };

  const deleteGoal = (id: string) => { setGoals(prev => prev.filter(g => g.id !== id)); };

  const contributeGoal = (id: string, amount: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const next = Math.max(0, Math.min(g.targetAmount, g.currentAmount + amount));
      if (next >= g.targetAmount) toast.success('🎉 Meta atingida!');
      return { ...g, currentAmount: next };
    }));
  };

  // ── Category budget actions ────────────────────────────────────────────────
  const updateCategoryBudget = (b: CategoryBudget) => {
    setCategoryBudgets(prev => {
      const exists = prev.find(x => x.categoryId === b.categoryId);
      return exists ? prev.map(x => x.categoryId === b.categoryId ? b : x) : [...prev, b];
    });
    toast.success('Limite de categoria salvo!');
  };

  const updateBudgetConfig = (salary: number, percent: number) => {
    setMonthlySalary(salary);
    setSafetyPercentage(percent);
    toast.success('Orçamento atualizado!');
  };

  // ── Nav ────────────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'dashboard', Icon: Home },
    { id: 'stats',     Icon: PieChart },
    null, // + button
    { id: 'recurring', Icon: Repeat },
    { id: 'goals',     Icon: Target },
  ] as const;

  const recurringBadge = recurring.filter(r => r.active).length;
  const goalsBadge     = goals.filter(g => g.currentAmount < g.targetAmount).length;

  return (
    <div className="min-h-screen w-full flex justify-center bg-black text-white selection:bg-theme selection:text-black">
      <div className="w-full max-w-[480px] h-[100dvh] flex flex-col relative overflow-hidden bg-background md:border-x md:border-white/5 md:shadow-2xl">

        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[60%] bg-theme opacity-[0.08] blur-[150px] pointer-events-none transition-colors duration-1000 will-change-transform" />

        {/* PWA overlays */}
        <OfflineBadge isOffline={pwa.isOffline} />
        {pwa.hasUpdate && <UpdateToast onApply={pwa.applyUpdate} />}
        {showInstallBanner && <InstallBanner onInstall={pwa.install} onDismiss={pwa.dismissInstall} />}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-28">
          {view === 'dashboard' && (
            <Dashboard balance={balance} transactions={transactions} monthlyLimit={monthlyLimit}
              onOpenHistory={() => setView('history')} onOpenSettings={() => setView('settings')}
              onTransactionClick={setSelectedTransaction} />
          )}
          {view === 'stats' && (
            <StatsView transactions={transactions} categoryBudgets={categoryBudgets}
              onUpdateCategoryBudget={updateCategoryBudget} />
          )}
          {view === 'history' && (
            <HistoryView transactions={transactions} onDelete={deleteTransaction}
              onBack={() => setView('dashboard')} onImport={importTransactions}
              onTransactionClick={setSelectedTransaction} />
          )}
          {view === 'settings' && (
            <SettingsView currentSalary={monthlySalary} currentPercent={safetyPercentage}
              onUpdateConfig={updateBudgetConfig} onClearData={clearTransactions}
              onBack={() => setView('dashboard')} />
          )}
          {view === 'recurring' && (
            <RecurringView recurring={recurring} onBack={() => setView('dashboard')}
              onAdd={addRecurring} onToggle={toggleRecurring}
              onDelete={deleteRecurring} onApplyNow={applyRecurringNow} />
          )}
          {view === 'goals' && (
            <GoalsView goals={goals} onBack={() => setView('dashboard')}
              onAdd={addGoal} onDelete={deleteGoal} onContribute={contributeGoal} />
          )}
        </main>

        {/* Bottom Nav */}
        <div className="absolute bottom-6 left-0 w-full px-4 z-50 pointer-events-none">
          <div className="glass rounded-[28px] p-2 flex items-center justify-between shadow-glass pointer-events-auto backdrop-blur-2xl relative">
            {/* Home */}
            <button onClick={() => setView('dashboard')}
              className={`flex-1 h-12 rounded-[22px] flex items-center justify-center transition-all duration-300 ${view === 'dashboard' ? 'text-theme bg-white/5' : 'text-white/35'}`}>
              <Home className="w-[22px] h-[22px]" />
            </button>

            {/* Stats */}
            <button onClick={() => setView('stats')}
              className={`flex-1 h-12 rounded-[22px] flex items-center justify-center transition-all duration-300 ${view === 'stats' ? 'text-theme bg-white/5' : 'text-white/35'}`}>
              <PieChart className="w-[22px] h-[22px]" />
            </button>

            {/* Add */}
            <div className="mx-2">
              <button onClick={() => setIsInputOpen(true)}
                className="w-14 h-14 rounded-full bg-theme text-black shadow-glow flex items-center justify-center transition-transform active:scale-95">
                <Plus className="w-7 h-7" strokeWidth={3} />
              </button>
            </div>

            {/* Recurring */}
            <button onClick={() => setView('recurring')}
              className={`flex-1 h-12 rounded-[22px] flex items-center justify-center transition-all duration-300 relative ${view === 'recurring' ? 'text-theme bg-white/5' : 'text-white/35'}`}>
              <Repeat className="w-[22px] h-[22px]" />
              {recurringBadge > 0 && (
                <span className="absolute top-2 right-3 w-4 h-4 rounded-full bg-theme text-black text-[9px] font-black flex items-center justify-center">
                  {recurringBadge}
                </span>
              )}
            </button>

            {/* Goals */}
            <button onClick={() => setView('goals')}
              className={`flex-1 h-12 rounded-[22px] flex items-center justify-center transition-all duration-300 relative ${view === 'goals' ? 'text-theme bg-white/5' : 'text-white/35'}`}>
              <Target className="w-[22px] h-[22px]" />
              {goalsBadge > 0 && (
                <span className="absolute top-2 right-3 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                  {goalsBadge}
                </span>
              )}
            </button>

            {pwa.isOffline && (
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
        </div>

        {isInputOpen && <SmartInput history={transactions} onClose={() => setIsInputOpen(false)} onSubmit={addTransaction} />}
        {selectedTransaction && (
          <TransactionDetailsModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)}
            onDelete={deleteTransaction} onUpdate={updateCategory} />
        )}
        <Toaster position="top-center" theme="dark" />
      </div>
    </div>
  );
};

export default App;
