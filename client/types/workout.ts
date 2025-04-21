export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  percentage?: number;
  weight?: number;
  notes?: string;
}

export interface WorkoutDay {
  name: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutWeek {
  week: number;
  days: WorkoutDay[];
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  createdAt: Date;
  prs: {
    squat: number;
    bench: number;
    deadlift: number;
    overhead: number;
  };
  weeks: WorkoutWeek[];
}

export interface PeriodizationPhase {
  name: string;
  weeks: number;
  focus: string;
  intensity: string;
  volume: string;
  notes: string;
}

export interface PeriodizationPlan {
  id: string;
  createdAt: Date;
  prs: {
    squat: number;
    bench: number;
    deadlift: number;
    overhead: number;
  };
  phases: PeriodizationPhase[];
  deloadWeeks: number[];
} 