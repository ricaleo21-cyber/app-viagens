"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useTripStore } from "@/store/tripStore";

const containerStyle = {
  width: "100%",
  height: "100%",
};


const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64779e" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e87" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f9ba5" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3C7680" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c6675" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#255763" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0d5ce" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry.fill",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#3a4762" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
];

const mapOptions: google.maps.MapOptions = {
  styles: darkMapStyles,
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function MapContainer() {
  const { trip, activePlace, setActivePlace, setMapCenter, setMapZoom, route, clearRoute } =
    useTripStore();
  const { places, mapCenter, mapZoom } = trip;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    id: "google-map-script",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  // React to store changes — pan/zoom the map
  useEffect(() => {
    if (map) {
      map.panTo(mapCenter);
      map.setZoom(mapZoom);
    }
  }, [map, mapCenter, mapZoom]);

  // Calculate directions when route changes
  useEffect(() => {
    if (!route?.origin || !route?.destination || !isLoaded) {
      setDirections(null);
      return;
    }
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    const modeKey = route.travelMode as keyof typeof google.maps.TravelMode;
    directionsServiceRef.current.route(
      {
        origin: route.origin,
        destination: route.destination,
        travelMode: google.maps.TravelMode[modeKey] ?? google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [route, isLoaded]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleZoomIn = () => {
    if (map) {
      const current = map.getZoom() || mapZoom;
      setMapZoom(current + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const current = map.getZoom() || mapZoom;
      setMapZoom(current - 1);
    }
  };

  /* ---- Fallback: no API key or load error ---- */
  if (!API_KEY || loadError) {
    return (
      <div className="w-full bg-[#1a1f2e] flex flex-col relative overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Search bar */}
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white/60">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <span className="text-sm">Buscar no mapa...</span>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center border border-violet-500/20 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2 text-center">
            Configurar Google Maps
          </h3>
          <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed mb-6">
            Adicione sua chave da API do Google Maps no arquivo{" "}
            <code className="text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded text-xs">.env.local</code>
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-xs w-full">
            <code className="text-xs text-slate-300 break-all">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
            </code>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Loading state ---- */
  if (!isLoaded) {
    return (
      <div className="w-full bg-[#1a1f2e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Carregando mapa...
          </p>
        </div>
      </div>
    );
  }

  /* ---- Real map ---- */
  return (
    <div className="w-full relative overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={mapZoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#7c3aed",
                strokeWeight: 5,
                strokeOpacity: 0.85,
              },
              suppressMarkers: false,
            }}
          />
        )}

        {places.map((marker) => (
          <MarkerF
            key={marker.id}
            position={marker.position}
            title={marker.title}
            onClick={() =>
              setActivePlace(activePlace === marker.id ? null : marker.id)
            }
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                  <defs>
                    <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/>
                    </filter>
                  </defs>
                  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#7c3aed" filter="url(#shadow)"/>
                  <circle cx="18" cy="16" r="8" fill="white" opacity="0.9"/>
                  <text x="18" y="21" text-anchor="middle" font-size="14">${marker.emoji}</text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(36, 44),
              anchor: new google.maps.Point(18, 44),
            }}
          >
            {activePlace === marker.id && (
              <InfoWindowF
                position={marker.position}
                onCloseClick={() => setActivePlace(null)}
              >
                <div style={{ padding: "4px 8px", minWidth: 120 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#7c3aed",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 2,
                    }}
                  >
                    {marker.category}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    {marker.emoji} {marker.title}
                  </div>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}
      </GoogleMap>

      {/* Search bar overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center gap-2 bg-[#0f172a]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white/60 shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <span className="text-sm">Buscar no mapa...</span>
        </div>
      </div>

      {/* Route info panel */}
      {directions && route && (
        <div className="absolute top-16 left-4 right-4 z-10 bg-[#0f172a]/90 backdrop-blur-md border border-violet-500/30 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                <span className="truncate">{route.originLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="truncate">{route.destinationLabel}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">
                  {directions.routes[0]?.legs[0]?.distance?.text}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-sm font-bold text-violet-400">
                  {directions.routes[0]?.legs[0]?.duration?.text}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${route.origin?.lat},${route.origin?.lng}&destination=${route.destination?.lat},${route.destination?.lng}&travelmode=${route.travelMode.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                Celular
              </a>
              <button
                onClick={clearRoute}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marker pills overlay */}
      <div className="absolute bottom-4 md:bottom-16 left-4 right-4 z-10 flex gap-2 flex-wrap">
        {places.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setActivePlace(m.id);
              setMapCenter(m.position);
              setMapZoom(15);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${m.color} text-white text-xs font-semibold shadow-lg hover:scale-105 transition-transform cursor-pointer`}
          >
            <span>{m.emoji}</span>
            {m.title}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-lg bg-[#0f172a]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors cursor-pointer shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-lg bg-[#0f172a]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors cursor-pointer shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>
    </div>
  );
}
