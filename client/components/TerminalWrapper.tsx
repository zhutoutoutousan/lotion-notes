'use client';

import { useTerminal } from '@/contexts/TerminalContext';
import Terminal from '@/components/Terminal';
import { useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

export default function TerminalWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, closeTerminal, openTerminal } = useTerminal();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        if (isOpen) {
          closeTerminal();
        } else {
          openTerminal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeTerminal, openTerminal]);
  
  return (
    <>
      {children}
      <Terminal isOpen={isOpen} onClose={closeTerminal} />
      {!isOpen && (
        <button
          onClick={openTerminal}
          className="fixed bottom-4 right-4 p-3 bg-[#2d2d2d] text-white rounded-full shadow-lg hover:bg-[#3d3d3d] transition-colors z-50"
          title="Open Terminal (Ctrl+`)"
        >
          <TerminalIcon size={20} />
        </button>
      )}
    </>
  );
} 