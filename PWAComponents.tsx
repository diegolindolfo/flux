import React, { useEffect, useState } from 'react';
import { X, Download, Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react';

// ── Install Banner ────────────────────────────────────────────────────────────
interface InstallBannerProps {
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall, onDismiss }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in after a short delay
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await onInstall();
    if (!accepted) setIsInstalling(false);
  };

  return (
    <div className={`
      fixed bottom-[100px] left-4 right-4 z-[80] max-w-[440px] mx-auto
      transition-all duration-500 ease-out
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}
    `}>
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 shadow-2xl"
           style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(10,10,10,0.95) 50%)' }}>
        
        {/* Green glow top-left */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-theme opacity-20 blur-[40px] rounded-full pointer-events-none" />

        <div className="relative z-10 p-4 flex items-center gap-4">
          {/* App icon */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10">
            <img src="/icons/icon-192x192.png" alt="Fluxo" className="w-full h-full object-cover" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-white leading-tight">Instalar Fluxo</p>
            <p className="text-[11px] text-white/45 mt-0.5 leading-snug">
              Acesso rápido, funciona offline e sem anúncios
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-theme/70">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-theme/70">
                <Smartphone className="w-3 h-3" /> Tela inicial
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="h-9 px-4 rounded-xl bg-theme text-black text-[12px] font-black flex items-center gap-1.5 shadow-glow hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {isInstalling ? '...' : 'Instalar'}
            </button>
            <button
              onClick={onDismiss}
              className="h-9 px-4 rounded-xl bg-white/5 text-white/40 text-[12px] font-bold hover:text-white/70 transition-colors text-center"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Offline Badge ─────────────────────────────────────────────────────────────
interface OfflineBadgeProps {
  isOffline: boolean;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ isOffline }) => {
  const [wasOffline, setWasOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowOnline(false);
    } else if (wasOffline) {
      // Was offline, now online → flash "conectado" briefly
      setShowOnline(true);
      const t = setTimeout(() => {
        setShowOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOffline, wasOffline]);

  if (!isOffline && !showOnline) return null;

  return (
    <div className={`
      fixed top-safe top-3 left-1/2 -translate-x-1/2 z-[90]
      flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-bold
      shadow-lg backdrop-blur-xl transition-all duration-500 animate-fade-in
      ${isOffline
        ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
        : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
      }
    `}>
      {isOffline
        ? <><WifiOff className="w-3.5 h-3.5" /> Sem conexão — dados salvos localmente</>
        : <><Wifi className="w-3.5 h-3.5" /> Conexão restaurada!</>
      }
    </div>
  );
};

// ── Update Toast ──────────────────────────────────────────────────────────────
interface UpdateToastProps {
  onApply: () => void;
}

export const UpdateToast: React.FC<UpdateToastProps> = ({ onApply }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`
      fixed bottom-[100px] left-4 right-4 z-[80] max-w-[440px] mx-auto
      transition-all duration-500
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
    `}>
      <div className="glass rounded-[20px] border border-theme/20 p-4 flex items-center gap-4 shadow-xl">
        <div className="w-9 h-9 rounded-xl bg-theme/10 flex items-center justify-center text-theme shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white">Nova versão disponível</p>
          <p className="text-[11px] text-white/40">Atualize para ter as últimas melhorias.</p>
        </div>
        <button
          onClick={onApply}
          className="h-8 px-3 rounded-xl bg-theme text-black text-[11px] font-black hover:brightness-110 active:scale-95 transition-all shrink-0"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
};
