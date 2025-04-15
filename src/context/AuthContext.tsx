// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin, useLogout, useRegister } from '../api';
import apiClient from '../lib/api-client';

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await apiClient.get('/users/me');
          
          if (response.data && response.data.user) {
            setUser(response.data.user);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function for AuthContext
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Call login mutation and get response
      const response = await loginMutation.mutateAsync({ email, password });
      console.log("Login response:", response);
      
      // Check if user data exists in response
      if (response && response.data && response.data.user) {
        console.log("Setting user from login:", response.data.user);
        setUser(response.data.user);
        router.push('/dashboard');
      } else {
        console.log("User data not found in login response, fetching separately");
        
        // If tokens were set successfully but no user data
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const userResponse = await apiClient.get('/users/me');
            console.log("User data response:", userResponse.data);
            
            if (userResponse.data && userResponse.data.user) {
              console.log("Setting user from /users/me");
              setUser(userResponse.data.user);
              router.push('/dashboard');
            } else {
              console.error("No user data found in /users/me response");
              throw new Error("Failed to retrieve user data");
            }
          } catch (userError) {
            console.error("Error fetching user data:", userError);
            // Clear tokens if we can't get user data
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            throw userError; // Re-throw to be caught by the calling component
          }
        } else {
          console.error("No token was set after login");
          throw new Error("Authentication failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      // Clear any tokens if login fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw error; // Re-throw to be caught by the calling component
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await registerMutation.mutateAsync({ name, email, password });
      
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutMutation.mutateAsync();
      setUser(null);
      router.push('/sign-in');
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server-side logout fails, we still want to clear local state
      setUser(null);
      router.push('/sign-in');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate authentication status
  const isAuthenticated = user !== null;
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}