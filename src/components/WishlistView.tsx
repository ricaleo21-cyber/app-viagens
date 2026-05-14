"use client";

import { useEffect, useRef, useState } from "react";
import { useTripStore, type Place } from "@/store/tripStore";

function inferFromTypes(types: string[]): { emoji: string; category: string } {
  if (types.some(t => ["restaurant", "food", "cafe", "meal_takeaway", "bakery", "bar", "meal_delivery"].includes(t)))
    return { emoji: "🍽️", category: "Restaurante" };
  if (types.some(t => ["museum"].includes(t)))
    return { emoji: "🎨", category: "Museu" };
  if (types.some(t => ["park", "natural_feature", "campground"].includes(t)))
    return { emoji: "🌿", category: "Parque" };
  if (types.some(t => ["shopping_mall", "store", "supermarket", "department_store", "clothing_store", "grocery_or_supermarket"].includes(t)))
    return { emoji: "🛍️", category: "Compras" };
  if (types.some(t => ["lodging"].includes(t)))
    return { emoji: "🏨", category: "Hotel" };
  if (types.some(t => ["church", "place_of_worship", "hindu_temple", "mosque", "synagogue"].includes(t)))
    return { emoji: "⛪", category: "Monumento" };
  return { emoji: "📍", category: "Atração" };
}

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
const CATEGORIES = Object.keys(CATEGORY_COLORS);

// ---- Add to wishlist modal ----

