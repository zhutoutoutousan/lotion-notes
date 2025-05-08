'use client'
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

export default function DeadlineManagementPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) return;

    const newDeadline: Deadline = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      dueDate,
      priority,
      status
    };

    setDeadlines([...deadlines, newDeadline]);
    setTitle('');
    setDescription('');
    setDueDate(undefined);
    setPriority('medium');
    setStatus('pending');
  };

  const updateStatus = (id: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    setDeadlines(deadlines.map(deadline => 
      deadline.id === id ? { ...deadline, status: newStatus } : deadline
    ));
  };

  const deleteDeadline = (id: string) => {
    setDeadlines(deadlines.filter(deadline => deadline.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Deadline Management</h1>
      <p className="text-muted-foreground mb-8">
        Track and manage your deadlines effectively. Add new deadlines, update their status, and stay on top of your commitments.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Deadline</CardTitle>
            <CardDescription>
              Create a new deadline with details and priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter deadline title"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter deadline description"
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <Button type="submit" className="w-full">
                Add Deadline
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Deadlines</CardTitle>
            <CardDescription>
              View and manage your deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{deadline.title}</h3>
                    <span className={cn("px-2 py-1 rounded-full text-xs", getPriorityColor(deadline.priority))}>
                      {deadline.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{deadline.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Due: {format(deadline.dueDate, "PPP")}
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={deadline.status}
                        onChange={(e) => updateStatus(deadline.id, e.target.value as 'pending' | 'in-progress' | 'completed')}
                        className={cn("text-xs px-2 py-1 rounded-full", getStatusColor(deadline.status))}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDeadline(deadline.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {deadlines.length === 0 && (
                <p className="text-center text-muted-foreground">
                  No deadlines added yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 