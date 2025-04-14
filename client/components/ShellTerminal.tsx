'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';

interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<string>;
}

interface ShellTerminalProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ShellTerminal({ containerRef }: ShellTerminalProps) {
  const xtermRef = useRef<XTerm | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isClient, setIsClient] = useState(false);

  const commands: Record<string, Command> = {
    help: {
      name: 'help',
      description: 'Show available commands',
      execute: async () => {
        return Object.values(commands)
          .map(cmd => `${cmd.name}: ${cmd.description}`)
          .join('\n');
      }
    },
    clear: {
      name: 'clear',
      description: 'Clear the terminal',
      execute: async () => {
        xtermRef.current?.clear();
        return '';
      }
    },
    ls: {
      name: 'ls',
      description: 'List directory contents',
      execute: async (args) => {
        return 'bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var';
      }
    },
    cd: {
      name: 'cd',
      description: 'Change directory',
      execute: async (args) => {
        if (args.length === 0) {
          setCurrentDirectory('/');
          return '';
        }
        const newDir = args[0];
        if (newDir === '..') {
          setCurrentDirectory(currentDirectory.split('/').slice(0, -1).join('/') || '/');
        } else if (newDir.startsWith('/')) {
          setCurrentDirectory(newDir);
        } else {
          setCurrentDirectory(`${currentDirectory}${currentDirectory === '/' ? '' : '/'}${newDir}`);
        }
        return '';
      }
    },
    pwd: {
      name: 'pwd',
      description: 'Print working directory',
      execute: async () => currentDirectory
    },
    echo: {
      name: 'echo',
      description: 'Print arguments',
      execute: async (args) => args.join(' ')
    },
    date: {
      name: 'date',
      description: 'Show current date and time',
      execute: async () => new Date().toLocaleString()
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
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

    let currentLine = '';
    let cursorPosition = 0;

    const writePrompt = () => {
      term.write(`\r\n${currentDirectory} $ `);
      currentLine = '';
      cursorPosition = 0;
    };

    const handleCommand = async (command: string) => {
      const [cmd, ...args] = command.trim().split(/\s+/);
      const commandHandler = commands[cmd];

      if (commandHandler) {
        try {
          const result = await commandHandler.execute(args);
          if (result) {
            term.write(`\r\n${result}`);
          }
        } catch (error) {
          term.write(`\r\nError: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else if (cmd) {
        term.write(`\r\nCommand not found: ${cmd}`);
      }
    };

    term.writeln('Welcome to the Terminal!');
    term.writeln('Type "help" for available commands.');
    writePrompt();

    term.onData((data: string) => {
      const printable = !data.startsWith('\x1b');

      if (data === '\r') {
        // Enter key
        setCommandHistory(prev => [...prev, currentLine]);
        setHistoryIndex(-1);
        term.write('\r\n');
        handleCommand(currentLine);
        writePrompt();
      } else if (data === '\u0003') {
        // Ctrl+C
        term.write('^C\r\n');
        writePrompt();
      } else if (data === '\u007F') {
        // Backspace
        if (cursorPosition > 0) {
          term.write('\b \b');
          currentLine = currentLine.slice(0, -1);
          cursorPosition--;
        }
      } else if (data === '\x1b[A') {
        // Up arrow
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];
          term.write('\r\x1b[K');
          term.write(`${currentDirectory} $ ${historyCommand}`);
          currentLine = historyCommand;
          cursorPosition = currentLine.length;
        }
      } else if (data === '\x1b[B') {
        // Down arrow
        if (historyIndex > -1) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          term.write('\r\x1b[K');
          if (newIndex === -1) {
            term.write(`${currentDirectory} $ `);
            currentLine = '';
            cursorPosition = 0;
          } else {
            const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];
            term.write(`${currentDirectory} $ ${historyCommand}`);
            currentLine = historyCommand;
            cursorPosition = currentLine.length;
          }
        }
      } else if (printable) {
        term.write(data);
        currentLine += data;
        cursorPosition++;
      }
    });

    xtermRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [currentDirectory, isClient]);

  return null;
} 