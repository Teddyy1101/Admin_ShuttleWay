import axiosClient from '@/lib/axiosClient';

export interface TripQuery {
  page?: number;
  limit?: number;
  status?: string;
  scheduledDate?: string;
  routeId?: string;
}

export const tripService = {
  getTrips: (query?: TripQuery) => {
    return axiosClient.get('/trips', { params: query });
  },
  
  createTrip: (data: {
    routeId: string;
    busId?: string;
    driverId?: string;
    scheduledDate: string;
    startTime?: string;
  }) => {
    return axiosClient.post('/trips', data);
  },

  updateTrip: (id: string, data: {
    routeId?: string;
    busId?: string;
    driverId?: string;
    scheduledDate?: string;
    startTime?: string;
  }) => {
    return axiosClient.patch(`/trips/${id}`, data);
  },

  deleteTrip: (id: string) => {
    return axiosClient.delete(`/trips/${id}`);
  }
};
