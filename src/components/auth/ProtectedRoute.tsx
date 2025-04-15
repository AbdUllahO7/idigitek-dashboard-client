// src/components/auth/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log("isAuthenticated" , isAuthenticated)

  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // If not loading and not authenticated, redirect to sign-in
    if (!isLoading && !isAuthenticated) {
      router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
    
    // If authenticated but not allowed (role check)
    if (!isLoading && isAuthenticated && user && allowedRoles.length > 0) {
      const hasPermission = allowedRoles.includes(user.role);
      if (!hasPermission) {
        router.push('/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname, allowedRoles]);
  
  // Show loading or unauthorized state
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, don't render children yet
  if (!isAuthenticated) {
    return null;
  }
  
  // If role check is needed and user doesn't have permission
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
}