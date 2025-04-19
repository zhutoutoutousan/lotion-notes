"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  getDailyTraining,
  saveDailyTraining,
  type TrainingItem,
  type DailyTraining
} from "@/lib/services/indexedDBService";

interface LanguageTrainingTrackerProps {
  languageId: string;
  languageName: string;
}

export function LanguageTrainingTracker({ languageId, languageName }: LanguageTrainingTrackerProps) {
  const [today, setToday] = useState<string>("");
  const [trainingData, setTrainingData] = useState<DailyTraining | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set today's date in YYYY-MM-DD format
    const todayDate = new Date().toISOString().split('T')[0];
    setToday(todayDate);
    
    // Load today's training data
    loadTrainingData(todayDate);
  }, [languageId]);

  const loadTrainingData = async (date: string) => {
    try {
      setIsLoading(true);
      const data = await getDailyTraining(languageId, date);
      setTrainingData(data);
    } catch (error) {
      console.error("Error loading training data:", error);
      toast.error("Failed to load training data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemStatusChange = async (itemName: string, newStatus: TrainingItem["status"]) => {
    if (!trainingData) return;

    try {
      // Update the item's status
      const updatedItems = trainingData.items.map(item => 
        item.item_name === itemName 
          ? { ...item, status: newStatus }
          : item
      );

      // Calculate total progress
      const totalItems = updatedItems.length;
      const completedItems = updatedItems.filter(item => item.status === "Completed").length;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      // Update the training data
      const updatedTraining: DailyTraining = {
        ...trainingData,
        items: updatedItems
      };

      // Save to IndexedDB
      await saveDailyTraining(updatedTraining);
      setTrainingData(updatedTraining);
      
      // Show success message
      toast.success(
        newStatus === "Completed" 
          ? "Activity marked as completed!" 
          : "Activity status updated!"
      );
    } catch (error) {
      console.error("Error updating training item:", error);
      toast.error("Failed to update activity status");
    }
  };

  if (isLoading) {
    return <div>Loading training data...</div>;
  }

  if (!trainingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Tracker</CardTitle>
          <CardDescription>No training plan for today</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Create a training plan in the Training Planner to start tracking your progress.</p>
        </CardContent>
      </Card>
    );
  }

  const totalItems = trainingData.items.length;
  const completedItems = trainingData.items.filter(item => item.status === "Completed").length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Tracker</CardTitle>
        <CardDescription>
          Track your progress for today's {languageName} training
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-4">
          {trainingData.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Checkbox
                id={`item-${index}`}
                checked={item.status === "Completed"}
                onCheckedChange={(checked) => {
                  handleItemStatusChange(
                    item.item_name,
                    checked ? "Completed" : "Not Started"
                  );
                }}
              />
              <div className="flex-1">
                <label
                  htmlFor={`item-${index}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.item_name}
                </label>
                <p className="text-sm text-muted-foreground">
                  {item.minutes} minutes ({item.percentage}%)
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 