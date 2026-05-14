import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(request: Request) {
  const { receipts, tripName } = await request.json();

  if (!receipts || receipts.length === 0) {
    return Response.json({ error: "Nenhum recibo para analisar" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const receiptLines = receipts
    .map((r: { vendor?: string; currency?: string; amount?: number; category?: string; description?: string }) =>
      `- ${r.vendor || "Local"}: ${r.currency || ""} ${r.amount?.toFixed(2) || "?"} (${r.category || "Outro"})${r.description ? " — " + r.description : ""}`
    )
    .join("\n");

  const prompt = `Analise os gastos desta viagem "${tripName}" e forneça um resumo útil em português brasileiro:

${receiptLines}

Responda com:
1. **Resumo dos gastos** (total e distribuição por categoria)
2. **Maior categoria de gasto** e o porquê pode estar alto
3. **2 dicas práticas** para economizar no restante da viagem

Seja direto, amigável e use emojis para tornar mais visual. Máximo 200 palavras.`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text();

  return Response.json({ summary });
}
