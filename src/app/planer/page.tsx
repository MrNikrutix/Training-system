"use client"

import React from "react"
import { PlannerProvider } from "@/lib/contexts/planner-provider"
import { usePlanContext } from "@/lib/contexts/plan-context"
import { TrainingPlanner } from "@/components/planer/training-planner"
import { EmptyState } from "@/components/planer/empty-state"
import { Navbar } from "@/components/planer/navbar"
import { ContentLayout } from "@/components/admin-panel/content-layout";

// Komponent wewnętrzny, który korzysta z kontekstu
function PlannerContent() {
  const { plans, isLoading, selectedPlanId } = usePlanContext()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ContentLayout title="Planer treningowy">
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-4 px-4">
        {plans.length > 0 && selectedPlanId ? <TrainingPlanner /> : <EmptyState />}
      </main>
    </div>
    </ContentLayout>
  )
}

// Komponent główny, który dostarcza kontekst
export default function Dashboard() {
  return (
    <PlannerProvider>
      <PlannerContent />
    </PlannerProvider>
  )
}
