import React, { useState, useEffect } from 'react';
import { X, ArrowUp } from 'lucide-react';
import { parseSmartInput, formatCurrency } from '../utils';
import { ParsedInput, Transaction } from '../types';

interface SmartInputProps {
  onClose: () => void;
  onSubmit: (t: Omit<Transaction, 'id' | 'date'>) => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({ onClose, onSubmit }) => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedInput>({ amount: null, description: '', guessedCategory: null, type: 'expense' });

  useEffect(() => {
    setParsed(parseSmartInput(input));
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed.amount && parsed.guessedCategory) {
        onSubmit({
            amount: parsed.amount,
            description: parsed.description,
            categoryId: parsed.guessedCategory.id,
            type: parsed.type
        });
    }
  };

  const isValid = parsed.amount !== null && parsed.amount > 0;
  const isIncome = parsed.type === 'income';

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col animate-fade-in">
        <div className={`absolute top-0 left-0 w-full h-1/2 opacity-20 blur-[120px] transition-colors duration-500 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="relative z-10 flex-1 flex flex-col p-6">
            <button onClick={onClose} className="self-end p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>

            <div className="flex-1 flex flex-col justify-center items-center gap-8">
                <div className="w-full text-center space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                        {isIncome ? 'Nova Receita' : 'Nova Despesa'}
                    </p>
                    <input 
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ex: Uber 25"
                        className="w-full bg-transparent text-center text-4xl font-bold text-white placeholder:text-white/10 outline-none caret-theme"
                    />
                </div>

                {/* Live Preview Pill */}
                <div className={`
                    flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-300
                    ${isValid 
                        ? (isIncome ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-rose-500/10 border-rose-500/50')
                        : 'bg-white/5 border-white/10 opacity-0 translate-y-4'
                    }
                `}>
                    {parsed.guessedCategory && (
                        <span className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {parsed.guessedCategory.name}
                        </span>
                    )}
                    {parsed.amount && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-sm font-bold text-white">
                                {formatCurrency(parsed.amount)}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <button 
                onClick={handleSubmit}
                disabled={!isValid}
                className={`
                    w-full h-16 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 transition-all
                    ${isValid 
                        ? (isIncome ? 'bg-emerald-500 text-black shadow-glow' : 'bg-rose-500 text-white shadow-[0_0_40px_rgba(244,63,94,0.3)]')
                        : 'bg-white/10 text-white/20 cursor-not-allowed'
                    }
                `}
            >
                Confirmar <ArrowUp className={`w-5 h-5 ${isValid ? 'rotate-0' : 'rotate-45'} transition-transform`} />
            </button>
        </div>
    </div>
  );
};