// src/api/auth.ts
import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

// For debugging - each instance gets a unique ID
const API_ID = Math.random().toString(36).substring(2, 9);

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

// Helper to safely store tokens
const storeTokens = (tokens: AuthTokens | undefined | null) => {
  if (!tokens) {
    console.log(`[AuthAPI ${API_ID}] No tokens to store`);
    return false;
  }
  
  try {
    localStorage.setItem('token', tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    console.log(`[AuthAPI ${API_ID}] Tokens stored successfully`);
    return true;
  } catch (e) {
    console.error(`[AuthAPI ${API_ID}] Failed to store tokens:`, e);
    return false;
  }
};

// Login hook
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log(`[AuthAPI ${API_ID}] Login attempt:`, credentials.email);
      
      try {
        const response = await apiClient.post('/auth/login', credentials);
        const responseData = response.data;
        
        console.log(`[AuthAPI ${API_ID}] Login response:`, responseData);
        
        // Store tokens in localStorage
        if (responseData?.data?.tokens) {
          storeTokens(responseData.data.tokens);
        } else {
          console.error(`[AuthAPI ${API_ID}] No tokens in login response`);
        }
        
        return responseData;
      } catch (error) {
        console.error(`[AuthAPI ${API_ID}] Login request failed:`, error);
        throw error;
      }
    }
  });
};

// Register hook
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterData): Promise<AuthResponse> => {
      console.log(`[AuthAPI ${API_ID}] Register attempt:`, userData.email);
      
      try {
        const response = await apiClient.post('/auth/register', userData);
        const responseData = response.data;
        
        console.log(`[AuthAPI ${API_ID}] Register response:`, responseData);
        
        // Store tokens in localStorage
        if (responseData?.data?.tokens) {
          storeTokens(responseData.data.tokens);
        } else {
          console.error(`[AuthAPI ${API_ID}] No tokens in register response`);
        }
        
        return responseData;
      } catch (error) {
        console.error(`[AuthAPI ${API_ID}] Registration request failed:`, error);
        throw error;
      }
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
          });
        }
      } catch (error) {
      } finally {
        // Always clear local storage, even if API call fails
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('userData');
      }
      return true; // Always return success
    }
  });
};

// Get current user hook with retry mechanism
export const useCurrentUser = () => {
  return useMutation({
    mutationFn: async () => {
      
      try {
        const response = await apiClient.get('/users/me');
        
        // Check all possible paths for user data
        let userData = null;
        
        if (response.data && response.data.user) {
          // First check the expected path
          userData = response.data.user;
        } else if (response.data && response.data.data) {
          // Check if data is nested in a 'data' field
          if (response.data.data.user) {
            // Check if user is in data.data.user
            userData = response.data.data.user;
          } else {
            // Maybe the data itself is the user object - check for required fields
            const possibleUser = response.data.data;
            if (possibleUser.id && possibleUser.email) {
              userData = possibleUser;
            }
          }
        }
        
        if (userData) {
          return userData;
        } else {
          return null;
        }
      } catch (error: any) {
        
        // For 401/403 errors, clear tokens
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('userData');
        }
        
        // Always return null for user on error
        return null;
      }
    }
  });
};

