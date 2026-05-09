const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || !API_KEY) return Response.json({ url: null });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`
    );
    const data = await res.json();

    const photoRef = data.results?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) return Response.json({ url: null });

    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${API_KEY}`;
    return Response.json({ url });
  } catch {
    return Response.json({ url: null });
  }
}
