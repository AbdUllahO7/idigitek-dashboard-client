// src/lib/api-client.ts
import axios from 'axios';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if the client has been initialized (to prevent double initialization in dev mode)
let isInitialized = false;

// Only run this setup once
if (!isInitialized && typeof window !== 'undefined') {
  
  // Setup initial auth header if token exists
  const token = localStorage.getItem('token');
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Add a request interceptor to check for token and set it for each request
  apiClient.interceptors.request.use(
    (config) => {
      // Only run on client side
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Add a response interceptor to handle token refresh
  apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // If we get a 401 Unauthorized error and we haven't already tried to refresh
      if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (refreshToken) {
            // Call your refresh token endpoint
            const response = await axios.post('/api/auth/refresh-token', { refreshToken });
            
            if (response.data && response.data.data && response.data.data.tokens) {
              // Save the new tokens
              localStorage.setItem('token', response.data.data.tokens.accessToken);
              if (response.data.data.tokens.refreshToken) {
                localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
              }
              
              // Update auth header and retry original request
              originalRequest.headers['Authorization'] = `Bearer ${response.data.data.tokens.accessToken}`;
              return axios(originalRequest);
            }
          }
          
        } catch (refreshError) {
          
          // Clear tokens on refresh failure
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('userData');
          
      
        }
      }
      
    
      
      return Promise.reject(error);
    }
  );
  
  isInitialized = true;
}

export default apiClient;