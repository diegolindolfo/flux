import React, { useState } from 'react';
import { Trash2, ArrowLeft, Wallet, Shield, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../utils';

interface SettingsViewProps {
  onClearData: () => void;
  onBack: () => void;
  currentSalary: number;
  currentPercent: number;
  onUpdateConfig: (salary: number, percent: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onClearData,
  onBack,
  currentSalary,
  currentPercent,
  onUpdateConfig
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [salary, setSalary] = useState(currentSalary.toString());
  const [percent, setPercent] = useState(currentPercent);

  const calculatedLimit = (parseFloat(salary) || 0) * (percent / 100);

  const handleClear = () => {
    if (confirmClear) {
      onClearData();
      toast.success('Todos os dados foram apagados.');
      onBack();
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      toast.warning('Toque novamente para confirmar a exclusão.');
    }
  };

  const handleSave = () => {
    const salaryNum = parseFloat(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      toast.error('Insira um salário válido.');
      return;
    }
    onUpdateConfig(salaryNum, percent);
  };

  const getSafetyLabel = (p: number) => {
    if (p <= 50) return { text: 'Conservador (50/30/20)', color: 'text-emerald-400' };
    if (p <= 75) return { text: 'Equilibrado', color: 'text-theme' };
    return { text: 'Arrojado (Máximo)', color: 'text-rose-400' };
  };

  const label = getSafetyLabel(percent);

  return (
    <div className="pt-safe pb-28 px-6 animate-slide-up space-y-8">
      <div className="flex items-center gap-4 pt-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">Ajustes</h1>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6 rounded-[28px] space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme opacity-[0.03] blur-[40px] pointer-events-none" />

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-theme" />
              <p className="font-bold text-white/50 text-[10px] uppercase tracking-widest">Sua Renda Mensal</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">R$</span>
              <input
                type="number"
                inputMode="decimal"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:border-theme/30 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-theme" />
                <p className="font-bold text-white/50 text-[10px] uppercase tracking-widest">Margem de Gasto</p>
              </div>
              <span className={`text-xs font-bold ${label.color} transition-colors`}>{percent}%</span>
            </div>

            <div className="px-1">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={percent}
                onChange={(e) => setPercent(parseInt(e.target.value))}
                className="w-full h-2 cursor-pointer"
              />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-wider text-center ${label.color} opacity-60`}>
              {label.text}
            </p>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Orçamento Seguro</p>
            <p className="text-xl font-extrabold text-white tracking-tight">
              {formatCurrency(calculatedLimit)}
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full h-14 rounded-2xl bg-theme text-black font-bold text-sm shadow-glow hover:brightness-110 active:scale-95 transition-all"
          >
            Confirmar Configuração
          </button>
        </div>

        <div className="glass-card p-5 rounded-[24px] space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-theme/10 flex items-center justify-center text-theme shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Privacidade em Primeiro Lugar</p>
              <p className="text-xs text-white/50 leading-relaxed mt-1">
                O valor da sua renda é apenas um parâmetro local para o cálculo. Nada sai do seu aparelho.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleClear}
            className={`
              w-full p-5 rounded-[24px] border flex items-center gap-4 transition-all duration-300
              ${confirmClear
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-rose-500/5 border-rose-500/20 text-rose-500'
              }
            `}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmClear ? 'bg-white/20' : 'bg-rose-500/10'}`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Resetar Aplicativo</p>
              <p className={`text-xs mt-0.5 ${confirmClear ? 'text-white/80' : 'text-rose-500/50'}`}>
                {confirmClear ? 'Tem certeza absoluta?' : 'Apagar todos os dados registrados.'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
