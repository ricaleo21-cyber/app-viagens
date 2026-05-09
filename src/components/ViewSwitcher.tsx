"use client";

import { useTripStore } from "@/store/tripStore";
import TripBoard from "@/components/TripBoard";
import MapContainer from "@/components/MapContainer";
import ReservationsView from "@/components/ReservationsView";

export default function ViewSwitcher() {
  const { activeView } = useTripStore();

  if (activeView === "reservations") {
    return <ReservationsView />;
  }

  return (
    <>
      <TripBoard />
      <MapContainer />
    </>
  );
}