function AddWishlistModal({ onClose }: { onClose: () => void }) {
  const { trip, addToWishlist } = useTripStore();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📍");
  const [category, setCategory] = useState("Atração");
  const [note, setNote] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [geocodedPosition, setGeocodedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const acInstanceRef = useRef<google.maps.places.Autocomplete | null>(null);

  const city = trip.cities.find(Boolean) || trip.name;

  // Attach Google Places Autocomplete to title input (Maps already loaded by MapContainer)
  useEffect(() => {
    const attach = () => {
      if (!titleInputRef.current || !window.google?.maps?.places) return false;
      acInstanceRef.current = new google.maps.places.Autocomplete(titleInputRef.current, {
        types: ["establishment", "geocode"],
      });
      acInstanceRef.current.addListener("place_changed", () => {
        const place = acInstanceRef.current?.getPlace();
        if (!place) return;
        if (place.name) setTitle(place.name);
        if (place.formatted_address) setAddress(place.formatted_address);
        if (place.geometry?.location) {
          setGeocodedPosition({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        }
        const { emoji: e, category: c } = inferFromTypes(place.types || []);
        setEmoji(e);
        setCategory(c);
      });
      return true;
    };
    if (!attach()) {
      const t = setTimeout(attach, 400);
      return () => clearTimeout(t);
    }
    return () => {
      if (acInstanceRef.current) google.maps.event.clearInstanceListeners(acInstanceRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    let position = geocodedPosition ?? { lat: 0, lng: 0 };
    if (!geocodedPosition) {
      try {
        const q = address.trim() || `${title.trim()}, ${city}`;
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.lat || data.lng) position = { lat: data.lat, lng: data.lng };
      } catch {}
    }
    addToWishlist({
      id: Date.now(),
      title: title.trim(),
      emoji,
      category,
      color: CATEGORY_COLORS[category] || "from-slate-500 to-slate-600",
      position,
      note: note.trim() || undefined,
      address: address.trim() || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Salvar lugar</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Search hint */}
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Digite o nome do lugar para buscar e preencher automaticamente
          </p>

          <div className="flex gap-3">
            <div className="space-y-1.5 w-20 shrink-0">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Emoji</label>
              <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-center text-xl focus:outline-none focus:border-violet-500 transition-all" />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome do lugar *</label>
              <input
                ref={titleInputRef}
                autoFocus
                type="text"
                placeholder="Ex: Walmart Supercenter..."
                value={title}
                onChange={(e) => { setTitle(e.target.value); setGeocodedPosition(null); }}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
            </div>
          </div>

          {geocodedPosition && (
            <p className="text-xs text-emerald-500 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Localização encontrada no mapa
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Endereço</label>
            <input type="text" placeholder="Preenchido automaticamente ou informe manualmente" value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nota</label>
            <textarea placeholder="Por que quero visitar, dicas, links..." value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none transition-all" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {saving ? "Salvando..." : "Salvar lugar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Move to day modal ----

function MoveToDayModal({ place, onClose }: { place: Place; onClose: () => void }) {
  const { trip, moveToItinerary, setActiveView, setShowMobileMap } = useTripStore();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleAdd = () => {
    if (selectedDay === null) return;
    moveToItinerary(place.id, selectedDay);
    setActiveView("itinerary");
    setShowMobileMap(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Adicionar ao itinerário</h2>
            <p className="text-xs text-slate-400 mt-0.5">Escolha o dia para <span className="font-semibold text-violet-500">{place.title}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-4 py-4 space-y-2 max-h-72 overflow-y-auto">
          {trip.days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
                selectedDay === day.id
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700"
              }`}
            >
              <span className="font-semibold">{day.label}</span>
              <span className="text-xs text-slate-400">{day.date} · {day.city}</span>
            </button>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleAdd} disabled={selectedDay === null}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Wishlist Card ----

function WishlistCard({ place }: { place: Place }) {
  const { removeFromWishlist, setMapCenter, setMapZoom, setShowMobileMap, updatePlace } = useTripStore();
  const [showDayModal, setShowDayModal] = useState(false);

  // Fetch photo if not loaded
  useEffect(() => {
    if (place.photoUrl !== undefined) return;
    const query = `${place.title} ${place.address ?? ""}`.trim();
    fetch(`/api/place-photo?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => updatePlace(place.id, { photoUrl: d.url ?? "" }))
      .catch(() => updatePlace(place.id, { photoUrl: "" }));
  }, [place.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all">
        <div className="flex">
          {/* Content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xl">{place.emoji}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r ${place.color} text-white`}>
                {place.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1 truncate">{place.title}</h3>
            {place.address && (
              <p className="text-xs text-slate-400 flex items-center gap-1 truncate mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {place.address}
              </p>
            )}
            {place.note && (
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="line-clamp-2">{place.note}</span>
              </p>
            )}
          </div>

          {/* Photo */}
          <div className="w-24 md:w-28 shrink-0">
            {place.photoUrl ? (
              <img src={place.photoUrl} alt={place.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full min-h-[96px] bg-gradient-to-br ${place.color} opacity-20 flex items-center justify-center`}>
                {place.photoUrl === undefined
                  ? <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                  : <span className="text-3xl opacity-60">{place.emoji}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setShowDayModal(true)}
            className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar ao itinerário
          </button>
          <button
            onClick={() => { setShowMobileMap(true); setMapCenter(place.position); setMapZoom(15); }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-violet-500 hover:border-violet-300 dark:hover:border-violet-700 transition-colors cursor-pointer"
            title="Ver no mapa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
          </button>
          <button
            onClick={() => removeFromWishlist(place.id)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700 transition-colors cursor-pointer"
            title="Remover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>

      {showDayModal && <MoveToDayModal place={place} onClose={() => setShowDayModal(false)} />}
    </>
  );
}

// ---- Main WishlistView ----

export default function WishlistView() {
  const { trip } = useTripStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const wishlist = trip.wishlist ?? [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#0b1120]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🔖</span> Lugares para Visitar
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              {wishlist.length} {wishlist.length === 1 ? "lugar salvo" : "lugares salvos"} · Adicione ao itinerário quando decidir o dia
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 cursor-pointer shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="hidden sm:inline">Salvar lugar</span>
            <span className="sm:hidden">Salvar</span>
          </button>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 pb-20 md:pb-6">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border-2 border-dashed border-violet-200 dark:border-violet-800 flex items-center justify-center text-4xl mb-5">
              🔖
            </div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Nenhum lugar salvo</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Salve lugares que você quer visitar mas ainda não decidiu o dia. Depois é só adicionar ao itinerário!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors cursor-pointer"
            >
              + Salvar primeiro lugar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {wishlist.map((place) => (
              <WishlistCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </div>

      {showAddModal && <AddWishlistModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
