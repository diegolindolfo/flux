import { Category } from './types';
import {
  Coffee, ShoppingBag, Home, Zap, Heart,
  TrendingUp, HelpCircle, Smartphone, Car
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, any> = {
  'Coffee': Coffee,
  'ShoppingBag': ShoppingBag,
  'Home': Home,
  'Zap': Zap,
  'Heart': Heart,
  'TrendingUp': TrendingUp,
  'HelpCircle': HelpCircle,
  'Smartphone': Smartphone,
  'Car': Car
};

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentação', icon: 'Coffee', color: 'text-orange-400', keywords: ['food', 'ifood', 'mercado', 'restaurante', 'lanche', 'padaria', 'açougue', 'mcdonalds', 'burger king', 'bk', 'almoço', 'jantar', 'café', 'cafe'] },
  { id: '2', name: 'Transporte', icon: 'Car', color: 'text-blue-400', keywords: ['uber', '99', 'gasolina', 'posto', 'onibus', 'metrô', 'estacionamento', 'pedágio', 'manutenção carro', 'oficina', 'mecanico'] },
  { id: '3', name: 'Moradia', icon: 'Home', color: 'text-indigo-400', keywords: ['aluguel', 'condominio', 'luz', 'agua', 'net', 'internet', 'energia', 'iptu', 'gás', 'manutenção casa', 'reforma'] },
  { id: '4', name: 'Lazer', icon: 'Smartphone', color: 'text-purple-400', keywords: ['cinema', 'netflix', 'spotify', 'jogo', 'show', 'viagem', 'bar', 'cerveja', 'festa', 'ingresso', 'games'] },
  { id: '5', name: 'Saúde', icon: 'Heart', color: 'text-rose-400', keywords: ['farmacia', 'medico', 'exame', 'remedio', 'fralda', 'psicologo', 'hospital', 'dentista', 'clinica', 'terapia', 'drogaria', 'saude', 'droga raia', 'pague menos'] },
  { id: '6', name: 'Compras', icon: 'ShoppingBag', color: 'text-pink-400', keywords: ['amazon', 'shopee', 'roupa', 'presente', 'eletronico', 'magalu', 'mercadolivre', 'loja', 'vestuario', 'calçado'] },
  { id: '7', name: 'Outros', icon: 'HelpCircle', color: 'text-gray-400', keywords: [] },
  { id: '8', name: 'Renda', icon: 'TrendingUp', color: 'text-emerald-400', keywords: ['salario', 'pix', 'venda', 'reembolso', 'bonus', 'dividendos', 'rendimento'] },
];
