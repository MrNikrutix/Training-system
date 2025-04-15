"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, X } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Definicja enum dla jednostek ćwiczenia
enum ExerciseUnit {
  TIME = "CZAS",
  QUANTITY = "ILOŚĆ",
}

// Definicje typów na podstawie zaktualizowanego API
interface Exercise {
  id: number
  name: string
  instructions?: string | null
  enrichment?: string | null
  videoUrl?: string | null
  tags?: { id: number; name: string }[]
}

interface WorkoutExercise {
  ex_id: number
  name?: string // Pomocnicze pole do wyświetlania
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

interface WorkoutPlannerProps {
  initialWorkout: any | null // Typ dla danych inicjalnych (opcjonalnie używany przy generowaniu AI lub edycji)
  onSave: (workout: WorkoutCreate) => void
  isEditMode?: boolean
}

export default function WorkoutPlanner({ initialWorkout, onSave, isEditMode = false }: WorkoutPlannerProps) {
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [workout, setWorkout] = useState<WorkoutCreate>({
    title: "",
    description: "",
    duration: 0,
    sections: [
      {
        name: "Sekcja 1",
        position: 0,
        exercises: [],
      },
    ],
  })

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/exercises")
        if (!response.ok) {
          throw new Error("Nie udało się pobrać ćwiczeń")
        }
        const data = await response.json()
        setAvailableExercises(data)
      } catch (error) {
        console.error("Error fetching exercises:", error)
        toast("Błąd", {
          description: "Nie udało się pobrać listy ćwiczeń",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchExercises()
  }, [])

  // Inicjalizacja treningu z danych inicjalnych (AI lub edycja)
  useEffect(() => {
    if (initialWorkout) {
      // Mapowanie danych z API do formatu komponentu
      const mappedWorkout: WorkoutCreate = {
        title: initialWorkout.title || "",
        description: initialWorkout.description || "",
        duration: initialWorkout.duration || 0,
        sections: [],
      }

      // Jeśli mamy sekcje w initialWorkout, mapujemy je
      if (initialWorkout.sections && Array.isArray(initialWorkout.sections)) {
        mappedWorkout.sections = initialWorkout.sections.map((section: any, index: number) => {
          // Przygotuj ćwiczenia dla sekcji
          let exercises: WorkoutExercise[] = []

          // Sprawdź, czy sekcja ma ćwiczenia
          if (section.exercises && Array.isArray(section.exercises)) {
            exercises = section.exercises.map((ex: any) => ({
              ex_id: ex.ex_id,
              name: ex.name || `Ćwiczenie ${ex.ex_id}`,
              sets: ex.sets || 3,
              quantity: ex.unit === ExerciseUnit.QUANTITY ? ex.quantity : null,
              unit: ex.unit || ExerciseUnit.QUANTITY,
              duration: ex.unit === ExerciseUnit.TIME ? ex.duration : null,
              rest: ex.rest || 60,
              position: ex.position || 0,
            }))
          }

          return {
            name: section.name || `Sekcja ${index + 1}`,
            position: section.position || index,
            exercises: exercises,
          }
        })
      } else {
        // Jeśli nie ma sekcji, dodajemy domyślną
        mappedWorkout.sections = [
          {
            name: "Sekcja 1",
            position: 0,
            exercises: [],
          },
        ]
      }

      setWorkout(mappedWorkout)
    }
  }, [initialWorkout])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkout({ ...workout, title: e.target.value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWorkout({ ...workout, description: e.target.value })
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    setWorkout({ ...workout, duration: value })
  }

  const handleSectionNameChange = (index: number, name: string) => {
    const updatedSections = [...workout.sections]
    updatedSections[index].name = name
    setWorkout({ ...workout, sections: updatedSections })
  }

  const addSection = () => {
    const newSection: WorkoutSection = {
      name: `Sekcja ${workout.sections.length + 1}`,
      position: workout.sections.length,
      exercises: [],
    }
    setWorkout({ ...workout, sections: [...workout.sections, newSection] })
  }

  const removeSection = (index: number) => {
    if (workout.sections.length <= 1) {
      toast("Uwaga", {
        description: "Trening musi zawierać co najmniej jedną sekcję",
      })
      return
    }

    const updatedSections = workout.sections.filter((_, i) => i !== index)
    // Aktualizacja pozycji sekcji
    const reorderedSections = updatedSections.map((section, i) => ({
      ...section,
      position: i,
    }))
    setWorkout({ ...workout, sections: reorderedSections })
  }

  const moveSection = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === workout.sections.length - 1)) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updatedSections = [...workout.sections]
    const temp = updatedSections[index]
    updatedSections[index] = updatedSections[newIndex]
    updatedSections[newIndex] = temp

