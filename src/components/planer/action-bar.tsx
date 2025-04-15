"use client"

import { useState } from "react"
import type { Plan } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Calendar, Edit } from "lucide-react"
import { AddEditPlanModal } from "./add-edit-plan-modal"
import { format } from "date-fns"

interface ActionBarProps {
  plan: Plan
}

export function ActionBar({ plan }: ActionBarProps) {
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{plan.name}</h2>
        {plan.eventDate && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4 mr-1" />
            Event date: {format(new Date(plan.eventDate), "MMMM d, yyyy")}
          </div>
        )}
      </div>

      <AddEditPlanModal open={isEditPlanModalOpen} onOpenChange={setIsEditPlanModalOpen} plan={plan} />
    </div>
  )
}
