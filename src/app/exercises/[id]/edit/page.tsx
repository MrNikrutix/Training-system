'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Tag {
  id: number
  name: string
}

interface Exercise {
  id: number
  name: string
  instructions: string | null
  enrichment: string | null
  videoUrl: string | null
  tags: Tag[]
}

export default function EditExercise() {
  const params = useParams()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    instructions: "",
    enrichment: "",
    videoUrl: "",
    tag_ids: [] as number[],
  })

  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tags
        const tagsResponse = await fetch("http://localhost:8000/api/tags")
        if (!tagsResponse.ok) {
          throw new Error("Nie udało się pobrać tagów")
        }
        const tagsData = await tagsResponse.json()
        setTags(tagsData)

        // Fetch exercise
        const exerciseResponse = await fetch(`http://localhost:8000/api/exercises/${params.id}`)
        if (!exerciseResponse.ok) {
          throw new Error("Nie udało się pobrać danych ćwiczenia")
        }
        const exerciseData = await exerciseResponse.json()

        setFormData({
          name: exerciseData.name || "",
          instructions: exerciseData.instructions || "",
          enrichment: exerciseData.enrichment || "",
          videoUrl: exerciseData.videoUrl || "",
          tag_ids: exerciseData.tags.map((tag: Tag) => tag.id),
        })

        setSelectedTags(exerciseData.tags)
      } catch (error) {
        console.error("Błąd:", error)
        setError("Nie udało się załadować danych. Spróbuj ponownie później.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

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

    // Check if tag already exists in the available tags
    let tagToAdd = tags.find((tag) => tag.name.toLowerCase() === newTagName.trim().toLowerCase())

    // If tag doesn't exist, create it
    if (!tagToAdd) {
      try {
        const response = await fetch("http://localhost:8000/api/tags", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newTagName.trim() }),
        })

        if (!response.ok) {
          throw new Error("Nie udało się utworzyć nowego tagu")
        }

        const newTag = await response.json()
        tagToAdd = newTag

        // Add the new tag to the available tags list
        setTags((prevTags) => [...prevTags, newTag])
      } catch (error) {
        console.error("Błąd podczas tworzenia tagu:", error)
        return
      }
    }

    // Check if tag is already selected
    if (!selectedTags.some((tag) => tag.id === tagToAdd.id)) {
      setSelectedTags((prev) => [...prev, tagToAdd])
      setFormData((prev) => ({
        ...prev,
        tag_ids: [...prev.tag_ids, tagToAdd.id],
      }))
    }

    // Clear the input
    setNewTagName("")
  }

const handleTagRemove = (tagId: number) => {
  // Create new arrays to avoid reference issues
  const updatedSelectedTags = selectedTags.filter((tag) => tag.id !== tagId);
  const updatedTagIds = formData.tag_ids.filter((id) => id !== tagId);
  
  // Set both states with the new arrays
  setSelectedTags(updatedSelectedTags);
  setFormData({
    ...formData,
    tag_ids: updatedTagIds
  });
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:8000/api/exercises/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Wystąpił błąd podczas zapisywania ćwiczenia")
      }

      // Redirect to exercise details page
      const data = await response.json()
      router.push(`/exercises/${data.id}`)
    } catch (error) {
      console.error("Błąd podczas zapisywania ćwiczenia:", error)
      setError(error instanceof Error ? error.message : "Wystąpił nieznany błąd")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-10 text-center">Ładowanie danych...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Powrót
        </Button>
        <h1 className="text-2xl font-bold ml-4">Edytuj ćwiczenie</h1>
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
                        className="ml-1 rounded-full hover:bg-muted p-0.5">
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
              {isSaving ? "Zapisywanie..." : "Zapisz ćwiczenie"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
