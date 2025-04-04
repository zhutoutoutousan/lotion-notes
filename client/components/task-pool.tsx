"use client"

import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Save, Loader2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { dbManager } from '@/lib/indexedDB';

export interface Task {
  id?: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  created: Date;
}

export default function TaskPool() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    estimatedMinutes: 30,
    created: new Date()
  });
  const [editingTask, setEditingTask] = useState<Task>({
    id: undefined,
    title: '',
    description: '',
    estimatedMinutes: 30,
    created: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);

  useEffect(() => {
    loadTasks();
    
    // Listen for data update events
    const handleDataUpdated = () => {
      loadTasks();
    };
    
    window.addEventListener('dataUpdated', handleDataUpdated);
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdated);
    };
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = await dbManager.getTasks();
      console.log('Loaded tasks:', loadedTasks);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingTask(true);
    
    try {
      // Validate task data
      if (!newTask.title.trim()) {
        throw new Error('Task title is required');
      }
      
      if (newTask.estimatedMinutes <= 0) {
        throw new Error('Estimated time must be greater than 0');
      }
      
      // Create a new task object with the current date
      const taskToAdd: Omit<Task, 'id'> = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        estimatedMinutes: newTask.estimatedMinutes,
        created: new Date()
      };
      
      console.log('Adding task:', taskToAdd);
      await dbManager.addTask(taskToAdd);
      
      // Reset form and close dialog
      setNewTask({
        title: '',
        description: '',
        estimatedMinutes: 30,
        created: new Date()
      });
      setIsAddTaskOpen(false);
      
      // Show success message
      toast({
        title: "Task added",
        description: "Your task has been added to the pool.",
      });
      
      // Reload tasks
      await loadTasks();
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('dataUpdated'));
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      estimatedMinutes: task.estimatedMinutes,
      created: task.created
    });
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTask(true);
    
    try {
      // Validate task data
      if (!editingTask.title.trim()) {
        throw new Error('Task title is required');
      }
      
      if (editingTask.estimatedMinutes <= 0) {
        throw new Error('Estimated time must be greater than 0');
      }
      
      if (!editingTask.id) {
        throw new Error('Task ID is required for update');
      }
      
      // Update the task
      const taskToUpdate: Task = {
        id: editingTask.id,
        title: editingTask.title.trim(),
        description: editingTask.description.trim(),
        estimatedMinutes: editingTask.estimatedMinutes,
        created: editingTask.created
      };
      
      console.log('Updating task:', taskToUpdate);
      await dbManager.updateTask(taskToUpdate);
      
      // Close dialog
      setIsEditTaskOpen(false);
      
      // Show success message
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
      
      // Reload tasks
      await loadTasks();
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('dataUpdated'));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setIsLoading(true);
        await dbManager.deleteTask(taskId);
        await loadTasks();
        
        toast({
          title: "Task deleted",
          description: "The task has been deleted from the pool.",
        });
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('dataUpdated'));
      } catch (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Error",
          description: "Failed to delete the task. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Task Pool</h2>
        <Button onClick={() => setIsAddTaskOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No tasks in the pool. Add some tasks to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map(task => (
            <Card key={task.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {task.estimatedMinutes} min
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="pt-0 flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => handleEditTask(task)}
                  disabled={isLoading || isEditingTask}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => task.id && handleDeleteTask(task.id)}
                  disabled={isLoading || isEditingTask}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddTaskOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Add a task to your pool with an estimated completion time.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  required
                  disabled={isAddingTask}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description"
                  disabled={isAddingTask}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
                <Input
                  id="estimatedMinutes"
                  type="number"
                  min="1"
                  value={newTask.estimatedMinutes}
                  onChange={(e) => setNewTask({ ...newTask, estimatedMinutes: parseInt(e.target.value) || 0 })}
                  required
                  disabled={isAddingTask}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isAddingTask}>
                {isAddingTask ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditTaskOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update your task details and estimated completion time.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTask}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Task title"
                  required
                  disabled={isEditingTask}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Task description"
                  disabled={isEditingTask}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-estimatedMinutes">Estimated Time (minutes)</Label>
                <Input
                  id="edit-estimatedMinutes"
                  type="number"
                  min="1"
                  value={editingTask.estimatedMinutes}
                  onChange={(e) => setEditingTask({ ...editingTask, estimatedMinutes: parseInt(e.target.value) || 0 })}
                  required
                  disabled={isEditingTask}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isEditingTask}>
                {isEditingTask ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 