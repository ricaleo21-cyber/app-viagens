"use client";

import { useTripStore } from "@/store/tripStore";
import TripBoard from "@/components/TripBoard";
import MapContainer from "@/components/MapContainer";
import ReservationsView from "@/components/ReservationsView";
import WishlistView from "@/components/WishlistView";

export default function ViewSwitcher() {
  const { activeView, showMobileMap } = useTripStore();

  if (activeView === "reservations") {
    return <ReservationsView />;
  }

  if (activeView === "wishlist") {
    return (
      <>
        <div className={`flex-1 min-w-0 overflow-hidden ${showMobileMap ? "hidden md:flex" : "flex"}`}>
          <WishlistView />
        </div>
        <div className={`shrink-0 overflow-hidden ${showMobileMap ? "flex w-full md:w-[40%]" : "hidden md:flex md:w-[40%]"}`}>
          <MapContainer />
        </div>
      </>
    );
  }

  return (
    <>
      {/* TripBoard: always visible on desktop, hidden on mobile when map is open */}
      <div className={`flex-1 min-w-0 overflow-hidden ${showMobileMap ? "hidden md:flex" : "flex"}`}>
        <TripBoard />
      </div>

      {/* MapContainer: always visible on desktop (w-[40%]), full-screen on mobile when open */}
      <div className={`shrink-0 overflow-hidden ${showMobileMap ? "flex w-full md:w-[40%]" : "hidden md:flex md:w-[40%]"}`}>
        <MapContainer />
      </div>
    </>
  );
}
