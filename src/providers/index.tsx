// src/providers/index.tsx
'use client';

import { ReactNode } from 'react';
import QueryProvider from './QueryProvider';
import { AuthProvider } from '../context/AuthContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}