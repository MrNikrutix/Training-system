"use client"

import { useState } from "react"
import { ExerciseForm } from "@/components/exercise-form"
import { createExercise } from "@/lib/api-client"
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function NewExercisePage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <ContentLayout title={`Tworzenie nowego treningu`} >
    <ExerciseForm
      submitLabel="Zapisz ćwiczenie"
      onSubmit={createExercise}
      isLoading={isLoading}
    />
    </ContentLayout>
  )
}
