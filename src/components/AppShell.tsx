"use client";

import { useEffect, useState } from "react";
import { useTripStore } from "@/store/tripStore";
import HomePage from "@/components/HomePage";
import NavigationSidebar from "@/components/NavigationSidebar";
import ViewSwitcher from "@/components/ViewSwitcher";
import PlaceDetailWrapper from "@/components/PlaceDetailWrapper";
import RouteModal from "@/components/RouteModal";
import AiPanel from "@/components/AiPanel";
import AuthPage from "@/components/AuthPage";

// ---- Mobile Drawer (sidebar como overlay) ----
function MobileDrawer({ onClose }: { onClose: () => void }) {
  const { trip, activeView, setActiveView, setShowHome, setShowMobileMap, user, signOut } = useTripStore();

  const navItems = [
    {
      id: "itinerary", label: "Itinerário", view: "itinerary" as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      id: "reservations", label: "Reservas", view: "reservations" as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
    },
    {
      id: "wishlist", label: "Lugares para Visitar", view: "wishlist" as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      id: "receipts", label: "Recibos", view: "receipts" as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-72 bg-[#0f172a] h-full flex flex-col shadow-2xl animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z"/><path d="M9 3v14"/><path d="M15 7v14"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">ViagemPlanner</h1>
              <p className="text-[10px] text-slate-400">Seu roteiro perfeito</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Back to trips */}
        <div className="px-5 pt-4">
          <button
            onClick={() => { setShowHome(true); onClose(); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Minhas viagens
          </button>
        </div>

        {/* Trip info */}
        <div className="px-5 py-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Viagem atual</p>
            <h2 className="text-sm font-bold text-white">{trip.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{trip.startDate} – {trip.endDate}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.view;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { setActiveView(item.view); setShowMobileMap(false); onClose(); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border border-violet-500/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className={isActive ? "text-violet-400" : "text-slate-500"}>{item.icon}</span>
                    {item.label}
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold shadow-lg shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.email?.split("@")[0] ?? ""}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button
            onClick={() => { signOut(); onClose(); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-red-400 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Mobile Header ----
function MobileHeader({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { trip, setShowHome, activeView, setActiveView, showMobileMap, setShowMobileMap } = useTripStore();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-white/10 flex items-center h-14 px-4 gap-3 shrink-0">
      {/* Hamburger */}
      <button onClick={onOpenDrawer} className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Trip name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 leading-none mb-0.5">Itinerário</p>
        <h1 className="text-sm font-bold text-white truncate">{trip.name}</h1>
      </div>

      {/* List / Map toggle pill */}
      {(activeView === "itinerary" || activeView === "wishlist") && (
        <div className="flex bg-white/10 rounded-xl p-1 gap-1 shrink-0">
          <button
            onClick={() => setShowMobileMap(false)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !showMobileMap ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setShowMobileMap(true)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              showMobileMap ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Mapa
          </button>
        </div>
      )}
      {(activeView === "reservations" || activeView === "wishlist" || activeView === "receipts") && (
        <button
          onClick={() => setActiveView("itinerary")}
          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Itinerário
        </button>
      )}
    </header>
  );
}

// ---- Mobile Bottom Nav ----
function MobileBottomNav() {
  const { activeView, setActiveView, showMobileMap, setShowMobileMap, setShowHome } = useTripStore();

  const items = [
    {
      label: "Viagens",
      active: false,
      onClick: () => setShowHome(true),
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z"/><path d="M9 3v14"/><path d="M15 7v14"/></svg>,
    },
    {
      label: "Roteiro",
      active: activeView === "itinerary" && !showMobileMap,
      onClick: () => { setActiveView("itinerary"); setShowMobileMap(false); },
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
    {
      label: "Mapa",
      active: activeView === "itinerary" && showMobileMap,
      onClick: () => { setActiveView("itinerary"); setShowMobileMap(true); },
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
    },
    {
      label: "Reservas",
      active: activeView === "reservations",
      onClick: () => { setActiveView("reservations"); setShowMobileMap(false); },
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
    },
    {
      label: "Lugares",
      active: activeView === "wishlist",
      onClick: () => { setActiveView("wishlist"); setShowMobileMap(false); },
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      label: "Recibos",
      active: activeView === "receipts",
      onClick: () => { setActiveView("receipts"); setShowMobileMap(false); },
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a] border-t border-white/10 flex items-center justify-around px-1">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className={`flex flex-col items-center gap-0.5 py-2.5 px-3 flex-1 transition-colors cursor-pointer ${
            item.active ? "text-violet-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-semibold">{item.label}</span>
          {item.active && <span className="w-1 h-1 rounded-full bg-violet-400" />}
        </button>
      ))}
    </nav>
  );
}

// ---- App Shell ----
export default function AppShell() {
  const { showHome, user, authLoading, init } = useTripStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (showHome) return <HomePage />;

  return (
    <div className="h-screen w-full overflow-hidden flex relative">
      {/* Desktop sidebar */}
      <NavigationSidebar />

      {/* Content — full height; on mobile offset for fixed header + bottom nav */}
      <div className="flex flex-1 min-w-0 overflow-hidden pt-14 md:pt-0 pb-14 md:pb-0">
        <ViewSwitcher />
      </div>

      {/* Overlays */}
      <PlaceDetailWrapper />
      <RouteModal />
      <AiPanel />

      {/* Mobile only */}
      <MobileHeader onOpenDrawer={() => setDrawerOpen(true)} />
      <MobileBottomNav />
      {drawerOpen && <MobileDrawer onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
