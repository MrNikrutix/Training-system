"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { AddEditPlanModal } from "./add-edit-plan-modal"

export function EmptyState() {
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <PlusCircle className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Create Your First Training Plan</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Start by creating a training plan. You can add weeks and workouts to build your perfect training schedule.
      </p>
      <Button onClick={() => setIsAddPlanModalOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Training Plan
      </Button>

      <AddEditPlanModal open={isAddPlanModalOpen} onOpenChange={setIsAddPlanModalOpen} />
    </div>
  )
}
