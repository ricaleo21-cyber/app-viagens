import { create } from "zustand";

// ---- Types ----

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: number;
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
  photos?: string[]; // base64 data URLs (client-side only for now)
  photoUrl?: string; // cover photo fetched from Places API
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
  activeView: "itinerary" | "reservations";

  // Route state
  route: {
    origin: Coordinates | null;
    destination: Coordinates | null;
    originLabel: string;
    destinationLabel: string;
    travelMode: string;
  } | null;

  // Pending route (controls the route modal)
  pendingRoutePlace: Place | null;

  // Day actions
  setActiveDay: (dayId: number) => void;

  // Place actions
  setActivePlace: (placeId: number | null) => void;
  addPlace: (place: Place) => void;
  removePlace: (placeId: number) => void;
  updatePlace: (placeId: number, data: Partial<Place>) => void;
  reorderPlaces: (oldIndex: number, newIndex: number) => void;
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
  setActiveView: (view: "itinerary" | "reservations") => void;

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

  // Mobile
  showMobileMap: boolean;
  setShowMobileMap: (show: boolean) => void;

  // Trip actions
  setTrip: (trip: Trip) => void;
}

// ---- Default trip data ----

const defaultTrip: Trip = {
  id: "1",
  name: "Paris & Roma",
  startDate: "12 Jun",
  endDate: "28 Jun, 2026",
  totalDays: 16,
  cities: ["Paris", "Roma"],
  mapCenter: { lat: 45.0, lng: 7.5 },
  mapZoom: 6,
  days: [
    { id: 1, label: "Dia 1", date: "12 Jun", city: "Paris" },
    { id: 2, label: "Dia 2", date: "13 Jun", city: "Paris" },
    { id: 3, label: "Dia 3", date: "14 Jun", city: "Paris" },
    { id: 4, label: "Dia 4", date: "15 Jun", city: "Roma" },
    { id: 5, label: "Dia 5", date: "16 Jun", city: "Roma" },
  ],
  places: [
    {
      id: 1,
      title: "Torre Eiffel",
      emoji: "🗼",
      category: "Atração",
      color: "from-amber-500 to-orange-500",
      position: { lat: 48.8584, lng: 2.2945 },
      time: "09:00",
      duration: "2h",
      note: "Comprar ingresso antecipado online",
      description:
        "A Torre Eiffel é uma torre trelicada de ferro forjado no Champ de Mars, em Paris. Nomeada em homenagem ao engenheiro Gustave Eiffel, foi construída entre 1887 e 1889 como peça central da Exposição Universal de 1889. Com 330 metros de altura, é a estrutura mais alta de Paris e o monumento pago mais visitado do mundo, recebendo quase 7 milhões de visitantes por ano. A torre possui três níveis acessíveis ao público, com restaurantes no primeiro e segundo andares.",
      address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris, França",
      rating: 4.7,
      website: "https://www.toureiffel.paris",
    },
    {
      id: 2,
      title: "Museu do Louvre",
      emoji: "🎨",
      category: "Museu",
      color: "from-violet-500 to-purple-600",
      position: { lat: 48.8606, lng: 2.3376 },
      time: "12:00",
      duration: "3h",
      note: "Entrada gratuita 1º domingo do mês",
      description:
        "O Museu do Louvre é o maior museu de arte do mundo e um monumento histórico em Paris. Localizado na margem direita do Sena, abriga mais de 380.000 objetos e 35.000 obras de arte em área de 72.735 m². Entre suas obras mais famosas estão a Mona Lisa de Leonardo da Vinci, a Vênus de Milo e a Vitória de Samotrácia. O edifício foi originalmente construído como fortaleza no século XII.",
      address: "Rue de Rivoli, 75001 Paris, França",
      rating: 4.8,
      website: "https://www.louvre.fr",
    },
    {
      id: 3,
      title: "Café de Flore",
      emoji: "☕",
      category: "Restaurante",
      color: "from-emerald-500 to-teal-600",
      position: { lat: 48.8536, lng: 2.3264 },
      time: "15:30",
      duration: "1h",
      note: "Experimentar o croque-monsieur",
      description:
        "O Café de Flore é um dos cafés mais antigos e prestigiados de Paris, localizado no coração de Saint-Germain-des-Prés. Fundado em 1887, foi ponto de encontro de intelectuais e artistas como Jean-Paul Sartre, Simone de Beauvoir, Albert Camus e Pablo Picasso. O café é famoso por seu chocolate quente, croque-monsieur e atmosfera literária que se mantém até hoje.",
      address: "172 Bd Saint-Germain, 75006 Paris, França",
      rating: 4.2,
      website: "https://cafedeflore.fr",
    },
    {
      id: 4,
      title: "Cruzeiro pelo Sena",
      emoji: "🚢",
      category: "Passeio",
      color: "from-sky-500 to-blue-600",
      position: { lat: 48.8566, lng: 2.3515 },
      time: "18:00",
      duration: "1h30",
      note: "Reservar lugar no deck superior",
      description:
        "Um cruzeiro pelo Rio Sena é uma das melhores maneiras de ver Paris. O passeio de barco oferece vistas deslumbrantes dos principais monumentos da cidade, incluindo a Torre Eiffel, Notre-Dame, Museu d'Orsay, Pont Alexandre III e a Île de la Cité. Os cruzeiros ao pôr do sol são especialmente populares, quando a cidade se ilumina e cria uma atmosfera mágica.",
      address: "Port de la Conférence, 75008 Paris, França",
      rating: 4.5,
      website: "https://www.bateaux-mouches.fr",
    },
    {
      id: 5,
      title: "Coliseu",
      emoji: "🏛️",
      category: "Atração",
      color: "from-rose-500 to-pink-600",
      position: { lat: 41.8902, lng: 12.4922 },
      time: "10:00",
      duration: "2h",
      note: "Visita guiada recomendada",
      description:
        "O Coliseu, também conhecido como Anfiteatro Flaviano, é um anfiteatro oval situado no centro de Roma. Construído em concreto e pedra entre 70-80 d.C., é o maior anfiteatro já construído, com capacidade para 50.000 a 80.000 espectadores. Era usado para combates de gladiadores, caçadas de animais e outras exibições públicas. É uma das Sete Novas Maravilhas do Mundo e Patrimônio Mundial da UNESCO.",
      address: "Piazza del Colosseo, 1, 00184 Roma, Itália",
      rating: 4.7,
      website: "https://colosseo.it",
    },
    {
      id: 6,
      title: "Vaticano",
      emoji: "⛪",
      category: "Monumento",
      color: "from-indigo-500 to-blue-600",
      position: { lat: 41.9029, lng: 12.4534 },
      time: "14:00",
      duration: "3h",
      note: "Reservar ingresso para Capela Sistina",
      description:
        "A Cidade do Vaticano é o menor estado independente do mundo, sede da Igreja Católica. Abriga a majestosa Basílica de São Pedro, a Capela Sistina com os afrescos de Michelangelo no teto, e os Museus Vaticanos com uma das maiores coleções de arte do mundo. A Praça de São Pedro, projetada por Bernini, é um dos espaços públicos mais impressionantes da Europa.",
      address: "00120 Città del Vaticano",
      rating: 4.8,
      website: "https://www.museivaticani.va",
    },
    {
      id: 7,
      title: "Fontana di Trevi",
      emoji: "⛲",
      category: "Atração",
      color: "from-cyan-500 to-teal-500",
      position: { lat: 41.8986, lng: 12.4769 },
      time: "18:00",
      duration: "30min",
      note: "Jogar moedinha para voltar a Roma",
      description:
        "A Fontana di Trevi é a maior e mais famosa fonte barroca de Roma, com 26 metros de altura e 49 metros de largura. Projetada por Nicola Salvi em 1762, apresenta Netuno em uma carruagem puxada por cavalos-marinhos. A tradição diz que jogar uma moeda na fonte garante o retorno a Roma. Cerca de 3.000 euros são jogados na fonte diariamente, sendo doados a instituições de caridade.",
      address: "Piazza di Trevi, 00187 Roma, Itália",
      rating: 4.6,
      website: "https://www.turismoroma.it",
    },
  ],
};

