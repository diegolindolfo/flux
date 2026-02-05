import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { TransactionList } from './TransactionList';
import { ArrowLeft, Loader2, Upload, Search, Filter, X } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | TransactionType>('all');
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply Search & Filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' || t.type === activeFilter;
        return matchesSearch && matchesFilter;
    });
  }, [transactions, searchTerm, activeFilter]);

  const total = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }, [filteredTransactions]);

  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, limit);
  }, [filteredTransactions, limit]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        const first = entries[0];
        if (first.isIntersecting && limit < filteredTransactions.length) {
            setLoading(true);
            setTimeout(() => {
                setLimit(prev => prev + 20);
                setLoading(false);
            }, 300);
        }
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [limit, filteredTransactions.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const loadingToast = toast.loading('Processando arquivo...');
      try {
          const imported = await parseCSV(file);
          onImport(imported);
          toast.dismiss(loadingToast);
      } catch (err) {
          console.error(err);
          toast.dismiss(loadingToast);
          toast.error('Erro ao ler o arquivo.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pt-safe pb-24 h-full flex flex-col animate-scale-in origin-bottom">
        {/* Header Sticky */}
        <div className="px-6 py-4 space-y-4 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-2">
                <button onClick={onBack} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1 text-right">
                    <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Resultado Filtro</p>
                    <p className={`text-xl font-bold ${total >= 0 ? 'text-theme' : 'text-rose-500'} theme-transition`}>
                        {formatCurrency(total)}
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-theme transition-colors" />
                <input 
                    type="text"
                    placeholder="Buscar transação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:bg-white/10 focus:border-theme/30 outline-none transition-all"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Quick Filters & Actions */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'income', label: 'Entradas' },
                    { id: 'expense', label: 'Saídas' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id as any)}
                        className={`
                            px-4 h-9 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                            ${activeFilter === f.id 
                                ? 'bg-theme/10 border-theme/30 text-theme' 
                                : 'bg-transparent border-white/5 text-white/40 hover:text-white/60'
                            }
                        `}
                    >
                        {f.label}
                    </button>
                ))}
                
                <div className="ml-auto flex items-center gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                </div>
            </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
            {filteredTransactions.length === 0 && searchTerm && (
                <div className="py-20 text-center opacity-30">
                    <p className="text-sm">Nenhum resultado para "{searchTerm}"</p>
                </div>
            )}
            <TransactionList 
                transactions={visibleTransactions} 
                onDelete={onDelete} 
                onSelect={onTransactionClick}
            />
            
            <div ref={loaderRef} className="py-8 flex justify-center w-full min-h-[50px]">
                {loading && <Loader2 className="w-6 h-6 text-theme animate-spin" />}
                {!loading && limit >= filteredTransactions.length && filteredTransactions.length > 0 && (
                    <p className="text-xs text-white/20 font-medium">Fim do histórico</p>
                )}
            </div>
        </div>
    </div>
  );
};