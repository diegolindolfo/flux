import React, { useState } from 'react';
import { Transaction } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { X, Check, Trash2, Layers } from 'lucide-react';
import { HelpCircle } from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: (id: string, newCategoryId: string, updateSimilar: boolean) => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ 
  transaction, 
  onClose, 
  onUpdate, 
  onDelete 
}) => {
  const [selectedCategory, setSelectedCategory] = useState(transaction.categoryId);
  const [updateSimilar, setUpdateSimilar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    onUpdate(transaction.id, selectedCategory, updateSimilar);
    onClose();
  };

  const handleDelete = () => {
      if (isDeleting) {
          onDelete(transaction.id);
          onClose();
      } else {
          setIsDeleting(true);
      }
  };

  const isIncome = transaction.type === 'income';

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-fade-in" 
            onClick={onClose}
        />

        {/* Modal Content */}
        <div className="bg-[#121212] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border border-white/10 p-6 pointer-events-auto animate-slide-up shadow-2xl relative overflow-hidden">
            
            {/* Header / Amount */}
            <div className="text-center mb-6 relative z-10">
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
                
                <p className="text-sm font-medium text-white/50 mb-1">{formatDate(transaction.date)}</p>
                <h2 className="text-3xl font-bold text-white mb-2">{transaction.description}</h2>
                <p className={`text-2xl font-bold tracking-tight ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
            </div>

            {/* Category Grid */}
            <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Alterar Categoria</p>
                <div className="grid grid-cols-4 gap-3">
                    {CATEGORIES.map(cat => {
                        const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
                        const isSelected = selectedCategory === cat.id;
                        
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`
                                    flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-white/10 border-theme shadow-[0_0_15px_rgba(0,230,118,0.15)] scale-105' 
                                        : 'bg-transparent border-transparent hover:bg-white/5 opacity-50 hover:opacity-100'
                                    }
                                `}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? 'text-white' : 'text-white/50'}`}>
                                    {cat.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Smart Update Option */}
            <div 
                className={`flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/5 mb-6 transition-all cursor-pointer hover:bg-white/10 ${selectedCategory === transaction.categoryId ? 'opacity-50 pointer-events-none grayscale' : ''}`}
                onClick={() => setUpdateSimilar(!updateSimilar)}
            >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${updateSimilar ? 'bg-theme border-theme text-black' : 'border-white/30'}`}>
                    {updateSimilar && <Check className="w-3 h-3" strokeWidth={4} />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-white">Atualizar similares?</p>
                    <p className="text-xs text-white/50">Aplica a todas as transações com esta descrição.</p>
                </div>
                <Layers className="w-5 h-5 text-white/20" />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button 
                    onClick={handleDelete}
                    className={`flex-1 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isDeleting ? 'bg-rose-500 text-white' : 'bg-white/5 text-rose-500 hover:bg-rose-500/10'}`}
                >
                    <Trash2 className="w-5 h-5" />
                    {isDeleting ? 'Confirmar?' : 'Excluir'}
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-[2] h-14 rounded-2xl bg-theme text-black font-bold text-sm shadow-glow flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                >
                    Salvar Alterações
                </button>
            </div>

            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>
    </div>
  );
};