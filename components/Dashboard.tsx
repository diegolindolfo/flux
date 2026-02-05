import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowRight, Settings, Target } from 'lucide-react';
import { TransactionList } from './TransactionList';

interface DashboardProps {
  balance: number;
  transactions: Transaction[];
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onTransactionClick: (t: Transaction) => void;
  monthlyLimit: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  balance, 
  transactions, 
  onOpenHistory, 
  onOpenSettings,
  onTransactionClick,
  monthlyLimit
}) => {
  const [showBalance, setShowBalance] = useState(true);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthExpense = transactions
    .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const budgetProgress = Math.min((monthExpense / monthlyLimit) * 100, 100);
  const isBudgetCritical = budgetProgress > 85;

  // Daily Stats
  const dailyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getDate() === today.getDate() &&
             tDate.getMonth() === currentMonth &&
             tDate.getFullYear() === currentYear;
  });
  const dailyBalance = dailyTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  // Sparkline Logic
  const sparklineData = useMemo(() => {
    const points = [];
    let runningBalance = balance;
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toDateString();
        const dayTransactions = transactions.filter(t => new Date(t.date).toDateString() === dayStr);
        points.push(runningBalance);
        dayTransactions.forEach(t => {
            if (t.type === 'income') runningBalance -= t.amount;
            else runningBalance += t.amount;
        });
    }
    return points.reverse();
  }, [transactions, balance]);

  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const svgPoints = sparklineData.map((val, i) => {
    const x = (i / (sparklineData.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-6 space-y-8 animate-slide-up pt-safe">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button 
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-full bg-theme-soft flex items-center justify-center border border-theme/20 theme-transition hover:scale-105 active:scale-95 transition-all"
            >
                <Settings className="w-5 h-5 text-theme theme-transition" />
            </button>
            <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest">Fluxo</p>
                <p className="text-sm font-bold text-white">Meu Controle</p>
            </div>
        </div>
        <button 
            onClick={() => setShowBalance(!showBalance)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </header>

      {/* Balance Card */}
      <div className="relative group">
         <div className="absolute inset-0 bg-theme opacity-10 blur-[80px] rounded-full theme-transition pointer-events-none group-hover:opacity-20 transition-opacity" />
         
         <div className="relative z-10 space-y-4 text-center py-4">
            <div>
                <p className="text-sm font-medium text-white/40">Saldo Disponível</p>
                <h1 className="text-5xl font-extrabold tracking-tighter text-white theme-transition font-sans mt-1">
                    {showBalance ? formatCurrency(balance) : '••••••'}
                </h1>
            </div>

            <div className="h-16 w-full max-w-[200px] mx-auto opacity-50 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={svgPoints}
                        className="text-theme theme-transition"
                    />
                </svg>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-md ${dailyBalance >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'} transition-all`}>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Fluxo Hoje</span>
                <span className="text-sm font-bold">
                    {showBalance 
                        ? (dailyBalance > 0 ? '+' : '') + formatCurrency(dailyBalance).replace('R$', '').trim() 
                        : '•••'
                    }
                </span>
            </div>
         </div>
      </div>

      {/* Budget Tracker */}
      <div className="glass-card p-5 rounded-[28px] space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white/40" />
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Orçamento Mensal</p>
            </div>
            <p className="text-xs font-bold text-white/60">{formatCurrency(monthExpense)} / {formatCurrency(monthlyLimit)}</p>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
                className={`h-full transition-all duration-1000 ${isBudgetCritical ? 'bg-rose-500' : 'bg-theme shadow-[0_0_15px_var(--theme-glow)]'}`}
                style={{ width: `${budgetProgress}%` }}
            />
        </div>
        <p className="text-[10px] text-center text-white/20 font-medium">Você já utilizou {budgetProgress.toFixed(0)}% do seu limite seguro.</p>
      </div>

      {/* Recent List */}
      <div className="pb-10">
        <div className="flex items-center justify-between mb-4 pl-1">
            <h3 className="text-sm font-bold text-white/80">Recentes</h3>
            <button onClick={onOpenHistory} className="text-xs font-bold text-theme flex items-center gap-1 hover:underline theme-transition">
                Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
        </div>
        
        <TransactionList 
            transactions={transactions.slice(0, 5)} 
            onSelect={onTransactionClick}
        />
      </div>

    </div>
  );
};