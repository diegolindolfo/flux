import React, { useState } from 'react';
import { Transaction } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { X, Check, Trash2, Layers, Calendar, Hash } from 'lucide-react';
import { HelpCircle } from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: (id: string, newCategoryId: string, updateSimilar: boolean) => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(transaction.categoryId);
  const [updateSimilar, setUpdateSimilar] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0 = idle, 1 = confirm

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
  const CurrentIcon = currentCategory ? (CATEGORY_ICONS[currentCategory.icon] || HelpCircle) : HelpCircle;

  const handleSave = () => {
    onUpdate(transaction.id, selectedCategory, updateSimilar);
    onClose();
  };

  const handleDelete = () => {
    if (deleteStep === 1) {
      onDelete(transaction.id);
      onClose();
    } else {
      setDeleteStep(1);
      setTimeout(() => setDeleteStep(0), 3000);
    }
  };

  const isIncome = transaction.type === 'income';
  const categoryChanged = selectedCategory !== transaction.categoryId;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-[#111111] rounded-t-[32px] sm:rounded-[32px] border border-white/[0.08] shadow-2xl animate-slide-up overflow-hidden">

        {/* Drag handle (mobile) */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-1 sm:hidden" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Transaction Summary ─────────────────── */}
        <div className="px-6 pt-5 pb-6 relative">
          {/* Glow */}
          <div className={`absolute top-0 left-0 w-full h-32 blur-[80px] opacity-[0.08] pointer-events-none ${isIncome ? 'bg-emerald-500' : 'bg-white'}`} />

          <div className="relative z-10 flex items-start gap-4">
            {/* Icon */}
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300
              ${isIncome ? 'bg-emerald-500/15 text-emerald-400' : `bg-white/[0.07] ${currentCategory?.color || 'text-white/50'}`}
            `}>
              <CurrentIcon className="w-6 h-6" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-[17px] font-bold text-white leading-tight truncate">{transaction.description}</h2>

              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
                <div className="flex items-center gap-1 text-white/30">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[11px] font-medium">{formatDate(transaction.date)}</span>
                </div>
                <div className="flex items-center gap-1 text-white/30">
                  <Hash className="w-3 h-3" />
                  <span className="text-[11px] font-mono">{transaction.id.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className={`
            mt-5 py-4 rounded-2xl text-center border
            ${isIncome ? 'bg-emerald-500/8 border-emerald-500/15' : 'bg-white/[0.04] border-white/[0.06]'}
          `}>
            <p className="text-[11px] font-bold text-white/25 uppercase tracking-widest mb-1">
              {isIncome ? 'Receita' : 'Despesa'}
            </p>
            <p className={`text-3xl font-black tracking-tight tabular-nums ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────── */}
        <div className="h-px bg-white/[0.05] mx-0" />

        {/* ── Category Grid ────────────────────────── */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Alterar Categoria</p>

          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all duration-200
                    ${isSelected
                      ? 'bg-white/8 border-theme/40 scale-105 shadow-[0_0_15px_rgba(0,230,118,0.1)]'
                      : 'bg-transparent border-transparent hover:bg-white/5 opacity-40 hover:opacity-70'
                    }
                  `}
                >
                  <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${cat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-semibold truncate w-full text-center leading-tight ${isSelected ? 'text-white' : 'text-white/40'}`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Update Similar ───────────────────────── */}
        {categoryChanged && (
          <div className="px-6 pb-4 animate-fade-in">
            <button
              onClick={() => setUpdateSimilar(!updateSimilar)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-left"
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${updateSimilar ? 'bg-theme border-theme text-black' : 'border-white/25'}`}>
                {updateSimilar && <Check className="w-3 h-3" strokeWidth={3.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white">Atualizar transações similares</p>
                <p className="text-[10px] text-white/40 mt-0.5 leading-tight">
                  Aplica a todas com a mesma descrição
                </p>
              </div>
              <Layers className="w-4 h-4 text-white/20 shrink-0" />
            </button>
          </div>
        )}

        {/* ── Actions ─────────────────────────────── */}
        <div className="px-6 pb-safe pb-6 flex gap-3">
          <button
            onClick={handleDelete}
            className={`
              h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shrink-0
              ${deleteStep === 1
                ? 'bg-rose-500 text-white px-6'
                : 'bg-rose-500/8 border border-rose-500/20 text-rose-500 hover:bg-rose-500/15 px-4'
              }
            `}
          >
            <Trash2 className="w-4 h-4" />
            {deleteStep === 1 ? 'Confirmar exclusão' : 'Excluir'}
          </button>

          <button
            onClick={handleSave}
            className="flex-1 h-14 rounded-2xl bg-theme text-black font-bold text-sm shadow-glow hover:brightness-110 active:scale-95 transition-all"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