// ---- Store ----

export const useTripStore = create<TripState>((set) => ({
  trip: defaultTrip,
  activeDay: 1,
  activePlace: null,
  activeView: "itinerary",
  route: null,
  pendingRoutePlace: null,
  reservations: [],
  showHome: true,
  trips: [defaultTrip],
  showMobileMap: false,

  setActiveDay: (dayId) => set({ activeDay: dayId }),

  setActivePlace: (placeId) => set({ activePlace: placeId }),

  addPlace: (place) =>
    set((state) => ({
      trip: { ...state.trip, places: [...state.trip.places, place] },
    })),

  removePlace: (placeId) =>
    set((state) => ({
      trip: {
        ...state.trip,
        places: state.trip.places.filter((p) => p.id !== placeId),
      },
    })),

  updatePlace: (placeId, data) =>
    set((state) => ({
      trip: {
        ...state.trip,
        places: state.trip.places.map((p) =>
          p.id === placeId ? { ...p, ...data } : p
        ),
      },
    })),

  reorderPlaces: (oldIndex, newIndex) =>
    set((state) => {
      const newPlaces = [...state.trip.places];
      const [moved] = newPlaces.splice(oldIndex, 1);
      newPlaces.splice(newIndex, 0, moved);
      return { trip: { ...state.trip, places: newPlaces } };
    }),

  addPhotoToPlace: (placeId, photoUrl) =>
    set((state) => ({
      trip: {
        ...state.trip,
        places: state.trip.places.map((p) =>
          p.id === placeId
            ? { ...p, photos: [...(p.photos || []), photoUrl] }
            : p
        ),
      },
    })),

  removePhotoFromPlace: (placeId, photoIndex) =>
    set((state) => ({
      trip: {
        ...state.trip,
        places: state.trip.places.map((p) =>
          p.id === placeId
            ? { ...p, photos: (p.photos || []).filter((_, i) => i !== photoIndex) }
            : p
        ),
      },
    })),

  setMapCenter: (coords) =>
    set((state) => ({
      trip: { ...state.trip, mapCenter: coords },
    })),

  setMapZoom: (zoom) =>
    set((state) => ({
      trip: { ...state.trip, mapZoom: zoom },
    })),

  setTrip: (trip) => set({ trip }),

  setRoute: (origin, destination, originLabel, destinationLabel, travelMode) =>
    set({ route: { origin, destination, originLabel, destinationLabel, travelMode } }),

  clearRoute: () => set({ route: null }),

  setPendingRoutePlace: (place) => set({ pendingRoutePlace: place }),

  setActiveView: (view) => set({ activeView: view }),

  addReservation: (r) =>
    set((state) => ({ reservations: [...state.reservations, r] })),

  updateReservation: (id, data) =>
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? { ...r, ...data } : r)),
    })),

  removeReservation: (id) =>
    set((state) => ({ reservations: state.reservations.filter((r) => r.id !== id) })),

  setShowHome: (show) => set({ showHome: show }),

  addTrip: (trip) =>
    set((state) => ({ trips: [...state.trips, trip] })),

  loadTrip: (tripId) =>
    set((state) => {
      const found = state.trips.find((t) => t.id === tripId);
      if (!found) return {};
      return { trip: found, showHome: false, activeDay: 1, activeView: "itinerary", route: null, reservations: [] };
    }),

  updateCurrentTripCover: (url) =>
    set((state) => ({
      trip: { ...state.trip, coverPhotoUrl: url },
      trips: state.trips.map((t) => t.id === state.trip.id ? { ...t, coverPhotoUrl: url } : t),
    })),

  setShowMobileMap: (show) => set({ showMobileMap: show }),
}));
