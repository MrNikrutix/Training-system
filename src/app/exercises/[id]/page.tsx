"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil } from "lucide-react"

interface Exercise {
  id: number
  name: string
  instructions: string | null
  enrichment: string | null
  videoUrl: string | null
  tags: { name: string }[]
}

export default function ExerciseDetails() {
  const params = useParams()
  const router = useRouter()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/exercises/${params.id}`)

        if (!response.ok) {
          throw new Error("Nie udało się pobrać danych ćwiczenia")
        }

        const data = await response.json()
        setExercise(data)
      } catch (error) {
        console.error("Błąd:", error)
        setError("Nie udało się załadować ćwiczenia. Spróbuj ponownie później.")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchExercise()
    }
  }, [params.id])

  if (isLoading) {
    return <div className="container mx-auto py-10 text-center">Ładowanie danych ćwiczenia...</div>
  }

  if (error || !exercise) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center text-red-500">{error || "Nie znaleziono ćwiczenia"}</div>
        <div className="mt-4 text-center">
          <Button onClick={() => router.push("/")}>Powrót do listy ćwiczeń</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Button>
        <Button className="flex items-center gap-2" onClick={() => router.push(`/exercises/${exercise.id}/edit`)}>
          <Pencil className="h-4 w-4" />
          Edytuj ćwiczenie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{exercise.name}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {exercise.tags?.map((tag) => (
              <Badge key={tag.name} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {exercise.instructions && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Instrukcje</h3>
              <div className="prose max-w-none">{exercise.instructions}</div>
            </div>
          )}

          {exercise.enrichment && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Dodatkowe informacje</h3>
              <div className="prose max-w-none">{exercise.enrichment}</div>
            </div>
          )}

          {exercise.videoUrl && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Wideo instruktażowe</h3>
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                <iframe
                  src={exercise.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={`Wideo instruktażowe dla ${exercise.name}`}
                ></iframe>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
