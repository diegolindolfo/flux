import React, { useState, useEffect } from 'react';
import { X, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';
import { parseSmartInput, formatCurrency } from '../utils';
import { ParsedInput, Transaction, TransactionType } from '../types';

interface SmartInputProps {
  onClose: () => void;
  onSubmit: (t: Omit<Transaction, 'id' | 'date'>) => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({ onClose, onSubmit }) => {
  const [input, setInput] = useState('');
  const [manualType, setManualType] = useState<TransactionType | null>(null);
  const [parsed, setParsed] = useState<ParsedInput>({ amount: null, description: '', guessedCategory: null, type: 'expense' });

  useEffect(() => {
    const p = parseSmartInput(input);
    // Se o usuário tocou manualmente em um tipo, mantemos ele a menos que ele mude o input drasticamente com keywords
    if (manualType) {
        p.type = manualType;
    }
    setParsed(p);
  }, [input, manualType]);

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
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in">
        {/* Dynamic Glow */}
        <div className={`absolute top-0 left-0 w-full h-1/2 opacity-30 blur-[120px] transition-colors duration-700 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="relative z-10 flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
            <header className="flex items-center justify-between mb-8">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => setManualType('expense')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${!isIncome ? 'bg-rose-500 text-white shadow-lg' : 'text-white/40'}`}
                    >
                        <TrendingDown className="w-3.5 h-3.5" /> Gasto
                    </button>
                    <button 
                        onClick={() => setManualType('income')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isIncome ? 'bg-emerald-500 text-black shadow-lg' : 'text-white/40'}`}
                    >
                        <TrendingUp className="w-3.5 h-3.5" /> Receita
                    </button>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-1 flex flex-col justify-center items-center gap-10">
                <div className="w-full text-center space-y-4">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? 'Inserir Nova Receita' : 'Registrar Novo Gasto'}
                    </p>
                    <input 
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ex: Almoço 45"
                        className="w-full bg-transparent text-center text-5xl font-extrabold text-white placeholder:text-white/10 outline-none caret-theme tracking-tight"
                    />
                </div>

                {/* Live Preview Pill */}
                <div className={`
                    flex items-center gap-3 px-6 py-4 rounded-3xl border transition-all duration-500
                    ${isValid 
                        ? (isIncome ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30')
                        : 'bg-white/5 border-white/10 opacity-0 translate-y-8'
                    }
                `}>
                    {parsed.guessedCategory && (
                        <div className={`flex items-center gap-2 text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {parsed.guessedCategory.name}
                        </div>
                    )}
                    {parsed.amount && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <div className="text-sm font-bold text-white tracking-wide">
                                {formatCurrency(parsed.amount)}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <button 
                onClick={handleSubmit}
                disabled={!isValid}
                className={`
                    w-full h-18 rounded-[28px] font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95
                    ${isValid 
                        ? (isIncome ? 'bg-emerald-500 text-black shadow-[0_0_40px_rgba(0,230,118,0.3)]' : 'bg-rose-500 text-white shadow-[0_0_40px_rgba(244,63,94,0.3)]')
                        : 'bg-white/10 text-white/20 cursor-not-allowed'
                    }
                `}
            >
                Confirmar <ArrowUp className={`w-5 h-5 ${isValid ? 'rotate-0' : 'rotate-45'} transition-transform duration-500`} />
            </button>
        </div>
    </div>
  );
};