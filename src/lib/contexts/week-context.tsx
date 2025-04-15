"use client"

import { createContext, useContext, ReactNode } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Week } from "../types"
import { weeksAPI } from "../api"
import { usePlanContext } from "./plan-context"

interface WeekContextType {
  weeks: Week[]
  isLoading: boolean
  addWeek: (data: { planId: number; position?: number; notes?: string }) => Promise<Week>
  updateWeek: (id: number, data: { position?: number; notes?: string }) => Promise<void>
  deleteWeek: (id: number) => Promise<void>
}

const WeekContext = createContext<WeekContextType | null>(null)

export function WeekProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { selectedPlanId } = usePlanContext()

  // Pobieranie tygodni dla wybranego planu
  const { data: weeks = [], isLoading } = useQuery({
    queryKey: ["weeks", selectedPlanId],
    queryFn: () => selectedPlanId ? weeksAPI.getByPlanId(selectedPlanId.toString()) : Promise.resolve([]),
    enabled: !!selectedPlanId
  })

  // Mutacja do dodawania tygodnia
  const addWeekMutation = useMutation({
    mutationFn: async (data: { planId: number; position?: number; notes?: string }) => {
      // Pobierz aktualne tygodnie dla tego planu
      const currentWeeks = await weeksAPI.getByPlanId(data.planId.toString())
      
      // Oblicz pozycję dla nowego tygodnia
      const position = data.position || currentWeeks.length + 1
      
      // Utwórz nowy tydzień
      return weeksAPI.create({
        planId: data.planId.toString(),
        position,
        notes: data.notes
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeks", selectedPlanId] })
    }
  })

  // Mutacja do aktualizacji tygodnia
  const updateWeekMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => weeksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeks", selectedPlanId] })
    }
  })

  // Mutacja do usuwania tygodnia
  const deleteWeekMutation = useMutation({
    mutationFn: async (id: string) => {
      // Najpierw pobieramy usuwany tydzień, aby znać jego pozycję
      const weekToDelete = weeks.find(w => w.id === Number(id));
      if (!weekToDelete || !selectedPlanId) return weeksAPI.delete(id);
      
      // Usuwamy tydzień
      await weeksAPI.delete(id);
      
      // Pobieramy wszystkie tygodnie dla tego planu
      const planWeeks = weeks
        .filter(w => w.planId === selectedPlanId)
        .sort((a, b) => a.position - b.position);
      
      // Aktualizujemy pozycje pozostałych tygodni
      const updatePromises = planWeeks
        .filter(w => w.id !== Number(id) && w.position > weekToDelete.position)
        .map(week => 
          weeksAPI.update(week.id.toString(), { 
            position: week.position - 1 
          })
        );
      
      // Wykonujemy wszystkie aktualizacje równolegle
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeks", selectedPlanId] })
    }
  })

  // Funkcje pomocnicze
  const addWeek = async (data: { planId: number; position?: number; notes?: string }) => {
    return addWeekMutation.mutateAsync(data)
  }

  const updateWeek = async (id: number, data: { position?: number; notes?: string }) => {
    await updateWeekMutation.mutateAsync({ id: id.toString(), data })
  }

  const deleteWeek = async (id: number) => {
    await deleteWeekMutation.mutateAsync(id.toString())
  }

  return (
    <WeekContext.Provider
      value={{
        weeks,
        isLoading,
        addWeek,
        updateWeek,
        deleteWeek
      }}
    >
      {children}
    </WeekContext.Provider>
  )
}

export function useWeekContext() {
  const context = useContext(WeekContext)
  if (!context) {
    throw new Error("useWeekContext must be used within a WeekProvider")
  }
  return context
}