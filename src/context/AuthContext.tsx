// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin, useLogout, useRegister, useCurrentUser } from '../api/auth';
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

// For debugging - each context instance gets a unique ID
const CONTEXT_ID = Math.random().toString(36).substring(2, 9);

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store for keeping track of the auth state, isolating changes
interface UserStore {
  user: User | null;
  version: number;
  timestamp: number;
}

// Create the auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // Main state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Refs for stabilizing state and preventing double updates
  const userRef = useRef<User | null>(null);
  const isAuthCheckedRef = useRef(false);
  const stateLockRef = useRef(false);
  const stateVersionRef = useRef(0);

  console.log(`[Auth ${CONTEXT_ID}] Provider initialized, user:`, user);
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const currentUserMutation = useCurrentUser();

  // Persist user data to both refs and sessionStorage
  const persistUser = (userData: User | null) => {
    if (stateLockRef.current) {
      console.log(`[Auth ${CONTEXT_ID}] State locked, skipping update`);
      return;
    }

    console.log(`[Auth ${CONTEXT_ID}] Persisting user:`, userData);
    
    // Lock the state to prevent rapid changes
    stateLockRef.current = true;
    
    // Update ref immediately
    userRef.current = userData;
    stateVersionRef.current += 1;
    
    // Store in sessionStorage for persistence across page navigations
    if (userData) {
      try {
        const userStore: UserStore = {
          user: userData,
          version: stateVersionRef.current,
          timestamp: Date.now()
        };
        sessionStorage.setItem('userData', JSON.stringify(userStore));
        console.log(`[Auth ${CONTEXT_ID}] User data saved to sessionStorage v${stateVersionRef.current}`);
      } catch (e) {
        console.error(`[Auth ${CONTEXT_ID}] Failed to save user data to sessionStorage:`, e);
      }
    } else if (typeof window !== 'undefined') {
      // Clear sessionStorage when user is null
      sessionStorage.removeItem('userData');
      console.log(`[Auth ${CONTEXT_ID}] User data cleared from sessionStorage`);
    }
    
    // Update state
    setUser(userData);
    
    // Release lock after a short delay to ensure state updates complete
    setTimeout(() => {
      stateLockRef.current = false;
    }, 100);
  };

  // Set up auth header whenever the token changes
  const setupAuthHeader = (token: string | null) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log(`[Auth ${CONTEXT_ID}] Set auth header with token`);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      console.log(`[Auth ${CONTEXT_ID}] Cleared auth header`);
    }
  };
  
  // Check if user is logged in on initial load
  useEffect(() => {
    // Skip if already checked or server-side
    if (isAuthCheckedRef.current || typeof window === 'undefined') {
      return;
    }

    console.log(`[Auth ${CONTEXT_ID}] Starting initial auth check`);
    
    const checkAuth = async () => {
      try {
        // First, try to restore from sessionStorage (faster than API call)
        let restoredFromSession = false;
        
        try {
          const storedUserData = sessionStorage.getItem('userData');
          if (storedUserData) {
            const userStore = JSON.parse(storedUserData) as UserStore;
            
            // Check if data is reasonably fresh (less than 30 minutes old)
            const isFresh = Date.now() - userStore.timestamp < 30 * 60 * 1000;
            
            if (userStore.user && isFresh) {
              console.log(`[Auth ${CONTEXT_ID}] Restored user from sessionStorage:`, userStore.user);
              userRef.current = userStore.user;
              stateVersionRef.current = userStore.version;
              setUser(userStore.user);
              restoredFromSession = true;
              
              // Even if we restore from session, still set up auth header
              const token = localStorage.getItem('token');
              if (token) {
                setupAuthHeader(token);
              }
            }
          }
        } catch (e) {
          console.error(`[Auth ${CONTEXT_ID}] Failed to restore from sessionStorage:`, e);
          sessionStorage.removeItem('userData');
        }
        
        // Proceed with API check if we have a token
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log(`[Auth ${CONTEXT_ID}] No token found, setting user to null`);
          if (!restoredFromSession) {
            persistUser(null);
          }
          return;
        }
        
        // Set up the auth header
        setupAuthHeader(token);
        
        // Always verify with API for security, even if restored from session
        console.log(`[Auth ${CONTEXT_ID}] Verifying user with API`);
        
        try {
          const userData = await currentUserMutation.mutateAsync();
          console.log(`[Auth ${CONTEXT_ID}] API returned user:`, userData);
          
          if (userData) {
            persistUser(userData);
          } else {
            console.log(`[Auth ${CONTEXT_ID}] API returned no user, clearing auth`);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('userData');
            setupAuthHeader(null);
            persistUser(null);
          }
        } catch (apiError) {
          console.error(`[Auth ${CONTEXT_ID}] API auth check failed:`, apiError);
          
          if (restoredFromSession) {
            console.log(`[Auth ${CONTEXT_ID}] Using session data despite API failure`);
            // Keep the session data if API fails but we restored from session
          } else {
            // Clear auth if API fails and we didn't restore from session
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('userData');
            setupAuthHeader(null);
            persistUser(null);
          }
        }
      } catch (error) {
        console.error(`[Auth ${CONTEXT_ID}] Auth check error:`, error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('userData');
        setupAuthHeader(null);
        persistUser(null);
      } finally {
        isAuthCheckedRef.current = true;
        setIsLoading(false);
        console.log(`[Auth ${CONTEXT_ID}] Initial auth check completed`);
      }
    };
    
    checkAuth();
    
    // Listen for storage events (in case another tab logs out)
    const handleStorageChange = (e: StorageEvent) => {
      console.log(`[Auth ${CONTEXT_ID}] Storage event:`, e.key);
      
      if (e.key === 'token') {
        if (!e.newValue) {
          console.log(`[Auth ${CONTEXT_ID}] Token removed in another tab, clearing user`);
          persistUser(null);
          setupAuthHeader(null);
        } else if (e.newValue !== localStorage.getItem('token')) {
          console.log(`[Auth ${CONTEXT_ID}] Token changed in another tab, reloading`);
          window.location.reload();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUserMutation]);
  
  // Login function
  const login = async (email: string, password: string) => {
    console.log(`[Auth ${CONTEXT_ID}] Login attempt:`, email);
    
    try {
      setIsLoading(true);
      
      // Call login mutation
      const response = await loginMutation.mutateAsync({ email, password });
      console.log(`[Auth ${CONTEXT_ID}] Login response:`, response);
      
      // Get the token from the response or localStorage
      const token = response?.data?.tokens?.accessToken || localStorage.getItem('token');
      
      if (token) {
        setupAuthHeader(token);
        
        // Get user data
        if (response?.data?.user) {
          console.log(`[Auth ${CONTEXT_ID}] Using user from login response`);
          persistUser(response.data.user);
        } else {
          // If no user in response, try to fetch it
          console.log(`[Auth ${CONTEXT_ID}] No user in response, fetching from API`);
          try {
            const userData = await currentUserMutation.mutateAsync();
            if (userData) {
              persistUser(userData);
            } else {
              throw new Error("Failed to get user data");
            }
          } catch (userError) {
            console.error(`[Auth ${CONTEXT_ID}] Error fetching user data:`, userError);
            // Clear tokens if we can't get user data
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('userData');
            setupAuthHeader(null);
            throw userError;
          }
        }
        
        // Navigate to dashboard or redirect URL
        console.log(`[Auth ${CONTEXT_ID}] Login successful, redirecting to dashboard`);
        router.push('/dashboard');
      } else {
        console.error(`[Auth ${CONTEXT_ID}] No token received in login response`);
        throw new Error("Authentication failed - no token received");
      }
    } catch (error) {
      console.error(`[Auth ${CONTEXT_ID}] Login error:`, error);
      // Clear tokens on login failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('userData');
      setupAuthHeader(null);
      persistUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (name: string, email: string, password: string) => {
    console.log(`[Auth ${CONTEXT_ID}] Register attempt:`, email);
    
    try {
      setIsLoading(true);
      const response = await registerMutation.mutateAsync({ name, email, password });
      console.log(`[Auth ${CONTEXT_ID}] Register response:`, response);
      
      // Get token from response or localStorage
      const token = response?.data?.tokens?.accessToken || localStorage.getItem('token');
      
      if (token) {
        setupAuthHeader(token);
        
        // Get user data
        if (response?.data?.user) {
          console.log(`[Auth ${CONTEXT_ID}] Using user from register response`);
          persistUser(response.data.user);
        } else {
          // If no user in response, try to fetch it
          console.log(`[Auth ${CONTEXT_ID}] No user in response, fetching from API`);
          const userData = await currentUserMutation.mutateAsync();
          if (userData) {
            persistUser(userData);
          } else {
            throw new Error("Failed to get user data after registration");
          }
        }
        
        console.log(`[Auth ${CONTEXT_ID}] Registration successful, redirecting to dashboard`);
        router.push('/dashboard');
      } else {
        console.error(`[Auth ${CONTEXT_ID}] No token received in register response`);
        throw new Error("Registration failed - no token received");
      }
    } catch (error) {
      console.error(`[Auth ${CONTEXT_ID}] Registration failed:`, error);
      // Clear tokens on registration failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('userData');
      setupAuthHeader(null);
      persistUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    console.log(`[Auth ${CONTEXT_ID}] Logout attempt`);
    
    try {
      setIsLoading(true);
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error(`[Auth ${CONTEXT_ID}] Logout error:`, error);
    } finally {
      // Always clear everything, even if server-side logout fails
      console.log(`[Auth ${CONTEXT_ID}] Clearing auth state`);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('userData');
      setupAuthHeader(null);
      persistUser(null);
      setIsLoading(false);
      router.push('/sign-in');
    }
  };
  
  // Calculate authentication status
  const isAuthenticated = user !== null;
  
  // Debug auth state changes
  useEffect(() => {
    console.log(`[Auth ${CONTEXT_ID}] Auth state updated:`, {
      isAuthenticated,
      user: user ? `${user.name} (${user.role})` : 'none',
      version: stateVersionRef.current
    });
  }, [user, isAuthenticated]);
  
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