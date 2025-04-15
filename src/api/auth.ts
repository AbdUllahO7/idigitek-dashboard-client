// src/api/auth.ts
import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

// Request types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

// Response types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: AuthTokens;
  };
  timestamp: string;
  requestId: string;
}

// Login hook
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Don't specify a return type here, let TypeScript infer it
      const response = await apiClient.post('/auth/login', credentials);
      const responseData = response.data;
      
      // Store tokens in localStorage
      if (responseData && responseData.data && responseData.data.tokens) {
        localStorage.setItem('token', responseData.data.tokens.accessToken);
        localStorage.setItem('refreshToken', responseData.data.tokens.refreshToken);
      }

      return responseData; // Return the full response data
    }
  });
};

// Register hook
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterData): Promise<AuthResponse> => {
      const { data } = await apiClient.post('/auth/register', userData);
      
      // Store tokens in localStorage - adjust the path based on your API response
      if (data && data.data && data.data.tokens) {
        localStorage.setItem('token', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      }
      
      return data;
    }
  });
};

// Logout hook
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      try {
        // Check if we have a token before attempting to call the logout endpoint
        const token = localStorage.getItem('token');
        if (token) {
          // Send logout request to API but don't wait for it to complete
          // This way we always clear local storage regardless of API response
          apiClient.post('/auth/logout').catch(err => {
            console.error("Logout API error (non-blocking):", err);
          });
        }
      } finally {
        // Always clear local storage, even if API call fails
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      return true; // Always return success
    }
  });
};

// Get current user hook
export const useCurrentUser = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get('/users/me');
      return data.user;
    }
  });
};