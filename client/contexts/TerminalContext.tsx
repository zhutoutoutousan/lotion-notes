'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  type: 'info' | 'success' | 'error' | 'warning';
  content: string;
  timestamp: Date;
}

interface TerminalContextType {
  isOpen: boolean;
  openTerminal: () => void;
  closeTerminal: () => void;
  addMessage: (type: Message['type'], content: string) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const openTerminal = () => setIsOpen(true);
  const closeTerminal = () => setIsOpen(false);
  const addMessage = (type: Message['type'], content: string) => {
    setMessages(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  return (
    <TerminalContext.Provider value={{ isOpen, openTerminal, closeTerminal, addMessage }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
} 