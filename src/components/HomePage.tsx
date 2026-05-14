"use client";

import { useEffect, useState } from "react";
import { useTripStore, type Trip } from "@/store/tripStore";

// ---- New Trip Modal ----

function NewTripModal({ onClose }: { onClose: () => void }) {
  const { addTrip, loadTrip } = useTripStore();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cities, setCities] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const days =
      start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) : 1;
    const cityList = cities.split(",").map((c) => c.trim()).filter(Boolean);
    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });

    const newTrip: Trip = {
      id: String(Date.now()),
      name: name.trim(),
      startDate: start ? fmt(start) : "",
      endDate: end ? fmt(end) + ", " + end.getFullYear() : "",
      totalDays: days,
      cities: cityList.length > 0 ? cityList : [""],
      mapCenter: { lat: 0, lng: 0 },
      mapZoom: 3,
      days: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        id: i + 1,
        label: `Dia ${i + 1}`,
        date: start
          ? new Date(start.getTime() + i * 86400000).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "short",
            })
          : `Dia ${i + 1}`,
        city: cityList[0] ?? "",
      })),
      places: [],
      wishlist: [],
      receipts: [],
    };

    addTrip(newTrip);
    loadTrip(newTrip.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Nova viagem</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome da viagem</label>
            <input
              autoFocus
              type="text"
              placeholder="Ex: Paris & Roma, Férias em Cancún..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Início</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fim</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cidades (separadas por vírgula)</label>
            <input
              type="text"
              placeholder="Ex: Paris, Roma, Veneza"
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            Criar viagem
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Trip Card ----

const GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-teal-500",
];

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const { loadTrip, updateTripCover, deleteTrip } = useTripStore();
  const [photo, setPhoto] = useState(trip.coverPhotoUrl);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    // Skip if photo already known (loaded from store) or no city to search
    if (photo !== undefined || !trip.cities[0]) return;
    fetch(`/api/place-photo?q=${encodeURIComponent(trip.cities[0])}`)
      .then((r) => r.json())
      .then((d) => {
        const url = d.url ?? "";
        setPhoto(url);
        if (url) updateTripCover(trip.id, url); // persist so we don't fetch again
      })
      .catch(() => setPhoto(""));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gradient = GRADIENTS[index % GRADIENTS.length];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      deleteTrip(trip.id);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <div
      onClick={() => !confirmDelete && loadTrip(trip.id)}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white"
    >
      {/* Cover */}
      <div className="relative h-44 overflow-hidden">
        {photo ? (
          <img src={photo} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            {photo === undefined ? (
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-5xl">✈️</span>
            )}
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Delete button / confirm */}
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
              <span className="text-xs text-white font-semibold">Excluir?</span>
              <button
                onClick={handleDelete}
                className="text-xs text-red-400 font-bold hover:text-red-300 transition-colors cursor-pointer px-1"
              >
                Sim
              </button>
              <button
                onClick={handleCancelDelete}
                className="text-xs text-slate-300 font-semibold hover:text-white transition-colors cursor-pointer px-1"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-black/50 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-black/70 cursor-pointer"
              title="Excluir viagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          )}
        </div>

        {/* City pills */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {trip.cities.filter(Boolean).map((city) => (
            <span key={city} className="text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/30">
              {city}
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-violet-600 transition-colors truncate">
          {trip.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {trip.startDate}{trip.endDate ? ` – ${trip.endDate}` : ""} · {trip.totalDays} dias
          </p>
          <span className="text-xs text-slate-400">{trip.places.length} lugares</span>
        </div>
      </div>
    </div>
  );
}

// ---- Home Page ----

export default function HomePage() {
  const { trips, setShowHome } = useTripStore();
  const [showNewTrip, setShowNewTrip] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z"/>
                <path d="M9 3v14"/><path d="M15 7v14"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">ViagemPlanner</h1>
              <p className="text-[11px] text-slate-400">Seu roteiro perfeito</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewTrip(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Planejar nova viagem
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-dashed border-violet-200 flex items-center justify-center text-4xl mb-5">✈️</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhuma viagem ainda</h2>
            <p className="text-slate-400 mb-6">Crie seu primeiro roteiro e comece a planejar!</p>
            <button onClick={() => setShowNewTrip(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors cursor-pointer">
              + Planejar primeira viagem
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Suas viagens</h2>
              <span className="text-sm text-slate-400">{trips.length} roteiro{trips.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trips.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} />
              ))}
              {/* Add new card */}
              <div
                onClick={() => setShowNewTrip(true)}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-violet-400 hover:bg-violet-50 transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[220px] group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-violet-500 transition-colors"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span className="text-sm font-semibold text-slate-400 group-hover:text-violet-500 transition-colors">Nova viagem</span>
              </div>
            </div>
          </>
        )}
      </main>

      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} />}
    </div>
  );
}
