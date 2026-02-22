import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { HelpCircle } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onSelect?: (t: Transaction) => void;
  grouped?: boolean;
}

const formatGroupDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
};

export const TransactionList: React.FC<TransactionListProps> = React.memo(({ transactions, onDelete, onSelect, grouped = false }) => {
  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-white/3 border border-white/5 flex items-center justify-center mx-auto opacity-30">
          <span className="text-2xl">📭</span>
        </div>
        <p className="text-sm text-white/30 font-medium">Sem movimentações</p>
      </div>
    );
  }

  const groups = useMemo(() => {
    if (!grouped) return null;

    const map: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const key = new Date(t.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });

    return Object.entries(map).map(([key, items]) => ({
      label: formatGroupDate(items[0].date),
      items,
      dayTotal: items.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0),
    }));
  }, [transactions, grouped]);

  if (grouped && groups) {
    return (
      <div className="space-y-6">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {/* Day Header */}
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 capitalize">
                {group.label}
              </span>
              <span className={`text-[11px] font-bold tabular-nums ${group.dayTotal >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                {group.dayTotal > 0 ? '+' : ''}{formatCurrency(group.dayTotal).replace('R$', '').trim()}
              </span>
            </div>

            {/* Transactions */}
            <div className="glass-card overflow-hidden divide-y divide-white/[0.04]">
              {group.items.map((t, idx) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  idx={idx}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  isFirst={idx === 0}
                  isLast={idx === group.items.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {transactions.map((t, idx) => (
        <TransactionRow
          key={t.id}
          transaction={t}
          idx={idx}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

// ─── Row ───────────────────────────────────────────────────────────────────
interface RowProps {
  transaction: Transaction;
  idx: number;
  onSelect?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const TransactionRow: React.FC<RowProps> = ({ transaction: t, idx, onSelect, onDelete, isFirst, isLast }) => {
  const category = CATEGORIES.find(c => c.id === t.categoryId) || CATEGORIES[6];
  const Icon = CATEGORY_ICONS[category.icon] || HelpCircle;
  const isIncome = t.type === 'income';
  const animDelay = `${Math.min(idx % 15, 15) * 35}ms`;

  return (
    <div
      onClick={() => onSelect?.(t)}
      className="group flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.035] active:bg-white/[0.06] active:scale-[0.99] transition-all duration-150 cursor-pointer animate-fade-in"
      style={{ animationDelay: animDelay }}
    >
      {/* Icon */}
      <div className={`
        relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0
        ${isIncome
          ? 'bg-emerald-500/10 text-emerald-400'
          : `bg-white/[0.06] ${category.color}`
        }
      `}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        {isIncome && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white leading-tight truncate">{t.description}</p>
        <p className="text-[11px] font-medium text-white/35 mt-0.5 truncate">
          {category.name}
          <span className="mx-1.5 opacity-40">·</span>
          {formatDate(t.date)}
        </p>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className={`text-[13px] font-bold tracking-tight tabular-nums ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
            {isIncome ? '+' : '-'} {formatCurrency(t.amount).replace('R$', '').trim()}
          </p>
          <p className="text-[10px] text-white/20 font-medium text-right">BRL</p>
        </div>

        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/15 hover:bg-rose-500/20 hover:text-rose-400 transition-all md:opacity-0 md:group-hover:opacity-100 shrink-0"
            aria-label="Deletar"
          >
            <span className="text-base leading-none">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
};
