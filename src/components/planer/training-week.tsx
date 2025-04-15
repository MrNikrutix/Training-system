"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useDroppable } from "@dnd-kit/core"
import { type Week, type Workout, WeekDay } from "@/lib/types"
import { useWeekContext } from "@/lib/contexts/week-context"
import { WorkoutCard } from "./workout-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddEditWorkoutModal } from "./add-edit-workout-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TrainingWeekProps {
  week: Week
  weekNumber: number
  planId: number
  workouts: Workout[]
  isSelected: boolean
  onSelectWeek: (id: number) => void
  isLast: boolean
}

export function TrainingWeek({
  week,
  weekNumber,
  planId,
  workouts,
  isSelected,
  onSelectWeek,
  isLast,
}: TrainingWeekProps) {
  const { updateWeek, deleteWeek } = useWeekContext()
  const [notes, setNotes] = useState(week.notes || "")
  const [isAddWorkoutModalOpen, setIsAddWorkoutModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const droppableRefs = useRef<Record<string, HTMLElement | null>>({})

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }

  const handleNotesSave = () => {
    updateWeek(week.id, { notes })
  }

  const handleAddWorkout = (day: WeekDay) => {
    setSelectedDay(day)
    setIsAddWorkoutModalOpen(true)
  }

  const handleDeleteWeek = async () => {
    setIsDeleting(true)
    try {
      await deleteWeek(week.id)
    } catch (error) {
      console.error("Error deleting week:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Tworzymy tablicę dni tygodnia
  const weekDays = Object.values(WeekDay);
  
  // Używamy już zdefiniowanej referencji droppableRefs
  
  // Tworzymy obiekty droppable dla każdego dnia tygodnia
  const droppableProps: Record<WeekDay, { 
    ref: (node: HTMLElement | null) => void,
    isOver?: boolean 
  }> = {};
  
  // Dla każdego dnia tygodnia tworzymy droppable area
  weekDays.forEach((day) => {
    const droppableId = `${week.id}-${day}`;
    
    // Używamy hooka useDroppable na najwyższym poziomie komponentu
    const { setNodeRef, isOver } = useDroppable({
      id: droppableId,
      data: { weekId: week.id, dayOfWeek: day },
    });
    
    // Zapisujemy referencję do droppable area
    droppableProps[day] = {
      ref: (node: HTMLElement | null) => {
        if (droppableRefs.current) {
          droppableRefs.current[droppableId] = node;
        }
        setNodeRef(node);
      },
      isOver: isOver,
    };
  });

  return (
    <div className={cn("border-t", isSelected && "bg-muted/30")}>
      <div className="flex items-center justify-between p-2 bg-muted/50">
        <Button variant="ghost" className="font-medium" onClick={() => onSelectWeek(week.id)}>
          Week {weekNumber}
          {isSelected ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Week {weekNumber}</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete Week {weekNumber} and all its workouts. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteWeek} 
                disabled={isDeleting}
                className={isDeleting ? "opacity-80" : ""}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex min-w-max">
        <div className="w-16 bg-muted flex items-center justify-center text-sm font-medium">Week {weekNumber}</div>

        {Object.values(WeekDay).map((day) => {
          const dayWorkouts = workouts.filter((w) => w.dayOfWeek === day)

          return (
            <div 
              key={day} 
              ref={droppableProps[day].ref}
              className={cn(
                "flex-1 min-h-[120px] p-2 border-l min-w-[8rem] relative transition-colors",
                droppableProps[day].isOver ? "bg-muted/40" : "hover:bg-muted/20"
              )}
              data-week-id={week.id}
              data-day-of-week={day}>
              {dayWorkouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-1 right-1 h-6 w-6 p-0"
                onClick={() => handleAddWorkout(day)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {isSelected && (
        <div className="p-4 bg-muted/20 border-t">
          <div className="mb-2 text-sm font-medium">Week Notes</div>
          <Textarea
            placeholder="Add notes for this week..."
            className="min-h-[100px]"
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleNotesSave}
          />
        </div>
      )}

      {selectedDay && (
        <AddEditWorkoutModal
          open={isAddWorkoutModalOpen}
          onOpenChange={setIsAddWorkoutModalOpen}
          initialValues={{
            planId,
            weekId: week.id,
            dayOfWeek: selectedDay,
          }}
        />
      )}
    </div>
  )
}
