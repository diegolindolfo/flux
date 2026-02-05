import React, { useState } from 'react';
import { Trash2, AlertTriangle, ArrowLeft, Info, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsViewProps {
  onClearData: () => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClearData, onBack }) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (confirmClear) {
      onClearData();
      toast.success('Todos os dados foram apagados.');
      onBack();
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000); // Reset confirm state after 3s
      toast.warning('Toque novamente para confirmar a exclusão de TUDO.');
    }
  };

  return (
    <div className="pt-safe pb-28 px-6 animate-slide-up space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 pt-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
      </div>

      <div className="space-y-6">
        {/* Security / Info */}
        <div className="glass-card p-5 rounded-[24px] space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-theme/10 flex items-center justify-center text-theme">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Privacidade Total</p>
              <p className="text-xs text-white/50 leading-relaxed mt-1">
                Seus dados são armazenados localmente no seu navegador. Não enviamos nada para servidores externos.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Versão do App</p>
              <p className="text-xs text-white/50 mt-1">Fluxo v2.1.0 (PWA)</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest pl-1">Zona de Perigo</p>
          <button 
            onClick={handleClear}
            className={`
              w-full p-5 rounded-[24px] border flex items-center gap-4 transition-all duration-300
              ${confirmClear 
                ? 'bg-rose-500 border-rose-500 text-white scale-[0.98]' 
                : 'bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500/10'
              }
            `}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmClear ? 'bg-white/20' : 'bg-rose-500/10'}`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">{confirmClear ? 'Tem certeza absoluta?' : 'Limpar todos os dados'}</p>
              <p className={`text-xs mt-1 ${confirmClear ? 'text-white/80' : 'text-rose-500/50'}`}>
                Isso apagará permanentemente todo o seu histórico.
              </p>
            </div>
            {confirmClear && <AlertTriangle className="w-5 h-5 animate-pulse" />}
          </button>
        </div>
      </div>
    </div>
  );
};