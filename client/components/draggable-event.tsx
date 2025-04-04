"use client"

import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/lib/indexedDB';

interface DraggableEventProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: number) => void;
  onUpdate: (event: CalendarEvent) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  hourHeight: number;
  dayWidth: number;
  viewType: 'day' | 'week' | 'month' | 'year';
  dayIndex?: number;
}

export default function DraggableEvent({
  event,
  onEdit,
  onDelete,
  onUpdate,
  containerRef,
  hourHeight,
  dayWidth,
  viewType = 'month',
  dayIndex = 0
}: DraggableEventProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [startTop, setStartTop] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startLeft, setStartLeft] = useState(0);
  const [originalEvent, setOriginalEvent] = useState<CalendarEvent | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  // Store original event when component mounts or event changes
  useEffect(() => {
    setOriginalEvent(event);
  }, [event.id]);
  
  // Calculate initial position and dimensions based on view type
  let topPosition = 0;
  let height = 0;
  let leftPosition = 0;
  
  if (viewType === 'month') {
    // For month view, events are displayed as small blocks
    height = 24; // Fixed height for month view
    topPosition = 0; // No vertical positioning in month view
    leftPosition = 0; // No horizontal positioning in month view
  } else {
    // For day and week views, calculate based on time
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
    const duration = endHour - startHour;
    
    // Position from top (each hour is hourHeight pixels high)
    topPosition = startHour * hourHeight;
    height = duration * hourHeight;
    
    // For week view, position horizontally based on day index
    if (viewType === 'week') {
      leftPosition = dayIndex * dayWidth;
    }
  }

  // Function to snap to 15-minute increments
  const snapTo15Minutes = (minutes: number): number => {
    return Math.round(minutes / 15) * 15;
  };

  // Function to convert pixels to minutes
  const pixelsToMinutes = (pixels: number): number => {
    const minutesPerPixel = 60 / hourHeight;
    return pixels * minutesPerPixel;
  };

  // Function to convert minutes to pixels
  const minutesToPixels = (minutes: number): number => {
    const pixelsPerMinute = hourHeight / 60;
    return minutes * pixelsPerMinute;
  };

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    // Store the original event when starting to drag
    setOriginalEvent(event);
  };

  // Handle drag stop
  const handleDragStop = (e: any, data: { x: number; y: number }) => {
    setIsDragging(false);
    
    // Different behavior based on view type
    if (viewType === 'month') {
      // In month view, dragging changes the day
      const newDate = new Date(startDate);
      const dayDiff = Math.round(data.x / dayWidth);
      newDate.setDate(newDate.getDate() + dayDiff);
      
      // Calculate duration in minutes
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      
      // Create new end date with same duration
      const newEndDate = new Date(newDate);
      newEndDate.setMinutes(newDate.getMinutes() + durationMinutes);
      
      // Ensure we're not creating invalid dates
      if (isNaN(newDate.getTime()) || isNaN(newEndDate.getTime())) {
        console.error('Invalid date created during drag operation');
        return;
      }
      
      // Update the event
      onUpdate({
        ...event,
        start: newDate,
        end: newEndDate
      });
    } else if (viewType === 'day' || viewType === 'week') {
      // For day and week views, calculate new time based on drag position
      // Snap to 15-minute increments
      const totalMinutes = pixelsToMinutes(data.y);
      const snappedMinutes = snapTo15Minutes(totalMinutes);
      
      const newStartHour = Math.floor(snappedMinutes / 60);
      const newStartMinute = snappedMinutes % 60;
      
      const newStartDate = new Date(startDate);
      newStartDate.setHours(newStartHour, newStartMinute);
      
      // For week view, calculate new day based on horizontal position
      if (viewType === 'week') {
        const newDayIndex = Math.floor(data.x / dayWidth);
        const dayDiff = newDayIndex - dayIndex;
        newStartDate.setDate(newStartDate.getDate() + dayDiff);
      }
      
      // Calculate duration in minutes
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      
      // Create new end date with same duration
      const newEndDate = new Date(newStartDate);
      newEndDate.setMinutes(newStartDate.getMinutes() + durationMinutes);
      
      // Ensure we're not creating invalid dates
      if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
        console.error('Invalid date created during drag operation');
        return;
      }
      
      // Create a new event object with the updated times
      const updatedEvent: CalendarEvent = {
        ...event,
        start: newStartDate,
        end: newEndDate
      };
      
      // Update the event
      onUpdate(updatedEvent);
    }
  };

  // Handle drag during movement (for 15-minute snapping)
  const handleDrag = (e: any, data: { x: number; y: number }) => {
    if (viewType === 'day' || viewType === 'week') {
      // Calculate the snapped position
      const totalMinutes = pixelsToMinutes(data.y);
      const snappedMinutes = snapTo15Minutes(totalMinutes);
      const snappedPixels = minutesToPixels(snappedMinutes);
      
      // Update the position to snap to 15-minute increments
      if (nodeRef.current) {
        nodeRef.current.style.transform = `translate(${data.x}px, ${snappedPixels}px)`;
      }
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
    setStartTop(topPosition);
    
    if (viewType === 'week') {
      setStartX(e.clientX);
      setStartLeft(leftPosition);
    }
    
    // Store the original event when starting to resize
    setOriginalEvent(event);
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    // Resize only works in day and week views
    if (viewType === 'month' || viewType === 'year') return;
    
    // Calculate new height based on mouse position
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(30, startHeight + deltaY); // Minimum height of 30px
    
    // Calculate new end time with 15-minute increments
    const totalMinutes = pixelsToMinutes(newHeight);
    const snappedMinutes = snapTo15Minutes(totalMinutes);
    
    const newEndHour = Math.floor(snappedMinutes / 60);
    const newEndMinute = snappedMinutes % 60;
    
    const newEndDate = new Date(endDate);
    newEndDate.setHours(newEndHour, newEndMinute);
    
    // Ensure we're not creating invalid dates
    if (isNaN(newEndDate.getTime())) {
      console.error('Invalid date created during resize operation');
      return;
    }
    
    // Create a new event object with the updated end time
    const updatedEvent: CalendarEvent = {
      ...event,
      end: newEndDate
    };
    
    // Update the event
    onUpdate(updatedEvent);
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Add and remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Handle edit cancellation
  const handleEditCancel = () => {
    if (originalEvent) {
      // Restore the original event
      onUpdate(originalEvent);
    }
  };

  // Different rendering based on view type
  if (viewType === 'month') {
    return (
      <Draggable
        nodeRef={nodeRef}
        position={{ x: 0, y: 0 }}
        onStart={handleDragStart}
        onStop={handleDragStop}
        bounds={containerRef.current ? {
          left: 0,
          top: 0,
          right: containerRef.current.clientWidth - 20,
          bottom: 0
        } : undefined}
        disabled={isResizing}
      >
        <div
          ref={nodeRef}
          className={`text-xs p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 truncate cursor-move hover:bg-blue-200 dark:hover:bg-blue-800 ${isDragging ? 'opacity-70' : ''}`}
          style={{ 
            height: `${height}px`,
            zIndex: isDragging ? 20 : 10
          }}
          title={`${event.title} (${startDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})} - ${endDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})})`}
          onClick={(e) => {
            if (!isDragging && !isResizing) {
              e.stopPropagation();
              onEdit(event);
            }
          }}
        >
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <GripVertical className="h-3 w-3 mr-1 text-blue-500" />
              <span className="truncate">{event.title}</span>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  event.id && onDelete(event.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Draggable>
    );
  } else {
    // Day and week views
    return (
      <Draggable
        nodeRef={nodeRef}
        position={{ x: viewType === 'week' ? leftPosition : 0, y: topPosition }}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        bounds={containerRef.current ? {
          left: 0,
          top: 0,
          right: containerRef.current.clientWidth - (viewType === 'week' ? dayWidth : containerRef.current.clientWidth),
          bottom: containerRef.current.clientHeight - height
        } : undefined}
        disabled={isResizing}
      >
        <div
          ref={nodeRef}
          className={`absolute text-xs p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 truncate cursor-move hover:bg-blue-200 dark:hover:bg-blue-800 ${isDragging ? 'opacity-70' : ''}`}
          style={{ 
            width: viewType === 'week' ? `${dayWidth - 10}px` : 'calc(100% - 80px)',
            height: `${height}px`,
            zIndex: isDragging || isResizing ? 20 : 10,
            left: viewType === 'day' ? '80px' : '0'
          }}
          title={`${event.title} (${startDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})} - ${endDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})})`}
          onClick={(e) => {
            if (!isDragging && !isResizing) {
              e.stopPropagation();
              onEdit(event);
            }
          }}
        >
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <GripVertical className="h-3 w-3 mr-1 text-blue-500" />
              <span className="truncate">{event.title}</span>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  event.id && onDelete(event.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Resize handle - only for day and week views */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-blue-300 dark:bg-blue-700 opacity-0 hover:opacity-100"
            onMouseDown={handleResizeStart}
          />
        </div>
      </Draggable>
    );
  }
} 