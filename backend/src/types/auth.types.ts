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

export interface GoogleLoginBody {
  credential: string;
}

export interface RequestOtpBody {
  phone: string;
  countryCode?: string;
}

export interface VerifyOtpBody {
  phone: string;
  otp: string;
  countryCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
  };
  isNewUser?: boolean;
}
