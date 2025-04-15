"use client"

import { useState } from "react"
import { 
  DndContext, 
  type DragEndEvent, 
  closestCorners, 
  pointerWithin,
  DragOverlay,
  useDraggable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import { usePlanContext } from "@/lib/contexts/plan-context"
import { useWeekContext } from "@/lib/contexts/week-context"
import { useWorkoutContext } from "@/lib/contexts/workout-context"
import { WeekDay } from "@/lib/types"
import { ActionBar } from "./action-bar"
import { TrainingWeek } from "./training-week"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

import { WorkoutCard } from "./workout-card"
import type { Workout } from "@/lib/types"

export function TrainingPlanner() {
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null)
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)

  const { selectedPlanId, selectedPlan } = usePlanContext()
  const { weeks, addWeek } = useWeekContext()
  const { workouts, moveWorkout } = useWorkoutContext()
  
  // Configure sensors for better drag experience
  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  })
  
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  })
  
  const sensors = useSensors(mouseSensor, touchSensor)

  // Filtrujemy i sortujemy tygodnie dla wybranego planu
  const planWeeks = weeks
    .filter((w) => Number(w.planId) === Number(selectedPlanId))
    .sort((a, b) => a.position - b.position)

  if (!selectedPlan) return null

  const handleDragStart = (event: any) => {
    const { active } = event;
    const workoutId = Number(active.id);
    const workout = workouts.find(w => w.id === workoutId);
    
    if (workout) {
      setActiveWorkout(workout);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    // Reset active workout
    setActiveWorkout(null);
    
    // Make sure we have valid active and over elements
    if (!active || !over) {
      console.log("Drag ended without valid active or over elements")
      return
    }
    
    // Make sure we're not dropping onto the same element
    if (active.id === over.id) {
      console.log("Dropped onto the same element, ignoring")
      return
    }
    
    console.log("Drag ended with active:", active, "and over:", over)
    
    // Get the data from the over element
    if (over.data?.current) {
      const { weekId, dayOfWeek } = over.data.current as { weekId: number; dayOfWeek: WeekDay }
      console.log(`Drop target data: weekId=${weekId}, dayOfWeek=${dayOfWeek}`)
      
      // Get the workout being dragged
      const workoutId = Number(active.id)
      const workout = workouts.find(w => w.id === workoutId)
      
      if (!workout) {
        console.error(`Workout with id ${workoutId} not found`)
        return
      }
      
      console.log(`Found workout:`, workout)
      
      // Only update if the workout is being moved to a different position
      if (workout.weekId !== weekId || workout.dayOfWeek !== dayOfWeek) {
        console.log(`Moving workout ${workoutId} from week ${workout.weekId} to week ${weekId}`)
        try {
          moveWorkout(workoutId, weekId, dayOfWeek)
        } catch (error) {
          console.error("Error moving workout:", error)
        }
      } else {
        console.log("Workout position unchanged, no update needed")
      }
    } else {
      console.log("No data in over element")
    }
  }

  return (
    <div className="space-y-4">
      <ActionBar plan={selectedPlan} />

      <div className="border rounded-lg overflow-x-auto">
        <div className="flex min-w-max">
          <div className="w-16 bg-muted"></div>
          {Object.values(WeekDay).map((day) => (
            <div key={day} className="flex-1 p-2 font-medium text-center border-l min-w-[8rem]">
              {day}
            </div>
          ))}
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={pointerWithin} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}>
          {planWeeks.map((week, index) => (
            <TrainingWeek
              key={week.id}
              week={week}
              weekNumber={index + 1}
              planId={selectedPlan.id}
              workouts={workouts.filter((w) => w.weekId === week.id)}
              isSelected={selectedWeekId === week.id}
              onSelectWeek={(id) => setSelectedWeekId(id === selectedWeekId ? null : id)}
              isLast={index === planWeeks.length - 1}
            />
          ))}
          
          <DragOverlay>
            {activeWorkout ? (
              <div className="opacity-80">
                <WorkoutCard workout={activeWorkout} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={async (e) => {
            // Dodajemy klasę loading do przycisku
            const button = e.currentTarget;
            button.classList.add("opacity-80");
            button.disabled = true;
            
            try {
              // Dodajemy nowy tydzień
              await addWeek({
                planId: selectedPlan.id,
                position: planWeeks.length + 1,
              });
            } catch (error) {
              console.error("Error adding week:", error);
            } finally {
              // Usuwamy klasę loading z przycisku
              button.classList.remove("opacity-80");
              button.disabled = false;
            }
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Week
        </Button>
      </div>
    </div>
  )
}
