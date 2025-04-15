export enum WeekDay {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export interface Plan {
  id: number
  name: string
  eventDate: string
}

export interface Week {
  id: number
  planId: number
  position: number
  notes?: string
}

export interface Workout {
  id: number
  planId: number
  weekId: number
  name?: string
  description?: string
  dayOfWeek: WeekDay
  completed: boolean
  notes?: string
  workId?: number
}

export enum WorkoutType {
  Run = "Run",
  Strength = "Strength",
  CrossTraining = "CrossTraining",
  Rest = "Rest",
}
