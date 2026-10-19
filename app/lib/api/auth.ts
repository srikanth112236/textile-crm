import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  recaptchaToken?: string;
  referralCode?: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
    mfaEnabled?: boolean;
  };
  accessToken: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      ...(credentials.recaptchaToken && { recaptchaToken: credentials.recaptchaToken }),
    }, {
      withCredentials: true, // Include cookies in request
    });
    
    // Store access token in localStorage (refresh token is in HttpOnly cookie)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      ...(data.recaptchaToken && { recaptchaToken: data.recaptchaToken }),
      ...(data.referralCode && { referralCode: data.referralCode }),
    }, {
      withCredentials: true, // Include cookies in request
    });
    
    // Store access token in localStorage (refresh token is in HttpOnly cookie)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout', {}, {
      withCredentials: true, // Include cookies in request
    });
    
    // Clear access token from localStorage (refresh token cookie is cleared by server)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    // Refresh token is automatically sent via HttpOnly cookie; stored copy
    // in body as fallback (backend accepts both)
    const storedRefresh =
      typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    const response = await apiClient.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh',
      storedRefresh ? { refreshToken: storedRefresh } : {},
      {
        withCredentials: true, // Include cookies in request
      }
    );

    // Store new access token (refresh token is in HttpOnly cookie)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
      if (response.data.refreshToken) localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response.data;
  },
};

