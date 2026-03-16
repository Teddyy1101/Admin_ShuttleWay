'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from 'next-themes';
import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { reverseGeocode, searchAddress, GeoSearchResult } from '@/lib/geocoder';
import { Search, Loader2, MapPin } from 'lucide-react';

// Tạo icon marker tùy chỉnh dạng giọt nước xanh (fix lỗi icon mặc định Leaflet trong Next.js)
const stationIcon = L.divIcon({
  className: '',
  html: `
    <div style="position: relative; width: 34px; height: 44px; display: flex; justify-content: center;">
      <svg viewBox="0 0 34 44" style="width: 34px; height: 44px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
        <path fill="#3b82f6" d="M17 0C7.61 0 0 7.61 0 17c0 11.2 17 27 17 27s17-15.8 17-27C34 7.61 26.39 0 17 0z"/>
        <circle cx="17" cy="16" r="8" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -44],
});

// Props cho StationMapPicker
interface StationMapPickerProps {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  setAddress: (addr: string) => void;
}

// Handle để parent component có thể gọi flyTo
export interface StationMapPickerHandle {
  flyTo: (lat: number, lng: number) => void;
}

// Component con: Bắt sự kiện click trên bản đồ (Reverse Geocoding)
function MapClickHandler({
  setPosition,
  setAddress,
}: {
  setPosition: (pos: [number, number]) => void;
  setAddress: (addr: string) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      // Gọi Reverse Geocoding để lấy tên địa chỉ từ tọa độ
      try {
        const address = await reverseGeocode(lat, lng);
        setAddress(address);
      } catch {
        setAddress('');
      }
    },
  });
  return null;
}

// Component con: Cho phép parent điều khiển flyTo qua ref
const MapController = forwardRef<StationMapPickerHandle, { position: [number, number] }>(
  ({ position }, ref) => {
    const map = useMap();

    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number) => {
        map.flyTo([lat, lng], 16, { duration: 1.5 });
      },
    }));

    useEffect(() => {
      map.setView(position, map.getZoom());

      // Thêm nút phóng to/thu nhỏ ở góc dưới bên trái
      const zoomControl = L.control.zoom({ position: 'bottomleft' });
      zoomControl.addTo(map);

      return () => {
        zoomControl.remove();
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
  }
);

MapController.displayName = 'MapController';

// Component chính: Bản đồ tương tác với Geocoder tìm kiếm debounce
const StationMapPicker = forwardRef<StationMapPickerHandle, StationMapPickerProps>(
  ({ position, setPosition, setAddress }, ref) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mapControllerRef = useRef<StationMapPickerHandle>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Expose flyTo cho parent thông qua mapControllerRef
    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number) => {
        mapControllerRef.current?.flyTo(lat, lng);
      },
    }));

    // Đổi tile URL theo Dark/Light mode
    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Debounce tìm kiếm (500ms)
    const handleSearchChange = useCallback((value: string) => {
      setSearchQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchAddress(value);
          setSearchResults(results);
          setShowDropdown(results.length > 0);
        } catch {
          setSearchResults([]);
          setShowDropdown(false);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    }, []);

    // Khi chọn một kết quả tìm kiếm
    const handleSelectResult = useCallback((result: GeoSearchResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      setPosition([lat, lng]);
      setAddress(result.display_name);
      setSearchQuery(result.display_name);
      setShowDropdown(false);
      setSearchResults([]);

      // Bay đến vị trí được chọn
      mapControllerRef.current?.flyTo(lat, lng);
    }, [setPosition, setAddress]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative w-full h-full">
        {/* Thanh tìm kiếm địa điểm nổi trên bản đồ */}
        <div ref={dropdownRef} className="absolute top-3 left-3 right-3 z-[1000]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm kiếm địa điểm..."
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder-gray-400"
            />
            {isSearching && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Dropdown danh sách kết quả */}
          {showDropdown && searchResults.length > 0 && (
            <ul className="mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {searchResults.map((result, idx) => (
                <li
                  key={`${result.lat}-${result.lon}-${idx}`}
                  onClick={() => handleSelectResult(result)}
                  className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors flex items-start gap-2"
                >
                  <MapPin size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{result.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bản đồ Leaflet */}
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ width: '100%', height: '100%', zIndex: 0, borderRadius: '0.75rem' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url={tileUrl}
          />
          <Marker position={position} icon={stationIcon} />
          <MapClickHandler setPosition={setPosition} setAddress={setAddress} />
          <MapController ref={mapControllerRef} position={position} />
        </MapContainer>
      </div>
    );
  }
);

StationMapPicker.displayName = 'StationMapPicker';

export default StationMapPicker;
