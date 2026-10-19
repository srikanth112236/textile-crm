import apiClient from './client';

export interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface BodyMeasurements {
  heightCm?: number;
  weightKg?: number;
  chestIn?: number;
  waistIn?: number;
  hipIn?: number;
  fit?: 'slim' | 'regular' | 'relaxed' | 'oversized';
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  measurements?: BodyMeasurements;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  measurements?: BodyMeasurements;
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

export interface AddressesResponse {
  success: boolean;
  data: Address[];
}

export interface AddressResponse {
  success: boolean;
  data: Address;
  message?: string;
}

export interface ExportDataResponse {
  success: boolean;
  data: {
    profile: UserProfile;
    addresses: Address[];
  };
}

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ProfileResponse>('/profile');
    return response.data.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.put<ProfileResponse>('/profile', data);
    return response.data.data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get<AddressesResponse>('/profile/addresses');
    return response.data.data;
  },

  addAddress: async (address: Omit<Address, '_id'>): Promise<Address> => {
    const response = await apiClient.post<AddressResponse>('/profile/addresses', address);
    return response.data.data;
  },

  updateAddress: async (addressId: string, address: Partial<Address>): Promise<Address> => {
    const response = await apiClient.put<AddressResponse>(`/profile/addresses/${addressId}`, address);
    return response.data.data;
  },

  deleteAddress: async (addressId: string): Promise<void> => {
    await apiClient.delete(`/profile/addresses/${addressId}`);
  },

  exportData: async (): Promise<ExportDataResponse['data']> => {
    const response = await apiClient.get<ExportDataResponse>('/profile/export');
    return response.data.data;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/profile');
  },
};

