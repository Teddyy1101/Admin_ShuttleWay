import axiosClient from '../lib/axiosClient';
import { LoginRequest, LoginResponse } from '../types/auth';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await axiosClient.post<LoginResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      console.error('Login Error Details:', error);
      throw error;
    }
  },
};
