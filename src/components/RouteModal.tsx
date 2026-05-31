"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";

type TravelMode = "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING";

const TRAVEL_MODES: { mode: TravelMode; label: string; icon: string }[] = [
  { mode: "DRIVING", label: "Carro", icon: "🚗" },
  { mode: "WALKING", label: "A pé", icon: "🚶" },
  { mode: "TRANSIT", label: "Ônibus", icon: "🚌" },
  { mode: "BICYCLING", label: "Bici", icon: "🚲" },
];

export default function RouteModal() {
  const { pendingRoutePlace, setPendingRoutePlace } = useTripStore();

  const [originMode, setOriginMode] = useState<"location" | "address">("location");
  const [customAddress, setCustomAddress] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const [isLocating, setIsLocating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");

  if (!pendingRoutePlace) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada neste navegador.");
      return;
    }
    setIsLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginMode("location");
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError("Não foi possível obter sua localização. Tente inserir um endereço.");
        setOriginMode("address");
      }
    );
  };

  const handleOpenGoogleMaps = () => {
    const { lat, lng } = pendingRoutePlace.position;
    const mode = travelMode.toLowerCase();
    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${mode}`;

    if (originMode === "location" && currentPosition) {
      url += `&origin=${currentPosition.lat},${currentPosition.lng}`;
    } else if (originMode === "address" && customAddress.trim()) {
      url += `&origin=${encodeURIComponent(customAddress.trim())}`;
    } else {
      setError("Informe sua localização ou um endereço de partida.");
      return;
    }

    window.open(url, "_blank");
    setPendingRoutePlace(null);
  };

  const canTrace =
    (originMode === "location" && currentPosition !== null) ||
    (originMode === "address" && customAddress.trim() !== "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setPendingRoutePlace(null)}
    >
      <div
        className="bg-[#111827] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Traçar Rota</h2>
            <p className="text-sm text-slate-400">
              Destino: {pendingRoutePlace.emoji} {pendingRoutePlace.title}
            </p>
          </div>
          <button
            onClick={() => setPendingRoutePlace(null)}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Origin section */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Ponto de partida
          </p>

          <button
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all mb-3 cursor-pointer ${
              originMode === "location" && currentPosition
                ? "bg-violet-600/20 border-violet-500 text-violet-300"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {isLocating ? (
              <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin shrink-0" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="1" />
                <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            )}
            <div className="text-left">
              <p className="text-sm font-semibold">
                {isLocating
                  ? "Localizando..."
                  : originMode === "location" && currentPosition
                  ? "Localização obtida ✓"
                  : "Usar minha localização atual"}
              </p>
              {originMode === "location" && currentPosition && (
                <p className="text-xs text-violet-400">GPS ativo</p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <input
            type="text"
            placeholder="Inserir endereço de partida..."
            value={customAddress}
            onChange={(e) => {
              setCustomAddress(e.target.value);
              setOriginMode("address");
            }}
            onFocus={() => setOriginMode("address")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:bg-violet-500/5 transition-all"
          />
        </div>

        {/* Travel mode */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Modo de transporte
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TRAVEL_MODES.map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all cursor-pointer ${
                  travelMode === mode
                    ? "bg-violet-600/20 border-violet-500 text-violet-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        {/* Button */}
        <button
          onClick={handleOpenGoogleMaps}
          disabled={!canTrace}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/25 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Traçar Rota no Google Maps
        </button>
      </div>
    </div>
  );
}
