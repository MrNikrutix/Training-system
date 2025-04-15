// Definicja typów dla treningu
export interface WorkoutActivity {
  id: string
  type: "exercise" | "rest"
  name: string
  duration: number | null
  quantity: number | null
  unit: "time" | "reps"
  currentSet: number
  totalSets: number
  sectionName: string
  sectionId: number
  exerciseId: number
}

export interface Workout {
  id: number
  title: string
  description: string | null
  created_at: string
  duration: number | null
  sections: {
    id?: number
    work_id?: number
    name: string
    position: number
    exercises?: {
      id?: number
      ex_id: number
      sets: number
      quantity: number | null
      unit: "CZAS" | "ILOŚĆ"
      duration: number | null
      rest: number
      position: number
      name?: string
    }[]
  }[]
}
