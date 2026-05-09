"use client";

import { useTripStore } from "@/store/tripStore";
import HomePage from "@/components/HomePage";
import NavigationSidebar from "@/components/NavigationSidebar";
import ViewSwitcher from "@/components/ViewSwitcher";
import PlaceDetailWrapper from "@/components/PlaceDetailWrapper";
import RouteModal from "@/components/RouteModal";
import AiPanel from "@/components/AiPanel";

export default function AppShell() {
  const { showHome } = useTripStore();

  if (showHome) return <HomePage />;

  return (
    <div className="h-screen w-full overflow-hidden flex relative">
      <NavigationSidebar />
      <ViewSwitcher />
      <PlaceDetailWrapper />
      <RouteModal />
      <AiPanel />
    </div>
  );
}
