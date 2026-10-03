// src/types/auth.types.ts
export interface RegisterBody {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}
