"use client"

import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import WorkoutPlanner from "@/components/workout-planner"
import { toast } from "sonner"
import { ContentLayout } from "@/components/admin-panel/content-layout";

// Definicja enum dla jednostek ćwiczenia
enum ExerciseUnit {
  TIME = "CZAS",
  QUANTITY = "ILOŚĆ",
}

// Zaktualizuj interfejs WorkoutExercise
interface WorkoutExercise {
  ex_id: number
  sets: number
  quantity: number | null
  unit: ExerciseUnit
  duration: number | null
  rest: number
  position: number
}

interface WorkoutSection {
  name: string
  position: number
  exercises: WorkoutExercise[]
}

interface WorkoutCreate {
  title: string
  description: string | null
  duration: number | null
  sections: WorkoutSection[]
}

export default function EditWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id

  const [isLoading, setIsLoading] = useState(true)
  const [workout, setWorkout] = useState<any | null>(null)

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!workoutId) return

      try {
        setIsLoading(true)
        const response = await fetch(`http://localhost:8000/api/workouts/${workoutId}`)

        if (!response.ok) {
          throw new Error("Nie udało się pobrać danych treningu")
        }

        const data = await response.json()
        setWorkout(data)
      } catch (error) {
        console.error("Error fetching workout:", error)
        toast("Błąd", {
          description: "Nie udało się pobrać danych treningu",
        })
        router.push("/workouts")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkout()
  }, [workoutId, router])

  const handleSave = async (workoutData: WorkoutCreate) => {
    if (!workoutId) return

    try {
      console.log("Sending updated workout data:", JSON.stringify(workoutData, null, 2))

      const response = await fetch(`http://localhost:8000/api/workouts/${workoutId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)

        let errorMessage = "Nie udało się zaktualizować treningu"
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.detail) {
            errorMessage = errorData.detail
          }
        } catch (e) {
          // Jeśli nie można sparsować JSON, użyj oryginalnego tekstu błędu
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Success response:", data)

      toast("Sukces", {
        description: "Trening został zaktualizowany",
      })
      router.push("/workouts")
    } catch (error) {
      console.error("Error updating workout:", error)
      toast("Błąd", {
        description: error instanceof Error ? error.message : "Wystąpił problem podczas aktualizacji treningu",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ContentLayout title={`Edycja treningu ${workout.id}`} >
    <div className="space-y-4 container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Edytuj trening</h1>
      {workout && <WorkoutPlanner initialWorkout={workout} onSave={handleSave} isEditMode={true} />}
    </div>
    </ContentLayout>
  )
}
