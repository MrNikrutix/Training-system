'use client'
import { Button } from "@/components/ui/button"
import { Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useState, useEffect } from "react"
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import Link from 'next/link';
async function getExercises() {
  try {
    const data = await fetch("http://localhost:8000/api/exercises", {
      next: { revalidate: 60 }, // Cache data for 60 seconds
    })

    if (!data.ok) throw new Error("Failed to fetch exercises")

    return data.json()
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return []
  }
}

export default function Home() {
  const [exercises, setExercises] = useState<any[]>([]) // Definiowanie stanu dla ćwiczeń
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [exerciseToDelete, setExerciseToDelete] = useState<number | null>(null)

  // Pobieranie ćwiczeń po załadowaniu komponentu
  useEffect(() => {
    const fetchData = async () => {
      const exercisesData = await getExercises()
      setExercises(exercisesData)
    }

    fetchData()
  }, []) // Uruchomienie raz, przy załadowaniu komponentu

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/exercises/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Usunięcie ćwiczenia ze stanu po pomyślnym usunięciu
        setExercises(exercises.filter((exercise) => exercise.id !== id))
      } else {
        console.error("Błąd podczas usuwania ćwiczenia")
      }
    } catch (error) {
      console.error("Błąd podczas usuwania ćwiczenia:", error)
    } finally {
      setDeleteDialogOpen(false)
      setExerciseToDelete(null)
    }
  }

  const confirmDelete = (id: number) => {
    setExerciseToDelete(id)
    setDeleteDialogOpen(true)
  }

  if (!exercises || exercises.length === 0) {
    return (
      <ContentLayout title="Lista ćwiczeń">
        <div className="container mx-auto py-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Ćwiczenia</h1>
            <Button className="flex items-center gap-2" asChild>
              <Link href="/exercises/new">
                <Plus className="h-4 w-4" />
                Utwórz nowe
              </Link>
            </Button>
          </div>
          <div className="text-center py-10">
            <p className="text-muted-foreground">Brak ćwiczeń. Utwórz nowe ćwiczenie, aby rozpocząć.</p>
          </div>
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Lista ćwiczeń">
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <Button className="flex items-center gap-2" asChild>
            <Link href="/exercises/new">
              <Plus className="h-4 w-4" />
              Utwórz nowe
            </Link>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Tagi</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {item.tags && item.tags.length > 0 ? (
                      item.tags.map((tag) => (
                        <Badge key={tag.id || tag.name} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">Brak tagów</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Podgląd" asChild>
                      <a href={`/exercises/${item.id}`}>
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" title="Edytuj" asChild>
                      <a href={`/exercises/${item.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" title="Usuń" onClick={() => confirmDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć to ćwiczenie?</AlertDialogTitle>
              <AlertDialogDescription>
                Ta akcja jest nieodwracalna. Ćwiczenie zostanie trwale usunięte z systemu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => exerciseToDelete && handleDelete(exerciseToDelete)}
                className="bg-red-500 hover:bg-red-600"
              >
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ContentLayout>
  )
}
