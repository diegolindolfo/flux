import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency } from '../utils';
import { HelpCircle, Calendar, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';

interface StatsViewProps {
  transactions: Transaction[];
}

export const StatsView: React.FC<StatsViewProps> = ({ transactions }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const expenses = monthlyTransactions.filter(t => t.type === 'expense');
    const income = monthlyTransactions.filter(t => t.type === 'income');

    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);

    const byCategory = CATEGORIES.map(cat => {
      const amount = expenses
        .filter(t => t.categoryId === cat.id)
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        ...cat,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      };
    })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return { totalExpense, totalIncome, byCategory };
  }, [transactions]);

  const monthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const maxVal = Math.max(stats.totalIncome, stats.totalExpense, 1);
  const incomeHeight = (stats.totalIncome / maxVal) * 100;
  const expenseHeight = (stats.totalExpense / maxVal) * 100;

  return (
    <div className="pt-safe pb-28 px-6 animate-slide-up space-y-6">
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Análise Mensal</h1>
          <p className="text-sm text-white/40 capitalize flex items-center gap-1.5 mt-1 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {monthName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-[28px] bg-emerald-500/5 border border-emerald-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500 blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative z-10 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Receitas</p>
              <p className="text-lg font-bold text-white leading-none">{formatCurrency(stats.totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-[28px] bg-rose-500/5 border border-rose-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500 blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative z-10 space-y-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">Despesas</p>
              <p className="text-lg font-bold text-white leading-none">{formatCurrency(stats.totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-[28px] space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-white/40" />
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Comparativo de Fluxo</h3>
        </div>

        <div className="flex items-end justify-center gap-12 h-40 px-4">
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="relative w-full flex flex-col items-center justify-end h-32">
              <div
                className="w-full max-w-[40px] bg-emerald-500 rounded-t-xl transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                style={{ height: `${incomeHeight}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Entradas</span>
          </div>

          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="relative w-full flex flex-col items-center justify-end h-32">
              <div
                className="w-full max-w-[40px] bg-rose-500 rounded-t-xl transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                style={{ height: `${expenseHeight}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Saídas</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 text-center">
          <p className="text-[11px] text-white/30 font-medium">
            {stats.totalIncome > stats.totalExpense
              ? "Você economizou este mês! 🎉"
              : "Atenção: seus gastos superaram as receitas."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white/80 pl-1 uppercase tracking-wider">Onde você gastou</h3>

        <div className="space-y-4">
          {stats.byCategory.length === 0 ? (
            <div className="text-center py-12 opacity-30">
              <p className="text-sm">Sem registros este mês.</p>
            </div>
          ) : (
            stats.byCategory.map((cat, idx) => {
              const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
              const bgClass = cat.color.replace('text-', 'bg-');

              return (
                <div key={cat.id} className="glass-card p-4 rounded-[24px] space-y-3 animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-white">{cat.name}</span>
                        <span className="block text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                          {cat.percentage.toFixed(1)}% do total
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-base text-white">{formatCurrency(cat.amount)}</span>
                    </div>
                  </div>

                  <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${bgClass} shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-1000 ease-out`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
