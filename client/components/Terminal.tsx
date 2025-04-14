'use client';

import dynamic from 'next/dynamic';

const ClientTerminal = dynamic(() => import('./ClientTerminal'), {
  ssr: false,
  loading: () => null
});

interface Message {
  type: 'info' | 'success' | 'error' | 'warning';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: Message[];
}

export default function Terminal(props: TerminalProps) {
  return <ClientTerminal {...props} />;
} 