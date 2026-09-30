import type { User } from '../types';

const AUTH_STORAGE_KEY = 'nyutaelite_user';

export const authService = {
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  register(userData: {
    fullName: string;
    businessName?: string;
    email: string;
    phone: string;
    gstNumber?: string;
    password?: string;
  }): User {
    const newUser: User = {
      id: 'usr_' + Date.now(),
      fullName: userData.fullName,
      businessName: userData.businessName,
      email: userData.email,
      phone: userData.phone,
      gstNumber: userData.gstNumber,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  login(email: string): User {
    const existing = this.getCurrentUser();
    if (existing && existing.email === email) {
      return existing;
    }
    const mockUser: User = {
      id: 'usr_' + Date.now(),
      fullName: 'Wholesale Partner',
      businessName: 'Business Enterprise',
      email: email,
      phone: '+91 98765 43210',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    return mockUser;
  },

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
