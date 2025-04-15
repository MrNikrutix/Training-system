"use client"

import { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PlanProvider } from "./plan-context"
import { WeekProvider } from "./week-context"
import { WorkoutProvider } from "./workout-context"

// Tworzymy instancję QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minut
      refetchOnWindowFocus: false,
    },
  },
})

export function PlannerProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PlanProvider>
        <WeekProvider>
          <WorkoutProvider>
            {children}
          </WorkoutProvider>
        </WeekProvider>
      </PlanProvider>
    </QueryClientProvider>
  )
}