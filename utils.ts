import { CATEGORIES } from './constants';
import { ParsedInput, TransactionType, Transaction, Category } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const guessCategoryFromDescription = (description: string, isIncome: boolean): Category => {
  const descLower = description.toLowerCase().trim();
  if (!descLower) return CATEGORIES.find(c => c.id === (isIncome ? '8' : '7'))!;

  const matchedCategory = CATEGORIES.find(c =>
    c.keywords.some(k => {
      const keyword = k.toLowerCase();
      if (keyword.length <= 3) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(descLower);
      }
      return descLower.includes(keyword);
    })
  );

  if (matchedCategory) return matchedCategory;

  return isIncome
    ? CATEGORIES.find(c => c.id === '8')!
    : CATEGORIES.find(c => c.id === '7')!;
};

export const parseSmartInput = (input: string): ParsedInput => {
  if (!input) return { amount: null, description: '', guessedCategory: null, type: 'expense' };

  const amountRegex = /((?:R\$)?\s*\d+(?:[.,]\d+)*)/;
  const amountMatch = input.match(amountRegex);
  let amount: number | null = null;
  let cleanInput = input;

  if (amountMatch) {
    let valStr = amountMatch[0].replace(/R\$\s*/gi, '').trim();
    if (valStr.includes(',') && valStr.includes('.')) valStr = valStr.replace(/\./g, '').replace(',', '.');
    else if (valStr.includes(',')) valStr = valStr.replace(',', '.');

    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      amount = val;
      cleanInput = input.replace(amountMatch[0], '').trim();
    }
  }

  const incomeKeywords = ['recebi', 'ganhei', 'salario', 'pix recebido', 'venda', 'reembolso', 'ganho'];
  const isIncome = incomeKeywords.some(k => input.toLowerCase().includes(k));
  const type: TransactionType = isIncome ? 'income' : 'expense';

  const guessedCategory = guessCategoryFromDescription(cleanInput || input, isIncome);

  return {
    amount,
    description: cleanInput || 'Nova Transação',
    guessedCategory,
    type
  };
};

export const cleanDescription = (raw: string): string => {
  if (!raw) return 'Sem descrição';

  let text = raw.trim();

  const prefixesToRemove = [
    "Transferência enviada pelo Pix",
    "Transferência recebida pelo Pix",
    "Transferência enviada",
    "Transferência recebida",
    "Pix enviado",
    "Pix recebido",
    "Compra no débito",
    "Compra no crédito",
    "Pagamento de fatura",
    "Pagamento de boleto",
    "Envio de Pix",
    "Recebimento de Pix"
  ];

  prefixesToRemove.forEach(p => {
    const regex = new RegExp(`^${p}\\s*-\\s*|^${p}\\s*:\\s*|^${p}\\s*`, 'i');
    text = text.replace(regex, "");
  });

  const parts = text.split(/\s*-\s*|\s*\/\s*/);

  const isUselessPart = (p: string) => {
    const low = p.toLowerCase();
    if (p.includes('•') || p.includes('*')) return true;
    if ((p.match(/\d/g) || []).length > 5 && !p.match(/[a-zA-Z]{3,}/)) return true;
    if (low.includes('bco') || low.includes('agencia') || low.includes('conta') || low.includes('agência') || low.includes('itau') || low.includes('bradesco') || low.includes('nubank') || low.includes('santander') || low.includes('pagseguro')) return true;
    if (low.includes('autenticacao') || low.includes('identificador') || low.includes('vencimento')) return true;
    return false;
  };

  const validParts = parts.filter(p => p.length > 2 && !isUselessPart(p));

  if (validParts.length > 0) {
    text = validParts[0];
  }

  text = text.replace(/\s*\([^)]*\)/g, "");
  text = text.replace(/(ag|cc|agencia|conta|banco)[:\s\-]*[0-9xX\-.]+/gi, "");
  text = text.replace(/\b\d{4,}\b/g, "");
  text = text.replace(/^[^a-zA-ZÀ-ÿ0-9]+/, "");
  text = text.replace(/[^a-zA-ZÀ-ÿ0-9]+$/, "");
  text = text.replace(/\s{2,}/g, " ");
  text = text.toLowerCase().replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
  text = text.replace(/\s(De|Da|Do|Dos|Das|E|Pelo|Pela)\s/g, (match) => match.toLowerCase());

  return text.trim() || raw;
};

export const parseCSV = async (file: File): Promise<Transaction[]> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  const transactions: Transaction[] = [];

  const startIndex = lines[0]?.toLowerCase().includes('data') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts: string[] = [];
    let current = '';
    let inQuote = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);

    const cols = parts.map(p => p.trim().replace(/^"|"$/g, ''));

    if (cols.length < 4) continue;

    const [dateStr, valueStr, id, rawDesc] = cols;

    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) continue;
    const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T12:00:00Z`);
    if (isNaN(date.getTime())) continue;

    const rawValue = parseFloat(valueStr);
    if (isNaN(rawValue)) continue;

    const type: TransactionType = rawValue >= 0 ? 'income' : 'expense';
    const desc = cleanDescription(rawDesc);
    const guessedCategory = guessCategoryFromDescription(desc, type === 'income');

    transactions.push({
      id: id || Math.random().toString(36).substr(2, 9),
      amount: Math.abs(rawValue),
      description: desc,
      categoryId: guessedCategory.id,
      date: date.toISOString(),
      type
    });
  }

  return transactions;
};
