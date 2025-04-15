"use client"

import { create } from "zustand"
import type { Plan } from "../types"
import { plansAPI } from "../api"

interface PlanState {
  plans: Plan[]
  loading: boolean
  selectedPlanId: number | null

  loadPlans: () => Promise<void>
  addPlan: (data: { name: string; eventDate?: string }) => Promise<Plan>
  updatePlan: (id: number, data: { name?: string; eventDate?: string }) => Promise<void>
  deletePlan: (id: number) => Promise<void>
  setSelectedPlan: (id: number | null) => void
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  loading: false,
  selectedPlanId: null,

  loadPlans: async () => {
    set({ loading: true })
    try {
      const plans = await plansAPI.getAll()
      set({
        plans,
        selectedPlanId: plans.length > 0 ? plans[0].id : null,
        loading: false,
      })
    } catch (error) {
      console.error("Failed to load plans:", error)
      set({ loading: false })
    }
  },

  addPlan: async (data) => {
    try {
      const newPlan = await plansAPI.create(data)
      set((state) => ({
        plans: [...state.plans, newPlan],
        selectedPlanId: newPlan.id,
      }))
      return newPlan
    } catch (error) {
      console.error("Failed to add plan:", error)
      throw error
    }
  },

  updatePlan: async (id, data) => {
    try {
      // Konwertujemy id na string dla API
      const planIdStr = id.toString()
      const updatedPlan = await plansAPI.update(planIdStr, data)
      set((state) => ({
        plans: state.plans.map((plan) => (plan.id === id ? { ...plan, ...updatedPlan } : plan)),
      }))
    } catch (error) {
      console.error("Failed to update plan:", error)
      throw error
    }
  },

  deletePlan: async (id) => {
    try {
      // Konwertujemy id na string dla API
      const planIdStr = id.toString()
      await plansAPI.delete(planIdStr)
      set((state) => {
        const newPlans = state.plans.filter((plan) => plan.id !== id)
        return {
          plans: newPlans,
          selectedPlanId: newPlans.length > 0 ? newPlans[0].id : null,
        }
      })
    } catch (error) {
      console.error("Failed to delete plan:", error)
      throw error
    }
  },

  setSelectedPlan: (id) => {
    set({ selectedPlanId: id })
  },
}))
