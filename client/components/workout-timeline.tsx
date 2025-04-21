import { WorkoutWeek, PeriodizationPhase } from '@/types/workout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkoutTimelineProps {
  weeks: WorkoutWeek[];
  phases?: PeriodizationPhase[];
}

export function WorkoutTimeline({ weeks, phases }: WorkoutTimelineProps) {
  return (
    <div className="space-y-8">
      {weeks.map((week) => (
        <Card key={week.week}>
          <CardHeader>
            <CardTitle>Week {week.week}</CardTitle>
            {week.notes && <p className="text-sm text-muted-foreground">{week.notes}</p>}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {week.days.map((day, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <h3 className="font-semibold">{day.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{day.focus}</p>
                  <div className="space-y-2">
                    {day.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="flex items-center justify-between">
                        <span>{exercise.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {exercise.sets}x{exercise.reps}
                          {exercise.percentage && ` @ ${exercise.percentage}%`}
                          {exercise.weight && ` (${exercise.weight}kg)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {phases && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Periodization Phases</h2>
          {phases.map((phase, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{phase.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {phase.weeks} weeks • {phase.focus}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Intensity</h3>
                    <p className="text-sm text-muted-foreground">{phase.intensity}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Volume</h3>
                    <p className="text-sm text-muted-foreground">{phase.volume}</p>
                  </div>
                </div>
                {phase.notes && (
                  <p className="mt-4 text-sm">{phase.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 