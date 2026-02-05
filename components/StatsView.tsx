import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency } from '../utils';
import { HelpCircle, TrendingDown, Calendar } from 'lucide-react';

interface StatsViewProps {
  transactions: Transaction[];
}

export const StatsView: React.FC<StatsViewProps> = ({ transactions }) => {
  // Filter for current month and expenses only
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = transactions.filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && 
               d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear;
    });

    const total = monthlyExpenses.reduce((acc, t) => acc + t.amount, 0);

    const byCategory = CATEGORIES.map(cat => {
        const amount = monthlyExpenses
            .filter(t => t.categoryId === cat.id)
            .reduce((acc, t) => acc + t.amount, 0);
        
        return {
            ...cat,
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0
        };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

    return { total, byCategory };
  }, [transactions]);

  const monthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="pt-safe pb-28 px-6 animate-slide-up space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Gastos do Mês</h1>
                <p className="text-sm text-white/50 capitalize flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {monthName}
                </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-rose-400" />
            </div>
        </div>

        {/* Total Card */}
        <div className="p-6 rounded-[24px] bg-gradient-to-br from-rose-500/20 to-rose-600/5 border border-rose-500/20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 blur-[80px] opacity-20 pointer-events-none" />
            <p className="text-sm font-bold text-rose-200 uppercase tracking-widest mb-1">Total Gasto</p>
            <h2 className="text-4xl font-bold text-white">{formatCurrency(stats.total)}</h2>
        </div>

        {/* List */}
        <div className="space-y-5">
            {stats.byCategory.length === 0 ? (
                <div className="text-center py-12 opacity-30">
                    <p>Sem gastos este mês.</p>
                </div>
            ) : (
                stats.byCategory.map((cat, idx) => {
                    const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
                    // Replace 'text-' with 'bg-' for the progress bar, simple replacement hack
                    const bgClass = cat.color.replace('text-', 'bg-');
                    
                    return (
                        <div key={cat.id} className="space-y-2 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${cat.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-sm text-white">{cat.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-sm text-white">{formatCurrency(cat.amount)}</span>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${bgClass} shadow-[0_0_10px_currentColor] opacity-80`} 
                                    style={{ width: `${cat.percentage}%`, transition: 'width 1s ease-out' }}
                                />
                            </div>
                            <p className="text-right text-[10px] text-white/40 font-bold">{cat.percentage.toFixed(1)}%</p>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};