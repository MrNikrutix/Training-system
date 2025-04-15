"use client"

import { useWorkoutContext } from "@/lib/contexts/workout-context"
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { WeekDay } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Copy, Trash2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  dayOfWeek: z.nativeEnum(WeekDay),
  notes: z.string().optional(),
  workId: z.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddEditWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: {
    id?: number
    planId: number
    weekId: number
    dayOfWeek: WeekDay
    name?: string
    description?: string
    notes?: string
    completed?: boolean
    workId?: number
  }
}

export function AddEditWorkoutModal({ open, onOpenChange, initialValues }: AddEditWorkoutModalProps) {
  const { addWorkout, updateWorkout, deleteWorkout, duplicateWorkout } = useWorkoutContext()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isEditing = !!initialValues.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues.name || "",
      description: initialValues.description || "",
      dayOfWeek: initialValues.dayOfWeek,
      notes: initialValues.notes || "",
      workId: initialValues.workId,
    },
  })

  async function onSubmit(values: FormValues) {
    if (isEditing && initialValues.id) {
      await updateWorkout(initialValues.id, values)
    } else {
      await addWorkout({
        ...values,
        planId: initialValues.planId,
        weekId: initialValues.weekId,
        completed: false,
      })
    }
    onOpenChange(false)
  }

  async function handleDelete() {
    if (isEditing && initialValues.id) {
      await deleteWorkout(initialValues.id)
      setIsDeleteDialogOpen(false)
      onOpenChange(false)
    }
  }

  async function handleDuplicate() {
    if (isEditing && initialValues.id) {
      await duplicateWorkout({
        id: initialValues.id,
        planId: initialValues.planId,
        weekId: initialValues.weekId,
        name: form.getValues().name,
        description: form.getValues().description,
        dayOfWeek: form.getValues().dayOfWeek,
        notes: form.getValues().notes,
        workId: form.getValues().workId,
        completed: false,
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Workout" : "Add Workout"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Run" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Easy 5k run" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(WeekDay).map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout ID (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Link to existing workout"
                      value={field.value?.toString() || ""}
                      onChange={(e) => {
                        const value = e.target.value ? Number.parseInt(e.target.value) : undefined
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this workout..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {isEditing && (
                <>
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this workout? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={handleDuplicate}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button type="submit">{isEditing ? "Save Changes" : "Add Workout"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
