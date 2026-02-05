import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";
import { formatCurrency } from "../utils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFinancialInsight(transactions: Transaction[], balance: number) {
  if (transactions.length === 0) return "Comece a registrar para receber dicas personalizadas!";

  const recentTransactions = transactions.slice(0, 10).map(t => ({
    desc: t.description,
    val: formatCurrency(t.amount),
    type: t.type
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estas transações financeiras e dê uma dica curta (máximo 15 palavras) e motivadora em português: 
      Saldo atual: ${formatCurrency(balance)}. 
      Transações recentes: ${JSON.stringify(recentTransactions)}`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 50,
      }
    });

    return response.text?.trim() || "Mantenha o foco nos seus objetivos financeiros!";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Economizar é o primeiro passo para a liberdade!";
  }
}