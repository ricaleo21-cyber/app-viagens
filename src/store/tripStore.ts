import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { DEMO_TRIP, DEMO_RESERVATIONS } from "@/lib/demoTrip";

// ---- Types ----

export interface ReceiptItem {
  name: string;
  qty?: number;
  price?: number;
}

export interface Receipt {
  id: number;
  dayId: number;
  imageData: string; // base64 data URL
  vendor?: string;
  amount?: number;
  currency?: string;
  category?: string;
  description?: string;
  items?: ReceiptItem[];
  aiExtracted?: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: number;
  dayId?: number;
  title: string;
  emoji: string;
  category: string;
  color: string;
  position: Coordinates;
  time?: string;
  duration?: string;
  note?: string;
  description?: string;
  address?: string;
  rating?: number;
  website?: string;
  photos?: string[];
  photoUrl?: string;
}

export interface Day {
  id: number;
  label: string;
  date: string;
  city: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  cities: string[];
  coverPhotoUrl?: string;
  mapCenter: Coordinates;
  mapZoom: number;
  days: Day[];
  places: Place[];
  wishlist: Place[];
  receipts: Receipt[];
}

// ---- Reservation types ----

export type ReservationType = "flight" | "hotel" | "car" | "restaurant" | "insurance" | "attachment" | "other";

export interface Reservation {
  id: number;
  type: ReservationType;
  title: string;
  provider?: string;
  confirmationCode?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  origin?: string;
  destination?: string;
  location?: string;
  cost?: number;
  currency?: string;
  notes?: string;
  attachments?: { name: string; data: string }[];
}

// ---- Store state & actions ----

interface TripState {
  trip: Trip;
  activeDay: number;
  activePlace: number | null;
  activeView: "itinerary" | "reservations" | "wishlist" | "receipts";

  route: {
    origin: Coordinates | null;
    destination: Coordinates | null;
    originLabel: string;
    destinationLabel: string;
    travelMode: string;
  } | null;

  pendingRoutePlace: Place | null;

  // Day actions
  setActiveDay: (dayId: number) => void;

  // Place actions
  setActivePlace: (placeId: number | null) => void;
  addPlace: (place: Place) => void;
  removePlace: (placeId: number) => void;
  updatePlace: (placeId: number, data: Partial<Place>) => void;
  reorderPlaces: (dayId: number, oldIndex: number, newIndex: number) => void;
  addPhotoToPlace: (placeId: number, photoUrl: string) => void;
  removePhotoFromPlace: (placeId: number, photoIndex: number) => void;

  // Map actions
  setMapCenter: (coords: Coordinates) => void;
  setMapZoom: (zoom: number) => void;

  // Route actions
  setRoute: (origin: Coordinates, destination: Coordinates, originLabel: string, destinationLabel: string, travelMode: string) => void;
  clearRoute: () => void;
  setPendingRoutePlace: (place: Place | null) => void;

  // View actions
  setActiveView: (view: "itinerary" | "reservations" | "wishlist" | "receipts") => void;

  // Wishlist actions
  addToWishlist: (place: Place) => void;
  removeFromWishlist: (placeId: number) => void;
  moveToItinerary: (placeId: number, dayId: number) => void;

  // Receipt actions
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (id: number, data: Partial<Receipt>) => void;
  removeReceipt: (id: number) => void;

  // Reservation state & actions
  reservations: Reservation[];
  addReservation: (r: Reservation) => void;
  updateReservation: (id: number, data: Partial<Reservation>) => void;
  removeReservation: (id: number) => void;

  // Home / multi-trip
  showHome: boolean;
  trips: Trip[];
  setShowHome: (show: boolean) => void;
  addTrip: (trip: Trip) => void;
  loadTrip: (tripId: string) => void;
  updateCurrentTripCover: (url: string) => void;
  updateTripCover: (tripId: string, url: string) => void;
  deleteTrip: (tripId: string) => void;
  setTrip: (trip: Trip) => void;

  // Mobile
  showMobileMap: boolean;
  setShowMobileMap: (show: boolean) => void;

  // Auth
  user: { id: string; email: string } | null;
  authLoading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

// ---- Default trip (placeholder while no trip is loaded) ----

const defaultTrip: Trip = {
  id: "__default__",
  name: "",
  startDate: "",
  endDate: "",
  totalDays: 1,
  cities: [],
  mapCenter: { lat: 0, lng: 0 },
  mapZoom: 3,
  days: [],
  places: [],
  wishlist: [],
  receipts: [],
};

// ---- Supabase sync helpers ----

async function syncTrip(trip: Trip, reservations: Reservation[], userId: string) {
  await supabase.from("trips").upsert({
    id: trip.id,
    user_id: userId,
    data: trip,
    reservations,
    updated_at: new Date().toISOString(),
  });
}

async function loadTripsFromDB(userId: string): Promise<{ trips: Trip[]; reservationMap: Record<string, Reservation[]> }> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, data, reservations")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return { trips: [], reservationMap: {} };

