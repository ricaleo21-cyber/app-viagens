import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

export async function POST(request: Request) {
  const { message, history, trip } = await request.json();

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemPrompt = `Você é um assistente de viagem especializado integrado ao roteiro "${trip.name}".

Viagem atual:
- Destino: ${trip.name}
- Período: ${trip.startDate} a ${trip.endDate} (${trip.totalDays} dias)
- Cidades: ${trip.cities.join(", ")}
- Locais planejados: ${trip.places.map((p: { title: string; category: string }) => `${p.title} (${p.category})`).join(", ")}

Responda sempre em português brasileiro. Seja direto, amigável e útil. Foque em dicas práticas de viagem.`;

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [{ text: `Olá! Sou seu assistente para a viagem ${trip.name}. Como posso ajudar?` }],
      },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      })),
    ],
  });

  const result = await chat.sendMessageStream(message);

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        controller.enqueue(new TextEncoder().encode(chunk.text()));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
