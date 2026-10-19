import apiClient from './client';

export interface User {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'user' | 'admin' | 'superadmin';
  isBanned: boolean;
  bannedAt?: string;
  bannedReason?: string;
  loyaltyPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  userId?: User;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

export interface Permission {
  _id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  description?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  isBanned?: boolean;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  role?: string;
  isBanned?: boolean;
  bannedReason?: string;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const adminApi = {
  // Users
  getUsers: async (params?: GetUsersParams) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserData) => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  banUser: async (id: string, reason: string) => {
    const response = await apiClient.post(`/admin/users/${id}/ban`, { reason });
    return response.data;
  },

  unbanUser: async (id: string) => {
    const response = await apiClient.post(`/admin/users/${id}/unban`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: GetAuditLogsParams) => {
    const response = await apiClient.get('/admin/logs', { params });
    return response.data;
  },

  // Permissions
  getPermissions: async () => {
    const response = await apiClient.get('/admin/permissions');
    return response.data;
  },

  createPermission: async (data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }) => {
    const response = await apiClient.post('/admin/permissions', data);
    return response.data;
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await apiClient.put(`/admin/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data;
  },
};

