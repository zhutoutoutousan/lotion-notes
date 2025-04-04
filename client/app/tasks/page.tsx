"use client"

import TaskPool from '@/components/task-pool';
import AITaskScheduler from '@/components/ai-task-scheduler';

export default function TasksPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Task Management</h1>
      
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <TaskPool />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <AITaskScheduler />
        </div>
      </div>
    </div>
  );
} 