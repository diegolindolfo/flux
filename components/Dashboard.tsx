import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { TransactionList } from './TransactionList';

interface DashboardProps {
  balance: number;
  transactions: Transaction[];
  onOpenHistory: () => void;
  onTransactionClick: (t: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ balance, transactions, onOpenHistory, onTransactionClick }) => {
  const [showBalance, setShowBalance] = useState(true);

  // Date Logic
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Daily Stats
  const dailyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getDate() === today.getDate() &&
             tDate.getMonth() === currentMonth &&
             tDate.getFullYear() === currentYear;
  });
  const dailyBalance = dailyTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  // Monthly Stats
  const monthlyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const monthIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const monthExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="p-6 space-y-8 animate-slide-up pt-safe">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-theme-soft flex items-center justify-center border border-theme/20 theme-transition">
                <div className="w-4 h-4 bg-theme rounded-full shadow-glow theme-transition" />
            </div>
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
      <div className="relative">
         <div className="absolute inset-0 bg-theme opacity-20 blur-[60px] rounded-full theme-transition pointer-events-none" />
         <div className="relative z-10 space-y-3 text-center py-6">
            <div>
                <p className="text-sm font-medium text-white/60">Saldo Atual</p>
                <h1 className="text-5xl font-bold tracking-tighter text-white theme-transition font-sans">
                    {showBalance ? formatCurrency(balance) : '••••••'}
                </h1>
            </div>

            {/* Daily Balance Pill */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-md ${dailyBalance >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'} transition-all`}>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Hoje</span>
                <span className="text-sm font-bold">
                    {showBalance 
                        ? (dailyBalance > 0 ? '+' : '') + formatCurrency(dailyBalance).replace('R$', '').trim() 
                        : '•••'
                    }
                </span>
            </div>
         </div>
      </div>

      {/* Quick Stats - Monthly */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 rounded-[24px] flex flex-col gap-3 group">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-white/40 font-medium mb-0.5">Entradas (Mês)</p>
                <p className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {showBalance ? formatCurrency(monthIncome) : '••••'}
                </p>
            </div>
        </div>
        <div className="glass-card p-4 rounded-[24px] flex flex-col gap-3 group">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <TrendingDown className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-white/40 font-medium mb-0.5">Saídas (Mês)</p>
                <p className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                    {showBalance ? formatCurrency(monthExpense) : '••••'}
                </p>
            </div>
        </div>
      </div>

      {/* Recent List */}
      <div>
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