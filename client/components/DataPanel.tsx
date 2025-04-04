"use client"

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, BookOpen, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbManager, type CalendarEvent, type KnowledgeNode } from '@/lib/indexedDB';
import { formatDate } from '@/lib/dateUtils';
import { toast } from '@/components/ui/use-toast';

// Custom event for data updates
const DATA_UPDATED_EVENT = 'dataUpdated';

export function DataPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'knowledge'>('calendar');

  useEffect(() => {
    loadData();
    
    // Listen for data update events
    const handleDataUpdated = () => {
      loadData();
    };
    
    window.addEventListener(DATA_UPDATED_EVENT, handleDataUpdated);
    
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, handleDataUpdated);
    };
  }, []);

  const loadData = async () => {
    try {
      const events = await dbManager.getCalendarEvents();
      const nodes = await dbManager.getKnowledgeNodes();
      setCalendarEvents(events);
      setKnowledgeNodes(nodes);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handlePurgeData = async () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      try {
        await dbManager.purgeData();
        setCalendarEvents([]);
        setKnowledgeNodes([]);
        toast({
          title: "Data purged",
          description: "All calendar events and knowledge nodes have been deleted.",
        });
      } catch (error) {
        console.error('Error purging data:', error);
        toast({
          title: "Error",
          description: "Failed to purge data. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-screen transition-all duration-300 ${isOpen ? 'w-80' : 'w-0'} z-50`}>
      {/* Toggle button */}
      <Button
        variant="outline"
        size="icon"
        className={`absolute top-4 ${isOpen ? '-left-10' : '-left-10'} z-10 bg-white dark:bg-gray-800 shadow-md`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Panel content */}
      <div className={`h-full bg-white dark:bg-gray-800 shadow-lg overflow-hidden ${isOpen ? 'w-80' : 'w-0'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Data</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-2 text-center flex items-center justify-center gap-2 ${
                activeTab === 'calendar' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
            <button
              className={`flex-1 py-2 text-center flex items-center justify-center gap-2 ${
                activeTab === 'knowledge' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('knowledge')}
            >
              <BookOpen className="h-4 w-4" />
              Knowledge
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'calendar' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Calendar Events</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete all calendar events? This action cannot be undone.')) {
                        dbManager.purgeCalendarEvents().then(() => {
                          setCalendarEvents([]);
                          toast({
                            title: "Calendar events purged",
                            description: "All calendar events have been deleted.",
                          });
                        }).catch((error: Error) => {
                          console.error('Error purging calendar events:', error);
                          toast({
                            title: "Error",
                            description: "Failed to purge calendar events. Please try again.",
                            variant: "destructive",
                          });
                        });
                      }
                    }}
                    className="flex items-center gap-1 text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Purge Calendar</span>
                  </Button>
                </div>
                {calendarEvents.length === 0 ? (
                  <p className="text-gray-500 text-center">No calendar events</p>
                ) : (
                  calendarEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.start)} - {formatDate(event.end)}
                      </p>
                      {event.description && (
                        <p className="text-sm mt-1">{event.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Knowledge Nodes</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete all knowledge nodes? This action cannot be undone.')) {
                        dbManager.purgeKnowledgeNodes().then(() => {
                          setKnowledgeNodes([]);
                          toast({
                            title: "Knowledge nodes purged",
                            description: "All knowledge nodes have been deleted.",
                          });
                        }).catch((error: Error) => {
                          console.error('Error purging knowledge nodes:', error);
                          toast({
                            title: "Error",
                            description: "Failed to purge knowledge nodes. Please try again.",
                            variant: "destructive",
                          });
                        });
                      }
                    }}
                    className="flex items-center gap-1 text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Purge Knowledge</span>
                  </Button>
                </div>
                {knowledgeNodes.length === 0 ? (
                  <p className="text-gray-500 text-center">No knowledge nodes</p>
                ) : (
                  knowledgeNodes.map((node) => (
                    <div key={node.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <h3 className="font-medium">{node.title}</h3>
                      <p className="text-sm mt-1 line-clamp-3">{node.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 