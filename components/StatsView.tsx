import React, { useMemo, useState } from 'react';
import { Transaction, StatsPeriod, CategoryBudget } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency } from '../utils';
import {
  HelpCircle, ArrowUpRight, ArrowDownRight, BarChart3,
  AlertTriangle, Settings2
} from 'lucide-react';

interface StatsViewProps {
  transactions: Transaction[];
  categoryBudgets: CategoryBudget[];
  onUpdateCategoryBudget: (b: CategoryBudget) => void;
}

const PERIODS: { id: StatsPeriod; label: string }[] = [
  { id: '1m', label: '1 mês' },
  { id: '3m', label: '3 meses' },
  { id: '6m', label: '6 meses' },
  { id: '1y', label: '1 ano' },
  { id: 'all', label: 'Tudo' },
];

function getPeriodStart(period: StatsPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case '1m': return new Date(now.getFullYear(), now.getMonth(), 1);
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case '6m': return new Date(now.getFullYear(), now.getMonth() - 5, 1);
    case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    case 'all': return null;
  }
}

function getPeriodLabel(period: StatsPeriod): string {
  const now = new Date();
  switch (period) {
    case '1m': return now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    case '3m': return 'Últimos 3 meses';
    case '6m': return 'Últimos 6 meses';
    case '1y': return 'Último ano';
    case 'all': return 'Todo o histórico';
  }
}

// ── Budget Editor Modal ───────────────────────────────────────────────────────
interface BudgetEditorProps {
  categoryId: string;
  current: CategoryBudget | undefined;
  onSave: (b: CategoryBudget) => void;
  onClose: () => void;
}

