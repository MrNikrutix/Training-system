"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw, ChevronRight, Check, Edit } from "lucide-react"
import { Noto_Sans } from "next/font/google"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
})

// Definicja typów
interface Exercise {
  id: number
  name: string
}

interface WorkoutExercise {
  id?: number
  ex_id: number
  sets: number
  quantity: number | null
  unit: "CZAS" | "ILOŚĆ"
  duration: number | null
  rest: number
  position: number
  name?: string // Pomocnicze pole do wyświetlania
}

interface WorkoutSection {
  id?: number
  work_id?: number
  name: string
  position: number
  exercises?: WorkoutExercise[]
}

interface Workout {
  id: number
  title: string
  description: string | null
  created_at: string
  duration: number | null
  sections: WorkoutSection[]
}

// Typ dla spłaszczonych aktywności
interface WorkoutActivity {
  id: string
  type: "exercise" | "rest"
  name: string
  duration: number | null
  quantity: number | null
  unit: "time" | "reps"
  currentSet: number
  totalSets: number
  sectionName: string
  sectionId: number
  exerciseId: number
}

// Funkcja do spłaszczania aktywności
function flattenActivities(workout: Workout): WorkoutActivity[] {
  if (!workout || !workout.sections) return []

  const activities: WorkoutActivity[] = []

  workout.sections.forEach((section) => {
    if (!section.exercises) return

    section.exercises.forEach((exercise) => {
      // Dla każdego ćwiczenia dodajemy odpowiednią liczbę serii
      for (let set = 1; set <= exercise.sets; set++) {
        // Dodaj ćwiczenie
        activities.push({
          id: `exercise-${section.id || section.position}-${exercise.ex_id}-set-${set}`,
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
            id: `rest-${section.id || section.position}-${exercise.ex_id}-set-${set}`,
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

export default function WorkoutTimer() {
  const [isRepsExercise, setIsRepsExercise] = useState(false)
  const [workoutData, setWorkoutData] = useState<Workout | null>(null)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [activityTimeRemaining, setActivityTimeRemaining] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [completedWorkout, setCompletedWorkout] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSet, setCurrentSet] = useState(1)
  const [allActivities, setAllActivities] = useState<WorkoutActivity[]>([])
  const [notificationPermission, setNotificationPermission] = useState<string>("default")
  const audioContextRef = useRef<AudioContext | null>(null)

  // Utworzenie audio bufferów dla dźwięków
  const shortBeepBufferRef = useRef<AudioBuffer | null>(null)
  const longBeepBufferRef = useRef<AudioBuffer | null>(null)

  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string

  // Inicjalizacja Audio Context i ładowanie dźwięków
  useEffect(() => {
    // Sprawdzamy czy jesteśmy w środowisku przeglądarki
    if (typeof window !== "undefined") {
      // Inicjalizacja AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass()
      }

      // Sprawdzenie/ustawienie uprawnień do powiadomień
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission)

        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            setNotificationPermission(permission)
          })
        }
      }

      // Wczytywanie dźwięków jako bufferów
      const loadSounds = async () => {
        if (!audioContextRef.current) return

        try {
          // Ładowanie krótkiego dźwięku
          const shortBeepResponse = await fetch("/sounds/beep-07a.mp3")
          const shortBeepArrayBuffer = await shortBeepResponse.arrayBuffer()
          shortBeepBufferRef.current = await audioContextRef.current.decodeAudioData(shortBeepArrayBuffer)

          // Ładowanie długiego dźwięku
          const longBeepResponse = await fetch("/sounds/beep-09.mp3")
          const longBeepArrayBuffer = await longBeepResponse.arrayBuffer()
          longBeepBufferRef.current = await audioContextRef.current.decodeAudioData(longBeepArrayBuffer)
        } catch (error) {
          console.error("Błąd ładowania dźwięków:", error)
        }
      }

      loadSounds()

      // Wznowienie AudioContext przy interakcji użytkownika
      const resumeAudioContext = () => {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume()
        }
      }

      // Nasłuchiwanie interakcji użytkownika
      document.addEventListener("click", resumeAudioContext)
      document.addEventListener("touchstart", resumeAudioContext)

      // Obsługa widoczności strony
      document.addEventListener("visibilitychange", handleVisibilityChange)

      return () => {
        document.removeEventListener("click", resumeAudioContext)
        document.removeEventListener("touchstart", resumeAudioContext)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }
  }, [])

  // Obsługa zmiany widoczności strony
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      // Wznów AudioContext gdy strona jest widoczna
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume()
      }
    }
  }

  // Odtwarzanie krótkiego dźwięku - preferowana metoda Web Audio API
  const playShortBeep = () => {
    try {
      // Pierwsza próba: Web Audio API (działa najlepiej w tle)
      if (audioContextRef.current && shortBeepBufferRef.current) {
        const source = audioContextRef.current.createBufferSource()
        source.buffer = shortBeepBufferRef.current
        source.connect(audioContextRef.current.destination)
        source.start()

        // Jeśli strona nie jest widoczna, wyślij powiadomienie
        if (document.visibilityState !== "visible" && notificationPermission === "granted") {
          new Notification("Ćwiczenie kończy się!", {
            silent: true, // bez dźwięku powiadomienia, bo mamy własny dźwięk
          })
        }
      } else {
        // Zapasowa metoda: standardowy HTML5 Audio
        const audio = new Audio("/sounds/beep-07a.mp3")
        const playPromise = audio.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Błąd odtwarzania dźwięku:", error)
            // Jeśli odtwarzanie dźwięku nie jest możliwe, spróbuj powiadomienia
            if (document.visibilityState !== "visible" && notificationPermission === "granted") {
              new Notification("Ćwiczenie kończy się!", {
                silent: false, // z dźwiękiem powiadomienia
              })
            }
          })
        }
      }
    } catch (error) {
      console.error("Błąd odtwarzania krótkiego sygnału:", error)
    }
  }

  // Odtwarzanie długiego dźwięku
  const playLongBeep = () => {
    try {
      // Pierwsza próba: Web Audio API
      if (audioContextRef.current && longBeepBufferRef.current) {
        const source = audioContextRef.current.createBufferSource()
        source.buffer = longBeepBufferRef.current
        source.connect(audioContextRef.current.destination)
        source.start()

        // Wysyłanie powiadomienia, jeśli strona jest w tle
        if (document.visibilityState !== "visible" && notificationPermission === "granted") {
          new Notification("Zmiana ćwiczenia!", {
            body: nextActivity ? `Następne: ${nextActivity.name}` : "Koniec serii",
            silent: true,
          })
        }
      } else {
        // Zapasowa metoda: standardowy HTML5 Audio
        const audio = new Audio("/sounds/beep-09.mp3")
        const playPromise = audio.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Błąd odtwarzania dźwięku:", error)
            // Jeśli odtwarzanie dźwięku nie jest możliwe, spróbuj powiadomienia
            if (document.visibilityState !== "visible" && notificationPermission === "granted") {
              new Notification("Zmiana ćwiczenia!", {
                body: nextActivity ? `Następne: ${nextActivity.name}` : "Koniec serii",
                silent: false, // z dźwiękiem powiadomienia
              })
            }
          })
        }
      }
    } catch (error) {
      console.error("Błąd odtwarzania długiego sygnału:", error)
    }
  }

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (workoutId) {
        // Sprawdź, czy ID to "new" - jeśli tak, przekieruj do strony tworzenia nowego treningu
        if (workoutId === "new") {
          router.push("/workouts/new")
          return
        }

        try {
          setIsLoading(true)
          setError(null)
          const response = await fetch(`http://localhost:8000/api/workouts/${workoutId}`)

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Trening o podanym ID nie istnieje")
            } else {
              throw new Error("Nie udało się pobrać danych treningu")
            }
          }

          const data = await response.json()
          setWorkoutData(data)

          // Konwertuj stary format na nowy format z sekcjami, jeśli to konieczne
          const activities = flattenActivities(data)
          setAllActivities(activities)

          if (activities.length > 0) {
            setActivityTimeRemaining(activities[0]?.duration || 0)
            setIsRepsExercise(activities[0]?.unit === "reps")
            setCurrentSet(activities[0]?.currentSet || 1)
          }
        } catch (err) {
          console.error("Error in fetchWorkoutData:", err)
          setError(err instanceof Error ? err.message : "Nie udało się załadować danych treningu. Spróbuj ponownie.")
          toast("Błąd", {
            description: err instanceof Error ? err.message : "Nie udało się załadować danych treningu",
          })
        } finally {
          setIsLoading(false)
        }
      } else {
        setError("Brak identyfikatora treningu. Sprawdź adres URL.")
        setIsLoading(false)
      }
    }

    fetchWorkoutData()
  }, [workoutId, router])

  const currentActivity = allActivities[currentActivityIndex]
  const nextActivity = allActivities[currentActivityIndex + 1]

  const totalDuration = allActivities.reduce((acc, activity) => acc + (activity.duration || 0), 0)

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    let timerId: NodeJS.Timeout | undefined

    if (isRunning) {
      timerId = setInterval(() => {
        if (currentActivity && currentActivity.unit === "time" && activityTimeRemaining > 0) {
          setActivityTimeRemaining((prev) => prev - 1)
          setTimeElapsed((prev) => prev + 1)

          if (activityTimeRemaining <= 4 && activityTimeRemaining > 1) {
            playShortBeep()
          } else if (activityTimeRemaining === 1) {
            playLongBeep()
          }
        } else if (currentActivity && currentActivity.unit === "time" && activityTimeRemaining === 0) {
          if (currentActivityIndex < allActivities.length - 1) {
            const nextIndex = currentActivityIndex + 1
            setCurrentActivityIndex(nextIndex)
            const nextActivity = allActivities[nextIndex]
            setActivityTimeRemaining(nextActivity.duration || 0)
            setIsRepsExercise(nextActivity.unit === "reps")
            setCurrentSet(nextActivity.currentSet)
          } else {
            setIsRunning(false)
            setCompletedWorkout(true)

            // Powiadomienie o zakończeniu treningu
            if (document.visibilityState !== "visible" && notificationPermission === "granted") {
              new Notification("Trening zakończony! 🎉", {
                body: "Gratulacje! Ukończyłeś swój trening.",
                silent: false,
              })
            }
          }
        }
      }, 1000)

      // Próba utrzymania ekranu włączonego (Wake Lock API)
      if ("wakeLock" in navigator) {
        navigator.wakeLock
          .request("screen")
          .then((wl) => {
            wakeLock = wl

            // Obsługa automatycznego odblokowania ekranu
            wakeLock.addEventListener("release", () => {
              console.log("Wake Lock został zwolniony")
              // Możemy tu podjąć próbę odnowienia blokady
            })
          })
          .catch((e) => console.error("Wake Lock error:", e))
      }

      // Wznowienie Audio Context jeśli jest wstrzymany
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume()
      }
    }

    return () => {
      if (timerId) clearInterval(timerId)
      if (wakeLock) {
        wakeLock.release().catch((e) => console.error("Wake Lock release error:", e))
      }
    }
  }, [
    isRunning,
    activityTimeRemaining,
    currentActivityIndex,
    allActivities,
    currentActivity,
    nextActivity,
    notificationPermission,
  ])

  const handleStart = () => {
    setCompletedWorkout(false)
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentActivityIndex(0)
    setActivityTimeRemaining(allActivities[0]?.duration || 0)
    setTimeElapsed(0)
    setCompletedWorkout(false)
    setIsRepsExercise(allActivities[0]?.unit === "reps")
    setCurrentSet(allActivities[0]?.currentSet || 1)
  }

  const handleSetCurrentActivity = (index: number) => {
    setCurrentActivityIndex(index)
    setActivityTimeRemaining(allActivities[index].duration || 0)
    const elapsed = allActivities.slice(0, index).reduce((acc, activity) => acc + (activity.duration || 0), 0)
    setTimeElapsed(elapsed)
    setCompletedWorkout(false)
    setIsRepsExercise(allActivities[index].unit === "reps")
    setCurrentSet(allActivities[index].currentSet)
  }

  const handleCompleteReps = () => {
    if (currentActivityIndex < allActivities.length - 1) {
      const nextIndex = currentActivityIndex + 1
      setCurrentActivityIndex(nextIndex)
      const nextActivity = allActivities[nextIndex]
      setActivityTimeRemaining(nextActivity.duration || 0)
      setIsRepsExercise(nextActivity.unit === "reps")
      setCurrentSet(nextActivity.currentSet)
    } else {
      setIsRunning(false)
      setCompletedWorkout(true)
    }
  }

  const handleGoBack = () => {
    router.push("/workouts")
  }

  const handleEdit = () => {
    router.push(`/workouts/${workoutId}/edit/`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={handleGoBack}>Wróć do listy treningów</Button>
      </div>
    )
  }

  if (!workoutData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="mb-4">Brak danych treningu.</div>
        <Button onClick={handleGoBack}>Wróć do listy treningów</Button>
      </div>
    )
  }

  return (
    <div
      className={`${notoSans.className} min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 text-white p-8`}
    >
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{workoutData.title}</h1>
          <p className="text-xl text-purple-200">Przygotuj się do treningu!</p>
        </header>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          <ActivityDisplay
            currentActivity={currentActivity}
            nextActivity={nextActivity}
            completedWorkout={completedWorkout}
            isRepsExercise={isRepsExercise}
          />
          {!isRepsExercise ? (
            <>
              <TimerDisplay timeSeconds={activityTimeRemaining} />
              <ProgressBar timeRemaining={activityTimeRemaining} totalDuration={currentActivity?.duration || 0} />
            </>
          ) : (
            <RepsDisplay reps={currentActivity?.quantity} />
          )}
          <SetDisplay currentSet={currentSet} totalSets={currentActivity?.totalSets} />
          <GlobalProgress timeElapsed={timeElapsed} totalDuration={totalDuration} />
          <Controls
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            onCompleteReps={handleCompleteReps}
            isRunning={isRunning}
            isRepsExercise={isRepsExercise}
          />
        </div>

        <WorkoutSetTable
          activities={allActivities}
          currentActivityIndex={currentActivityIndex}
          onSetCurrentActivity={handleSetCurrentActivity}
        />

        <div className="mt-8 text-center flex justify-center gap-4">
          <Button variant="outline" onClick={handleGoBack} className="bg-white/10 hover:bg-white/20 text-white">
            Wróć do listy treningów
          </Button>
          <Button variant="outline" onClick={handleEdit} className="bg-white/10 hover:bg-white/20 text-white">
            <Edit className="mr-2 h-4 w-4" />
            Edytuj trening
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ActivityDisplayProps {
  currentActivity: WorkoutActivity | undefined
  nextActivity: WorkoutActivity | undefined
  completedWorkout: boolean
  isRepsExercise: boolean
}

function ActivityDisplay({ currentActivity, nextActivity, completedWorkout, isRepsExercise }: ActivityDisplayProps) {
  return (
    <div className="text-center mb-8">
      <AnimatePresence mode="wait">
        <motion.h2
          key={`${currentActivity?.id}-${currentActivity?.currentSet}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`text-5xl font-bold mb-4 ${
            currentActivity?.type === "exercise" ? "text-yellow-300" : "text-green-300"
          }`}
        >
          {completedWorkout ? "Trening zakończony! 🎉" : currentActivity?.name}
        </motion.h2>
      </AnimatePresence>
      {!completedWorkout && currentActivity && (
        <p className="text-2xl text-purple-200">
          {isRepsExercise ? `${currentActivity.quantity} powtórzeń` : `${currentActivity.duration} sekund`}
        </p>
      )}
      {!completedWorkout && nextActivity && (
        <p className="text-2xl text-purple-200 mt-2">
          Następnie: {nextActivity.name}
          <ChevronRight className="inline" />
        </p>
      )}
    </div>
  )
}

interface RepsDisplayProps {
  reps: number | string | undefined
}

function RepsDisplay({ reps }: RepsDisplayProps) {
  return (
    <div className="text-8xl font-bold text-center mb-8">
      {reps}
      <span className="text-4xl ml-2">powt.</span>
    </div>
  )
}

interface TimerDisplayProps {
  timeSeconds: number
}

function TimerDisplay({ timeSeconds }: TimerDisplayProps) {
  const minutes = String(Math.floor(timeSeconds / 60)).padStart(2, "0")
  const seconds = String(timeSeconds % 60).padStart(2, "0")

  return (
    <div className="text-8xl font-bold text-center mb-8">
      {minutes}:{seconds}
    </div>
  )
}

interface SetDisplayProps {
  currentSet: number
  totalSets?: number
}

function SetDisplay({ currentSet, totalSets }: SetDisplayProps) {
  return (
    <div className="text-2xl font-bold text-center mb-4">
      Seria {currentSet} z {totalSets || 1}
    </div>
  )
}

interface ProgressBarProps {
  timeRemaining: number
  totalDuration: number
}

function ProgressBar({ timeRemaining, totalDuration }: ProgressBarProps) {
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100 || 0

  return (
    <div className="w-full h-4 bg-white/20 rounded-full mb-8 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-green-400 to-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
}

interface GlobalProgressProps {
  timeElapsed: number
  totalDuration: number
}

function GlobalProgress({ timeElapsed, totalDuration }: GlobalProgressProps) {
  const formatTime = (time: number) => {
    const minutes = String(Math.floor(time / 60)).padStart(2, "0")
    const seconds = String(time % 60).padStart(2, "0")
    return `${minutes}:${seconds}`
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between text-lg mb-2">
        <span>{formatTime(timeElapsed)}</span>
        <span>{formatTime(totalDuration)}</span>
      </div>
      <ProgressBar timeRemaining={totalDuration - timeElapsed} totalDuration={totalDuration} />
    </div>
  )
}

interface ControlsProps {
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onCompleteReps: () => void
  isRunning: boolean
  isRepsExercise: boolean
}

function Controls({ onStart, onPause, onReset, onCompleteReps, isRunning, isRepsExercise }: ControlsProps) {
  return (
    <div className="flex justify-center space-x-6">
      {isRepsExercise ? (
        <button
          onClick={onCompleteReps}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full transition duration-300 flex items-center"
        >
          <Check className="mr-2" />
          Zakończ
        </button>
      ) : (
        <button
          onClick={isRunning ? onPause : onStart}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-full transition duration-300 flex items-center"
        >
          {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
          {isRunning ? "Pauza" : "Start"}
        </button>
      )}
      <button
        onClick={onReset}
        className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-full transition duration-300 flex items-center"
      >
        <RotateCcw className="mr-2" />
        Resetuj
      </button>
    </div>
  )
}

interface WorkoutSetTableProps {
  activities: WorkoutActivity[]
  currentActivityIndex: number
  onSetCurrentActivity: (index: number) => void
}

function WorkoutSetTable({ activities, currentActivityIndex, onSetCurrentActivity }: WorkoutSetTableProps) {
  const totalDuration = activities.reduce((acc, activity) => acc + (activity.duration || 0), 0)
  const totalDurationMinutes = Math.floor(totalDuration / 60)
  const totalDurationSeconds = totalDuration % 60

  return (
    <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl">
      <h3 className="text-2xl font-bold mb-4">Plan treningu</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="py-2 px-4 text-left">Sekcja</th>
              <th className="py-2 px-4 text-left">Aktywność</th>
              <th className="py-2 px-4 text-right">Seria</th>
              <th className="py-2 px-4 text-right">Czas/Powt.</th>
              <th className="py-2 px-4 text-right">Typ</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr
                key={`${activity.id}-${index}`}
                className={`border-b border-white/10 cursor-pointer transition duration-300 ${
                  index === currentActivityIndex ? "bg-white/20" : "hover:bg-white/5"
                }`}
                onClick={() => onSetCurrentActivity(index)}
              >
                <td className="py-2 px-4">{activity.sectionName}</td>
                <td className="py-2 px-4">{activity.name}</td>
                <td className="py-2 px-4 text-right">
                  {activity.currentSet}/{activity.totalSets}
                </td>
                <td className="py-2 px-4 text-right">
                  {activity.unit === "reps"
                    ? `${activity.quantity} powt.`
                    : activity.unit === "time"
                      ? `${activity.duration}s`
                      : "-"}
                </td>
                <td className="py-2 px-4 text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      activity.type === "exercise" ? "bg-yellow-500 text-yellow-900" : "bg-green-500 text-green-900"
                    }`}
                  >
                    {activity.type === "exercise" ? "Ćwiczenie" : "Odpoczynek"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-right text-sm">
        Łączny czas: {totalDurationMinutes} min {totalDurationSeconds} sek
      </p>
    </div>
  )
}
