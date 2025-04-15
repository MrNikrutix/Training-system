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
    // Log the data being sent to the API
    console.log("API createExercise - Data being sent:", JSON.stringify(data, null, 2));
    
    // Ensure tag_ids is an array of valid IDs (no undefined values)
    const processedData = {
      ...data,
      tag_ids: Array.isArray(data.tag_ids) 
        ? data.tag_ids.filter(id => id !== undefined && typeof id === 'number') 
        : []
    };
    
    console.log("API createExercise - Processed data:", JSON.stringify(processedData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(processedData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log("API createExercise - Error response:", JSON.stringify(errorData, null, 2));
      
      // Handle case where errorData might be an object with validation errors
      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.detail) {
          throw new Error(errorData.detail);
        } else {
          // Format validation errors into a readable message
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          throw new Error(errorMessages || "Error creating exercise");
        }
      } else {
        throw new Error("Error creating exercise");
      }
    }

    const result = await response.json();
    console.log("API createExercise - Success response:", JSON.stringify(result, null, 2));
    return result as Exercise;
  } catch (error) {
    console.error("Error creating exercise:", error)
    throw error
  }
}

// Update the updateExercise function to accept the ExerciseFormData type
export async function updateExercise(id: string, data: ExerciseFormData) {
  try {
    // Log the data being sent to the API
    console.log("API updateExercise - Data being sent:", JSON.stringify(data, null, 2));
    
    // Ensure tag_ids is an array of valid IDs (no undefined values)
    const processedData = {
      ...data,
      tag_ids: Array.isArray(data.tag_ids) 
        ? data.tag_ids.filter(id => id !== undefined && typeof id === 'number') 
        : []
    };
    
    console.log("API updateExercise - Processed data:", JSON.stringify(processedData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(processedData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log("API updateExercise - Error response:", JSON.stringify(errorData, null, 2));
      
      // Handle case where errorData might be an object with validation errors
      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.detail) {
          throw new Error(errorData.detail);
        } else {
          // Format validation errors into a readable message
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          throw new Error(errorMessages || "Error updating exercise");
        }
      } else {
        throw new Error("Error updating exercise");
      }
    }

    const result = await response.json();
    console.log("API updateExercise - Success response:", JSON.stringify(result, null, 2));
    return result as Exercise;
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
    console.log("Creating tag with name:", name.trim());
    
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log("Error creating tag - response:", errorData);
        
        // Handle case where errorData might be an object with validation errors
        if (typeof errorData === 'object' && errorData !== null) {
          if (errorData.detail) {
            throw new Error(errorData.detail);
          } else {
            // Format validation errors into a readable message
            const errorMessages = Object.entries(errorData)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            throw new Error(errorMessages || "Failed to create new tag");
          }
        } else {
          throw new Error("Failed to create new tag");
        }
      } catch (jsonError) {
        throw new Error("Failed to create new tag");
      }
    }

    const tagData = await response.json();
    console.log("Created tag - response:", tagData);
    
    // Check if the tag has an ID
    if (!tagData || typeof tagData.id === 'undefined') {
      console.log("Tag created without ID, fetching all tags to find the newly created tag");
      
      // If the tag doesn't have an ID, fetch all tags and find the one with the matching name
      const allTags = await getAllTags();
      const createdTag = allTags.find(tag => tag.name.toLowerCase() === name.trim().toLowerCase());
      
      if (createdTag && typeof createdTag.id !== 'undefined') {
        console.log("Found tag with ID:", createdTag);
        return createdTag;
      } else {
        console.error("Could not find the newly created tag with name:", name.trim());
        throw new Error("Could not retrieve ID for the newly created tag");
      }
    }
    
    return tagData as Tag;
  } catch (error) {
    console.error("Error creating tag:", error)
    throw error
  }
}