const BudgetEditor: React.FC<BudgetEditorProps> = ({ categoryId, current, onSave, onClose }) => {
  const cat = CATEGORIES.find(c => c.id === categoryId)!;
  const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
  const [limit, setLimit] = useState(current?.monthlyLimit.toString() || '');
  const [alertAt, setAlertAt] = useState(current?.alertAt ?? 80);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] rounded-t-[28px] border border-white/10 p-6 space-y-5 animate-slide-up pb-safe pb-8">
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto" />
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${cat.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-bold text-white">Limite — {cat.name}</h3>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">R$</span>
          <input type="number" inputMode="decimal" placeholder="Sem limite definido" value={limit}
            onChange={e => setLimit(e.target.value)}
            className="w-full bg-white/5 border border-white/8 rounded-2xl pl-10 pr-4 py-3.5 text-white font-bold outline-none focus:border-theme/30 transition-all" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Alertar quando atingir</span>
            <span className="text-[11px] font-bold text-theme">{alertAt}%</span>
          </div>
          <input type="range" min="50" max="95" step="5" value={alertAt}
            onChange={e => setAlertAt(parseInt(e.target.value))} className="w-full" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-white/5 text-white/40 font-bold text-sm hover:bg-white/10 transition-all">Cancelar</button>
          <button
            onClick={() => {
              const n = parseFloat(limit);
              if (!isNaN(n) && n > 0) onSave({ categoryId, monthlyLimit: n, alertAt });
              onClose();
            }}
            className="flex-[2] h-12 rounded-2xl bg-theme text-black font-bold text-sm shadow-glow active:scale-95 transition-all">
            Salvar Limite
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export const StatsView: React.FC<StatsViewProps> = ({ transactions, categoryBudgets, onUpdateCategoryBudget }) => {
  const [period, setPeriod] = useState<StatsPeriod>('1m');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  const stats = useMemo(() => {
    const start = getPeriodStart(period);
    const filtered = start ? transactions.filter(t => new Date(t.date) >= start) : transactions;

    const expenses = filtered.filter(t => t.type === 'expense');
    const income   = filtered.filter(t => t.type === 'income');
    const totalExpense = expenses.reduce((a, t) => a + t.amount, 0);
    const totalIncome  = income.reduce((a, t) => a + t.amount, 0);

    // Monthly bars
    const monthMap: Record<string, { income: number; expense: number }> = {};
    filtered.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      if (t.type === 'income') monthMap[key].income += t.amount;
      else monthMap[key].expense += t.amount;
    });
    const months = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        label: new Date(key + '-15').toLocaleString('pt-BR', { month: 'short' }),
        ...v,
      }));

    // Per-category (always current month for budget comparison)
    const now = new Date();
    const byCategory = CATEGORIES.map(cat => {
      const amount = expenses.filter(t => t.categoryId === cat.id).reduce((a, t) => a + t.amount, 0);
      const budget = categoryBudgets.find(b => b.categoryId === cat.id);
      const monthExpense = expenses
        .filter(t => {
          if (t.categoryId !== cat.id) return false;
          const d = new Date(t.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((a, t) => a + t.amount, 0);

      const budgetProgress = budget ? Math.min((monthExpense / budget.monthlyLimit) * 100, 100) : null;

      return {
        ...cat, amount, percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        budget, monthExpense, budgetProgress,
        isOverBudget:  budget ? monthExpense > budget.monthlyLimit : false,
        isNearBudget:  budget ? (monthExpense / budget.monthlyLimit) * 100 >= budget.alertAt : false,
      };
    })
      .filter(c => c.amount > 0 || c.budget)
      .sort((a, b) => b.amount - a.amount);

    return { totalExpense, totalIncome, byCategory, months };
  }, [transactions, period, categoryBudgets]);

  const maxBarVal = Math.max(...stats.months.map(m => Math.max(m.income, m.expense)), 1);

  return (
    <div className="pt-safe pb-28 px-5 animate-slide-up space-y-6">

      {/* Header */}
      <div className="pt-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Análise</h1>
          <p className="text-sm text-white/40 mt-1 capitalize font-medium">{getPeriodLabel(period)}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`h-8 px-4 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all shrink-0
                ${period === p.id ? 'bg-theme/10 border-theme/40 text-theme' : 'bg-transparent border-white/8 text-white/35 hover:text-white/60'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Receitas', value: stats.totalIncome, Icon: ArrowUpRight, color: 'emerald' },
          { label: 'Despesas', value: stats.totalExpense, Icon: ArrowDownRight, color: 'rose' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className={`p-4 rounded-[24px] bg-${color}-500/5 border border-${color}-500/10 space-y-2`}>
            <div className={`w-8 h-8 rounded-full bg-${color}-500/10 flex items-center justify-center text-${color}-400`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className={`text-[10px] font-bold text-${color}-500/60 uppercase tracking-widest`}>{label}</p>
            <p className="text-[17px] font-bold text-white leading-none">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {stats.months.length > 0 && (
        <div className="glass-card p-5 rounded-[24px] space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-white/30" />
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Fluxo por mês</h3>
          </div>
          <div className="flex items-end gap-2 h-28">
            {stats.months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full min-w-0">
                <div className="flex-1 w-full flex flex-col items-center justify-end gap-px">
                  <div className="w-full max-w-[14px] bg-emerald-500/70 rounded-t-sm transition-all duration-700"
                    style={{ height: `${(m.income / maxBarVal) * 100}%`, minHeight: m.income > 0 ? '2px' : '0' }} />
                  <div className="w-full max-w-[14px] bg-rose-500/70 rounded-b-sm transition-all duration-700"
                    style={{ height: `${(m.expense / maxBarVal) * 100}%`, minHeight: m.expense > 0 ? '2px' : '0' }} />
                </div>
                <span className="text-[9px] font-bold text-white/20 uppercase truncate w-full text-center">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /><span className="text-[10px] text-white/30">Entradas</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500/70" /><span className="text-[10px] text-white/30">Saídas</span></div>
            <span className={`ml-auto text-[11px] font-bold ${stats.totalIncome >= stats.totalExpense ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.totalIncome >= stats.totalExpense ? '🎉 No azul' : '⚠️ No vermelho'}
            </span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pl-1">
          <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Por categoria</h3>
          <span className="text-[10px] text-white/20">⚙️ define limite</span>
        </div>

        {stats.byCategory.length === 0 ? (
          <div className="text-center py-12 opacity-30"><p className="text-sm">Sem registros neste período.</p></div>
        ) : (
          <div className="space-y-3">
            {stats.byCategory.map((cat, idx) => {
              const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
              const bgClass = cat.color.replace('text-', 'bg-');
              return (
                <div key={cat.id}
                  className={`glass-card p-4 rounded-[20px] space-y-3 animate-fade-in ${cat.isOverBudget ? 'border border-rose-500/25' : cat.isNearBudget ? 'border border-amber-500/20' : ''}`}
                  style={{ animationDelay: `${idx * 55}ms` }}>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[13px] text-white">{cat.name}</span>
                          {cat.isOverBudget && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          {!cat.isOverBudget && cat.isNearBudget && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        </div>
                        <span className="text-[10px] text-white/30 font-bold">
                          {cat.percentage.toFixed(1)}% do total
                          {cat.budget && <span className={` ml-1 ${cat.isOverBudget ? 'text-rose-400' : cat.isNearBudget ? 'text-amber-400' : 'text-white/20'}`}>· lim. {formatCurrency(cat.budget.monthlyLimit)}</span>}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-white">{formatCurrency(cat.amount)}</span>
                      <button onClick={() => setEditingBudget(cat.id)}
                        className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/10 transition-all">
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bgClass} transition-all duration-700`} style={{ width: `${cat.percentage}%` }} />
                  </div>

                  {cat.budget && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${cat.isOverBudget ? 'bg-rose-500' : cat.isNearBudget ? 'bg-amber-400' : 'bg-emerald-500/50'}`}
                          style={{ width: `${cat.budgetProgress ?? 0}%` }} />
                      </div>
                      <p className={`text-[10px] font-bold text-right ${cat.isOverBudget ? 'text-rose-400' : cat.isNearBudget ? 'text-amber-400' : 'text-white/20'}`}>
                        {cat.isOverBudget
                          ? `Excedeu ${formatCurrency(cat.monthExpense - cat.budget.monthlyLimit)}`
                          : `${(cat.budgetProgress ?? 0).toFixed(0)}% do limite mensal`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingBudget && (
        <BudgetEditor
          categoryId={editingBudget}
          current={categoryBudgets.find(b => b.categoryId === editingBudget)}
          onSave={onUpdateCategoryBudget}
          onClose={() => setEditingBudget(null)}
        />
      )}
    </div>
  );
};
