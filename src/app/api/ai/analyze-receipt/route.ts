import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

export async function POST(request: Request) {
  const { imageData } = await request.json();

  if (!imageData) {
    return Response.json({ error: "Imagem não fornecida" }, { status: 400 });
  }

  const parts = imageData.split(",");
  const base64 = parts[1];
  const mimeType = (parts[0]?.split(";")[0]?.split(":")[1]) || "image/jpeg";

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: { data: base64, mimeType },
    },
    `Analise este recibo/nota fiscal detalhadamente. Retorne SOMENTE um JSON válido sem markdown, sem explicações:

{
  "vendor": "nome do estabelecimento/loja exatamente como no recibo",
  "amount": valor_total_numérico_sem_símbolo_de_moeda,
  "currency": "código da moeda (USD, EUR, BRL, GBP, etc)",
  "category": "uma das opções: Restaurante, Supermercado, Loja, Farmácia, Transporte, Hotel, Entretenimento, Atrações, Outro",
  "description": "resumo curto do que foi comprado (máx 60 chars)",
  "items": [
    { "name": "nome do produto/item", "qty": quantidade_numérica, "price": preço_unitário_numérico },
    ...liste todos os itens visíveis no recibo...
  ]
}

Regras:
- Se não conseguir identificar um campo, use null
- Para items, liste o máximo possível de itens visíveis
- qty e price podem ser null se não visíveis
- amount deve ser o total final pago`,
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return Response.json({ error: "Não foi possível analisar o recibo" }, { status: 500 });
  }

  try {
    const data = JSON.parse(jsonMatch[0]);
    return Response.json(data);
  } catch {
    return Response.json({ error: "Erro ao processar resposta da IA" }, { status: 500 });
  }
}
