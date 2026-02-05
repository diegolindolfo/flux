import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils';
import { Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface GoalsProps {
  monthlyLimit: number;
  onUpdateLimit: (newLimit: number) => void;
}

export const Goals: React.FC<GoalsProps> = ({ monthlyLimit, onUpdateLimit }) => {
  const [value, setValue] = useState(monthlyLimit.toString());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
        onUpdateLimit(num);
        toast.success('Meta atualizada com sucesso!');
    }
  };

  return (
    <div className="pb-24 pt-6 px-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Metas Financeiras</h1>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <DollarSign className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Orçamento Mensal</h3>
                <p className="text-sm text-slate-500">Limite seguro para seus gastos.</p>
            </div>
        </div>

        <form onSubmit={handleSave}>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Limite (R$)
            </label>
            <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                <input 
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 pl-12 pr-4 text-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
            </div>

            <Button type="submit" className="w-full gap-2">
                <Save className="w-4 h-4" />
                Salvar Meta
            </Button>
        </form>
      </Card>

      <div className="mt-8 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed">
        <p><strong>Dica:</strong> Defina um limite que represente seus gastos variáveis (lazer, mercado, transporte). Contas fixas devem ser calculadas separadamente.</p>
      </div>
    </div>
  );
};