"use client"
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createChatCompletion, parseCalendarRequest, parseKnowledgeRequest } from '@/lib/deepseek';
import { dbManager, type CalendarEvent, type KnowledgeNode } from '@/lib/indexedDB';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Custom event for data updates
const DATA_UPDATED_EVENT = 'dataUpdated';

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to notify that data has been updated
  const notifyDataUpdated = () => {
    const event = new CustomEvent(DATA_UPDATED_EVENT);
    window.dispatchEvent(event);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Check if it's a calendar request
      const calendarData = parseCalendarRequest(userMessage);
      if (calendarData) {
        // Add each task to the calendar
        const addedTasks = await Promise.all(
          calendarData.tasks.map(task => 
            dbManager.addCalendarEvent({
              ...task,
              created: new Date(),
            })
          )
        );

        // Notify that data has been updated
        notifyDataUpdated();

        // Create a summary message
        const taskSummary = calendarData.tasks
          .map((task, index) => 
            `- ${task.title} at ${task.start.toLocaleTimeString()}`
          )
          .join('\n');

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I've added the following tasks to your calendar:\n${taskSummary}`,
        }]);
        return;
      }

      // Check if it's a knowledge request
      const knowledgeData = parseKnowledgeRequest(userMessage);
      if (knowledgeData) {
        await dbManager.addKnowledgeNode({
          ...knowledgeData,
          created: new Date(),
          updated: new Date(),
        });

        // Notify that data has been updated
        notifyDataUpdated();

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I've added "${knowledgeData.title}" to your knowledge base.`,
        }]);
        return;
      }

      // Regular chat interaction
      const response = await createChatCompletion([
        { role: 'system', content: 'You are a helpful AI assistant that can help with calendar and knowledge management.' },
        ...messages,
        { role: 'user', content: userMessage },
      ]);

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await dbManager.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lotion-notes-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await dbManager.importData(data);
      
      // Notify that data has been updated
      notifyDataUpdated();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Data imported successfully!',
      }]);
    } catch (error) {
      console.error('Import error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error importing data. Please check the file format.',
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[500px] max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>

      <div className="p-2 border-t flex justify-end space-x-2">
        <Button variant="outline" onClick={handleExport}>
          Export Data
        </Button>
        <label>
          <Button variant="outline" asChild>
            <span>Import Data</span>
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
} 