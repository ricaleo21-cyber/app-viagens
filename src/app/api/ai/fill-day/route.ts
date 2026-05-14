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

async function geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPS_KEY) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${MAPS_KEY}`
    );
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

async function geocodePlace(placeName: string, city: string): Promise<{ lat: number; lng: number } | null> {
  // Try place + city first, then city alone as fallback
  return (await geocodeQuery(`${placeName}, ${city}`)) ?? (await geocodeQuery(city));
}

export async function POST(request: Request) {
  const { city, date, existingPlaces } = await request.json();

  if (!city || !city.trim()) {
    return Response.json({ error: "Cidade não informada" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `Você é um assistente de planejamento de viagens. Você DEVE sugerir atrações, restaurantes e atividades APENAS na cidade exata especificada pelo usuário. Nunca sugira lugares de outras cidades, estados ou países. Todos os locais devem ser reais e existir fisicamente na cidade indicada.`,
  });

  const prompt = `Crie um itinerário para um dia de turismo em ${city} (${date}).

A cidade é: ${city}. Todos os locais DEVEM estar em ${city}.
${existingPlaces.length > 0 ? `Locais já incluídos (não repetir): ${existingPlaces.join(", ")}` : ""}

Sugira entre 3 e 4 atividades turísticas reais e populares que existem em ${city}. Retorne SOMENTE um array JSON válido, sem markdown, sem explicações:

[
  {
    "title": "Nome real do local em ${city}",
    "emoji": "emoji adequado",
    "category": "Atração ou Museu ou Restaurante ou Passeio ou Compras ou Monumento ou Praia ou Parque",
    "time": "HH:MM",
    "duration": "Xh ou Xmin",
    "note": "uma dica prática curta",
    "description": "descrição real de 2 frases",
    "address": "endereço real completo em ${city}",
    "lat": latitude_numérica_aproximada_em_${city.replace(/\s/g, "_")},
    "lng": longitude_numérica_aproximada_em_${city.replace(/\s/g, "_")}
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return Response.json({ error: "Resposta inválida da IA" }, { status: 500 });
  }

  let places;
  try {
    places = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ error: "Erro ao processar resposta da IA" }, { status: 500 });
  }

  const formatted = await Promise.all(
    places.map(async (p: {
      title: string; emoji: string; category: string;
      time: string; duration: string; note: string;
      description: string; address: string; lat?: number; lng?: number;
    }, i: number) => {
      // Try geocoding first; fall back to AI-provided coords if geocoding fails
      const geocoded = await geocodePlace(p.title, city);
      const position = geocoded
        ?? (p.lat && p.lng ? { lat: p.lat, lng: p.lng } : null)
        ?? { lat: 0, lng: 0 };

      return {
        id: Date.now() + i,
        title: p.title,
        emoji: p.emoji || "📍",
        category: p.category,
        color: CATEGORY_COLORS[p.category] || "from-slate-500 to-slate-600",
        position,
        time: p.time,
        duration: p.duration,
        note: p.note,
        description: p.description,
        address: p.address,
      };
    })
  );

  return Response.json({ places: formatted });
}
