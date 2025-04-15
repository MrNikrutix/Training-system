import type { Plan, Week, Workout, WeekDay } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper function for API requests
async function fetchAPI<T>(endpoint: string, method = "GET", data?: any): Promise<T> {
  const url = `${API_URL}${endpoint}`
  console.log(`API Request: ${method} ${url}`);
  
  if (data) {
    console.log("Request data:", data);
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, options)
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json()
      console.error("API Error:", error);
      throw new Error(error.detail || "An error occurred")
    }

    if (response.status === 204) {
      return {} as T
    }

    const responseData = await response.json();
    console.log("Response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Plans API
export const plansAPI = {
  getAll: async (): Promise<Plan[]> => {
    return fetchAPI<Plan[]>("/api/plans")
  },

  getById: async (id: string): Promise<Plan> => {
    return fetchAPI<Plan>(`/api/plans/${id}`)
  },

  create: async (data: { name: string; eventDate?: string }): Promise<Plan> => {
    return fetchAPI<Plan>("/api/plans", "POST", {
      name: data.name,
      event_date: data.eventDate,
    })
  },

  update: async (id: string, data: { name?: string; eventDate?: string }): Promise<Plan> => {
    return fetchAPI<Plan>(`/api/plans/${id}`, "PUT", {
      name: data.name,
      event_date: data.eventDate,
    })
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/api/plans/${id}`, "DELETE")
  },
}

// Weeks API
export const weeksAPI = {
  getByPlanId: async (planId: string): Promise<Week[]> => {
    console.log("API call to get weeks for planId:", planId);
    const weeksFromApi = await fetchAPI<any[]>(`/api/plans/${planId}/weeks`);
    console.log("Received weeks from API:", weeksFromApi);
    
    // Mapujemy dane z API na strukturę oczekiwaną przez aplikację
    const weeks = weeksFromApi.map(week => ({
      id: week.id,
      planId: Number(week.plan_id), // Konwertujemy plan_id na planId
      position: week.position,
      notes: week.notes
    }));
    
    console.log("Mapped weeks:", weeks);
    return weeks;
  },

  create: async (data: { planId: string; position: number; notes?: string }): Promise<Week> => {
    console.log("API call to create week with data:", {
      plan_id: data.planId,
      position: data.position,
      notes: data.notes,
    });
    
    const weekFromApi = await fetchAPI<any>("/api/plans/weeks", "POST", {
      plan_id: data.planId,
      position: data.position,
      notes: data.notes,
    });
    
    console.log("Received week from API:", weekFromApi);
    
    // Mapujemy dane z API na strukturę oczekiwaną przez aplikację
    const week: Week = {
      id: weekFromApi.id,
      planId: Number(weekFromApi.plan_id), // Konwertujemy plan_id na planId
      position: weekFromApi.position,
      notes: weekFromApi.notes
    };
    
    console.log("Mapped week:", week);
    return week;
  },

  update: async (id: string, data: { position?: number; notes?: string }): Promise<Week> => {
    console.log("API call to update week with id:", id, "and data:", data);
    
    const weekFromApi = await fetchAPI<any>(`/api/plans/weeks/${id}`, "PUT", {
      position: data.position,
      notes: data.notes,
    });
    
    console.log("Received updated week from API:", weekFromApi);
    
    // Mapujemy dane z API na strukturę oczekiwaną przez aplikację
    const week: Week = {
      id: weekFromApi.id,
      planId: Number(weekFromApi.plan_id), // Konwertujemy plan_id na planId
      position: weekFromApi.position,
      notes: weekFromApi.notes
    };
    
    console.log("Mapped updated week:", week);
    return week;
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/api/plans/weeks/${id}`, "DELETE")
  },
}

// Workouts API
export const workoutsAPI = {
  getByWeekId: async (weekId: string): Promise<Workout[]> => {
    console.log("API call to get workouts for weekId:", weekId);
    const workoutsFromApi = await fetchAPI<any[]>(`/api/plans/weeks/${weekId}/workouts`);
    console.log("Received workouts from API:", workoutsFromApi);
    
    // Mapujemy dane z API na strukturę oczekiwaną przez aplikację
    const workouts = workoutsFromApi.map(workout => ({
      id: workout.id,
      planId: Number(workout.plan_id),
      weekId: Number(workout.week_id),
      name: workout.name,
      description: workout.description,
      dayOfWeek: workout.day_of_week,
      completed: workout.completed,
      notes: workout.notes,
      workId: workout.work_id
    }));
    
    console.log("Mapped workouts:", workouts);
    return workouts;
  },

  create: async (data: {
    planId: string
    weekId: string
    name?: string
    description?: string
    dayOfWeek: WeekDay
    completed: boolean
    notes?: string
    workId?: number
  }): Promise<Workout> => {
    return fetchAPI<Workout>("/api/plans/workouts", "POST", {
      plan_id: data.planId,
      week_id: data.weekId,
      name: data.name,
      description: data.description,
      day_of_week: data.dayOfWeek,
      completed: data.completed,
      notes: data.notes,
      work_id: data.workId,
    })
  },

  update: async (
    id: string,
    data: {
      name?: string
      description?: string
      dayOfWeek?: WeekDay
      completed?: boolean
      notes?: string
      workId?: number
      weekId?: number
    },
  ): Promise<Workout> => {
    return fetchAPI<Workout>(`/api/plans/workouts/${id}`, "PUT", {
      name: data.name,
      description: data.description,
      day_of_week: data.dayOfWeek,
      completed: data.completed,
      notes: data.notes,
      work_id: data.workId,
      week_id: data.weekId,
    })
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/api/plans/workouts/${id}`, "DELETE")
  },
}
