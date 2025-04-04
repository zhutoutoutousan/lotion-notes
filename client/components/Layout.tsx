"use client"

import { ReactNode } from 'react';
import { DataPanel } from './DataPanel';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen">
      {children}
      <DataPanel />
    </div>
  );
} 