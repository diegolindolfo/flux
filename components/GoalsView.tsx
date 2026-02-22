import React, { useState } from 'react';
import { Goal } from '../types';
import { formatCurrency } from '../utils';
import { ArrowLeft, Plus, Trash2, Target, ChevronDown, PlusCircle, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GoalsViewProps {
  goals: Goal[];
  onBack: () => void;
  onAdd: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onContribute: (id: string, amount: number) => void;
}

const GOAL_COLORS = [
  { label: 'Verde',  value: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
  { label: 'Azul',   value: 'text-blue-400',    bg: 'bg-blue-500/10',    bar: 'bg-blue-500' },
  { label: 'Roxo',   value: 'text-purple-400',  bg: 'bg-purple-500/10',  bar: 'bg-purple-500' },
  { label: 'Rosa',   value: 'text-pink-400',    bg: 'bg-pink-500/10',    bar: 'bg-pink-500' },
  { label: 'Laranja',value: 'text-orange-400',  bg: 'bg-orange-500/10',  bar: 'bg-orange-500' },
  { label: 'Âmbar',  value: 'text-amber-400',   bg: 'bg-amber-500/10',   bar: 'bg-amber-500' },
];

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '🎓', '💊', '🎮', '💍', '📱', '🏖️', '💰', '🎯', '🛒'];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function monthsUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

// ── Contribute Modal ─────────────────────────────────────────────────────────
interface ContributeModalProps {
  goal: Goal;
  onContribute: (amount: number) => void;
  onClose: () => void;
}

const ContributeModal: React.FC<ContributeModalProps> = ({ goal, onContribute, onClose }) => {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const remaining = goal.targetAmount - goal.currentAmount;

  const handleSubmit = () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { toast.error('Valor inválido'); return; }
    onContribute(mode === 'add' ? n : -n);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] rounded-t-[28px] border border-white/10 p-6 space-y-5 animate-slide-up pb-safe pb-8">
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto" />

        <div className="text-center">
          <p className="text-2xl mb-1">{goal.icon}</p>
          <h3 className="text-[15px] font-bold text-white">{goal.name}</h3>
          <p className="text-[12px] text-white/40 mt-1">
            {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
          </p>
        </div>

        {/* Mode */}
        <div className="flex bg-white/5 p-1 rounded-xl gap-1">
          <button onClick={() => setMode('add')}
            className={`flex-1 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${mode === 'add' ? 'bg-emerald-500 text-black' : 'text-white/30'}`}>
            <PlusCircle className="w-3.5 h-3.5" /> Depositar
          </button>
          <button onClick={() => setMode('remove')}
            className={`flex-1 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${mode === 'remove' ? 'bg-rose-500 text-white' : 'text-white/30'}`}>
            <MinusCircle className="w-3.5 h-3.5" /> Retirar
          </button>
        </div>

        {/* Quick amounts */}
        {mode === 'add' && remaining > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 200].map(v => (
              <button key={v} onClick={() => setAmount(v.toString())}
                className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${amount === v.toString() ? 'bg-theme/10 border-theme/40 text-theme' : 'bg-white/5 border-white/5 text-white/40 hover:text-white/70'}`}>
                R${v}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">R$</span>
          <input type="number" inputMode="decimal" placeholder="0,00" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-white/5 border border-white/8 rounded-2xl pl-10 pr-4 py-3.5 text-white font-bold outline-none focus:border-theme/30 transition-all" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-white/5 text-white/40 font-bold text-sm hover:bg-white/10 transition-all">Cancelar</button>
          <button onClick={handleSubmit}
            className={`flex-[2] h-12 rounded-2xl font-bold text-sm active:scale-95 transition-all ${mode === 'add' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-rose-500 text-white'}`}>
            {mode === 'add' ? 'Depositar' : 'Retirar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main GoalsView ────────────────────────────────────────────────────────────
export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onBack, onAdd, onDelete, onContribute }) => {
  const [showForm, setShowForm] = useState(false);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', targetAmount: '', currentAmount: '0',
    deadline: '', icon: '🎯', color: GOAL_COLORS[0].value,
  });

  const totalSaved = goals.reduce((a, g) => a + g.currentAmount, 0);
  const totalTarget = goals.reduce((a, g) => a + g.targetAmount, 0);

  const handleAdd = () => {
    const target = parseFloat(form.targetAmount);
    const current = parseFloat(form.currentAmount) || 0;
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (isNaN(target) || target <= 0) { toast.error('Meta inválida'); return; }

    onAdd({
      name: form.name.trim(),
      targetAmount: target,
      currentAmount: Math.min(current, target),
      deadline: form.deadline || null,
      icon: form.icon,
      color: form.color,
    });

    setForm({ name: '', targetAmount: '', currentAmount: '0', deadline: '', icon: '🎯', color: GOAL_COLORS[0].value });
    setShowForm(false);
    toast.success('Meta criada!');
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
      toast.info('Meta removida');
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col animate-slide-up">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-2xl border-b border-white/[0.05] px-5 pt-safe pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-[15px] font-bold text-white">Metas</h1>
            <p className="text-[11px] text-white/30 font-medium">{goals.length} {goals.length === 1 ? 'meta' : 'metas'}</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="w-10 h-10 rounded-full bg-theme flex items-center justify-center text-black shadow-glow active:scale-95 transition-all">
            <Plus className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        {/* Total strip */}
        {goals.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/3 border border-white/5">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Total guardado</span>
            </div>
            <div className="text-right">
              <span className="text-[13px] font-black text-white tabular-nums">{formatCurrency(totalSaved)}</span>
              <span className="text-[10px] text-white/25 ml-1">/ {formatCurrency(totalTarget)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4 pb-28">

        {/* Add Form */}
        {showForm && (
          <div className="glass-card p-5 rounded-[24px] space-y-4 animate-fade-in border border-theme/20">
            <p className="text-[11px] font-black text-theme uppercase tracking-widest">Nova Meta</p>

            {/* Emoji picker */}
            <div className="space-y-2">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Ícone</p>
              <div className="flex flex-wrap gap-2">
                {GOAL_EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.icon === e ? 'bg-theme/20 scale-110 ring-1 ring-theme/40' : 'bg-white/5 hover:bg-white/10'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <input type="text" placeholder="Nome da meta (ex: Viagem para Europa)"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-theme/30 transition-all" />

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">Meta R$</span>
                <input type="number" inputMode="decimal" placeholder="0" value={form.targetAmount}
                  onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-14 pr-3 py-3 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-theme/30 transition-all" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">Tenho R$</span>
                <input type="number" inputMode="decimal" placeholder="0" value={form.currentAmount}
                  onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-14 pr-3 py-3 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-theme/30 transition-all" />
              </div>
            </div>

            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Prazo (opcional)</p>
              <input type="date" value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-theme/30 transition-all" />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Cor</p>
              <div className="flex gap-2">
                {GOAL_COLORS.map(c => (
                  <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`w-8 h-8 rounded-full ${c.bar} transition-all ${form.color === c.value ? 'scale-125 ring-2 ring-white/30' : 'opacity-50 hover:opacity-80'}`} />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl bg-white/5 text-white/40 text-sm font-bold hover:bg-white/10 transition-all">Cancelar</button>
              <button onClick={handleAdd} className="flex-[2] h-11 rounded-xl bg-theme text-black text-sm font-bold shadow-glow hover:brightness-110 active:scale-95 transition-all">Criar Meta</button>
            </div>
          </div>
        )}

        {/* Goals list */}
        {goals.length === 0 && !showForm ? (
          <div className="py-20 text-center space-y-3 opacity-30">
            <p className="text-4xl">🎯</p>
            <p className="text-sm font-medium text-white/50">Nenhuma meta ainda</p>
            <p className="text-[11px] text-white/30">Viagem, carro, reserva de emergência...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((g, idx) => {
              const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
              const remaining = g.targetAmount - g.currentAmount;
              const done = remaining <= 0;
              const days = daysUntil(g.deadline);
              const months = monthsUntil(g.deadline);
              const monthlyNeeded = months && remaining > 0 ? remaining / months : null;
              const colorObj = GOAL_COLORS.find(c => c.value === g.color) || GOAL_COLORS[0];
              const isDeleting = deleteConfirm === g.id;

              return (
                <div key={g.id} className={`glass-card p-5 rounded-[24px] space-y-4 animate-fade-in ${done ? 'border border-emerald-500/30' : ''}`}
                  style={{ animationDelay: `${idx * 70}ms` }}>

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${colorObj.bg} flex items-center justify-center text-2xl shrink-0`}>
                        {done ? '🎉' : g.icon}
                      </div>
                      <div>
                        <p className="font-bold text-[14px] text-white">{g.name}</p>
                        {g.deadline && (
                          <p className={`text-[10px] font-medium mt-0.5 ${days !== null && days < 30 ? 'text-rose-400' : 'text-white/30'}`}>
                            {days !== null && days > 0 ? `${days} dias restantes` : days === 0 ? 'Prazo hoje!' : 'Prazo encerrado'}
                          </p>
                        )}
                      </div>
                    </div>

                    <button onClick={() => handleDelete(g.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${isDeleting ? 'bg-rose-500 text-white' : 'bg-white/5 text-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400'}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[18px] font-black text-white tabular-nums">{formatCurrency(g.currentAmount)}</span>
                        <span className="text-[11px] text-white/30 ml-1">de {formatCurrency(g.targetAmount)}</span>
                      </div>
                      <span className={`text-[13px] font-black ${done ? 'text-emerald-400' : colorObj.value}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${colorObj.bar} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${progress}%` }} />
                    </div>

                    {!done && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/25">Faltam {formatCurrency(remaining)}</span>
                        {monthlyNeeded && (
                          <span className="text-[10px] text-white/25">{formatCurrency(monthlyNeeded)}/mês para o prazo</span>
                        )}
                      </div>
                    )}

                    {done && (
                      <p className="text-[11px] font-bold text-emerald-400 text-center">🎉 Meta atingida!</p>
                    )}
                  </div>

                  {/* Contribute button */}
                  {!done && (
                    <button onClick={() => setContributing(g)}
                      className={`w-full h-10 rounded-xl ${colorObj.bg} ${colorObj.value} text-[12px] font-bold border border-current/20 hover:brightness-110 active:scale-95 transition-all`}>
                      + Depositar / Retirar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contributing && (
        <ContributeModal
          goal={contributing}
          onContribute={amount => onContribute(contributing.id, amount)}
          onClose={() => setContributing(null)}
        />
      )}
    </div>
  );
};
