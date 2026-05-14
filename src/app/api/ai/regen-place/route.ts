import { GoogleGenerativeAI } from "@google/generative-ai";

const CATEGORY_COLORS: Record<string, string> = {
  Atração: "from-amber-500 to-orange-500",
  Museu: "from-violet-500 to-purple-600",
  Restaurante: "from-emerald-500 to-teal-600",
  Passeio: "from-sky-500 to-blue-600",
  Compras: "from-pink-500 to-rose-600",
  Monumento: "from-indigo-500 to-blue-600",
  Praia: "from-cyan-500 to-teal-500",
  Parque: "from-green-500 to-emerald-600",
};

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPS_KEY) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${MAPS_KEY}`
    );
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { city, date, placeToReplace, existingPlaces } = await request.json();

  if (!city?.trim()) return Response.json({ error: "Cidade não informada" }, { status: 400 });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `Você é um assistente de planejamento de viagens. Sugira locais APENAS na cidade especificada. Nunca sugira lugares de outras cidades.`,
  });

  const others = Array.isArray(existingPlaces) ? existingPlaces.join(", ") : "";
  const prompt = `Sugira UM ÚNICO local turístico real para substituir "${placeToReplace}" em ${city} (${date}).
A cidade é: ${city}. O local deve estar fisicamente em ${city}.
${others ? `Não repetir: ${others}` : ""}

Retorne SOMENTE um objeto JSON válido, sem markdown:

{
  "title": "Nome real do local em ${city}",
  "emoji": "emoji",
  "category": "Atração ou Museu ou Restaurante ou Passeio ou Compras ou Monumento ou Praia ou Parque",
  "time": "HH:MM",
  "duration": "Xh ou Xmin",
  "note": "dica prática curta",
  "description": "descrição real de 2 frases",
  "address": "endereço completo em ${city}",
  "lat": latitude_numérica,
  "lng": longitude_numérica
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return Response.json({ error: "Resposta inválida da IA" }, { status: 500 });

  let p;
  try {
    p = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ error: "Erro ao processar resposta" }, { status: 500 });
  }

  const coords =
    (await geocode(`${p.title}, ${city}`)) ??
    (p.lat && p.lng ? { lat: p.lat, lng: p.lng } : null) ??
    (await geocode(city)) ??
    { lat: 0, lng: 0 };

  return Response.json({
    place: {
      title: p.title,
      emoji: p.emoji || "📍",
      category: p.category,
      color: CATEGORY_COLORS[p.category] || "from-slate-500 to-slate-600",
      position: coords,
      time: p.time,
      duration: p.duration,
      note: p.note,
      description: p.description,
      address: p.address,
      photoUrl: undefined,
    },
  });
}
