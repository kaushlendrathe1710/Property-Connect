import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://property.lelekart.com';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: 'buyer' | 'seller' | 'agent' | 'admin';
  avatar: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  listingType: 'sale' | 'lease';
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'land' | 'commercial';
  price: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  images: string[];
  amenities: string[];
  status: 'pending' | 'approved' | 'rejected';
  ownerId: string;
  ownerType: 'seller' | 'agent';
  views: number;
  isFeatured: boolean;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    images: string[];
  };
  buyer?: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
  };
}

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async requestOtp(email: string): Promise<{ message: string }> {
    return this.request('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otp: string): Promise<{ user: User; isNewUser: boolean }> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async completeOnboarding(userId: string, data: { fullName: string; phone: string; role: string }): Promise<User> {
    return this.request('/api/auth/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    });
  }

  async getFeaturedProperties(): Promise<Property[]> {
    return this.request('/api/properties/featured');
  }

  async getProperties(filters?: {
    city?: string;
    listingType?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Property[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.request(`/api/properties${query ? `?${query}` : ''}`);
  }

  async getProperty(id: string): Promise<Property & { owner: User }> {
    return this.request(`/api/properties/${id}`);
  }

  async createProperty(data: Omit<Property, 'id' | 'views' | 'createdAt' | 'status'>): Promise<Property> {
    return this.request('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyListings(userId: string): Promise<Property[]> {
    return this.request(`/api/my-listings?userId=${userId}`);
  }

  async getFavorites(userId: string): Promise<Favorite[]> {
    return this.request(`/api/favorites?userId=${userId}`);
  }

  async addFavorite(userId: string, propertyId: string): Promise<Favorite> {
    return this.request('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ userId, propertyId }),
    });
  }

  async removeFavorite(propertyId: string, userId: string): Promise<void> {
    return this.request(`/api/favorites/${propertyId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async getInquiries(userId: string): Promise<Inquiry[]> {
    return this.request(`/api/inquiries?userId=${userId}`);
  }

  async getMyInquiries(userId: string): Promise<Inquiry[]> {
    return this.request(`/api/my-inquiries?userId=${userId}`);
  }

  async sendInquiry(data: { propertyId: string; buyerId: string; sellerId: string; message: string }): Promise<Inquiry> {
    return this.request('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();

export async function saveUser(user: User): Promise<void> {
  await SecureStore.setItemAsync('user', JSON.stringify(user));
}

export async function getStoredUser(): Promise<User | null> {
  const data = await SecureStore.getItemAsync('user');
  return data ? JSON.parse(data) : null;
}

export async function clearUser(): Promise<void> {
  await SecureStore.deleteItemAsync('user');
}
