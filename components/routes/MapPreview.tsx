'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// 1. Tạo SVG Icon hình "giọt nước" giống Google Maps
const createGoogleMapsPin = (index: number) => {
  const fontSize = index >= 10 ? 11 : 14;
  const html = `
    <div style="position: relative; width: 34px; height: 44px; display: flex; justify-content: center;">
      <svg viewBox="0 0 34 44" style="width: 34px; height: 44px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
        <path fill="#EA4335" d="M17 0C7.61 0 0 7.61 0 17c0 11.2 17 27 17 27s17-15.8 17-27C34 7.61 26.39 0 17 0z"/>
        <circle cx="17" cy="16" r="10" fill="white"/>
        <text x="17" y="16" text-anchor="middle" dominant-baseline="central" 
              fill="#C62828" font-size="${fontSize}" font-weight="800" font-family="Arial, sans-serif">
          ${index}  
        </text>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: '', 
    html: html,
    iconSize: [34, 44],
    iconAnchor: [17, 44], 
    popupAnchor: [0, -44], 
  });
};

export default function MapPreview({ stations, center }: { stations: any[], center: { lat: number, lng: number } }) {
  const { theme } = useTheme();
  
  // State lưu trữ mảng tọa độ đường đi (đã được bám theo đường bộ)
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  // Đổi nền bản đồ theo Dark/Light Mode
  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Dùng useEffect để gọi API của OSRM tính toán đường đi thực tế
  useEffect(() => {
    if (!stations || stations.length < 2) return;

    const fetchRoute = async () => {
      try {
        // OSRM yêu cầu format: kinh_độ,vĩ_độ;kinh_độ,vĩ_độ... (Lưu ý: Longitude đứng trước)
        const coordinatesString = stations
          .map(s => `${s.longitude},${s.latitude}`)
          .join(';');

        // Gọi API miễn phí của OSRM (Loại phương tiện: driving - xe ô tô)
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
          // OSRM trả về mảng [Kinh độ, Vĩ độ], nhưng Leaflet Polyline yêu cầu [Vĩ độ, Kinh độ]
          // Nên ta phải map để đảo ngược lại vị trí
          const latLngs = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setRoutePath(latLngs);
        } else {
          // Fallback: Nếu lỗi API, tạm thời vẽ đường chim bay
          setRoutePath(stations.map(s => [s.latitude, s.longitude]));
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu đường đi OSRM:", error);
        // Fallback: Nếu rớt mạng hoặc lỗi, vẽ đường chim bay
        setRoutePath(stations.map(s => [s.latitude, s.longitude]));
      }
    };

    fetchRoute();
  }, [stations]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ width: '100%', height: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url={tileUrl}
      />
      
      {/* Vẽ đường đi bám theo đường nhựa */}
      {routePath.length > 1 && (
        <Polyline 
          positions={routePath} 
          pathOptions={{ 
            color: '#3b82f6', // Màu xanh dương Tailwind (blue-500)
            weight: 5,        // Độ dày của nét vẽ
            opacity: 0.8,     // Độ trong suốt
            lineCap: 'round', // Bo tròn hai đầu nét vẽ
            lineJoin: 'round' // Bo tròn các điểm gấp khúc
          }} 
        />
      )}

      {/* Render các Marker */}
      {stations.map((station, index) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={createGoogleMapsPin(index + 1)}
        >
          <Popup>
            <div className="font-semibold text-gray-900">{station.name}</div>
            <div className="text-sm text-gray-500">Trạm dừng thứ {index + 1}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}