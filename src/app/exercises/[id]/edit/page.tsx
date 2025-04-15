"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ExerciseForm } from "@/components/exercise-form"
import { getExerciseById, updateExercise } from "@/lib/api-client"
import { ContentLayout } from "@/components/admin-panel/content-layout";

// Add these functions before the EditExercise component
const fetchTags = async () => {
  try {
    const response = await fetch("http://localhost:8000/api/tags")
    if (!response.ok) throw new Error("Failed to fetch tags")
    return await response.json()
  } catch (error) {
    console.error("Error fetching tags:", error)
    throw error
  }
}

const fetchExercise = async (id: string) => {
  try {
    const response = await fetch(`http://localhost:8000/api/exercises/${id}`)
    if (!response.ok) throw new Error("Failed to fetch exercise data")
    return await response.json()
  } catch (error) {
    console.error("Error fetching exercise:", error)
    throw error
  }
}

const createTag = async (name: string) => {
  try {
    const response = await fetch("http://localhost:8000/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    if (!response.ok) throw new Error("Failed to create new tag")
    return await response.json()
  } catch (error) {
    console.error("Error creating tag:", error)
    throw error
  }
}

const EditExercise = () => {
  const params = useParams()
  const [exercise, setExercise] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setIsLoading(true)
        const data = await getExerciseById(params.id as string)
        setExercise(data)
      } catch (error) {
        console.error("Error fetching exercise:", error)
        setError("Nie udało się załadować ćwiczenia")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchExercise()
    }
  }, [params.id])

  const handleSubmit = async (formData) => {
    return updateExercise(params.id as string, formData)
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">{error}</div>
  }

  return (
     <ContentLayout title={`Edycja ćwiczenia: ${params.id}`}>
    <ExerciseForm
      initialData={exercise}
      submitLabel="Zapisz zmiany"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
    </ContentLayout>
  )
}

export default EditExercise
