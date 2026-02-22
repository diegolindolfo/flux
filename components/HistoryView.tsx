import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { TransactionList } from './TransactionList';
import { ArrowLeft, Loader2, Upload, Search, X, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { formatCurrency, parseCSV } from '../utils';
import { toast } from 'sonner';

interface HistoryViewProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onBack: () => void;
  onImport: (transactions: Transaction[]) => void;
  onTransactionClick: (t: Transaction) => void;
}

type FilterType = 'all' | TransactionType;

export const HistoryView: React.FC<HistoryViewProps> = ({ transactions, onDelete, onBack, onImport, onTransactionClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [limit, setLimit] = useState(40);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || t.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    return { income, expense, total: income - expense };
  }, [filteredTransactions]);

  const visibleTransactions = useMemo(() => filteredTransactions.slice(0, limit), [filteredTransactions, limit]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && limit < filteredTransactions.length) {
        setLoading(true);
        setTimeout(() => {
          setLimit(prev => prev + 30);
          setLoading(false);
        }, 250);
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
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Erro ao ler o arquivo.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Tudo' },
    { id: 'income', label: 'Entradas' },
    { id: 'expense', label: 'Saídas' },
  ];

  return (
    <div className="h-full flex flex-col animate-scale-in origin-bottom">

      {/* ── Sticky Header ──────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-2xl border-b border-white/[0.05]">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 pt-safe pb-3 pt-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1">
            <h1 className="text-[15px] font-bold text-white leading-tight">Histórico</h1>
            <p className="text-[11px] text-white/30 font-medium">{filteredTransactions.length} transações</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            title="Importar CSV"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
        </div>

        {/* Stats strip */}
        <div className="flex items-stretch divide-x divide-white/[0.05] px-5 pb-3">
          <div className="flex-1 pr-4 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Entrou</span>
            </div>
            <p className="text-[13px] font-bold text-emerald-400 tabular-nums">{formatCurrency(stats.income)}</p>
          </div>
          <div className="flex-1 px-4 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-rose-500" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Saiu</span>
            </div>
            <p className="text-[13px] font-bold text-rose-400 tabular-nums">{formatCurrency(stats.expense)}</p>
          </div>
          <div className="flex-1 pl-4 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-white/40" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Saldo</span>
            </div>
            <p className={`text-[13px] font-bold tabular-nums ${stats.total >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {stats.total > 0 ? '+' : ''}{formatCurrency(stats.total)}
            </p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="px-5 pb-4 space-y-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 group-focus-within:text-theme transition-colors" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-white/[0.05] border border-white/[0.06] rounded-xl pl-10 pr-10 text-[13px] text-white placeholder:text-white/20 focus:bg-white/[0.08] focus:border-theme/30 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`
                  h-8 px-4 rounded-full text-[11px] font-bold transition-all border
                  ${activeFilter === f.id
                    ? 'bg-theme/10 border-theme/40 text-theme'
                    : 'bg-transparent border-white/[0.08] text-white/35 hover:text-white/60'
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable List ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        {filteredTransactions.length === 0 ? (
          <div className="py-20 text-center space-y-3 opacity-40">
            <p className="text-2xl">🔍</p>
            <p className="text-sm font-medium text-white/50">
              {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhuma transação encontrada'}
            </p>
          </div>
        ) : (
          <TransactionList
            transactions={visibleTransactions}
            onDelete={onDelete}
            onSelect={onTransactionClick}
            grouped={!searchTerm}
          />
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="py-8 flex justify-center min-h-[60px]">
          {loading && <Loader2 className="w-5 h-5 text-theme/50 animate-spin" />}
          {!loading && limit >= filteredTransactions.length && filteredTransactions.length > 0 && (
            <p className="text-[11px] text-white/15 font-medium tracking-wider uppercase">Fim do histórico</p>
          )}
        </div>
      </div>
    </div>
  );
};
