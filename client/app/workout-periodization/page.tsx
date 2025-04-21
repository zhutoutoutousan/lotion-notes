'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateWorkoutPlan, generatePeriodizationPlan } from '@/lib/services/workout-ai';
import { WorkoutTimeline } from '@/components/workout-timeline';
import { saveWorkoutPlan, savePeriodizationPlan, getWorkoutPlans, getPeriodizationPlans } from '@/lib/services/workout-db';
import { WorkoutPlan, PeriodizationPlan } from '@/types/workout';
import { v4 as uuidv4 } from 'uuid';

export default function WorkoutPeriodization() {
  const [prs, setPrs] = useState({
    squat: 0,
    bench: 0,
    deadlift: 0,
    overhead: 0
  });

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [periodizationPlan, setPeriodizationPlan] = useState<PeriodizationPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<{
    workouts: WorkoutPlan[];
    periodizations: PeriodizationPlan[];
  }>({ workouts: [], periodizations: [] });

  useEffect(() => {
    loadSavedPlans();
  }, []);

  const loadSavedPlans = async () => {
    try {
      const [workouts, periodizations] = await Promise.all([
        getWorkoutPlans(),
        getPeriodizationPlans()
      ]);
      setSavedPlans({ workouts, periodizations });
    } catch (error) {
      console.error('Error loading saved plans:', error);
    }
  };

  const handlePrUpdate = async (lift: string, weight: number) => {
    setPrs(prev => ({ ...prev, [lift]: weight }));
  };

  const generatePlans = async () => {
    setIsLoading(true);
    try {
      // Generate workout plan based on PRs
      const workoutPrompt = `Generate a 4-week workout plan for an intermediate lifter with the following PRs:
      Squat: ${prs.squat}kg
      Bench: ${prs.bench}kg
      Deadlift: ${prs.deadlift}kg
      Overhead Press: ${prs.overhead}kg
      
      Focus on strength and hypertrophy. Include compound lifts and accessories.
      
      Return the response in the following JSON format:
      {
        "id": "generated-uuid",
        "createdAt": "2024-03-20T00:00:00.000Z",
        "prs": {
          "squat": "170kg",
          "bench": "120kg",
          "deadlift": "180kg",
          "overhead": "70kg"
        },
        "weeks": [
          {
            "weekNumber": 1,
            "days": [
              {
                "name": "Monday",
                "focus": "Squat and Lower Body",
                "exercises": [
                  {
                    "name": "Back Squat",
                    "sets": 4,
                    "reps": 5,
                    "intensity": "75% of 1RM",
                    "notes": "Focus on depth and control"
                  }
                ]
              }
            ]
          }
        ]
      }`;

      const workoutData = await generateWorkoutPlan(workoutPrompt);
      const newWorkoutPlan: WorkoutPlan = {
        ...workoutData,
        id: uuidv4(),
        createdAt: new Date(),
        prs: workoutData.prs || prs
      };
      setWorkoutPlan(newWorkoutPlan);
      await saveWorkoutPlan(newWorkoutPlan);

      // Generate periodization plan
      const periodizationPrompt = `Create a 12-week periodization plan for an intermediate lifter with the following PRs:
      Squat: ${prs.squat}kg
      Bench: ${prs.bench}kg
      Deadlift: ${prs.deadlift}kg
      Overhead Press: ${prs.overhead}kg
      
      Include:
      1. Volume and intensity progression
      2. Deload weeks
      3. Exercise variations
      4. Accessory work
      5. Recovery recommendations
      
      Return the response in the following JSON format:
      {
        "id": "generated-uuid",
        "createdAt": "2024-03-20T00:00:00.000Z",
        "prs": {
          "squat": "170kg",
          "bench": "120kg",
          "deadlift": "180kg",
          "overhead": "70kg"
        },
        "phases": [
          {
            "phaseNumber": 1,
            "name": "Hypertrophy",
            "duration": "4 weeks",
            "focus": "Muscle Growth",
            "volume": "High",
            "intensity": "60-75%",
            "deload": false,
            "workouts": [
              {
                "day": "Monday",
                "focus": "Squat and Lower Body",
                "exercises": [
                  {
                    "name": "Back Squat",
                    "sets": 4,
                    "reps": 8,
                    "intensity": "70% of 1RM",
                    "notes": "Focus on form and control"
                  }
                ]
              }
            ]
          }
        ]
      }`;

      const periodizationData = await generatePeriodizationPlan(periodizationPrompt);
      const newPeriodizationPlan: PeriodizationPlan = {
        ...periodizationData,
        id: uuidv4(),
        createdAt: new Date(),
        prs: periodizationData.prs || prs
      };
      setPeriodizationPlan(newPeriodizationPlan);
      await savePeriodizationPlan(newPeriodizationPlan);

      await loadSavedPlans();
    } catch (error) {
      console.error('Error generating plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Workout Periodization</h1>
      
      <Tabs defaultValue="pr" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pr">PR Tracking</TabsTrigger>
          <TabsTrigger value="workout">Workout Plan</TabsTrigger>
          <TabsTrigger value="periodization">Periodization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pr">
          <Card>
            <CardHeader>
              <CardTitle>Personal Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(prs).map(([lift, weight]) => (
                  <div key={lift} className="flex items-center justify-between">
                    <span className="capitalize">{lift}</span>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => handlePrUpdate(lift, Number(e.target.value))}
                      className="w-24 px-2 py-1 border rounded"
                      placeholder="Weight (kg)"
                    />
                  </div>
                ))}
                <Button 
                  onClick={generatePlans} 
                  disabled={isLoading}
                  className="w-full mt-4"
                >
                  {isLoading ? 'Generating Plans...' : 'Generate Workout & Periodization Plans'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workout">
          <Card>
            <CardHeader>
              <CardTitle>Generated Workout Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Generating workout plan...</div>
              ) : workoutPlan ? (
                <>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Personal Records</h3>
                        <div className="space-y-2">
                          {Object.entries(workoutPlan.prs).map(([lift, weight]) => (
                            <div key={lift} className="flex justify-between">
                              <span className="capitalize">{lift}</span>
                              <span>{weight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Plan Details</h3>
                        <div className="space-y-2">
                          <div>Duration: {workoutPlan.duration}</div>
                          <div>Goal: {workoutPlan.goal}</div>
                          <div>Experience Level: {workoutPlan.experienceLevel}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {workoutPlan.weeks?.map((week) => (
                        <div key={week.weekNumber} className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Week {week.weekNumber}</h3>
                          <div className="space-y-4">
                            {week.days?.map((day, index) => (
                              <div key={index} className="border-l-2 border-primary pl-4">
                                <h4 className="font-medium">{day.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{day.focus}</p>
                                <div className="space-y-2">
                                  {day.exercises?.map((exercise, exIndex) => (
                                    <div key={exIndex} className="bg-muted p-2 rounded">
                                      <div className="font-medium">{exercise.name}</div>
                                      <div className="text-sm">
                                        {exercise.sets} sets × {exercise.reps} reps
                                        {exercise.intensity && ` @ ${exercise.intensity}`}
                                      </div>
                                      {exercise.notes && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {exercise.notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={() => saveWorkoutPlan(workoutPlan)}
                    className="mt-4"
                  >
                    Save Workout Plan
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">Enter your PRs and click "Generate Plans" to get started</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="periodization">
          <Card>
            <CardHeader>
              <CardTitle>Periodization Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Generating periodization plan...</div>
              ) : periodizationPlan ? (
                <>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Personal Records</h3>
                        <div className="space-y-2">
                          {Object.entries(periodizationPlan.prs).map(([lift, weight]) => (
                            <div key={lift} className="flex justify-between">
                              <span className="capitalize">{lift}</span>
                              <span>{weight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {periodizationPlan.recovery && (
                        <div>
                          <h3 className="font-semibold mb-2">Recovery Guidelines</h3>
                          <div className="space-y-2">
                            {Object.entries(periodizationPlan.recovery).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key}</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {periodizationPlan.phases?.map((phase) => (
                        <div key={phase.phaseNumber} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">Phase {phase.phaseNumber}: {phase.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {phase.duration} • {phase.volume} Volume • {phase.intensity} Intensity
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{phase.focus}</p>
                          <div className="space-y-4">
                            {phase.workouts?.map((workout, index) => (
                              <div key={index} className="border-l-2 border-primary pl-4">
                                <h4 className="font-medium">{workout.day}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{workout.focus}</p>
                                <div className="space-y-2">
                                  {workout.exercises?.map((exercise, exIndex) => (
                                    <div key={exIndex} className="bg-muted p-2 rounded">
                                      <div className="font-medium">{exercise.name}</div>
                                      <div className="text-sm">
                                        {exercise.sets} sets × {exercise.reps} reps
                                        {exercise.intensity && ` @ ${exercise.intensity}`}
                                      </div>
                                      {exercise.notes && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {exercise.notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={() => savePeriodizationPlan(periodizationPlan)}
                    className="mt-4"
                  >
                    Save Periodization Plan
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">Enter your PRs and click "Generate Plans" to get started</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 