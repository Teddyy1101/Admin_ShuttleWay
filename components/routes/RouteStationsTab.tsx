'use client';

import MapPreview from '@/components/routes/MapPreview';
import { Route } from '@/types/route';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

interface RouteStationsTabProps {
  route: Route;
}

export default function RouteStationsTab({ route }: RouteStationsTabProps) {
  const { theme } = useTheme();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""
  });

  const stations = route.stations?.sort((a, b) => a.orderIndex - b.orderIndex) || [];

  const center = useMemo(() => {
    if (stations.length > 0) {
      return { lat: stations[0].latitude, lng: stations[0].longitude };
    }
    return { lat: 10.762622, lng: 106.660172 }; // Default to HCM city coordinates
  }, [stations]);

  // Styling map cho Dark mode
  const mapOptions = useMemo(() => {
    return {
      disableDefaultUI: false,
      clickableIcons: false,
      mapTypeId: 'roadmap',
      styles: theme === 'dark' ? [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263c3f" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" }],
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#2f3948" }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#515c6d" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#17263c" }],
        },
      ] : []
    };
  }, [theme]);

  if (!stations || stations.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
        <MapPin size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p>Không có trạm dừng nào được cấu hình cho tuyến đường này.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Cột trái: Danh sách trạm (30%) */}
      <div className="w-full lg:w-[30%] bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm order-2 lg:order-1 max-h-[500px] overflow-y-auto no-scrollbar">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Lộ trình ({stations.length} trạm)</h3>
        
        <div className="relative border-l-2 border-blue-500 dark:border-blue-600 ml-3 md:ml-4 space-y-8">
          {stations.map((station, index) => (
            <div key={station.id} className="relative pl-6 md:pl-8">
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800 shadow-sm" />
              
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 mb-2 inline-block">
                  Trạm thứ {station.orderIndex}
                </span>
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">{station.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1">
                  <span className="truncate">{station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cột phải: Bản đồ (70%) */}
      {/* <div className="w-full lg:w-[70%] order-1 lg:order-2 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm h-[400px] lg:h-[500px]">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={13}
            options={mapOptions}
          >
            {stations.map((station, index) => (
              <Marker
                key={station.id}
                position={{ lat: station.latitude, lng: station.longitude }}
                label={{
                  text: station.orderIndex.toString(),
                  color: "white",
                  fontWeight: "bold"
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div> */}
      <div className="w-full lg:w-[70%] order-1 lg:order-2 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm h-[400px] lg:h-[500px] relative z-0">
        <MapPreview stations={stations} center={center} />
      </div>
    </div>
  );
}
