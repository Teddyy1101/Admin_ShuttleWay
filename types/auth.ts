export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}
