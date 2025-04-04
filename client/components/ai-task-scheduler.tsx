"use client"

import { useState, useEffect } from 'react';
import { Calendar, Clock, Loader2, Check, X, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { dbManager, Task, CalendarEvent } from '@/lib/indexedDB';
import { formatDate } from '@/lib/dateUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChatCompletion } from '@/lib/deepseek';

interface SuggestedEvent {
  title: string;
  description: string;
  start: Date;
  end: Date;
  taskId?: number;
  originalDuration?: number;
  adjustedDuration?: number;
}

export default function AITaskScheduler() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [jsonSchedule, setJsonSchedule] = useState<string>('');
  const [existingEvents, setExistingEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadTasks();
    loadExistingEvents();
    
    // Listen for data update events
    const handleDataUpdated = () => {
      loadTasks();
      loadExistingEvents();
    };
    
    window.addEventListener('dataUpdated', handleDataUpdated);
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdated);
    };
  }, [selectedDate]);

  const loadTasks = async () => {
    try {
      const loadedTasks = await dbManager.getTasks();
      console.log('Loaded tasks for scheduler:', loadedTasks);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive",
      });
    }
  };

  const loadExistingEvents = async () => {
    try {
      const allEvents = await dbManager.getCalendarEvents();
      
      // Filter events for the selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const eventsForSelectedDate = allEvents.filter(event => {
        const eventStart = new Date(event.start);
        return eventStart >= startOfDay && eventStart <= endOfDay;
      });
      
      console.log('Existing events for selected date:', eventsForSelectedDate);
      setExistingEvents(eventsForSelectedDate);
    } catch (error) {
      console.error('Error loading existing events:', error);
      toast({
        title: "Error",
        description: "Failed to load existing calendar events.",
        variant: "destructive",
      });
    }
  };

  const generateSuggestions = async () => {
    if (tasks.length === 0) {
      toast({
        title: "No tasks available",
        description: "Add some tasks to your pool first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Prepare tasks data for AI
      const tasksData = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        estimatedMinutes: task.estimatedMinutes
      }));
      
      // Prepare existing events data for AI
      const existingEventsData = existingEvents.map(event => ({
        title: event.title,
        description: event.description || '',
        start: new Date(event.start).toISOString(),
        end: new Date(event.end).toISOString()
      }));
      
      // Format the date for the prompt
      const formattedDate = formatDate(selectedDate);
      
      // Create the prompt for the AI
      const prompt = `I need help scheduling the following tasks for ${formattedDate}. 
      Please create a schedule that makes sense based on task duration and priority.
      
      IMPORTANT RULES:
      1. Only schedule tasks AFTER the current time (${currentHour}:${currentMinute.toString().padStart(2, '0')}).
      2. Consider a typical workday from 9 AM to 5 PM.
      3. If it's impossible to fit all tasks in the remaining time of the day, intelligently shrink some tasks' durations.
      4. When shrinking tasks, prioritize keeping the most important tasks at their full duration.
      5. For tasks that need to be shrunk, reduce their duration proportionally but maintain at least 15 minutes per task.
      
      IMPORTANT: There are already some events scheduled for this day. Please avoid scheduling new tasks during these time slots:
      ${JSON.stringify(existingEventsData, null, 2)}
      
      Tasks to schedule:
      ${JSON.stringify(tasksData, null, 2)}
      
      Please respond with a JSON array of scheduled events in the following format:
      [
        {
          "title": "Task title",
          "description": "Task description",
          "start": "YYYY-MM-DDTHH:MM:SS",
          "end": "YYYY-MM-DDTHH:MM:SS",
          "taskId": taskId,
          "originalDuration": originalDurationInMinutes,
          "adjustedDuration": adjustedDurationInMinutes
        }
      ]
      
      Make sure the start and end times are within the remaining time of the day.
      DO NOT schedule any tasks during the time slots of the existing events listed above.
      If you need to shrink tasks, add a note in the description explaining the adjustment.`;
      
      // Call the DeepSeek AI service
      const aiResponse = await createChatCompletion([
        { role: 'system', content: 'You are a helpful AI assistant that creates task schedules while avoiding conflicts with existing events. You intelligently adjust task durations when necessary to fit all tasks in the available time.' },
        { role: 'user', content: prompt }
      ]);
      
      console.log('AI Response:', aiResponse);
      
      // Parse the JSON response
      let parsedEvents: SuggestedEvent[] = [];
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                          aiResponse.match(/```\n([\s\S]*?)\n```/) || 
                          aiResponse.match(/\[([\s\S]*?)\]/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsedData = JSON.parse(jsonStr);
          
          // Convert string dates to Date objects
          parsedEvents = parsedData.map((event: any) => ({
            title: event.title,
            description: event.description,
            start: new Date(event.start),
            end: new Date(event.end),
            taskId: event.taskId,
            originalDuration: event.originalDuration,
            adjustedDuration: event.adjustedDuration
          }));
        } else {
          throw new Error('Could not extract JSON from AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse AI response. Please try again.');
      }
      
      setSuggestedEvents(parsedEvents);
      
      // Create JSON representation of the schedule
      const scheduleJson = JSON.stringify({
        date: selectedDate.toISOString(),
        events: parsedEvents.map(event => ({
          title: event.title,
          description: event.description,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          taskId: event.taskId,
          originalDuration: event.originalDuration,
          adjustedDuration: event.adjustedDuration
        }))
      }, null, 2);
      
      setJsonSchedule(scheduleJson);
      setIsSchedulerOpen(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate task suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestions = async () => {
    try {
      // Add all suggested events to the calendar
      for (const event of suggestedEvents) {
        await dbManager.addCalendarEvent({
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          created: new Date()
        });
      }
      
      // Close the dialog and show success message
      setIsSchedulerOpen(false);
      toast({
        title: "Success",
        description: `${suggestedEvents.length} events added to your calendar.`,
      });
      
      // Dispatch event to notify calendar to refresh
      window.dispatchEvent(new Event('dataUpdated'));
    } catch (error) {
      console.error('Error adding events:', error);
      toast({
        title: "Error",
        description: "Failed to add events to calendar.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">AI Task Scheduler</h2>
        <Button onClick={generateSuggestions} disabled={isLoading || tasks.length === 0}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Generate Schedule
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">
            {tasks.length === 0 
              ? "Add tasks to your pool first, then use AI to schedule them." 
              : `You have ${tasks.length} tasks in your pool. Click "Generate Schedule" to get AI suggestions.`}
          </p>
        </CardContent>
      </Card>

      {/* Suggestions Dialog */}
      <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Task Schedule Suggestions</DialogTitle>
            <DialogDescription>
              Here's how your tasks could be scheduled for {formatDate(selectedDate)}.
              Review and accept to add these events to your calendar.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="visual">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Visual Schedule</TabsTrigger>
              <TabsTrigger value="json">JSON Schedule</TabsTrigger>
            </TabsList>
            <TabsContent value="visual" className="max-h-[60vh] overflow-y-auto py-4">
              {suggestedEvents.length === 0 ? (
                <p className="text-center text-gray-500">No suggestions available.</p>
              ) : (
                <div className="space-y-4">
                  {suggestedEvents.map((event, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <CardDescription>
                              {event.description}
                              {event.originalDuration && event.adjustedDuration && event.originalDuration !== event.adjustedDuration && (
                                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                  Duration adjusted from {event.originalDuration} to {event.adjustedDuration} minutes
                                </div>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(event.start)} - {formatDate(event.end)}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="json" className="max-h-[60vh] overflow-y-auto py-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Schedule JSON</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(jsonSchedule);
                        toast({
                          title: "Copied",
                          description: "JSON schedule copied to clipboard.",
                        });
                      }}
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
                    {jsonSchedule}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSchedulerOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleAcceptSuggestions} disabled={suggestedEvents.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              Accept All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 