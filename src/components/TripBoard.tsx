"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTripStore, type Place } from "@/store/tripStore";

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

const cityCoords: Record<string, { lat: number; lng: number }> = {
  Paris: { lat: 48.8566, lng: 2.3522 },
  Roma: { lat: 41.9028, lng: 12.4964 },
};

// ---- Add Place Modal ----

function AddPlaceModal({ onClose, city }: { onClose: () => void; city: string }) {
  const { addPlace } = useTripStore();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📍");
  const [category, setCategory] = useState("Atração");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("2h");
  const [note, setNote] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    let position = { lat: 0, lng: 0 };
    try {
      const q = address.trim() || `${title.trim()}, ${city}`;
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.lat || data.lng) position = { lat: data.lat, lng: data.lng };
    } catch {}
    addPlace({
      id: Date.now(),
      title: title.trim(),
      emoji,
      category,
      color: CATEGORY_COLORS[category] || "from-slate-500 to-slate-600",
      position,
      time,
      duration,
      note: note.trim() || undefined,
      address: address.trim() || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adicionar local</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-3">
            <div className="space-y-1.5 w-20 shrink-0">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Emoji</label>
              <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-center text-xl focus:outline-none focus:border-violet-500 transition-all" />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome do local *</label>
              <input autoFocus type="text" placeholder="Ex: Bonnet House Museum" value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Horário</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duração</label>
              <input type="text" placeholder="Ex: 2h, 30min" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Endereço (para localizar no mapa)</label>
            <input type="text" placeholder={`Ex: 900 N Birch Rd, Fort Lauderdale`} value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nota</label>
            <textarea placeholder="Dicas, lembretes, horários de funcionamento..." value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none transition-all" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {saving ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Sortable Card ----

function SortablePlaceCard({
  card, index, total, isActive, onCardClick, onRouteClick, city, date,
}: {
  card: Place; index: number; total: number; isActive: boolean;
  onCardClick: (id: number) => void;
  onRouteClick: (card: Place) => void;
  city: string;
  date: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  const { updatePlace, removePlace, setShowMobileMap, setMapCenter, setMapZoom } = useTripStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(card.note || "");
  const [regenerating, setRegenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (card.photoUrl !== undefined) return;
    const query = `${card.title} ${card.address ?? ""}`.trim();
    fetch(`/api/place-photo?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => updatePlace(card.id, { photoUrl: d.url ?? "" }))
      .catch(() => updatePlace(card.id, { photoUrl: "" }));
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync note value when card changes (e.g. after regen)
  useEffect(() => {
    setNoteValue(card.note || "");
  }, [card.note]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setRegenerating(true);
    try {
      const res = await fetch("/api/ai/regen-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, date, placeToReplace: card.title }),
      });
      const data = await res.json();
      if (data.place) {
        updatePlace(card.id, { ...data.place, id: card.id });
      }
    } catch {}
    setRegenerating(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removePlace(card.id);
    setMenuOpen(false);
  };

  const handleSaveNote = () => {
    updatePlace(card.id, { note: noteValue });
    setEditingNote(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative flex gap-4 group ${isDragging ? "scale-[1.02]" : ""}`}>
      {/* Timeline dot */}
      <div className="relative z-10 mt-4 shrink-0">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-lg shadow-lg ring-4 ring-white dark:ring-[#0b1120] transition-transform group-hover:scale-110 ${regenerating ? "animate-pulse" : ""}`}>
          {card.emoji}
        </div>
      </div>

      {/* Card */}
      <div
        onClick={() => !editingNote && onCardClick(card.id)}
        className={`flex-1 bg-white dark:bg-[#111827] rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden group-hover:-translate-y-0.5 ${
          editingNote ? "" : "cursor-pointer"
        } ${
          isActive
            ? "border-violet-500 shadow-violet-500/20 shadow-md ring-2 ring-violet-500/30"
            : "border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
        } ${isDragging ? "shadow-xl shadow-violet-500/20 border-violet-400" : ""}`}
      >
        <div className="flex">
          {/* Content */}
          <div className="flex-1 p-5 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r ${card.color} text-white`}>
                    {card.category}
                  </span>
                  <span className="text-xs text-slate-400">{card.time}</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">
                  {regenerating ? <span className="animate-pulse text-violet-500">Gerando novo local...</span> : card.title}
                </h3>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {card.duration}
                </span>
                {/* Mobile: Ver no mapa */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMobileMap(true);
                    setMapCenter(card.position);
                    setMapZoom(15);
                  }}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer"
                  title="Ver no mapa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRouteClick(card); }}
                  className="hidden md:block p-1.5 rounded-lg text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer"
                  title="Criar rota"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </button>

                {/* ⋮ Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Mais opções"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-8 z-50 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-[170px]">
                      <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                          <path d="M21 3v5h-5"/>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                          <path d="M8 16H3v5"/>
                        </svg>
                        Refazer com IA
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2 my-1" />
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Excluir local
                      </button>
                    </div>
                  )}
                </div>

                {/* Drag handle — desktop only */}
                <button
                  {...attributes}
                  {...listeners}
                  className="hidden md:block p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing touch-none"
                  title="Arrastar para reordenar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Editable note */}
            <div className="mb-1">
              {editingNote ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <textarea
                    autoFocus
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveNote(); }
                      if (e.key === "Escape") { setNoteValue(card.note || ""); setEditingNote(false); }
                    }}
                    placeholder="Adicionar nota..."
                    rows={2}
                    className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-violet-300 dark:border-violet-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none mt-1"
                  />
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveNote(); }}
                      className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setNoteValue(card.note || ""); setEditingNote(false); }}
                      className="text-xs text-slate-400 hover:underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingNote(true); }}
                  className="w-full text-left group/note"
                >
                  {card.note ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-1.5 group-hover/note:text-slate-700 dark:group-hover/note:text-slate-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="truncate">{card.note}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 ml-auto opacity-0 group-hover/note:opacity-100 text-violet-400 transition-opacity">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-300 dark:text-slate-600 italic flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Adicionar nota...
                    </p>
                  )}
                </button>
              )}
            </div>

            {index < total - 1 && (
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  ~15 min até próximo local
                </div>
              </div>
            )}
          </div>

          {/* Photo thumbnail */}
          <div className="w-28 shrink-0 relative">
            {card.photoUrl ? (
              <img src={card.photoUrl} alt={card.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${card.color} opacity-20 flex items-center justify-center`}>
                {card.photoUrl === undefined && (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                )}
                {card.photoUrl === "" && <span className="text-3xl opacity-60">{card.emoji}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main TripBoard ----

export default function TripBoard() {
  const {
    trip,
    activeDay,
    activePlace,
    setActiveDay,
    setActivePlace,
    setMapCenter,
    setMapZoom,
    reorderPlaces,
    setPendingRoutePlace,
    addPlace,
  } = useTripStore();

  const [fillingDay, setFillingDay] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const days = trip.days;
  const places = trip.places;
  const placeIds = useMemo(() => places.map((p) => p.id), [places]);

  const activeDay_ = days.find((d) => d.id === activeDay);
  const currentCity = activeDay_?.city || trip.cities.find(Boolean) || trip.name;
  const currentDate = activeDay_?.date || "";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDayClick = (dayId: number) => {
    setActiveDay(dayId);
    const day = days.find((d) => d.id === dayId);
    if (day && cityCoords[day.city]) {
      setMapCenter(cityCoords[day.city]);
      setMapZoom(13);
    }
  };

  const handleCardClick = (placeId: number) => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setActivePlace(activePlace === placeId ? null : placeId);
      setMapCenter(place.position);
      setMapZoom(15);
    }
  };

  const handleFillDay = async () => {
    if (fillingDay) return;
    setFillingDay(true);
    try {
      const res = await fetch("/api/ai/fill-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: currentCity,
          date: currentDate,
          existingPlaces: places.map((p) => p.title),
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`Erro ao preencher dia: ${data.error}`);
      } else if (data.places) {
        data.places.forEach((p: Parameters<typeof addPlace>[0]) => addPlace(p));
        const firstPlace = data.places.find(
          (p: { position: { lat: number; lng: number } }) =>
            p.position.lat !== 0 || p.position.lng !== 0
        );
        if (firstPlace?.position) {
          setMapCenter(firstPlace.position);
          setMapZoom(13);
        }
      }
    } catch {
      alert("Erro ao conectar com a IA. Tente novamente.");
    } finally {
      setFillingDay(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = places.findIndex((p) => p.id === active.id);
    const newIndex = places.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderPlaces(oldIndex, newIndex);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#0b1120]">
      {/* Trip Header */}
      <header className="shrink-0 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 md:py-5">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl md:text-2xl">✈️</span>
              <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">{trip.name}</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              {trip.startDate} – {trip.endDate} · {trip.totalDays} dias · {trip.cities.length} cidades
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Adicionar local
            </button>
            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day) => {
            const isActive = activeDay === day.id;
            return (
              <button
                key={day.id}
                onClick={() => handleDayClick(day.id)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span className="font-bold text-sm">{day.label}</span>
                <span className={isActive ? "text-violet-200" : "text-slate-400 dark:text-slate-500"}>
                  {day.date} · {day.city}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Cards Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {activeDay}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {activeDay_?.label} – {activeDay_?.city}
              </h2>
              <p className="text-xs text-slate-400">
                {places.length} atividades planejadas · arraste para reordenar
              </p>
            </div>
          </div>
          <button
            onClick={handleFillDay}
            disabled={fillingDay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/25 cursor-pointer shrink-0"
          >
            {fillingDay ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5.06-1.38L2 22l1.38-4.94A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2z" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
            )}
            {fillingDay ? "Gerando..." : "Preencher dia com IA"}
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 relative">
              <div className="absolute left-[19px] top-8 bottom-4 w-0.5 bg-gradient-to-b from-violet-300 via-indigo-200 to-transparent dark:from-violet-700 dark:via-indigo-900" />

              {places.map((card, index) => (
                <SortablePlaceCard
                  key={card.id}
                  card={card}
                  index={index}
                  total={places.length}
                  isActive={activePlace === card.id}
                  onCardClick={handleCardClick}
                  onRouteClick={setPendingRoutePlace}
                  city={currentCity}
                  date={currentDate}
                />
              ))}

              {/* Add Card Button */}
              <div className="relative flex gap-4 pt-2">
                <div className="relative z-10 mt-1 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl py-4 text-sm font-semibold text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all duration-200 cursor-pointer"
                >
                  + Adicionar atividade
                </button>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {showAddModal && (
        <AddPlaceModal onClose={() => setShowAddModal(false)} city={currentCity} />
      )}
    </div>
  );
}
