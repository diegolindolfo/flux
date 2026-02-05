import React from 'react';
import { Transaction } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { HelpCircle } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onSelect?: (t: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = React.memo(({ transactions, onDelete, onSelect }) => {
  if (transactions.length === 0) {
      return (
          <div className="py-10 text-center opacity-30">
              <p className="text-sm">Sem movimentações.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-2">
      {transactions.map((t, idx) => {
          const category = CATEGORIES.find(c => c.id === t.categoryId) || CATEGORIES[6];
          const Icon = CATEGORY_ICONS[category.icon] || HelpCircle;
          const isIncome = t.type === 'income';

          // Optmized Animation Delay: 
          // Instead of idx * 50 which creates huge delays for item #100,
          // we cap the delay or cycle it, so items appear in waves or quickly.
          const animationDelay = `${Math.min(idx % 15, 15) * 40}ms`;

          return (
            <div 
                key={t.id}
                onClick={() => onSelect && onSelect(t)}
                className="group flex items-center justify-between p-3 rounded-[20px] hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer animate-fade-in"
                style={{ animationDelay }}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[18px] bg-[#1a1a1a] border border-white/5 flex items-center justify-center ${isIncome ? 'text-emerald-400' : category.color || 'text-white'}`}>
                        <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-tight line-clamp-1">{t.description}</p>
                        <p className="text-xs font-medium text-white/40 mt-0.5">{category.name} • {formatDate(t.date)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <p className={`text-sm font-bold tracking-tight whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(t.amount).replace('R$', '').trim()}
                    </p>
                    {onDelete && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:bg-rose-500/20 hover:text-rose-500 transition-all md:opacity-0 md:group-hover:opacity-100"
                        >
                            <span className="sr-only">Delete</span>
                            &times;
                        </button>
                    )}
                </div>
            </div>
          );
      })}
    </div>
  );
});