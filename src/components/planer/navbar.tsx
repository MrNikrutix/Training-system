"use client"

import { useState } from "react"
import { usePlanContext } from "@/lib/contexts/plan-context"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { AddEditPlanModal } from "./add-edit-plan-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Navbar() {
  const { plans, selectedPlanId, selectedPlan, setSelectedPlanId } = usePlanContext()
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false)
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false)

  return (
    <header className="border-b">
      <div className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">
            {plans.length > 0 && (
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedPlanId?.toString() || undefined} 
                  onValueChange={(value) => setSelectedPlanId(Number(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPlan && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditPlanModalOpen(true)}>
                    Edit
                  </Button>
                )}
              </div>
            )}

            <Button onClick={() => setIsAddPlanModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Plan
            </Button>
          </div>
        </div>
      </div>

      <AddEditPlanModal open={isAddPlanModalOpen} onOpenChange={setIsAddPlanModalOpen} />

      {selectedPlan && (
        <AddEditPlanModal open={isEditPlanModalOpen} onOpenChange={setIsEditPlanModalOpen} plan={selectedPlan} />
      )}
    </header>
  )
}
