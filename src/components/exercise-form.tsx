"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X } from "lucide-react"
import { FormSkeleton } from "@/components/ui/loading-skeleton"
import { type Tag, type Exercise, type ExerciseFormData, getAllTags, createTag } from "@/lib/api-client"

interface ExerciseFormProps {
  initialData?: Exercise
  onSubmit: (data: ExerciseFormData) => Promise<Exercise>
  submitLabel: string
  isLoading?: boolean
}

export function ExerciseForm({ initialData, onSubmit, submitLabel, isLoading = false }: ExerciseFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: "",
    instructions: "",
    enrichment: "",
    videoUrl: "",
    tag_ids: [], // Initialize as an empty array
  })
  
  // Log initial form data and clean up any undefined tag IDs
  useEffect(() => {
    console.log("Initial form data:", formData);
    
    // Clean up any undefined tag IDs that might be in the initial form data
    if (formData.tag_ids.some(id => id === undefined)) {
      console.log("Found undefined tag IDs in initial form data, cleaning up...");
      setFormData(prev => ({
        ...prev,
        tag_ids: prev.tag_ids.filter(id => id !== undefined)
      }));
    }
  }, [])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(true)

  // Load tags and initialize form data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all available tags
        const tagsData = await getAllTags()
        setTags(tagsData)

        // If we have initial data (editing mode), populate the form
        if (initialData) {
          console.log("Initializing form with data:", initialData);
          
          // Ensure tag_ids is an array
          const tagIds = initialData.tags?.map((tag) => tag.id) || [];
          console.log("Extracted tag IDs:", tagIds);
          
          const formDataToSet = {
            name: initialData.name || "",
            instructions: initialData.instructions || "",
            enrichment: initialData.enrichment || "",
            videoUrl: initialData.videoUrl || "",
            tag_ids: tagIds,
          };
          
          console.log("Setting form data:", formDataToSet);
          setFormData(formDataToSet);

          // Set selected tags based on the exercise's tags
          const tagsToSet = initialData.tags || [];
          console.log("Setting selected tags:", tagsToSet);
          setSelectedTags(tagsToSet);
        }
      } catch (error) {
        console.error("Error loading form data:", error)
        setError("Nie udało się załadować danych. Spróbuj ponownie później.")
      } finally {
        setIsFormLoading(false)
      }
    }

    loadData()
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagName(e.target.value)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTagName.trim()) {
      e.preventDefault()
      addTag()
    }
  }

  const addTag = async () => {
    if (!newTagName.trim()) return

    try {
      // Check if tag already exists in the available tags
      let tagToAdd = tags.find((tag) => tag.name.toLowerCase() === newTagName.trim().toLowerCase())

      // If tag doesn't exist, create it
      if (!tagToAdd) {
        try {
          tagToAdd = await createTag(newTagName.trim())
          console.log("Created new tag:", tagToAdd);
          
          // Add the new tag to the available tags list
          setTags((prevTags) => [...prevTags, tagToAdd])
        } catch (createError) {
          console.error("Error creating tag:", createError);
          setError("Nie udało się utworzyć nowego tagu. Spróbuj ponownie.");
          return;
        }
      }

      // Ensure the tag has a valid ID before adding it
      if (tagToAdd && typeof tagToAdd.id === 'number') {
        // Check if tag is already selected
        if (!selectedTags.some((tag) => tag.id === tagToAdd.id)) {
          // Create a new array with the updated selected tags
          const newSelectedTags = [...selectedTags, tagToAdd];
          setSelectedTags(newSelectedTags);
          
          // Create a new array with the updated tag IDs
          const newTagIds = [...formData.tag_ids.filter(id => id !== undefined), tagToAdd.id];
          
          // Update the form data with the new tag IDs
          setFormData({
            ...formData,
            tag_ids: newTagIds,
          });
          
          // Log for debugging
          console.log("Added tag:", tagToAdd);
          console.log("Updated selected tags:", newSelectedTags);
          console.log("Updated tag_ids:", newTagIds);
        } else {
          console.log("Tag already selected:", tagToAdd);
        }
      } else {
        console.error("Invalid tag object or missing ID:", tagToAdd);
        setError("Nie udało się dodać tagu - brak poprawnego ID.");
        
        // Refresh the tags list to ensure we have the latest data
        try {
          const refreshedTags = await getAllTags();
          setTags(refreshedTags);
        } catch (refreshError) {
          console.error("Error refreshing tags:", refreshError);
        }
      }

      // Clear the input
      setNewTagName("")
    } catch (error) {
      console.error("Błąd podczas tworzenia tagu:", error)
      setError("Nie udało się dodać tagu. Spróbuj ponownie.")
    }
  }

  const handleTagRemove = (tagId: number) => {
    if (tagId === undefined) {
      console.error("Attempted to remove tag with undefined ID");
      return;
    }
    
    // Create new arrays to avoid reference issues
    const updatedSelectedTags = selectedTags.filter((tag) => tag.id !== tagId);
    
    // Filter out undefined values and the tag ID to be removed
    const updatedTagIds = formData.tag_ids
      .filter(id => id !== undefined && id !== tagId);

    // Set both states with the new arrays
    setSelectedTags(updatedSelectedTags);
    setFormData({
      ...formData,
      tag_ids: updatedTagIds,
    });
    
    // Log for debugging
    console.log("Removed tag ID:", tagId);
    console.log("Updated selected tags:", updatedSelectedTags);
    console.log("Updated tag_ids:", updatedTagIds);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // Basic validation
      if (!formData.name.trim()) {
        throw new Error("Nazwa ćwiczenia jest wymagana")
      }

      // Log the form data being sent to the API
      console.log("Submitting form data:", formData);
      console.log("Selected tags:", selectedTags);
      console.log("Tag IDs being sent:", formData.tag_ids);

      // Submit the form data
      const result = await onSubmit(formData)

      // Redirect to the exercise details page
      router.push(`/exercises/${result.id}`)
    } catch (error) {
      console.error("Błąd podczas zapisywania ćwiczenia:", error)
      
      // Improved error handling to display more user-friendly messages
      if (error instanceof Error) {
        // Check if the error message is a JSON string (sometimes happens with API errors)
        try {
          const parsedError = JSON.parse(error.message);
          if (typeof parsedError === 'object' && parsedError !== null) {
            // Format the error object into a readable message
            const errorMessages = Object.entries(parsedError)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            setError(errorMessages);
          } else {
            setError(error.message);
          }
        } catch {
          // If it's not a JSON string, just use the error message directly
          setError(error.message);
        }
      } else {
        setError("Wystąpił nieznany błąd");
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || isFormLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="flex items-center gap-2" disabled>
            <ArrowLeft className="h-4 w-4" />
            Powrót
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Informacje o ćwiczeniu</CardTitle>
          </CardHeader>
          <CardContent>
            <FormSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Powrót
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informacje o ćwiczeniu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="name">Nazwa ćwiczenia *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instrukcje</Label>
              <Textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrichment">Dodatkowe informacje</Label>
              <Textarea
                id="enrichment"
                name="enrichment"
                value={formData.enrichment}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL do wideo</Label>
              <Input
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagInput">Tagi</Label>
              <div className="flex gap-2">
                <Input
                  id="tagInput"
                  value={newTagName}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Wpisz nazwę tagu i naciśnij Enter lub dodaj"
                />
                <Button type="button" onClick={addTag} variant="outline" className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Wpisz nazwę tagu i naciśnij Enter lub kliknij przycisk Dodaj
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.length > 0 ? (
                  selectedTags.map((tag) => (
                    <Badge key={`tag-${tag.id}`} variant="secondary" className="flex items-center gap-1">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag.id)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Usuń tag {tag.name}</span>
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Brak wybranych tagów</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : submitLabel}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
