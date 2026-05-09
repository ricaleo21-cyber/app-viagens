"use client";

import { useTripStore } from "@/store/tripStore";

const navItems = [
  {
    id: "itinerary",
    label: "Itinerário",
    view: "itinerary" as const,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "reservations",
    label: "Reservas",
    view: "reservations" as const,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
        <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
      </svg>
    ),
  },
];

export default function NavigationSidebar() {
  const { trip, activeView, setActiveView, setShowHome } = useTripStore();

  return (
    <aside className="flex w-64 flex-col bg-[#0f172a] text-white shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z" />
            <path d="M9 3v14" />
            <path d="M15 7v14" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">ViagemPlanner</h1>
          <p className="text-[11px] text-slate-400 font-medium">
            Seu roteiro perfeito
          </p>
        </div>
      </div>

      {/* Back to trips */}
      <div className="px-5 pt-4">
        <button
          onClick={() => setShowHome(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Minhas viagens
        </button>
      </div>

      {/* Trip Info */}
      <div className="px-5 py-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Viagem atual
          </p>
          <h2 className="text-sm font-bold text-white">{trip.name}</h2>
          <p className="text-xs text-slate-400 mt-1">{trip.startDate} – {trip.endDate}</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white shadow-sm border border-violet-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={
                      isActive ? "text-violet-400" : "text-slate-500"
                    }
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom / User Area */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-emerald-500/20">
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Ricardo</p>
            <p className="text-[11px] text-slate-500 truncate">
              Viajante Premium
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-600"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
