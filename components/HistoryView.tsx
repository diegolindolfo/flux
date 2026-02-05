import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction } from '../types';
import { TransactionList } from './TransactionList';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { formatCurrency, parseCSV } from '../utils';
import { toast } from 'sonner';

interface HistoryViewProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onBack: () => void;
  onImport: (transactions: Transaction[]) => void;
  onTransactionClick: (t: Transaction) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ transactions, onDelete, onBack, onImport, onTransactionClick }) => {
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize total calculation (Expensive on large lists)
  const total = useMemo(() => {
    return transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }, [transactions]);

  // Memoize visible slice to prevent re-slicing on every render
  const visibleTransactions = useMemo(() => {
    return transactions.slice(0, limit);
  }, [transactions, limit]);

  // Lazy Loading Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        const first = entries[0];
        if (first.isIntersecting && limit < transactions.length) {
            setLoading(true);
            // Debounce the load slightly to allow UI to breathe
            setTimeout(() => {
                setLimit(prev => prev + 20);
                setLoading(false);
            }, 300);
        }
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [limit, transactions.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const loadingToast = toast.loading('Processando arquivo...');
      try {
          // Offload parsing if possible (simple async here)
          const imported = await parseCSV(file);
          onImport(imported);
          toast.dismiss(loadingToast);
      } catch (err) {
          console.error(err);
          toast.dismiss(loadingToast);
          toast.error('Erro ao ler o arquivo. Verifique o formato.');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pt-safe pb-24 h-full flex flex-col animate-scale-in origin-bottom">
        <div className="px-6 py-4 flex items-center gap-2 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
            <button onClick={onBack} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all">
                <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white"
                title="Importar CSV"
            >
                <Upload className="w-5 h-5" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv"
                onChange={handleFileUpload} 
            />

            <div className="flex-1 text-right">
                <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Total Acumulado</p>
                <p className={`text-xl font-bold ${total >= 0 ? 'text-theme' : 'text-rose-500'} theme-transition`}>
                    {formatCurrency(total)}
                </p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            <TransactionList 
                transactions={visibleTransactions} 
                onDelete={onDelete} 
                onSelect={onTransactionClick}
            />
            
            {/* Infinite Scroll Loader */}
            <div ref={loaderRef} className="py-8 flex justify-center w-full min-h-[50px]">
                {loading && <Loader2 className="w-6 h-6 text-theme animate-spin" />}
                {!loading && limit >= transactions.length && transactions.length > 0 && (
                    <p className="text-xs text-white/20 font-medium">Fim do histórico</p>
                )}
            </div>
        </div>
    </div>
  );
};