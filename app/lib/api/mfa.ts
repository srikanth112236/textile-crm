import apiClient from './client';

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  message: string;
}

export interface MFAVerifyResponse {
  message: string;
  mfaEnabled: boolean;
}

export const mfaApi = {
  setup: async (): Promise<MFASetupResponse> => {
    const response = await apiClient.post<MFASetupResponse>('/auth/mfa/setup');
    return response.data;
  },

  verify: async (token: string): Promise<MFAVerifyResponse> => {
    const response = await apiClient.post<MFAVerifyResponse>('/auth/mfa/verify', {
      token,
    });
    return response.data;
  },

  disable: async (token: string): Promise<MFAVerifyResponse> => {
    const response = await apiClient.post<MFAVerifyResponse>('/auth/mfa/disable', {
      token,
    });
    return response.data;
  },
};

