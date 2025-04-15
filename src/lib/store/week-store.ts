"use client"

import { create } from "zustand"
import type { Week } from "../types"
import { weeksAPI } from "../api"
import { usePlanStore } from "./plan-store"

interface WeekState {
  weeks: Week[]

  loadWeeks: () => Promise<void>
  addWeek: (data: { planId: number; position: number; notes?: string }) => Promise<Week>
  updateWeek: (id: number, data: { position?: number; notes?: string }) => Promise<void>
  deleteWeek: (id: number) => Promise<void>
}

export const useWeekStore = create<WeekState>((set, get) => ({
  weeks: [],

  loadWeeks: async () => {
    try {
      const { plans, selectedPlanId } = usePlanStore.getState()
      console.log("Loading weeks for selectedPlanId:", selectedPlanId);

      if (!selectedPlanId || plans.length === 0) {
        console.log("No selected plan or empty plans list, setting weeks to empty array");
        set({ weeks: [] })
        return
      }

      // Konwertujemy selectedPlanId na string dla API
      const planIdStr = selectedPlanId.toString()
      console.log("Fetching weeks for planId:", planIdStr);
      
      const weeks = await weeksAPI.getByPlanId(planIdStr)
      console.log("Loaded weeks:", weeks);
      
      // Sortujemy tygodnie po position przed ustawieniem stanu
      const sortedWeeks = [...weeks].sort((a, b) => a.position - b.position);
      console.log("Sorted weeks:", sortedWeeks);
      
      set({ weeks: sortedWeeks })
    } catch (error) {
      console.error("Failed to load weeks:", error)
    }
  },

  addWeek: async (data) => {
    try {
      console.log("Adding week with data:", data);
      
      // Najpierw pobieramy aktualne tygodnie dla tego planu bezpośrednio z API
      const planIdStr = data.planId.toString();
      console.log("Fetching current weeks for planId:", planIdStr);
      
      const currentWeeks = await weeksAPI.getByPlanId(planIdStr);
      console.log("Current weeks from API:", currentWeeks);
      
      // Obliczamy poprawną wartość position na podstawie aktualnych danych z API
      const position = currentWeeks.length + 1;
      console.log("Calculated position from API data:", position);
      
      // Tworzymy nowy tydzień z poprawną wartością position
      const newWeek = await weeksAPI.create({
        planId: planIdStr,
        position,
        notes: data.notes,
      });
      
      console.log("New week created:", newWeek);
      
      // Aktualizujemy stan, dodając nowy tydzień i sortując wszystkie tygodnie
      set((state) => {
        const updatedWeeks = [...state.weeks, newWeek].sort((a, b) => a.position - b.position);
        console.log("Updated weeks after sorting:", updatedWeeks);
        return { weeks: updatedWeeks };
      });
      
      return newWeek;
    } catch (error) {
      console.error("Failed to add week:", error);
      throw error;
    }
  },

  updateWeek: async (id, data) => {
    try {
      // Konwertujemy id na string dla API
      const weekId = id.toString()
      const updatedWeek = await weeksAPI.update(weekId, data)
      set((state) => ({
        weeks: state.weeks.map((week) => (week.id === id ? { ...week, ...updatedWeek } : week)),
      }))
    } catch (error) {
      console.error("Failed to update week:", error)
      throw error
    }
  },

  deleteWeek: async (id) => {
    try {
      // Konwertujemy id na string dla API
      const weekId = id.toString()
      await weeksAPI.delete(weekId)
      set((state) => ({
        weeks: state.weeks.filter((week) => week.id !== id),
      }))
    } catch (error) {
      console.error("Failed to delete week:", error)
      throw error
    }
  },
}))
