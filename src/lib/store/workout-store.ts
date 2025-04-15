"use client"

import { create } from "zustand"
import type { Workout, WeekDay } from "../types"
import { workoutsAPI } from "../api"
import { useWeekStore } from "./week-store"

interface WorkoutState {
  workouts: Workout[]

  loadWorkouts: () => Promise<void>
  addWorkout: (data: {
    planId: number
    weekId: number
    name?: string
    description?: string
    dayOfWeek: WeekDay
    completed: boolean
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
    },
  ) => Promise<void>
  deleteWorkout: (id: number) => Promise<void>
  moveWorkout: (id: number, weekId: number, dayOfWeek: WeekDay) => Promise<void>
  duplicateWorkout: (workout: Workout) => Promise<void>
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],

  loadWorkouts: async () => {
    try {
      const { weeks } = useWeekStore.getState()

      if (weeks.length === 0) {
        set({ workouts: [] })
        return
      }

      const workoutsPromises = weeks.map((week) => workoutsAPI.getByWeekId(week.id))
      const workoutsArrays = await Promise.all(workoutsPromises)
      const workouts = workoutsArrays.flat()

      set({ workouts })
    } catch (error) {
      console.error("Failed to load workouts:", error)
    }
  },

  addWorkout: async (data) => {
    try {
      const newWorkout = await workoutsAPI.create(data)
      set((state) => ({ workouts: [...state.workouts, newWorkout] }))
      return newWorkout
    } catch (error) {
      console.error("Failed to add workout:", error)
      throw error
    }
  },

  updateWorkout: async (id, data) => {
    try {
      const updatedWorkout = await workoutsAPI.update(id, data)
      set((state) => ({
        workouts: state.workouts.map((workout) => (workout.id === id ? { ...workout, ...updatedWorkout } : workout)),
      }))
    } catch (error) {
      console.error("Failed to update workout:", error)
      throw error
    }
  },

  deleteWorkout: async (id) => {
    try {
      await workoutsAPI.delete(id)
      set((state) => ({
        workouts: state.workouts.filter((workout) => workout.id !== id),
      }))
    } catch (error) {
      console.error("Failed to delete workout:", error)
      throw error
    }
  },

  moveWorkout: async (id, weekId, dayOfWeek) => {
    try {
      const workout = get().workouts.find((w) => w.id === id)

      if (!workout) {
        throw new Error("Workout not found")
      }

      if (workout.weekId === weekId && workout.dayOfWeek === dayOfWeek) {
        return // No change needed
      }

      const updatedWorkout = await workoutsAPI.update(id, { dayOfWeek })

      set((state) => ({
        workouts: state.workouts.map((w) => (w.id === id ? { ...w, weekId, dayOfWeek } : w)),
      }))
    } catch (error) {
      console.error("Failed to move workout:", error)
      throw error
    }
  },

  duplicateWorkout: async (workout) => {
    try {
      const { id, ...workoutData } = workout
      const newWorkout = await workoutsAPI.create(workoutData)
      set((state) => ({ workouts: [...state.workouts, newWorkout] }))
    } catch (error) {
      console.error("Failed to duplicate workout:", error)
      throw error
    }
  },
}))
