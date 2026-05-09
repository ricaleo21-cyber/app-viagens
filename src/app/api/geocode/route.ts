const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || !API_KEY) return Response.json({ lat: 0, lng: 0 });
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${API_KEY}`
    );
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    return Response.json(loc ? { lat: loc.lat, lng: loc.lng } : { lat: 0, lng: 0 });
  } catch {
    return Response.json({ lat: 0, lng: 0 });
  }
}
