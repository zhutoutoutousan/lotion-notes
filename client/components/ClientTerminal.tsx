'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { TerminalIcon, MessageSquare } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import dynamic from 'next/dynamic';

const ShellTerminal = dynamic(() => import('./ShellTerminal'), { ssr: false });

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

export default function ClientTerminal({ isOpen, onClose, messages = [] }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'shell' | 'messages'>('shell');
  const messageTerminalRef = useRef<XTerm | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current || activeTab !== 'messages') return;

    const term = new XTerm({
      cursorBlink: false,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#f0f0f0',
        cursor: '#f0f0f0',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const webglAddon = new WebglAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(webglAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    // Display all messages
    if (Array.isArray(messages)) {
      messages.forEach(message => {
        const timestamp = message.timestamp.toLocaleTimeString();
        const typeColor = {
          info: '\x1b[36m', // Cyan
          success: '\x1b[32m', // Green
          error: '\x1b[31m', // Red
          warning: '\x1b[33m', // Yellow
        }[message.type];

        term.writeln(`${typeColor}[${timestamp}] ${message.content}\x1b[0m`);
      });
    }

    messageTerminalRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [messages, activeTab, isClient]);

  if (!isOpen || !isClient) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 bg-[#1e1e1e] border-t border-gray-700 z-50">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex space-x-2">
          <button
            className={`flex items-center space-x-1 px-2 py-1 rounded ${
              activeTab === 'shell' ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('shell')}
          >
            <TerminalIcon className="w-4 h-4" />
            <span>Shell</span>
          </button>
          <button
            className={`flex items-center space-x-1 px-2 py-1 rounded ${
              activeTab === 'messages' ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </button>
        </div>
        <button
          className="px-2 py-1 rounded hover:bg-gray-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div ref={containerRef} className="h-[calc(100%-40px)]">
        {activeTab === 'shell' && <ShellTerminal containerRef={containerRef} />}
      </div>
    </div>
  );
} 