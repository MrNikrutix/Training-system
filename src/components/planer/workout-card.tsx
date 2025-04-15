"use client"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import type { Workout } from "@/lib/types"
import { useWorkoutContext } from "@/lib/contexts/workout-context"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AddEditWorkoutModal } from "./add-edit-workout-modal"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Pencil, MoveHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface WorkoutCardProps {
  workout: Workout
  isDragging?: boolean
}

export function WorkoutCard({ workout, isDragging = false }: WorkoutCardProps) {
  const { updateWorkout } = useWorkoutContext()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform } = isDragging ? { 
    attributes: {}, 
    listeners: {}, 
    setNodeRef: () => {}, 
    transform: null 
  } : useDraggable({
    id: workout.id,
    data: workout,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined

  const handleCompletedChange = async (checked: boolean) => {
    await updateWorkout(workout.id, { completed: checked })
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "mb-2 shadow-sm hover:shadow-md transition-shadow", 
          !isDragging && "cursor-grab active:cursor-grabbing",
          isDragging && "shadow-lg",
          workout.completed && "opacity-60"
        )}
        title="Drag to move between days or weeks"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoveHorizontal className="h-3 w-3 text-muted-foreground" />
              <div className="text-sm font-medium">{workout.name || workout.description || "Untitled Workout"}</div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  className="py-2 cursor-pointer"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="py-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    handleCompletedChange(!workout.completed)
                  }}
                >
                  <div className="flex items-center w-full">
                    <Checkbox 
                      checked={workout.completed} 
                      className="mr-2"
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          handleCompletedChange(checked)
                        }
                      }}
                    />
                    <span>Mark as {workout.completed ? "incomplete" : "complete"}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {workout.description && workout.name && (
            <div className="text-xs text-muted-foreground mt-1">{workout.description}</div>
          )}
        </CardContent>
      </Card>

      <AddEditWorkoutModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialValues={{
          id: workout.id,
          planId: workout.planId,
          weekId: workout.weekId,
          dayOfWeek: workout.dayOfWeek,
          name: workout.name,
          description: workout.description,
          notes: workout.notes,
          completed: workout.completed,
          workId: workout.workId,
        }}
      />
    </>
  )
}
