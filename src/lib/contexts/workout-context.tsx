"use client"

import { createContext, useContext, ReactNode } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Workout, WeekDay } from "../types"
import { workoutsAPI } from "../api"
import { useWeekContext } from "./week-context"

interface WorkoutContextType {
  workouts: Workout[]
  isLoading: boolean
  addWorkout: (data: {
    planId: number
    weekId: number
    name?: string
    description?: string
    dayOfWeek: WeekDay
    completed?: boolean
    notes?: string
    workId?: number
  }) => Promise<Workout>
  updateWorkout: (
    id: number,
    data: {
      name?: string
      description?: string
      dayOfWeek?: WeekDay
      completed?: boolean
      notes?: string
      workId?: number
    }
  ) => Promise<void>
  deleteWorkout: (id: number) => Promise<void>
  moveWorkout: (id: number, weekId: number, dayOfWeek: WeekDay) => Promise<void>
  duplicateWorkout: (workout: Workout) => Promise<void>
}

const WorkoutContext = createContext<WorkoutContextType | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { weeks } = useWeekContext()
  
  // Pobieranie treningów dla wszystkich tygodni
  const weekIds = weeks.map(w => w.id)
  
  const { data: workoutsArrays = [], isLoading } = useQuery({
    queryKey: ["workouts", weekIds],
    queryFn: async () => {
      if (weekIds.length === 0) return []
      
      const promises = weekIds.map(weekId => 
        workoutsAPI.getByWeekId(weekId.toString())
      )
      
      return Promise.all(promises)
    },
    enabled: weekIds.length > 0
  })
  
  // Spłaszczamy tablicę treningów
  const workouts = workoutsArrays.flat()

  // Mutacja do dodawania treningu
  const addWorkoutMutation = useMutation({
    mutationFn: workoutsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
    }
  })

  // Mutacja do aktualizacji treningu
  const updateWorkoutMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => workoutsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
    }
  })

  // Mutacja do usuwania treningu
  const deleteWorkoutMutation = useMutation({
    mutationFn: (id: number) => workoutsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
    }
  })

  // Funkcje pomocnicze
  const addWorkout = async (data: {
    planId: number
    weekId: number
    name?: string
    description?: string
    dayOfWeek: WeekDay
    completed?: boolean
    notes?: string
    workId?: number
  }) => {
    return addWorkoutMutation.mutateAsync(data)
  }

  const updateWorkout = async (
    id: number,
    data: {
      name?: string
      description?: string
      dayOfWeek?: WeekDay
      completed?: boolean
      notes?: string
      workId?: number
    }
  ) => {
    await updateWorkoutMutation.mutateAsync({ id, data })
  }

  const deleteWorkout = async (id: number) => {
    await deleteWorkoutMutation.mutateAsync(id)
  }

  const moveWorkout = async (id: number, weekId: number, dayOfWeek: WeekDay) => {
    const workout = workouts.find(w => w.id === id)
    
    if (!workout) {
      throw new Error("Workout not found")
    }
    
    if (workout.weekId === weekId && workout.dayOfWeek === dayOfWeek) {
      return // No change needed
    }
    
    console.log(`Moving workout ${id} from week ${workout.weekId} to week ${weekId} and day ${dayOfWeek}`)
    
    try {
      await updateWorkoutMutation.mutateAsync({ 
        id: id.toString(), 
        data: { 
          weekId, 
          dayOfWeek 
        } 
      })
      console.log(`Successfully moved workout ${id} to week ${weekId}`)
    } catch (error) {
      console.error(`Error moving workout ${id} to week ${weekId}:`, error)
      throw error
    }
  }

  const duplicateWorkout = async (workout: Workout) => {
    const { id, ...workoutData } = workout
    await addWorkoutMutation.mutateAsync(workoutData)
  }

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        isLoading,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        moveWorkout,
        duplicateWorkout
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkoutContext() {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error("useWorkoutContext must be used within a WorkoutProvider")
  }
  return context
}