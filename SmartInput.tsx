import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';
import { parseSmartInput, formatCurrency } from '../utils';
import { ParsedInput, Transaction, TransactionType } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { HelpCircle } from 'lucide-react';

interface SmartInputProps {
  onClose: () => void;
  onSubmit: (t: Omit<Transaction, 'id' | 'date'>) => void;
  history: Transaction[];
}

export const SmartInput: React.FC<SmartInputProps> = ({ onClose, onSubmit, history }) => {
  const [input, setInput] = useState('');
  const [manualType, setManualType] = useState<TransactionType | null>(null);
  const [parsed, setParsed] = useState<ParsedInput>({ amount: null, description: '', guessedCategory: null, type: 'expense' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const p = parseSmartInput(input);

    if (p.description && p.description.length > 2) {
      const norm = p.description.trim().toLowerCase();
      const prev = history.find(t => t.description.toLowerCase().trim() === norm);
      if (prev) {
        const cat = CATEGORIES.find(c => c.id === prev.categoryId);
        if (cat) {
          p.guessedCategory = cat;
          if (!manualType) p.type = prev.type;
        }
      }
    }

    if (manualType) p.type = manualType;
    setParsed(p);
  }, [input, manualType, history]);

  const handleSubmit = () => {
    if (parsed.amount && parsed.guessedCategory) {
      onSubmit({
        amount: parsed.amount,
        description: parsed.description,
        categoryId: parsed.guessedCategory.id,
        type: parsed.type,
      });
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  const isValid = parsed.amount !== null && parsed.amount > 0;
  const isIncome = parsed.type === 'income';
  const CategoryIcon = parsed.guessedCategory ? (CATEGORY_ICONS[parsed.guessedCategory.icon] || HelpCircle) : null;

  const accentColor = isIncome ? '#10b981' : '#ef4444';
  const accentClass = isIncome ? 'emerald' : 'rose';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col animate-fade-in">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
        onClick={onClose}
      />

      {/* Dynamic ambient glow */}
      <div
        className={`absolute top-0 left-0 w-full h-[45%] blur-[120px] opacity-25 transition-all duration-700 pointer-events-none`}
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor} 0%, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col h-full px-6 max-w-md mx-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between pt-safe pt-6 pb-4">
          {/* Type toggle */}
          <div className="flex bg-white/5 p-1 rounded-2xl gap-1 border border-white/5">
            <button
              onClick={() => setManualType('expense')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                !isIncome ? 'bg-rose-500 text-white shadow-lg' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Gasto
            </button>
            <button
              onClick={() => setManualType('income')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                isIncome ? 'bg-emerald-500 text-black shadow-lg' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Receita
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main input area */}
        <div className="flex-1 flex flex-col justify-center items-center gap-8">

          {/* Label */}
          <p className={`text-[10px] font-black uppercase tracking-[0.35em] transition-colors duration-500 ${
            isIncome ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isIncome ? 'Inserir Receita' : 'Registrar Gasto'}
          </p>

          {/* Text input */}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Almoço 45"
            className="w-full bg-transparent text-center text-[3.2rem] font-black text-white placeholder:text-white/10 outline-none caret-theme tracking-tight leading-tight"
          />

          {/* Live preview */}
          <div className={`
            w-full max-w-sm flex items-center justify-center gap-4 px-6 py-4 rounded-3xl border transition-all duration-400
            ${isValid
              ? (isIncome
                  ? 'bg-emerald-500/8 border-emerald-500/25 opacity-100'
                  : 'bg-rose-500/8 border-rose-500/25 opacity-100'
                )
              : 'opacity-0 translate-y-2 border-transparent bg-transparent pointer-events-none'
            }
          `}>
            {/* Category icon */}
            {CategoryIcon && parsed.guessedCategory && (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${parsed.guessedCategory.color} bg-white/5`}>
                <CategoryIcon className="w-5 h-5" />
              </div>
            )}

            <div className="text-left">
              {parsed.guessedCategory && (
                <p className={`text-[11px] font-bold uppercase tracking-wider ${isIncome ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                  {parsed.guessedCategory.name}
                </p>
              )}
              {parsed.amount && (
                <p className="text-lg font-black text-white tracking-tight tabular-nums">
                  {isIncome ? '+' : '-'} {formatCurrency(parsed.amount)}
                </p>
              )}
            </div>
          </div>

          {/* Hint text */}
          {!input && (
            <p className="text-[11px] text-white/15 text-center font-medium leading-relaxed max-w-[220px]">
              Digite a descrição e o valor.<br/>Ex: "Uber 23,50" ou "Salário 3000"
            </p>
          )}
        </div>

        {/* Submit button */}
        <div className="pb-safe pb-8">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`
              w-full h-16 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 active:scale-95
              ${isValid
                ? (isIncome
                    ? 'bg-emerald-500 text-black shadow-[0_0_40px_rgba(16,185,129,0.35)]'
                    : 'bg-rose-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.35)]'
                  )
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              }
            `}
          >
            {isValid ? 'Confirmar' : 'Digite o valor'}
            <ArrowUp className={`w-5 h-5 transition-transform duration-300 ${isValid ? 'rotate-0' : 'rotate-45 opacity-50'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
