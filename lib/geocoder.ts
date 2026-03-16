// Nominatim Geocoding API – Tìm kiếm và chuyển đổi tọa độ miễn phí (OpenStreetMap)

// Interface cho kết quả tìm kiếm địa chỉ
export interface GeoSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Tìm kiếm địa chỉ theo từ khóa (Geocoding)
 * @param query - Từ khóa tìm kiếm (tên đường, địa điểm...)
 * @returns Danh sách kết quả tìm kiếm
 */
export async function searchAddress(query: string): Promise<GeoSearchResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'vi' }, // Ưu tiên kết quả tiếng Việt
  });

  if (!response.ok) {
    throw new Error('Lỗi khi tìm kiếm địa chỉ từ Nominatim');
  }

  return response.json();
}

/**
 * Lấy địa chỉ từ tọa độ (Reverse Geocoding)
 * @param lat - Vĩ độ
 * @param lon - Kinh độ
 * @returns Tên địa chỉ đầy đủ
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'vi' }, // Ưu tiên kết quả tiếng Việt
  });

  if (!response.ok) {
    throw new Error('Lỗi khi lấy địa chỉ từ tọa độ (Nominatim)');
  }

  const data = await response.json();
  return data.display_name || '';
}
