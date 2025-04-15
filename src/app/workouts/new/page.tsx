"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import WorkoutPlanner from "@/components/workout-planner"
import { Button } from "@/components/ui/button"
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

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

// Typ dla danych inicjalnych (opcjonalnie używany przy generowaniu AI)
interface InitialWorkoutData {
  title: string
  description: string | null
  duration: number | null
  sections: {
    name: string
    position: number
    exercises: {
      ex_id: number
      name?: string // Pomocnicze pole do wyświetlania
      sets: number
      quantity: number
      unit: ExerciseUnit
      duration: number
      rest: number
      position: number
    }[]
  }[]
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [aiPrompt, setAIPrompt] = useState("")
  const [aiGenerating, setAIGenerating] = useState(false)
  const [initialWorkout, setInitialWorkout] = useState<InitialWorkoutData | null>(null)

  const handleSave = async (workoutData: WorkoutCreate) => {
    try {
      console.log("Sending workout data:", JSON.stringify(workoutData, null, 2))

      const response = await fetch("http://localhost:8000/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)

        let errorMessage = "Nie udało się utworzyć treningu"
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
        description: "Trening został utworzony",
      })
      router.push("/")
    } catch (error) {
      console.error("Error creating workout:", error)
      toast("Błąd", {
        description: error instanceof Error ? error.message : "Wystąpił problem podczas tworzenia treningu",
      })
    }
  }

  const handleGenerateAI = async () => {
    setAIGenerating(true)
    try {
      // Tutaj możesz dostosować endpoint do generowania treningów przez AI
      // jeśli taki istnieje w Twoim API
      const response = await fetch("http://localhost:8000/api/generate-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (response.ok) {
        const data = await response.json()
        setInitialWorkout(data)
        setIsAIDialogOpen(false)
        toast("Sukces", {
          description: "AI wygenerowało plan treningowy!",
        })
      } else {
        const errorData = await response.json()
        toast("Błąd", {
          description: errorData.detail || "Nie udało się wygenerować ćwiczeń.",
        })
      }
    } catch (error) {
      console.error("Error generating exercises:", error)
      toast("Błąd", {
        description: "Wystąpił błąd podczas generowania ćwiczeń.",
      })
    } finally {
      setAIGenerating(false)
    }
  }

  return (
    <ContentLayout title="Tworzenie nowego konspektu">
    <div className="space-y-4 container mx-auto px-4 py-8">
      <div className="flex space-x-4">
        <Button onClick={() => setIsAIDialogOpen(true)}>Generuj AI</Button>
      </div>
      <WorkoutPlanner initialWorkout={initialWorkout} onSave={handleSave} />

      {/* Dialog do wprowadzenia promptu */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generuj trening za pomocą AI</DialogTitle>
            <DialogDescription>Wprowadź opis treningu, który chcesz wygenerować.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Np. Trening całego ciała dla początkujących"
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateAI} disabled={aiGenerating}>
              {aiGenerating ? "Generowanie..." : "Generuj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ContentLayout>
  )
}
