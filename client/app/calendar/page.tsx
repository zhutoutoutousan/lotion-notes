"use client"

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Grid, List, BarChart, Edit2, ClipboardList, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbManager, CalendarEvent } from '@/lib/indexedDB';
import { formatDate } from '@/lib/dateUtils';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskPool from '@/components/task-pool';
import AITaskScheduler from '@/components/ai-task-scheduler';
import DraggableEvent from '@/components/draggable-event';
import { downloadICSFile } from '@/lib/icsUtils';

// Custom event for data updates
const DATA_UPDATED_EVENT = 'dataUpdated';

type ViewType = 'day' | 'week' | 'month' | 'year';

interface EventForm {
  id?: number;
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export default function CalendarPage() {
  const [viewType, setViewType] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [newEvent, setNewEvent] = useState<EventForm>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '10:00',
  });
  const [editingEvent, setEditingEvent] = useState<EventForm>({
    id: undefined,
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });
  const [originalEvent, setOriginalEvent] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [dayWidth, setDayWidth] = useState(100);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<'today' | 'week' | 'month'>('today');

  // Calculate day width when container size changes
  useEffect(() => {
    const calculateDayWidth = () => {
      if (calendarRef.current) {
        const containerWidth = calendarRef.current.clientWidth;
        const newDayWidth = Math.floor((containerWidth - 48) / 7); // 48px for the time column
        setDayWidth(newDayWidth);
      }
    };

    // Calculate initial width
    calculateDayWidth();

    // Add resize listener
    window.addEventListener('resize', calculateDayWidth);

    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateDayWidth);
    };
  }, [viewType]); // Recalculate when view type changes

  useEffect(() => {
    loadEvents();
    
    // Listen for data update events
    const handleDataUpdated = () => {
      loadEvents();
    };
    
    window.addEventListener(DATA_UPDATED_EVENT, handleDataUpdated);
    
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, handleDataUpdated);
    };
  }, []);

  const loadEvents = async () => {
    try {
      const loadedEvents = await dbManager.getCalendarEvents();
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events.",
        variant: "destructive",
      });
    }
  };

  const handlePrevPeriod = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setNewEvent({
      title: '',
      description: '',
      startDate: date.toISOString().split('T')[0],
      startTime: '09:00',
      endDate: date.toISOString().split('T')[0],
      endTime: '10:00',
    });
    setIsAddEventOpen(true);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}`);
    const endDateTime = new Date(`${newEvent.endDate}T${newEvent.endTime}`);
    
    const event: Omit<CalendarEvent, 'id'> = {
      title: newEvent.title,
      description: newEvent.description,
      start: startDateTime,
      end: endDateTime,
      created: new Date()
    };
    
    // Add to IndexedDB
    dbManager.addCalendarEvent(event)
      .then(async () => {
        await loadEvents();
        setIsAddEventOpen(false);
        setNewEvent({
          title: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endDate: new Date().toISOString().split('T')[0],
          endTime: '10:00',
        });
        toast({
          title: "Event added",
          description: "Your calendar event has been added successfully.",
        });
      })
      .catch((error) => {
        console.error('Error adding event:', error);
        toast({
          title: "Error",
          description: "Failed to add the event. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleEditEvent = (event: CalendarEvent) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    // Store the original event for cancellation
    setOriginalEvent(event);
    
    setEditingEvent({
      id: event.id,
      title: event.title,
      description: event.description || '',
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate.toISOString().split('T')[0],
      endTime: endDate.toTimeString().slice(0, 5),
    });
    
    setIsEditEventOpen(true);
  };

  const handleUpdateEvent = async (updatedEvent: CalendarEvent | React.FormEvent<HTMLFormElement>) => {
    if ('target' in updatedEvent) {
      // Handle form submission
      const form = updatedEvent.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const startDateTime = new Date(`${formData.get('startDate')}T${formData.get('startTime')}`);
      const endDateTime = new Date(`${formData.get('endDate')}T${formData.get('endTime')}`);
      
      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({
          title: "Error",
          description: "Invalid date format. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const eventToUpdate: CalendarEvent = {
        id: editingEvent.id!,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        start: startDateTime,
        end: endDateTime,
        created: new Date()
      };
      
      try {
        await dbManager.updateCalendarEvent(eventToUpdate);
        await loadEvents();
        setIsEditEventOpen(false);
        setOriginalEvent(null); // Clear the original event
        toast({
          title: "Event updated",
          description: "Your calendar event has been updated successfully.",
        });
      } catch (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: "Failed to update the event. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Handle drag update
      try {
        // Ensure the dates are valid
        const startDate = new Date(updatedEvent.start);
        const endDate = new Date(updatedEvent.end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('Invalid date in dragged event:', updatedEvent);
          toast({
            title: "Error",
            description: "Invalid date format. The event was not updated.",
            variant: "destructive",
          });
          return;
        }
        
        // Create a new event with validated dates
        const validatedEvent: CalendarEvent = {
          ...updatedEvent,
          start: startDate,
          end: endDate
        };
        
        // Update the database
        await dbManager.updateCalendarEvent(validatedEvent);
        
        // Update the local events state immediately for better UI responsiveness
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === validatedEvent.id ? validatedEvent : event
          )
        );
        
        // Update the editing event state if the edited event is the same as the dragged one
        if (editingEvent.id === validatedEvent.id) {
          setEditingEvent({
            id: validatedEvent.id,
            title: validatedEvent.title,
            description: validatedEvent.description || '',
            startDate: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().slice(0, 5),
            endDate: endDate.toISOString().split('T')[0],
            endTime: endDate.toTimeString().slice(0, 5),
          });
        }
        
        // Reload events to ensure consistency
        await loadEvents();
        
        toast({
          title: "Event updated",
          description: "The event has been successfully updated.",
        });
      } catch (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: "Failed to update the event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEdit = async () => {
    // Close the edit dialog
    setIsEditEventOpen(false);
    
    // If we have an original event, restore it
    if (originalEvent) {
      try {
        await dbManager.updateCalendarEvent(originalEvent);
        await loadEvents();
        setOriginalEvent(null); // Clear the original event
      } catch (error) {
        console.error('Error restoring original event:', error);
        toast({
          title: "Error",
          description: "Failed to restore the original event. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // If no original event, just reload events
      await loadEvents();
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await dbManager.deleteCalendarEvent(eventId);
        await loadEvents();
        toast({
          title: "Event deleted",
          description: "The calendar event has been deleted successfully.",
        });
      } catch (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Error",
          description: "Failed to delete the event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Month view functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Week view functions
  const getDaysInWeek = (date: Date) => {
    const days = [];
    const dayOfWeek = date.getDay();
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    
    return days;
  };

  // Year view functions
  const getMonthsInYear = (date: Date) => {
    const months = [];
    const year = date.getFullYear();
    
    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }
    
    return months;
  };

  // Event filtering functions
  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEventsForDay = (date: Date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEventsForMonth = (date: Date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventStart = new Date(event.start);

  return (
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      );
    });
  };

  // Render functions for different views
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {dayNames.map(day => (
            <div key={day} className="bg-gray-100 dark:bg-gray-800 p-2 text-center font-medium">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {days.map((date, index) => (
            <div 
              key={index} 
              className={`min-h-[120px] bg-white dark:bg-gray-800 p-2 ${date ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
              onClick={() => date && handleDateClick(date)}
            >
              {date && (
                <>
                  <div className="font-medium mb-1">{date.getDate()}</div>
                  <div className="space-y-1">
                    {getEventsForDate(date).map((event) => (
                      <DraggableEvent
                        key={event.id}
                        event={event}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                        onUpdate={handleUpdateEvent}
                        containerRef={calendarRef}
                        hourHeight={60}
                        dayWidth={100}
                        viewType="month"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getDaysInWeek(currentDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Group events by day for better rendering
    const eventsByDay = days.map(day => getEventsForDay(day));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700">
          <div className="bg-gray-100 dark:bg-gray-800 p-2 text-center font-medium">
            Time
          </div>
          {days.map(day => (
            <div key={day.toISOString()} className="bg-gray-100 dark:bg-gray-800 p-2 text-center">
              <div className="font-medium">{dayNames[day.getDay()]}</div>
              <div className="text-sm">{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700" ref={calendarRef}>
          <div className="bg-white dark:bg-gray-800">
            {hours.map(hour => (
              <div key={hour} className="h-12 border-b border-gray-200 dark:border-gray-700 p-1 text-xs text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          
          {days.map((day, dayIndex) => (
            <div key={day.toISOString()} className="bg-white dark:bg-gray-800 relative">
              {/* Hour grid */}
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-12 border-b border-gray-200 dark:border-gray-700 p-1 relative"
                  onClick={() => {
                    const newDate = new Date(day);
                    newDate.setHours(hour);
                    handleDateClick(newDate);
                  }}
                >
                  {/* 15-minute grid lines */}
                  <div className="absolute top-1/4 left-0 right-0 border-t border-gray-100 dark:border-gray-700"></div>
                  <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100 dark:border-gray-700"></div>
                  <div className="absolute top-3/4 left-0 right-0 border-t border-gray-100 dark:border-gray-700"></div>
                </div>
              ))}
              
              {/* Events positioned absolutely */}
              {eventsByDay[dayIndex].map((event) => (
                <DraggableEvent
                  key={event.id}
                  event={event}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  onUpdate={handleUpdateEvent}
                  containerRef={calendarRef}
                  hourHeight={48} // Match the height of the hour divs
                  dayWidth={dayWidth}
                  viewType="week"
                  dayIndex={dayIndex}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {dayNames[currentDate.getDay()]}, {monthNames[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 relative" ref={calendarRef}>
          {/* Hour grid */}
          {hours.map(hour => (
            <div 
              key={hour} 
              className="h-16 border-b border-gray-200 dark:border-gray-700 p-1 relative"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setHours(hour);
                handleDateClick(newDate);
              }}
            >
              <div className="absolute left-0 top-0 w-16 h-full flex items-center justify-center text-xs text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              
              {/* 15-minute grid lines */}
              <div className="absolute left-16 right-0 top-0 h-full">
                <div className="absolute top-1/4 left-0 right-0 border-t border-gray-100 dark:border-gray-700"></div>
                <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100 dark:border-gray-700"></div>
                <div className="absolute top-3/4 left-0 right-0 border-t border-gray-100 dark:border-gray-700"></div>
              </div>
            </div>
          ))}
          
          {/* Events positioned absolutely */}
          {getEventsForDay(currentDate).map(event => (
            <DraggableEvent
              key={event.id}
              event={event}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onUpdate={handleUpdateEvent}
              containerRef={calendarRef}
              hourHeight={64} // Match the height of the hour divs
              dayWidth={100}
              viewType="day"
            />
          ))}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = getMonthsInYear(currentDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-4">
          {months.map((month, index) => (
            <div 
              key={index} 
              className="border rounded-lg p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => {
                setCurrentDate(month);
                setViewType('month');
              }}
            >
              <h3 className="font-medium text-center mb-2">{monthNames[index]}</h3>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center text-gray-500">{day}</div>
                ))}
                
                {getDaysInMonth(month).map((date, i) => (
                  <div 
                    key={i} 
                    className={`text-center ${date ? 'hover:bg-blue-100 dark:hover:bg-blue-900 rounded' : ''}`}
                  >
                    {date ? date.getDate() : ''}
                  </div>
                ))}
              </div>
              
              <div className="mt-2 text-xs text-center text-blue-500">
                {getEventsForMonth(month).length} events
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    switch (viewType) {
      case 'day':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
      case 'month':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'year':
        return `${currentDate.getFullYear()}`;
      default:
        return '';
    }
  };

  const handleExportEvents = async () => {
    try {
      // Get all events
      const allEvents = await dbManager.getCalendarEvents();
      
      // Filter events based on selected date range
      let filteredEvents: CalendarEvent[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (exportDateRange === 'today') {
        // Filter events for today
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        filteredEvents = allEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= today && eventStart <= endOfDay;
        });
      } else if (exportDateRange === 'week') {
        // Filter events for the current week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        filteredEvents = allEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= startOfWeek && eventStart <= endOfWeek;
        });
      } else if (exportDateRange === 'month') {
        // Filter events for the current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        
        filteredEvents = allEvents.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart >= startOfMonth && eventStart <= endOfMonth;
        });
      }
      
      if (filteredEvents.length === 0) {
        toast({
          title: "No events to export",
          description: `No events found for the selected ${exportDateRange} period.`,
          variant: "destructive",
        });
        return;
      }
      
      // Format events for ICS export
      const eventsForExport = filteredEvents.map(event => ({
        title: event.title,
        description: event.description || '',
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      
      // Generate filename based on date range
      let filename = 'calendar-events.ics';
      if (exportDateRange === 'today') {
        filename = `calendar-events-${today.toISOString().split('T')[0]}.ics`;
      } else if (exportDateRange === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        filename = `calendar-events-${startOfWeek.toISOString().split('T')[0]}-to-${endOfWeek.toISOString().split('T')[0]}.ics`;
      } else if (exportDateRange === 'month') {
        filename = `calendar-events-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}.ics`;
      }
      
      // Download the ICS file
      downloadICSFile(eventsForExport, filename);
      
      // Close the dialog and show success message
      setIsExportDialogOpen(false);
      toast({
        title: "Export successful",
        description: `${filteredEvents.length} events exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting events:', error);
      toast({
        title: "Export failed",
        description: "Failed to export calendar events. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Calendar Header - Fixed */}
      <div className="flex flex-col space-y-4 p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowTaskPanel(!showTaskPanel)}>
              <ClipboardList className="h-4 w-4 mr-2" />
              {showTaskPanel ? 'Hide Tasks' : 'Show Tasks'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {getViewTitle()}
          </h2>
          <Button onClick={() => setIsAddEventOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
        
        <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Body - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col md:flex-row gap-6 h-full">
          {showTaskPanel && (
            <div className="md:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-8 overflow-auto">
              <TaskPool />
              <AITaskScheduler />
            </div>
          )}
          
          <div className={`${showTaskPanel ? 'md:w-2/3' : 'w-full'} bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-auto`}>
            {viewType === 'day' && renderDayView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'month' && renderMonthView()}
            {viewType === 'year' && renderYearView()}
          </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Enter the details for your new calendar event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    required
                  />
          </div>
                    </div>
                  </div>
            <DialogFooter>
              <Button type="submit">Add Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog 
        open={isEditEventOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // When dialog is closed (either by clicking cancel or X), restore original event
            if (originalEvent) {
              dbManager.updateCalendarEvent(originalEvent)
                .then(() => {
                  loadEvents();
                  setOriginalEvent(null); // Clear the original event
                })
                .catch(error => {
                  console.error('Error restoring original event:', error);
                  toast({
                    title: "Error",
                    description: "Failed to restore the original event. Please try again.",
                    variant: "destructive",
                  });
                });
            } else {
              // If no original event, just reload events
              loadEvents();
            }
          }
          setIsEditEventOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the details for your calendar event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEvent}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Event title"
                  required
                />
                    </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="Event description"
                />
                  </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    name="startDate"
                    type="date"
                    value={editingEvent.startDate}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    name="startTime"
                    type="time"
                    value={editingEvent.startTime}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    name="endDate"
                    type="date"
                    value={editingEvent.endDate}
                    onChange={(e) => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    name="endTime"
                    type="time"
                    value={editingEvent.endTime}
                    onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
    </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit">Update Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Calendar Events</DialogTitle>
            <DialogDescription>
              Export your calendar events to an ICS file that can be imported into Google Calendar, Apple Calendar, Outlook, and other calendar applications.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="export-range">Export Range</Label>
              <div className="flex space-x-2">
                <Button 
                  variant={exportDateRange === 'today' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setExportDateRange('today')}
                >
                  Today
                </Button>
                <Button 
                  variant={exportDateRange === 'week' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setExportDateRange('week')}
                >
                  This Week
                </Button>
                <Button 
                  variant={exportDateRange === 'month' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setExportDateRange('month')}
                >
                  This Month
                </Button>
        </div>
        </div>
      </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportEvents}>
              <Download className="h-4 w-4 mr-2" />
              Export to ICS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

