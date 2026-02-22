import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';
import { Eye, EyeOff, ArrowRight, Settings, Target, ChevronRight } from 'lucide-react';
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

  const monthExpense = useMemo(() =>
    transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + t.amount, 0),
    [transactions, currentMonth, currentYear]
  );

  const budgetProgress = Math.min((monthExpense / monthlyLimit) * 100, 100);
  const budgetRemaining = Math.max(0, monthlyLimit - monthExpense);
  const isBudgetCritical = budgetProgress > 85;
  const isBudgetWarning = budgetProgress > 65 && !isBudgetCritical;

  // Daily stats
  const { dailyExpense, dailyIncome } = useMemo(() => {
    const todayStr = today.toDateString();
    const daily = transactions.filter(t => new Date(t.date).toDateString() === todayStr);
    return {
      dailyExpense: daily.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
      dailyIncome: daily.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0),
    };
  }, [transactions]);

  const dailyBalance = dailyIncome - dailyExpense;

  // Sparkline
  const sparklineData = useMemo(() => {
    const points: number[] = [];
    let running = balance;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dayTxs = transactions.filter(t => new Date(t.date).toDateString() === dayStr);
      points.push(running);
      dayTxs.forEach(t => { running = t.type === 'income' ? running - t.amount : running + t.amount; });
    }
    return points.reverse();
  }, [transactions, balance]);

  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const svgPoints = sparklineData.map((val, i) => {
    const x = (i / (sparklineData.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 75 - 12;
    return `${x},${y}`;
  }).join(' ');

  // Budget color
  const budgetColor = isBudgetCritical ? '#ef4444' : isBudgetWarning ? '#f59e0b' : 'var(--theme-color)';
  const budgetTextColor = isBudgetCritical ? 'text-rose-400' : isBudgetWarning ? 'text-amber-400' : 'text-theme';

  // Recent: last 5
  const recent = transactions.slice(0, 5);

  return (
    <div className="pt-safe pb-4 animate-slide-up">

      {/* ── Header ──────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 pt-4 pb-2">
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <Settings className="w-[18px] h-[18px]" />
        </button>

        <div className="text-center">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Fluxo</p>
        </div>

        <button
          onClick={() => setShowBalance(!showBalance)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          {showBalance ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
        </button>
      </header>

      {/* ── Balance ─────────────────────────────────── */}
      <div className="px-6 py-8 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full bg-theme opacity-[0.07] blur-[80px] theme-transition" />
        </div>

        <div className="relative z-10 text-center space-y-5">
          <div>
            <p className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-[0.2em]">Saldo Disponível</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl text-white/30 font-light translate-y-[-2px]">R$</span>
              <span className="text-[3.8rem] leading-none font-black text-white tracking-tight theme-transition">
                {showBalance
                  ? formatCurrency(balance).replace('R$', '').trim()
                  : <span className="opacity-20 tracking-[0.2em] text-4xl">•••••</span>
                }
              </span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-10 w-[160px] mx-auto opacity-35 hover:opacity-80 transition-opacity duration-500">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={svgPoints}
                className="text-theme theme-transition"
              />
            </svg>
          </div>

          {/* Today badge */}
          <div className={`
            inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-black/30
            ${dailyBalance >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}
          `}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${dailyBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              Hoje
            </span>
            <span className={`text-sm font-bold tabular-nums ${dailyBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {showBalance
                ? (dailyBalance > 0 ? '+' : '') + formatCurrency(dailyBalance).replace('R$', '').trim()
                : '•••'
              }
            </span>
          </div>
        </div>
      </div>

      {/* ── Budget Tracker ──────────────────────────── */}
      <div className="mx-5 mb-6">
        <div className="glass-card p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 opacity-[0.04] blur-[50px] rounded-full" style={{ background: budgetColor }} />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-white/50" />
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Orçamento do Mês</span>
            </div>
            <span className={`text-[11px] font-bold tabular-nums ${budgetTextColor} transition-colors`}>
              {budgetProgress.toFixed(0)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${budgetProgress}%`,
                background: budgetColor,
                boxShadow: `0 0 12px ${budgetColor}55`
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30 font-medium">
              <span className="text-white font-bold">{formatCurrency(monthExpense)}</span> gastos
            </span>
            <span className="text-[11px] text-white/30 font-medium">
              Resta <span className={`font-bold ${budgetTextColor} transition-colors`}>{formatCurrency(budgetRemaining)}</span>
            </span>
          </div>

          {isBudgetCritical && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 text-center animate-fade-in">
              <p className="text-[11px] text-rose-400 font-bold">⚠️ Limite quase esgotado!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ─────────────────────── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-bold text-white/70 uppercase tracking-wider">Recentes</h3>
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1 text-[11px] font-bold text-theme hover:opacity-70 transition-opacity py-1 -mr-1"
          >
            Ver tudo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="glass-card py-10 text-center opacity-30">
            <p className="text-sm">Registre seu primeiro gasto com o +</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <TransactionList
              transactions={recent}
              onSelect={onTransactionClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};
