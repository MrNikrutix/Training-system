"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Plan } from "../types"
import { plansAPI } from "../api"

interface PlanContextType {
  plans: Plan[]
  isLoading: boolean
  selectedPlanId: number | null
  selectedPlan: Plan | undefined
  setSelectedPlanId: (id: number | null) => void
  addPlan: (data: { name: string; eventDate?: string }) => Promise<Plan>
  updatePlan: (id: number, data: { name?: string; eventDate?: string }) => Promise<void>
  deletePlan: (id: number) => Promise<void>
}

const PlanContext = createContext<PlanContextType | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  // Pobieranie planów
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: plansAPI.getAll,
    onSuccess: (data) => {
      // Automatycznie wybierz pierwszy plan, jeśli żaden nie jest wybrany
      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id)
      }
    }
  })

  // Pobieranie wybranego planu
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  // Mutacja do dodawania planu
  const addPlanMutation = useMutation({
    mutationFn: plansAPI.create,
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      setSelectedPlanId(newPlan.id)
      return newPlan
    }
  })

  // Mutacja do aktualizacji planu
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => plansAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] })
    }
  })

  // Mutacja do usuwania planu
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => plansAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      // Wybierz pierwszy plan po usunięciu, jeśli istnieje
      if (plans.length > 1) {
        const newPlans = plans.filter(p => p.id !== selectedPlanId)
        setSelectedPlanId(newPlans[0]?.id || null)
      } else {
        setSelectedPlanId(null)
      }
    }
  })

  // Funkcje pomocnicze
  const addPlan = async (data: { name: string; eventDate?: string }) => {
    return addPlanMutation.mutateAsync(data)
  }

  const updatePlan = async (id: number, data: { name?: string; eventDate?: string }) => {
    await updatePlanMutation.mutateAsync({ id: id.toString(), data })
  }

  const deletePlan = async (id: number) => {
    await deletePlanMutation.mutateAsync(id.toString())
  }

  return (
    <PlanContext.Provider
      value={{
        plans,
        isLoading,
        selectedPlanId,
        selectedPlan,
        setSelectedPlanId,
        addPlan,
        updatePlan,
        deletePlan
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlanContext() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error("usePlanContext must be used within a PlanProvider")
  }
  return context
}