    // Aktualizacja pozycji sekcji
    const reorderedSections = updatedSections.map((section, i) => ({
      ...section,
      position: i,
    }))
    setWorkout({ ...workout, sections: reorderedSections })
  }

  const addExerciseToSection = (sectionIndex: number, exercise: Exercise) => {
    const updatedSections = [...workout.sections]
    const newExercise: WorkoutExercise = {
      ex_id: exercise.id,
      name: exercise.name, // Dodajemy nazwę dla wygody wyświetlania
      sets: 3,
      quantity: 10,
      unit: ExerciseUnit.QUANTITY, // Domyślna jednostka to ILOŚĆ
      duration: null,
      rest: 60,
      position: updatedSections[sectionIndex].exercises.length,
    }
    updatedSections[sectionIndex].exercises.push(newExercise)
    setWorkout({ ...workout, sections: updatedSections })
  }

  const removeExerciseFromSection = (sectionIndex: number, exerciseIndex: number) => {
    const updatedSections = [...workout.sections]
    updatedSections[sectionIndex].exercises = updatedSections[sectionIndex].exercises.filter(
      (_, i) => i !== exerciseIndex,
    )
    // Aktualizacja pozycji ćwiczeń
    updatedSections[sectionIndex].exercises = updatedSections[sectionIndex].exercises.map((ex, i) => ({
      ...ex,
      position: i,
    }))
    setWorkout({ ...workout, sections: updatedSections })
  }

  const updateExerciseDetails = (
    sectionIndex: number,
    exerciseIndex: number,
    field: keyof WorkoutExercise,
    value: number | ExerciseUnit,
  ) => {
    const updatedSections = [...workout.sections]
    updatedSections[sectionIndex].exercises[exerciseIndex][field] = value
    setWorkout({ ...workout, sections: updatedSections })
  }

  const moveExercise = (sectionIndex: number, exerciseIndex: number, direction: "up" | "down") => {
    if (
      (direction === "up" && exerciseIndex === 0) ||
      (direction === "down" && exerciseIndex === workout.sections[sectionIndex].exercises.length - 1)
    ) {
      return
    }

    const newIndex = direction === "up" ? exerciseIndex - 1 : exerciseIndex + 1
    const updatedSections = [...workout.sections]
    const temp = updatedSections[sectionIndex].exercises[exerciseIndex]
    updatedSections[sectionIndex].exercises[exerciseIndex] = updatedSections[sectionIndex].exercises[newIndex]
    updatedSections[sectionIndex].exercises[newIndex] = temp

    // Aktualizacja pozycji ćwiczeń
    updatedSections[sectionIndex].exercises = updatedSections[sectionIndex].exercises.map((ex, i) => ({
      ...ex,
      position: i,
    }))
    setWorkout({ ...workout, sections: updatedSections })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!workout.title.trim()) {
      toast("Błąd", {
        description: "Tytuł treningu jest wymagany",
      })
      return
    }

    // Sprawdzenie czy każda sekcja ma co najmniej jedno ćwiczenie
    const emptySections = workout.sections.filter((section) => section.exercises.length === 0)
    if (emptySections.length > 0) {
      toast("Błąd", {
        description: "Każda sekcja musi zawierać co najmniej jedno ćwiczenie",
      })
      return
    }

    // Przygotowanie danych do wysłania - usunięcie pomocniczych pól i konwersja typów
    const workoutToSave: WorkoutCreate = {
      ...workout,
      sections: workout.sections.map((section) => ({
        ...section,
        exercises: section.exercises.map(({ name, ...exercise }) => ({
          ...exercise,
          // Upewniamy się, że ex_id jest liczbą
          ex_id: typeof exercise.ex_id === "string" ? Number.parseInt(exercise.ex_id) : exercise.ex_id,
          // Ustaw odpowiednie wartości w zależności od jednostki
          quantity: exercise.unit === ExerciseUnit.QUANTITY ? exercise.quantity : null,
          duration: exercise.unit === ExerciseUnit.TIME ? exercise.duration : null,
        })),
      })),
    }

    console.log("Sending workout data:", JSON.stringify(workoutToSave, null, 2))
    onSave(workoutToSave)
  }

  const filteredExercises = availableExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lewa kolumna - Baza ćwiczeń */}
        <Card className="w-full md:w-1/2">
          <CardHeader>
            <CardTitle>Baza ćwiczeń</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Szukaj ćwiczeń..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredExercises.length === 0 ? (
                  <div className="col-span-full text-center p-4 text-muted-foreground">
                    Nie znaleziono ćwiczeń pasujących do wyszukiwania
                  </div>
                ) : (
                  filteredExercises.map((exercise) => (
                    <div key={exercise.id} className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
                      <span className="text-sm font-medium">{exercise.name}</span>
                      <div className="flex gap-2">
                        {workout.sections.map((_, sectionIndex) => (
                          <Button
                            key={sectionIndex}
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              addExerciseToSection(sectionIndex, exercise)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {sectionIndex + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prawa kolumna - Konspekt treningu */}
        <Card className="w-full md:w-1/2">
          <CardHeader>
            <CardTitle>{isEditMode ? "Edycja konspektu" : "Konspekt treningu"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Nazwa treningu *
              </label>
              <Input
                id="title"
                value={workout.title}
                onChange={handleTitleChange}
                placeholder="Np. Trening nóg"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Opis
              </label>
              <Textarea
                id="description"
                value={workout.description || ""}
                onChange={handleDescriptionChange}
                placeholder="Krótki opis treningu"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Czas trwania (minuty)
              </label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={workout.duration || ""}
                onChange={handleDurationChange}
                placeholder="Np. 45"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Sekcje treningu</label>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    addSection()
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj sekcję
                </Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {workout.sections.map((section, sectionIndex) => (
                  <Card key={sectionIndex} className="border border-muted">
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <Input
                            value={section.name}
                            onChange={(e) => handleSectionNameChange(sectionIndex, e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              moveSection(sectionIndex, "up")
                            }}
                            disabled={sectionIndex === 0}
                            className="h-7 w-7"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              moveSection(sectionIndex, "down")
                            }}
                            disabled={sectionIndex === workout.sections.length - 1}
                            className="h-7 w-7"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              removeSection(sectionIndex)
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      {section.exercises.length === 0 ? (
                        <div className="h-16 border-2 border-dashed border-muted rounded-md flex items-center justify-center text-muted-foreground">
                          Dodaj ćwiczenia z bazy ćwiczeń
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {section.exercises.map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="border rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-medium flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <span>{exercise.name || `Ćwiczenie ${exercise.ex_id}`}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      moveExercise(sectionIndex, exerciseIndex, "up")
                                    }}
                                    disabled={exerciseIndex === 0}
                                    className="h-6 w-6"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      moveExercise(sectionIndex, exerciseIndex, "down")
                                    }}
                                    disabled={exerciseIndex === section.exercises.length - 1}
                                    className="h-6 w-6"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      removeExerciseFromSection(sectionIndex, exerciseIndex)
                                    }}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="text-xs font-medium">Serie</label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={exercise.sets}
                                    onChange={(e) =>
                                      updateExerciseDetails(
                                        sectionIndex,
                                        exerciseIndex,
                                        "sets",
                                        Number.parseInt(e.target.value) || 1,
                                      )
                                    }
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Jednostka</label>
                                  <Select
                                    value={exercise.unit}
                                    onValueChange={(value) =>
                                      updateExerciseDetails(sectionIndex, exerciseIndex, "unit", value as ExerciseUnit)
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Wybierz jednostkę" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={ExerciseUnit.QUANTITY}>ILOŚĆ</SelectItem>
                                      <SelectItem value={ExerciseUnit.TIME}>CZAS</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {exercise.unit === ExerciseUnit.QUANTITY ? (
                                  <div>
                                    <label className="text-xs font-medium">Powtórzenia</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={exercise.quantity || 0}
                                      onChange={(e) =>
                                        updateExerciseDetails(
                                          sectionIndex,
                                          exerciseIndex,
                                          "quantity",
                                          Number.parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="text-xs font-medium">Czas (s)</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={exercise.duration || 0}
                                      onChange={(e) =>
                                        updateExerciseDetails(
                                          sectionIndex,
                                          exerciseIndex,
                                          "duration",
                                          Number.parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                )}
                                <div>
                                  <label className="text-xs font-medium">Odpoczynek (s)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={exercise.rest}
                                    onChange={(e) =>
                                      updateExerciseDetails(
                                        sectionIndex,
                                        exerciseIndex,
                                        "rest",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
            >
              {isEditMode ? "Zapisz zmiany" : "Zapisz trening"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
