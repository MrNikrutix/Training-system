"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout";

interface Exercise {
  id: string
  name: string
  description: string
  videoUrl: string
  tags: { name: string }[]
}

const fetchExercise = async (id: string) => {
  try {
    const response = await fetch(`http://localhost:8000/api/exercises/${id}`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error("Failed to fetch exercise data")
    }

    return await response.json()
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

interface ExerciseDetailsProps {
  params: Promise<{ id: string }> // zmiana tutaj — params jako Promise
}

const ExerciseDetails = ({ params }: ExerciseDetailsProps) => {
  const { id } = use(params) // odpakowujemy parametry
  const router = useRouter()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getExercise = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!id) {
          setError("Invalid exercise ID")
          return
        }

        const data = await fetchExercise(id)

        if (!data) {
          setError("Exercise not found")
          return
        }

        setExercise(data)
      } catch (error) {
        console.error("Error:", error)
        setError("Failed to load exercise. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    getExercise()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="rounded-md border p-6">
          <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-md border p-6">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!exercise) {
    return <div>Exercise not found</div>
  }

  return (
    <ContentLayout title={`Podlgąd ćwiczenia: ${exercise.name}`}>
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
    </ContentLayout>
  )
}

export default ExerciseDetails