  const trips: Trip[] = data.map((row) => row.data as Trip);
  const reservationMap: Record<string, Reservation[]> = {};
  data.forEach((row) => {
    reservationMap[row.id] = (row.reservations ?? []) as Reservation[];
  });

  // Seed demo trip if the user doesn't have it yet
  const hasDemo = trips.some((t) => t.id === DEMO_TRIP.id);
  if (!hasDemo) {
    const { error: seedErr } = await supabase.from("trips").upsert({
      id: DEMO_TRIP.id,
      user_id: userId,
      data: DEMO_TRIP,
      reservations: DEMO_RESERVATIONS,
      updated_at: new Date().toISOString(),
    });
    if (!seedErr) {
      trips.unshift(DEMO_TRIP);
      reservationMap[DEMO_TRIP.id] = DEMO_RESERVATIONS;
    } else {
      console.error("Demo trip seed error:", seedErr);
    }
  }

  return { trips, reservationMap };
}

// ---- Store ----

export const useTripStore = create<TripState>()((set, get) => ({
  trip: defaultTrip,
  activeDay: 1,
  activePlace: null,
  activeView: "itinerary",
  route: null,
  pendingRoutePlace: null,
  reservations: [],
  showHome: true,
  trips: [],
  showMobileMap: false,
  user: null,
  authLoading: true,

  // ---- Auth ----

  init: async () => {
    set({ authLoading: true });

    // Safety valve: never hang more than 8 seconds
    const bailout = setTimeout(() => {
      console.warn("Supabase init timeout — showing auth page");
      set({ authLoading: false });
    }, 8000);

    try {
      console.log("Supabase init: calling getSession...");
      const { data, error } = await supabase.auth.getSession();
      console.log("Supabase getSession result:", { session: data?.session?.user?.email, error });

      if (data?.session?.user) {
        const { trips, reservationMap } = await loadTripsFromDB(data.session.user.id);
        set({ user: { id: data.session.user.id, email: data.session.user.email! }, trips, showHome: true });
        (get() as TripState & { _reservationMap?: Record<string, Reservation[]> })._reservationMap = reservationMap;
      }
    } catch (e) {
      console.error("Supabase init error:", e);
    } finally {
      clearTimeout(bailout);
      set({ authLoading: false });
    }

    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        set({ user: null, trips: [], trip: defaultTrip, showHome: true, reservations: [], authLoading: false });
      }
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const userId = data.user.id;
    const { trips, reservationMap } = await loadTripsFromDB(userId);
    set({
      user: { id: userId, email: data.user.email! },
      trips,
      showHome: true,
    });
    (get() as TripState & { _reservationMap?: Record<string, Reservation[]> })._reservationMap = reservationMap;
    return { error: null };
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (!data.session) {
      return { error: null, needsConfirmation: true };
    }

    const userId = data.user!.id;

    // Seed demo trip for new users
    await supabase.from("trips").insert({
      id: DEMO_TRIP.id,
      user_id: userId,
      data: DEMO_TRIP,
      reservations: DEMO_RESERVATIONS,
    });

    const reservationMap = { [DEMO_TRIP.id]: DEMO_RESERVATIONS };
    set({ user: { id: userId, email }, trips: [DEMO_TRIP], showHome: true });
    (get() as TripState & { _reservationMap?: Record<string, Reservation[]> })._reservationMap = reservationMap;

    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, trips: [], trip: defaultTrip, showHome: true, reservations: [] });
  },

  // ---- Day ----

  setActiveDay: (dayId) => set({ activeDay: dayId }),

  setActivePlace: (placeId) => set({ activePlace: placeId }),

  // ---- Place mutations (sync trip after each) ----

  addPlace: (place) => {
    set((state) => {
      const trip = { ...state.trip, places: [...state.trip.places, place] };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  removePlace: (placeId) => {
    set((state) => {
      const trip = { ...state.trip, places: state.trip.places.filter((p) => p.id !== placeId) };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  updatePlace: (placeId, data) => {
    set((state) => {
      const trip = { ...state.trip, places: state.trip.places.map((p) => p.id === placeId ? { ...p, ...data } : p) };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  reorderPlaces: (dayId, oldIndex, newIndex) => {
    set((state) => {
      const all = [...state.trip.places];
      const dayIdxs = all.reduce<number[]>((acc, p, i) => { if ((p.dayId ?? 0) === dayId) acc.push(i); return acc; }, []);
      const daySlice = dayIdxs.map((i) => all[i]);
      const [moved] = daySlice.splice(oldIndex, 1);
      daySlice.splice(newIndex, 0, moved);
      dayIdxs.forEach((globalIdx, i) => { all[globalIdx] = daySlice[i]; });
      const trip = { ...state.trip, places: all };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  addPhotoToPlace: (placeId, photoUrl) => {
    set((state) => {
      const trip = { ...state.trip, places: state.trip.places.map((p) => p.id === placeId ? { ...p, photos: [...(p.photos || []), photoUrl] } : p) };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  removePhotoFromPlace: (placeId, photoIndex) => {
    set((state) => {
      const trip = { ...state.trip, places: state.trip.places.map((p) => p.id === placeId ? { ...p, photos: (p.photos || []).filter((_, i) => i !== photoIndex) } : p) };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  // ---- Map ----

  setMapCenter: (coords) =>
    set((state) => ({ trip: { ...state.trip, mapCenter: coords } })),

  setMapZoom: (zoom) =>
    set((state) => ({ trip: { ...state.trip, mapZoom: zoom } })),

  // ---- Routes ----

  setRoute: (origin, destination, originLabel, destinationLabel, travelMode) =>
    set({ route: { origin, destination, originLabel, destinationLabel, travelMode } }),

  clearRoute: () => set({ route: null }),

  setPendingRoutePlace: (place) => set({ pendingRoutePlace: place }),

  setActiveView: (view) => set({ activeView: view }),

  // ---- Wishlist ----

  addToWishlist: (place) => {
    set((state) => {
      const trip = { ...state.trip, wishlist: [...(state.trip.wishlist ?? []), place] };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  removeFromWishlist: (placeId) => {
    set((state) => {
      const trip = { ...state.trip, wishlist: (state.trip.wishlist ?? []).filter((p) => p.id !== placeId) };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  moveToItinerary: (placeId, dayId) => {
    set((state) => {
      const place = (state.trip.wishlist ?? []).find((p) => p.id === placeId);
      if (!place) return {};
      const trip = {
        ...state.trip,
        places: [...state.trip.places, { ...place, dayId }],
        wishlist: (state.trip.wishlist ?? []).filter((p) => p.id !== placeId),
      };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  // ---- Receipts ----

  addReceipt: (receipt) => {
    set((state) => {
      const trip = { ...state.trip, receipts: [...(state.trip.receipts ?? []), receipt] };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  updateReceipt: (id, data) => {
    set((state) => {
      const trip = { ...state.trip, receipts: (state.trip.receipts ?? []).map((r) => r.id === id ? { ...r, ...data } : r) };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  removeReceipt: (id) => {
    set((state) => {
      const trip = { ...state.trip, receipts: (state.trip.receipts ?? []).filter((r) => r.id !== id) };
      return { trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) };
    });
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  // ---- Reservations ----

  addReservation: (r) => {
    set((state) => ({ reservations: [...state.reservations, r] }));
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  updateReservation: (id, data) => {
    set((state) => ({ reservations: state.reservations.map((r) => r.id === id ? { ...r, ...data } : r) }));
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  removeReservation: (id) => {
    set((state) => ({ reservations: state.reservations.filter((r) => r.id !== id) }));
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  // ---- Trip management ----

  setShowHome: (show) => set({ showHome: show }),

  addTrip: (trip) => {
    set((state) => ({ trips: [...state.trips, trip] }));
    const { user } = get();
    if (user) {
      supabase.from("trips").insert({
        id: trip.id,
        user_id: user.id,
        data: trip,
        reservations: [],
      }).then();
    }
  },

  loadTrip: (tripId) => {
    set((state) => {
      const found = state.trips.find((t) => t.id === tripId);
      if (!found) return {};
      return { trip: found, showHome: false, activeDay: 1, activeView: "itinerary", route: null };
    });
    // Load reservations for this trip from the cached map
    const storeWithMap = get() as TripState & { _reservationMap?: Record<string, Reservation[]> };
    const tripReservations = storeWithMap._reservationMap?.[tripId] ?? [];
    set({ reservations: tripReservations });
  },

  setTrip: (trip) => {
    set((state) => ({ trip, trips: state.trips.map((t) => t.id === trip.id ? trip : t) }));
    const { reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  updateCurrentTripCover: (url) => {
    set((state) => ({
      trip: { ...state.trip, coverPhotoUrl: url },
      trips: state.trips.map((t) => t.id === state.trip.id ? { ...t, coverPhotoUrl: url } : t),
    }));
    const { trip, reservations, user } = get();
    if (user) syncTrip(trip, reservations, user.id);
  },

  updateTripCover: (tripId, url) => {
    set((state) => ({
      trips: state.trips.map((t) => t.id === tripId ? { ...t, coverPhotoUrl: url } : t),
      trip: state.trip.id === tripId ? { ...state.trip, coverPhotoUrl: url } : state.trip,
    }));
    const { trips, reservations, user } = get();
    const trip = trips.find((t) => t.id === tripId);
    if (user && trip) syncTrip(trip, reservations, user.id);
  },

  deleteTrip: (tripId) => {
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== tripId),
      showHome: true,
    }));
    const { user } = get();
    if (user) {
      supabase.from("trips").delete().eq("id", tripId).then();
    }
  },

  setShowMobileMap: (show) => set({ showMobileMap: show }),
}));
