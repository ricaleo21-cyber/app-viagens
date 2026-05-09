"use client";

import { useTripStore } from "@/store/tripStore";
import PlaceDetailPanel from "@/components/PlaceDetailPanel";

export default function PlaceDetailWrapper() {
  const { activePlace, trip } = useTripStore();
  const place = trip.places.find((p) => p.id === activePlace);

  if (!place) return null;

  return <PlaceDetailPanel place={place} />;
}
