import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';
import { Eye, EyeOff, ArrowRight, Settings, Target, TrendingUp } from 'lucide-react';
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
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
                <Settings className="w-5 h-5" />
            </button>
            <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Fluxo</p>
                <p className="text-sm font-bold text-white">Meu Controle</p>
            </div>
        </div>
        <button 
            onClick={() => setShowBalance(!showBalance)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </header>

      {/* Balance Card */}
      <div className="relative group py-6">
         {/* Glow Effect */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-theme opacity-20 blur-[60px] rounded-full theme-transition pointer-events-none" />
         
         <div className="relative z-10 space-y-5 text-center">
            <div>
                <p className="text-sm font-semibold text-white/40 mb-2">Saldo Disponível</p>
                <h1 className="text-[3.5rem] leading-none font-bold tracking-tighter text-white theme-transition font-sans">
                    {showBalance ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="text-3xl opacity-50 font-medium translate-y-[-4px]">R$</span>
                        {formatCurrency(balance).replace('R$', '').trim()}
                      </span>
                    ) : (
                      <span className="opacity-20 tracking-widest text-4xl mt-2 block">•••••••</span>
                    )}
                </h1>
            </div>

            {/* Micro Chart */}
            <div className="h-12 w-full max-w-[180px] mx-auto opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={svgPoints}
                        className="text-theme theme-transition drop-shadow-[0_0_8px_var(--theme-glow)]"
                    />
                </svg>
            </div>

            {/* Daily Tag */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-black/20 backdrop-blur-md ${dailyBalance >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'} transition-all`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${dailyBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Hoje</span>
                <span className={`text-sm font-bold ${dailyBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {showBalance 
                        ? (dailyBalance > 0 ? '+' : '') + formatCurrency(dailyBalance).replace('R$', '').trim() 
                        : '•••'
                    }
                </span>
            </div>
         </div>
      </div>

      {/* Budget Tracker */}
      <div className="glass-card p-5 space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-theme opacity-[0.03] blur-[40px] rounded-full" />
        
        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/5 text-white/60">
                    <Target className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Orçamento</p>
            </div>
            <p className="text-xs font-bold text-white/80 tabular-nums tracking-wide">
                {formatCurrency(monthExpense)} <span className="text-white/30 mx-1">/</span> {formatCurrency(monthlyLimit)}
            </p>
        </div>
        
        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${isBudgetCritical ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-theme shadow-[0_0_10px_var(--theme-glow)]'}`}
                style={{ width: `${budgetProgress}%` }}
            />
        </div>
        
        <p className="text-[11px] text-center text-white/30 font-medium">
            Resta <span className="text-white font-bold">{formatCurrency(Math.max(0, monthlyLimit - monthExpense))}</span> para gastar.
        </p>
      </div>

      {/* Recent List */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-5 pl-1 pr-1">
            <h3 className="text-sm font-bold text-white/90">Recentes</h3>
            <button onClick={onOpenHistory} className="text-xs font-bold text-theme flex items-center gap-1.5 hover:opacity-80 transition-opacity p-2 -mr-2">
                Ver tudo <ArrowRight className="w-3.5 h-3.5" />
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