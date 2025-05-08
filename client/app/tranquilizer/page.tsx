'use client'
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TranquilizerPage() {
  const [tasks, setTasks] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/tranquilizer/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });
      
      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Task Tranquilizer</h1>
      <p className="text-muted-foreground mb-8">
        Feeling overwhelmed? Write down your tasks and let AI help you create a structured plan to tackle them effectively.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>
              List all your tasks, deadlines, and any important details. Be as specific as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Example:&#10;- Need to finish project proposal by Friday&#10;- Call client about new requirements&#10;- Prepare presentation for team meeting&#10;- Review and respond to emails&#10;- Schedule dentist appointment"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Plan...
            </>
          ) : (
            'Generate Attack Plan'
          )}
        </Button>
      </form>

      {plan && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Attack Plan</CardTitle>
            <CardDescription>
              Here's your AI-generated plan to tackle your tasks effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="space-y-6">
              <TabsList>
                <TabsTrigger value="daily">Today's Schedule</TabsTrigger>
                <TabsTrigger value="dates">Date Schedule</TabsTrigger>
                <TabsTrigger value="priorities">Priorities</TabsTrigger>
                <TabsTrigger value="tips">Tips</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-4">
                <h3 className="text-lg font-semibold">Today's Schedule</h3>
                <div className="space-y-2">
                  {plan.daily_timeline?.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                      <div className="font-medium min-w-[100px]">{item.time}</div>
                      <div>{item.task}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="dates" className="space-y-4">
                <h3 className="text-lg font-semibold">Date Schedule</h3>
                <div className="space-y-6">
                  {plan.date_based_timeline?.map((date: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-medium text-lg">{date.date}</h4>
                      <div className="space-y-2">
                        {date.tasks.map((task: any, taskIndex: number) => (
                          <div key={taskIndex} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                            <div className="font-medium min-w-[100px]">{task.time}</div>
                            <div>{task.task}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="priorities" className="space-y-4">
                <h3 className="text-lg font-semibold">Priority Breakdown</h3>
                <div className="space-y-2">
                  {plan.priorities?.map((priority: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium mb-1">{priority.title}</div>
                      <div className="text-sm text-muted-foreground">{priority.description}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tips" className="space-y-4">
                <h3 className="text-lg font-semibold">Tips for Success</h3>
                <ul className="list-disc list-inside space-y-2">
                  {plan.tips?.map((tip: string, index: number) => (
                    <li key={index} className="text-muted-foreground">{tip}</li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 