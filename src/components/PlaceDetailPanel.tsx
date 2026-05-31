"use client";

import { useRef, useState } from "react";
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
  Hotel: "from-blue-500 to-indigo-600",
};
const CATEGORIES = Object.keys(CATEGORY_COLORS);

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      {hasHalf && (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#halfStar)" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#e2e8f0" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function PlaceDetailPanel({ place }: { place: Place }) {
  const { setActivePlace, setMapCenter, setMapZoom, addPhotoToPlace, removePhotoFromPlace, updatePlace } =
    useTripStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(place.title);
  const [editEmoji, setEditEmoji] = useState(place.emoji);
  const [editCategory, setEditCategory] = useState(place.category);
  const [editTime, setEditTime] = useState(place.time || "09:00");
  const [editDuration, setEditDuration] = useState(place.duration || "");
  const [editAddress, setEditAddress] = useState(place.address || "");

  // Note inline editing
  const [noteValue, setNoteValue] = useState(place.note || "");
  const [noteEditing, setNoteEditing] = useState(false);

  const handleViewOnMap = () => {
    setMapCenter(place.position);
    setMapZoom(16);
    setActivePlace(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) addPhotoToPlace(place.id, dataUrl);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveEdit = () => {
    const color = CATEGORY_COLORS[editCategory] || place.color;
    updatePlace(place.id, {
      title: editTitle.trim() || place.title,
      emoji: editEmoji || place.emoji,
      category: editCategory,
      color,
      time: editTime,
      duration: editDuration,
      address: editAddress.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleSaveNote = () => {
    updatePlace(place.id, { note: noteValue.trim() || undefined });
    setNoteEditing(false);
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setIsEditing(false)} />
        <div className="relative w-full max-w-lg max-h-[85vh] mx-4 bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden animate-slideUp flex flex-col">
          <div className={`h-2 w-full bg-gradient-to-r ${CATEGORY_COLORS[editCategory] || place.color}`} />
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar local</h2>
            <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            <div className="flex gap-3">
              <div className="space-y-1.5 w-20 shrink-0">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Emoji</label>
                <input type="text" value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} maxLength={2}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-center text-xl focus:outline-none focus:border-violet-500 transition-all" />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome do local</label>
                <input autoFocus type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Horário</label>
                <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duração</label>
                <input type="text" placeholder="Ex: 2h, 30min" value={editDuration} onChange={(e) => setEditDuration(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Endereço</label>
              <input type="text" placeholder="Endereço completo" value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-all" />
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-4 flex gap-3">
            <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors cursor-pointer">
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setActivePlace(null)} />

      <div className="relative w-full max-w-lg max-h-[85vh] mx-4 bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden animate-slideUp flex flex-col">
        <div className={`h-2 w-full bg-gradient-to-r ${place.color}`} />

        <button
          onClick={() => setActivePlace(null)}
          className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="overflow-y-auto flex-1 p-6">
          {/* Emoji + Title */}
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${place.color} flex items-center justify-center text-3xl shadow-lg shrink-0`}>
              {place.emoji}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r ${place.color} text-white`}>
                  {place.category}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{place.title}</h2>
              {place.rating && (
                <div className="flex items-center gap-2 mt-1.5">
                  <StarRating rating={place.rating} />
                  <span className="text-sm font-semibold text-amber-600">{place.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule chips */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {place.time && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{place.time}</span>
              </div>
            )}
            {place.duration && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                  <path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
                </svg>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{place.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {place.position.lat.toFixed(4)}, {place.position.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Description */}
          {place.description && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sobre este lugar</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{place.description}</p>
            </div>
          )}

          {/* Note — always editable */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Observações</span>
            </div>
            {noteEditing ? (
              <div>
                <textarea
                  autoFocus
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setNoteValue(place.note || ""); setNoteEditing(false); }
                  }}
                  placeholder="Dicas, lembretes, horários de funcionamento..."
                  rows={3}
                  className="w-full border border-violet-300 dark:border-violet-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none transition-all"
                />
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={handleSaveNote} className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline cursor-pointer">Salvar</button>
                  <button onClick={() => { setNoteValue(place.note || ""); setNoteEditing(false); }} className="text-xs text-slate-400 hover:underline cursor-pointer">Cancelar</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setNoteEditing(true)}
                className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-all cursor-pointer border ${
                  noteValue
                    ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                    : "border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-violet-400 hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10"
                }`}
              >
                {noteValue || "Toque para adicionar observação..."}
              </button>
            )}
          </div>

          {/* Photo Gallery */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Minhas Fotos</h3>
            <div className="grid grid-cols-3 gap-2">
              {(place.photos || []).map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photo} alt={`${place.title} foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhotoFromPlace(place.id, index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span className="text-[10px] font-semibold">Adicionar</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            {(place.photos || []).length === 0 && (
              <p className="text-xs text-slate-400 mt-2">Toque em + para adicionar fotos da galeria ou câmera</p>
            )}
          </div>

          {/* Detail rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {place.address && (
              <div className="flex items-start gap-3 py-3">
                <span className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Endereço</p>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{place.address}</span>
                </div>
              </div>
            )}
            {place.website && (
              <div className="flex items-start gap-3 py-3">
                <span className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Website</p>
                  <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-500 hover:text-violet-400 transition-colors underline underline-offset-2">
                    {place.website.replace("https://", "")}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-4 flex gap-3">
          <button
            onClick={handleViewOnMap}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Ver no mapa
          </button>
          <button
            onClick={() => {
              setEditTitle(place.title);
              setEditEmoji(place.emoji);
              setEditCategory(place.category);
              setEditTime(place.time || "09:00");
              setEditDuration(place.duration || "");
              setEditAddress(place.address || "");
              setIsEditing(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button
            onClick={() => setActivePlace(null)}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
