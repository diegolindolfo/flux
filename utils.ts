import { CATEGORIES } from './constants';
import { ParsedInput, TransactionType, Transaction } from './types';

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

export const parseSmartInput = (input: string): ParsedInput => {
    if (!input) return { amount: null, description: '', guessedCategory: null, type: 'expense' };

    // 1. Extract Amount (R$ 50,00 or 50.00 or 50)
    const amountRegex = /((?:R\$)?\s*\d+(?:[.,]\d+)*)/;
    const amountMatch = input.match(amountRegex);
    let amount: number | null = null;
    let cleanInput = input;

    if (amountMatch) {
        let valStr = amountMatch[0].replace(/R\$\s*/gi, '').trim();
        // Brazilian format fix: 1.000,00 -> 1000.00
        if (valStr.includes(',') && valStr.includes('.')) valStr = valStr.replace(/\./g, '').replace(',', '.');
        else if (valStr.includes(',')) valStr = valStr.replace(',', '.');
        
        const val = parseFloat(valStr);
        if (!isNaN(val)) {
            amount = val;
            cleanInput = input.replace(amountMatch[0], '').trim();
        }
    }

    // 2. Determine Type (Income vs Expense)
    const incomeKeywords = ['recebi', 'ganhei', 'salario', 'pix recebido', 'venda'];
    const isIncome = incomeKeywords.some(k => input.toLowerCase().includes(k));
    const type: TransactionType = isIncome ? 'income' : 'expense';

    // 3. Guess Category
    const descLower = cleanInput.toLowerCase();
    const category = CATEGORIES.find(c => c.keywords.some(k => descLower.includes(k))) || 
                     (isIncome ? CATEGORIES.find(c => c.id === '8') : CATEGORIES.find(c => c.id === '7')); // Default to Outros or Renda

    return {
        amount,
        description: cleanInput || 'Nova Transação',
        guessedCategory: category || null,
        type
    };
};

const cleanDescription = (raw: string): string => {
    if (!raw) return 'Sem descrição';
    
    let text = raw.trim();

    // 1. Remove sufixos entre parênteses (ex: "Nome (Transferência enviada)")
    text = text.replace(/\s*\([^)]*\)/g, "");

    // 2. Remove prefixos bancários comuns
    // Regex complexa para pegar variações de texto bancário
    const prefixes = [
        "compra no d[ée]bito( via)?( nupay)?",
        "compra no cr[ée]dito( via)?",
        "pagamento( de)?( fatura)?( para)?",
        "transfer[êe]ncia( recebida| enviada)?( pelo)?( pix)?( via)?( open banking)?",
        "envio de pix",
        "pix enviado( para)?",
        "pix recebido( de)?",
        "dep[óo]sito",
        "recarga de celular",
        "ajuste de",
        "estorno",
        "resgate"
    ];

    const prefixRegex = new RegExp(`^(${prefixes.join('|')})[:\\s]*`, 'i');
    const match = text.match(prefixRegex);

    // Se encontrou prefixo, remove APENAS se sobrar algo depois (para não deixar string vazia)
    if (match && text.replace(match[0], '').trim().length > 1) {
        text = text.replace(match[0], '');
    }

    // 3. Remove números/IDs/CPFs no início (ex: "37 294 948 Bruno...", "123456 Mercado")
    // Remove qualquer sequência de caracteres que não seja letra no começo
    text = text.replace(/^[^a-zA-ZÀ-ÿ]+/, "");

    // 4. Remove conectores soltos no inicio ou fim
    text = text.replace(/^(de|para|a)\s+/i, "");

    // 5. Title Case (Primeira letra maiúscula)
    text = text.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    
    // Corrige conectores para minúsculo (de, da, do...)
    text = text.replace(/\s(De|Da|Do|Dos|Das|E)\s/g, (match) => match.toLowerCase());

    return text.trim() || raw; // Retorna original se limpou tudo
};

export const parseCSV = async (file: File): Promise<Transaction[]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const transactions: Transaction[] = [];

    // Identify header row
    const startIndex = lines[0]?.toLowerCase().includes('data') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Manual CSV parser to handle quotes containing commas
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

        // Clean quotes and trim
        const cols = parts.map(p => p.trim().replace(/^"|"$/g, ''));
        
        // Expected format: Data, Valor, Identificador, Descrição
        if (cols.length < 4) continue;
        
        const [dateStr, valueStr, id, rawDesc] = cols;

        // Date Parsing: 03/02/2026 -> ISO
        const dateParts = dateStr.split('/');
        if (dateParts.length !== 3) continue;
        // Use noon to avoid timezone shifting dates
        const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T12:00:00Z`);
        if (isNaN(date.getTime())) continue;

        const rawValue = parseFloat(valueStr);
        if (isNaN(rawValue)) continue;

        const type: TransactionType = rawValue >= 0 ? 'income' : 'expense';
        
        // Clean Description
        const desc = cleanDescription(rawDesc);
        
        // Auto-categorize
        const descLower = desc.toLowerCase();
        let categoryId = type === 'income' ? '8' : '7';
        
        const foundCategory = CATEGORIES.find(c => c.keywords.some(k => descLower.includes(k)));
        if (foundCategory) categoryId = foundCategory.id;

        transactions.push({
            id: id || Math.random().toString(36).substr(2, 9),
            amount: Math.abs(rawValue),
            description: desc,
            categoryId,
            date: date.toISOString(),
            type
        });
    }

    return transactions;
};