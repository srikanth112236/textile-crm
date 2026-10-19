import apiClient from './client';

export interface CreateAdminData {
  email: string;
  password: string;
  name?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface UsersResponse {
  success: boolean;
  data: Array<{
    _id: string;
    email: string;
    name?: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateAdminResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    email: string;
    name?: string;
    role: string;
    createdAt: string;
  };
}

export const usersApi = {
  // Create admin (Superadmin only)
  createAdmin: async (adminData: CreateAdminData): Promise<CreateAdminResponse> => {
    const response = await apiClient.post('/users/admins', adminData);
    return response.data;
  },

  // Get all users (Superadmin only)
  getUsers: async (filters: UserFilters = {}): Promise<UsersResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/users/users?${params.toString()}`);
    return response.data;
  },
};

