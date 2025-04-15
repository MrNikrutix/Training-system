/**
 * API client for the exercises application
 * This file centralizes all API calls to avoid duplication
 */

// Base API URL - could be moved to an environment variable
const API_BASE_URL = "http://localhost:8000/api"

// Types
export interface Tag {
  id: number
  name: string
}

export interface Exercise {
  id: number
  name: string
  instructions: string | null
  enrichment: string | null
  videoUrl: string | null
  tags: Tag[]
}

// Update the ExerciseFormData interface to match the form component
export interface ExerciseFormData {
  name: string
  instructions: string
  enrichment: string
  videoUrl: string
  tag_ids: number[]
}

// API functions
export async function getAllExercises() {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`, {
      next: { revalidate: 60 }, // Cache data for 60 seconds
    })

    if (!response.ok) throw new Error("Failed to fetch exercises")

    return (await response.json()) as Exercise[]
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return []
  }
}

export async function getExerciseById(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      next: { revalidate: 60 }, // Cache data for 60 seconds
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error("Failed to fetch exercise data")
    }

    return (await response.json()) as Exercise
  } catch (error) {
    console.error("Error fetching exercise:", error)
    throw error
  }
}

// Update the createExercise function to accept the ExerciseFormData type
export async function createExercise(data: ExerciseFormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Error creating exercise")
    }

    return (await response.json()) as Exercise
  } catch (error) {
    console.error("Error creating exercise:", error)
    throw error
  }
}

// Update the updateExercise function to accept the ExerciseFormData type
export async function updateExercise(id: string, data: ExerciseFormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Error updating exercise")
    }

    return (await response.json()) as Exercise
  } catch (error) {
    console.error("Error updating exercise:", error)
    throw error
  }
}

export async function deleteExercise(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) throw new Error("Failed to delete exercise")

    return true
  } catch (error) {
    console.error("Error deleting exercise:", error)
    throw error
  }
}

export async function getAllTags() {
  try {
    const response = await fetch(`${API_BASE_URL}/tags`)

    if (!response.ok) throw new Error("Failed to fetch tags")

    return (await response.json()) as Tag[]
  } catch (error) {
    console.error("Error fetching tags:", error)
    throw error
  }
}

export async function createTag(name: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })

    if (!response.ok) throw new Error("Failed to create new tag")

    return (await response.json()) as Tag
  } catch (error) {
    console.error("Error creating tag:", error)
    throw error
  }
}
