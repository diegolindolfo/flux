import React, { useState, useMemo } from 'react';
import { RecurringTransaction, TransactionType, RecurringFrequency } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency } from '../utils';
import {
  ArrowLeft, Plus, RefreshCw, Pause, Play, Trash2,
  HelpCircle, ChevronDown, Calendar, Repeat
} from 'lucide-react';
import { toast } from 'sonner';

interface RecurringViewProps {
  recurring: RecurringTransaction[];
  onBack: () => void;
  onAdd: (r: Omit<RecurringTransaction, 'id' | 'createdAt' | 'lastApplied'>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onApplyNow: (r: RecurringTransaction) => void;
}

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  monthly: 'Mensal',
  weekly:  'Semanal',
  yearly:  'Anual',
};

const FREQ_ICONS: Record<RecurringFrequency, string> = {
  monthly: '📅',
  weekly:  '🗓️',
  yearly:  '📆',
};

const GOAL_ICONS = ['🏠', '🚗', '✈️', '🎓', '💊', '🎮', '🛒', '☕', '💡', '📱'];

// ── Form ─────────────────────────────────────────────────────────────────────
interface FormState {
  description: string;
  amount: string;
  categoryId: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  dayOfMonth: number;
}

const defaultForm = (): FormState => ({
  description: '',
  amount: '',
  categoryId: '7',
  type: 'expense',
  frequency: 'monthly',
  dayOfMonth: 1,
});

export const RecurringView: React.FC<RecurringViewProps> = ({
  recurring, onBack, onAdd, onToggle, onDelete, onApplyNow
}) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalMonthly = useMemo(() => {
    return recurring
      .filter(r => r.active && r.frequency === 'monthly')
      .reduce((acc, r) => r.type === 'expense' ? acc - r.amount : acc + r.amount, 0);
  }, [recurring]);

  const handleSubmit = () => {
    const amount = parseFloat(form.amount);
    if (!form.description.trim()) { toast.error('Adicione uma descrição'); return; }
    if (isNaN(amount) || amount <= 0) { toast.error('Valor inválido'); return; }

    onAdd({
      description: form.description.trim(),
      amount,
      categoryId: form.categoryId,
      type: form.type,
      frequency: form.frequency,
      dayOfMonth: form.dayOfMonth,
      active: true,
    });

    setForm(defaultForm());
    setShowForm(false);
    toast.success('Recorrente criada!');
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
      toast.info('Recorrente removida');
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const activeCount  = recurring.filter(r => r.active).length;
  const pausedCount  = recurring.filter(r => !r.active).length;

  return (
    <div className="h-full flex flex-col animate-slide-up">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-2xl border-b border-white/[0.05] px-5 pt-safe pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-[15px] font-bold text-white">Recorrentes</h1>
            <p className="text-[11px] text-white/30 font-medium">{activeCount} ativas · {pausedCount} pausadas</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="w-10 h-10 rounded-full bg-theme flex items-center justify-center text-black shadow-glow active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        {/* Monthly impact strip */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${totalMonthly >= 0 ? 'bg-emerald-500/8 border-emerald-500/15' : 'bg-rose-500/8 border-rose-500/15'}`}>
          <div className="flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Impacto mensal</span>
          </div>
          <span className={`text-[13px] font-black tabular-nums ${totalMonthly >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalMonthly > 0 ? '+' : ''}{formatCurrency(totalMonthly)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4 pb-28">

        {/* ── Add Form ── */}
        {showForm && (
          <div className="glass-card p-5 rounded-[24px] space-y-4 animate-fade-in border border-theme/20">
            <p className="text-[11px] font-black text-theme uppercase tracking-widest">Nova Recorrente</p>

            {/* Type toggle */}
            <div className="flex bg-white/5 p-1 rounded-xl gap-1">
              {(['expense', 'income'] as TransactionType[]).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${form.type === t ? (t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-black') : 'text-white/30'}`}>
                  {t === 'expense' ? 'Gasto' : 'Receita'}
                </button>
              ))}
            </div>

            {/* Description */}
            <input
              type="text"
              placeholder="Descrição (ex: Netflix, Aluguel)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-theme/30 transition-all"
            />

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">R$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-theme/30 transition-all"
              />
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme/30 transition-all appearance-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#111' }}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>

            {/* Frequency */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FREQ_LABELS) as RecurringFrequency[]).map(f => (
                <button key={f} onClick={() => setForm(s => ({ ...s, frequency: f }))}
                  className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all ${form.frequency === f ? 'bg-theme/10 border-theme/40 text-theme' : 'bg-transparent border-white/8 text-white/30 hover:text-white/60'}`}>
                  {FREQ_ICONS[f]} {FREQ_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Day of month */}
            {form.frequency === 'monthly' && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider shrink-0">Todo dia</span>
                <div className="relative flex-1">
                  <select
                    value={form.dayOfMonth}
                    onChange={e => setForm(f => ({ ...f, dayOfMonth: parseInt(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-theme/30 appearance-none"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d} style={{ background: '#111' }}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
                <span className="text-[11px] text-white/40 font-bold">do mês</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setForm(defaultForm()); }}
                className="flex-1 h-11 rounded-xl bg-white/5 text-white/40 text-sm font-bold hover:bg-white/10 transition-all">
                Cancelar
              </button>
              <button onClick={handleSubmit}
                className="flex-[2] h-11 rounded-xl bg-theme text-black text-sm font-bold shadow-glow hover:brightness-110 active:scale-95 transition-all">
                Criar Recorrente
              </button>
            </div>
          </div>
        )}

        {/* ── List ── */}
        {recurring.length === 0 && !showForm ? (
          <div className="py-20 text-center space-y-3 opacity-30">
            <p className="text-3xl">🔄</p>
            <p className="text-sm font-medium text-white/50">Nenhuma recorrente ainda</p>
            <p className="text-[11px] text-white/30">Netflix, aluguel, salário — tudo que se repete</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurring.map(r => {
              const cat = CATEGORIES.find(c => c.id === r.categoryId) || CATEGORIES[6];
              const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
              const isDeleting = deleteConfirm === r.id;

              return (
                <div key={r.id} className={`glass-card p-4 rounded-[20px] transition-all ${!r.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${r.active ? (r.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : `bg-white/6 ${cat.color}`) : 'bg-white/5 text-white/20'}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">{r.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/30 font-medium">{FREQ_ICONS[r.frequency]} {FREQ_LABELS[r.frequency]}</span>
                        {r.frequency === 'monthly' && (
                          <span className="text-[10px] text-white/20">· dia {r.dayOfMonth}</span>
                        )}
                        {r.lastApplied && (
                          <span className="text-[10px] text-white/20">· aplicado {new Date(r.lastApplied).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <p className={`text-[13px] font-black tabular-nums shrink-0 ${r.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                      {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                    <button
                      onClick={() => onApplyNow(r)}
                      disabled={!r.active}
                      className="flex-1 h-8 rounded-xl bg-white/5 text-white/40 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <RefreshCw className="w-3 h-3" /> Aplicar agora
                    </button>
                    <button
                      onClick={() => onToggle(r.id)}
                      className="h-8 px-3 rounded-xl bg-white/5 text-white/40 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 hover:text-white transition-all"
                    >
                      {r.active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {r.active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className={`h-8 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center transition-all ${isDeleting ? 'bg-rose-500 text-white' : 'bg-white/5 text-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400'}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
