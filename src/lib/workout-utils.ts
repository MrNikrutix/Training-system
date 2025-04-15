import type { Workout, WorkoutActivity } from "./workout"

export function flattenActivities(workout: Workout): WorkoutActivity[] {
  if (!workout || !workout.sections) return []

  const activities: WorkoutActivity[] = []

  workout.sections.forEach((section) => {
    if (!section.exercises) return

    section.exercises.forEach((exercise) => {
      // Dla każdego ćwiczenia dodajemy odpowiednią liczbę serii
      for (let set = 1; set <= exercise.sets; set++) {
        // Dodaj ćwiczenie
        activities.push({
          id: `exercise-${exercise.ex_id}-set-${set}`,
          type: "exercise",
          name: exercise.name || `Ćwiczenie ${exercise.ex_id}`,
          duration: exercise.unit === "CZAS" ? exercise.duration : null,
          quantity: exercise.unit === "ILOŚĆ" ? exercise.quantity : null,
          unit: exercise.unit === "CZAS" ? "time" : "reps",
          currentSet: set,
          totalSets: exercise.sets,
          sectionName: section.name,
          sectionId: section.id || 0,
          exerciseId: exercise.ex_id,
        })

        // Dodaj odpoczynek po ćwiczeniu (oprócz ostatniej serii)
        if (set < exercise.sets || exercise !== section.exercises[section.exercises.length - 1]) {
          activities.push({
            id: `rest-${exercise.ex_id}-set-${set}`,
            type: "rest",
            name: "Odpoczynek",
            duration: exercise.rest,
            quantity: null,
            unit: "time",
            currentSet: set,
            totalSets: exercise.sets,
            sectionName: section.name,
            sectionId: section.id || 0,
            exerciseId: exercise.ex_id,
          })
        }
      }
    })
  })

  return activities
}
