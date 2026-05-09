"use client";

import { useRef } from "react";
import { useTripStore, type Place } from "@/store/tripStore";

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg
          key={`full-${i}`}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#f59e0b"
          stroke="none"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      {hasHalf && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="url(#halfStar)"
          />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg
          key={`empty-${i}`}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#e2e8f0"
          stroke="none"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-violet-500 hover:text-violet-400 transition-colors underline underline-offset-2"
    >
      {value}
    </a>
  ) : (
    <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
  );

  return (
    <div className="flex items-start gap-3 py-3">
      <span className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {content}
      </div>
    </div>
  );
}

export default function PlaceDetailPanel({ place }: { place: Place }) {
  const { setActivePlace, setMapCenter, setMapZoom, addPhotoToPlace, removePhotoFromPlace } =
    useTripStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (dataUrl) {
          addPhotoToPlace(place.id, dataUrl);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={() => setActivePlace(null)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[85vh] mx-4 bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden animate-slideUp flex flex-col">
        {/* Color header bar */}
        <div
          className={`h-2 w-full bg-gradient-to-r ${place.color}`}
        />

        {/* Close button */}
        <button
          onClick={() => setActivePlace(null)}
          className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Emoji + Title */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${place.color} flex items-center justify-center text-3xl shadow-lg shrink-0`}
            >
              {place.emoji}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r ${place.color} text-white`}
                >
                  {place.category}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {place.title}
              </h2>
              {place.rating && (
                <div className="flex items-center gap-2 mt-1.5">
                  <StarRating rating={place.rating} />
                  <span className="text-sm font-semibold text-amber-600">
                    {place.rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule info chips */}
          <div className="flex items-center gap-3 mb-6">
            {place.time && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-violet-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {place.time}
                </span>
              </div>
            )}
            {place.duration && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-500"
                >
                  <path d="M5 22h14" />
                  <path d="M5 2h14" />
                  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                </svg>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {place.duration}
                </span>
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
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Sobre este lugar
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {place.description}
              </p>
            </div>
          )}

          {/* Note */}
          {place.note && (
            <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-violet-500"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  Nota pessoal
                </span>
              </div>
              <p className="text-sm text-violet-700 dark:text-violet-300">
                {place.note}
              </p>
            </div>
          )}

          {/* Photo Gallery */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Minhas Fotos
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {/* Existing photos */}
              {(place.photos || []).map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={photo}
                    alt={`${place.title} foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhotoFromPlace(place.id, index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                <span className="text-[10px] font-semibold">Adicionar</span>
              </button>
            </div>

            {/* Hidden file input — accept image, multiple files, camera on mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {(place.photos || []).length === 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Toque em + para adicionar fotos da galeria ou câmera
              </p>
            )}
          </div>

          {/* Detail rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {place.address && (
              <InfoRow
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                }
                label="Endereço"
                value={place.address}
              />
            )}
            {place.website && (
              <InfoRow
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                }
                label="Website"
                value={place.website.replace("https://", "")}
                href={place.website}
              />
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-4 flex gap-3">
          <button
            onClick={handleViewOnMap}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Ver no mapa
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Editar
          </button>
          <button
            onClick={() => setActivePlace(null)}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
