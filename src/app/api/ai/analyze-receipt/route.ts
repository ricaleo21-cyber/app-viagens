import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(request: Request) {
  const { imageData } = await request.json();

  if (!imageData) {
    return Response.json({ error: "Imagem não fornecida" }, { status: 400 });
  }

  // imageData is a base64 data URL: "data:image/jpeg;base64,..."
  const parts = imageData.split(",");
  const base64 = parts[1];
  const mimeType = (parts[0]?.split(";")[0]?.split(":")[1]) || "image/jpeg";

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: { data: base64, mimeType },
    },
    `Analise este recibo/nota fiscal e extraia as informações principais. Retorne SOMENTE um JSON válido sem markdown, sem explicações:

{
  "vendor": "nome do estabelecimento ou loja",
  "amount": valor_total_numérico_sem_símbolo,
  "currency": "código da moeda (USD, EUR, BRL, etc)",
  "category": "Restaurante ou Supermercado ou Loja ou Farmácia ou Transporte ou Hotel ou Entretenimento ou Atrações ou Outro",
  "description": "breve descrição de 1 linha do que foi comprado"
}

Se não conseguir identificar algum campo, use null para ele.`,
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
