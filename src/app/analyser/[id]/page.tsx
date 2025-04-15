// app/analyser/[id]/page.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Separator } from "@/components/ui/separator"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Flag,
  Trash2,
  ChevronRight,
  ChevronDown,
  Save,
  Scissors,
  ArrowLeft,
} from "lucide-react"
import { 
  Analyser, 
  AnnotationAnalyser, 
  getAnalyser, 
  getAnnotations, 
  createAnnotation, 
  updateAnnotation, 
  deleteAnnotation,
  createCroppedVideo
} from "@/services/analyserService"

export default function AnalyserPage() {
  const params = useParams();
  const router = useRouter();
  const analyserId = parseInt(params.id as string);

  const [analyser, setAnalyser] = useState<Analyser | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationAnalyser[]>([]);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [isRangeStarted, setIsRangeStarted] = useState(false);
  const [rangeStartTime, setRangeStartTime] = useState<number | null>(null);
  const [expandedAnnotation, setExpandedAnnotation] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);

  const [newAnnotation, setNewAnnotation] = useState({
    title: "",
    description: "",
    color: "#FF5733",
    time_from: "00:00:00", // Format time (HH:MM:SS)
    time_to: null as string | null,
    saved: false
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Pobierz dane analizatora i adnotacje
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const analyserData = await getAnalyser(analyserId);
        setAnalyser(analyserData);
        
        const annotationsData = await getAnnotations(analyserId);
        setAnnotations(annotationsData);
        
        setError(null);
      } catch (err) {
        console.error("Błąd podczas pobierania danych:", err);
        setError("Nie udało się pobrać danych analizatora. Spróbuj ponownie później.");
      } finally {
        setIsLoading(false);
      }
    };

    if (analyserId) {
      fetchData();
    }
  }, [analyserId]);

  // Obsługa zdarzeń wideo
  useEffect(() => {
    console.log("Video effect running");
    const video = videoRef.current;
    if (!video) {
      console.log("Video element not found in effect - will try again when analyser is loaded");
      return;
    }
    
    console.log("Adding video event listeners");

    const setVideoData = () => {
      console.log("Video metadata loaded, duration:", video.duration);
      
      // Sprawdź, czy duration jest poprawne
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        console.log("Setting duration to:", video.duration);
        setDuration(video.duration);
        
        // Jeśli mamy już ustawiony currentTime, upewnijmy się, że jest poprawny
        if (video.currentTime && !isNaN(video.currentTime)) {
          console.log("Setting current time to:", video.currentTime);
          setCurrentTime(video.currentTime);
        }
      } else {
        console.warn("Invalid duration:", video.duration);
        
        // Spróbujmy jeszcze raz uzyskać duration
        setTimeout(() => {
          if (video && video.duration && !isNaN(video.duration) && video.duration > 0) {
            console.log("Retry: Setting duration to:", video.duration);
            setDuration(video.duration);
          }
        }, 1000); // Spróbuj ponownie po 1 sekundzie
      }
    };

    const updateTime = () => {
      if (!video) return; // Safety check
      
      console.log("Time update:", video.currentTime, "Duration:", video.duration);
      
      // Sprawdź, czy currentTime jest poprawny
      if (!isNaN(video.currentTime)) {
        setCurrentTime(video.currentTime);
        
        // Jeśli duration nie jest jeszcze ustawione, a mamy poprawne video.duration, ustawmy je
        if (duration === 0 && video.duration && !isNaN(video.duration) && video.duration > 0) {
          console.log("Setting duration from timeupdate:", video.duration);
          setDuration(video.duration);
        }
      }
    };

    // Dodatkowe funkcje do logowania zdarzeń
    const handleLoadStart = () => console.log("Video: loadstart");
    const handleLoadedData = () => console.log("Video: loadeddata");
    const handleCanPlay = () => console.log("Video: canplay");
    const handleCanPlayThrough = () => console.log("Video: canplaythrough");
    const handlePlay = () => console.log("Video: play event");
    const handlePause = () => console.log("Video: pause event");
    const handleSeeking = () => console.log("Video: seeking to", video.currentTime);
    const handleSeeked = () => console.log("Video: seeked to", video.currentTime);
    const handleVolumeChange = () => console.log("Video: volume changed to", video.volume, "muted:", video.muted);
    const handleError = () => console.error("Video: error event", video.error);
    
    // Główne zdarzenia
    video.addEventListener("loadedmetadata", setVideoData);
    video.addEventListener("loadeddata", setVideoData);
    video.addEventListener("durationchange", setVideoData);
    video.addEventListener("timeupdate", updateTime);
    
    // Dodatkowe zdarzenia do debugowania
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("canplaythrough", handleCanPlayThrough);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("error", handleError);

    return () => {
      // Safety check before removing event listeners
      if (!video) return;
      
      // Usuwanie głównych zdarzeń
      video.removeEventListener("loadedmetadata", setVideoData);
      video.removeEventListener("loadeddata", setVideoData);
      video.removeEventListener("durationchange", setVideoData);
      video.removeEventListener("timeupdate", updateTime);
      
      // Usuwanie dodatkowych zdarzeń
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("error", handleError);
    };
  }, [analyser, videoError, duration]);

  // Przełącznik Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) {
      console.error("Video element not found");
      return;
    }

    console.log("Toggle play, current state:", isPlaying);
    
    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
        console.log("Video paused");
      } else {
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          // Set playing state only after promise resolves
          playPromise
            .then(() => {
              console.log("Video playing");
              setIsPlaying(true);
            })
            .catch(error => {
              console.error("Error playing video:", error);
              // Autoplay was prevented, show a UI element to let the user manually start playback
              setIsPlaying(false);
            });
        } else {
          // For older browsers that don't return a promise
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Error toggling play state:", error);
      setIsPlaying(false);
    }
  };

  // Przewijanie do przodu/tyłu
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) {
      console.error("Video element not found");
      return;
    }

    console.log("Skip", seconds, "seconds, current time:", video.currentTime, "duration:", video.duration);
    
    try {
      if (video.duration > 0) {
        const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        video.currentTime = newTime;
        console.log("New time:", newTime);
      } else {
        console.warn("Cannot skip, duration is not available");
      }
    } catch (error) {
      console.error("Error skipping video:", error);
    }
  };

  // Obsługa zmiany głośności
  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) {
      console.error("Video element not found");
      return;
    }

    try {
      const newVolume = value[0];
      console.log("Volume change:", newVolume);
      
      setVolume(newVolume);
      video.volume = newVolume;
      setIsMuted(newVolume === 0);
    } catch (error) {
      console.error("Error changing volume:", error);
    }
  };

  // Wyciszenie
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) {
      console.error("Video element not found");
      return;
    }

    console.log("Toggle mute, current state:", isMuted, "current volume:", volume);
    
    try {
      if (isMuted) {
        video.volume = volume;
        setIsMuted(false);
        console.log("Unmuted, volume set to:", volume);
      } else {
        video.volume = 0;
        setIsMuted(true);
        console.log("Muted");
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  // Formatowanie czasu (sekundy na MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) {
      return "00:00";
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Obsługa kliknięcia na pasku postępu
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const video = videoRef.current;
    
    if (!progressBar) {
      console.error("Progress bar element not found");
      return;
    }
    
    if (!video) {
      console.error("Video element not found");
      return;
    }

    try {
      const rect = progressBar.getBoundingClientRect();
      
      // Ensure click is within the bounds of the progress bar
      if (e.clientX < rect.left || e.clientX > rect.right) {
        console.warn("Click outside progress bar bounds");
        return;
      }
      
      // Calculate position as percentage (0-1)
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      console.log("Progress bar click, position:", pos, "duration:", video.duration);
      
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        const newTime = pos * video.duration;
        video.currentTime = newTime;
        console.log("New time:", newTime);
        
        // Update current time state immediately for better UI responsiveness
        setCurrentTime(newTime);
      } else {
        console.warn("Cannot seek, duration is not available or invalid:", video.duration);
      }
    } catch (error) {
      console.error("Error seeking video:", error);
    }
  };

  // Konwersja czasu wideo do formatu time (HH:MM:SS)
  const videoTimeToTimeString = (seconds: number) => {
    // Handle invalid inputs
    if (isNaN(seconds) || seconds < 0) {
      console.warn("Invalid time value:", seconds);
      seconds = 0;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Dodaj nową adnotację lub rozpocznij zakres
  const addAnnotation = async () => {
    const video = videoRef.current;
    if (!video) return;

    // Jeśli jesteśmy w trybie zakresu i nie rozpoczęliśmy jeszcze zakresu
    if (isRangeMode && !isRangeStarted) {
      // Zapisz czas początkowy zakresu
      setRangeStartTime(video.currentTime);
      setIsRangeStarted(true);
      return;
    }

    // Jeśli nie mamy tytułu lub analizatora, nie możemy dodać adnotacji
    if (!newAnnotation.title || !analyser) {
      if (isRangeStarted) {
        // Jeśli rozpoczęliśmy zakres, ale nie mamy tytułu, wyświetl błąd
        setError("Please enter a title for the annotation");
      }
      return;
    }

    try {
      // Przygotuj dane adnotacji
      const annotationData = {
        analyser_id: analyser.id,
        time_from: isRangeStarted && rangeStartTime !== null 
          ? videoTimeToTimeString(rangeStartTime) 
          : videoTimeToTimeString(video.currentTime),
        time_to: isRangeStarted ? videoTimeToTimeString(video.currentTime) : null,
        title: newAnnotation.title,
        description: newAnnotation.description || null,
        color: newAnnotation.color,
        saved: false
      };

      // Zapisz adnotację w API
      const savedAnnotation = await createAnnotation(annotationData);
      
      // Dodaj do lokalnego stanu
      setAnnotations([...annotations, savedAnnotation]);
      
      // Resetuj formularz i stan zakresu
      setNewAnnotation({
        title: "",
        description: "",
        color: "#FF5733",
        time_from: "00:00:00", // Format time (HH:MM:SS)
        time_to: null,
        saved: false
      });
      
      setIsRangeStarted(false);
      setRangeStartTime(null);
      
      setError(null);
    } catch (err) {
      console.error("Błąd podczas dodawania adnotacji:", err);
      setError("Nie udało się dodać adnotacji. Spróbuj ponownie później.");
    }
  };

  // Usuń adnotację
  const deleteAnnotationHandler = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tę adnotację?")) return;

    try {
      await deleteAnnotation(id);
      setAnnotations(annotations.filter(anno => anno.id !== id));
      setError(null);
    } catch (err) {
      console.error("Błąd podczas usuwania adnotacji:", err);
      setError("Nie udało się usunąć adnotacji. Spróbuj ponownie później.");
    }
  };

  // Zapisz fragment wideo
  const saveVideoClip = async (annotation: AnnotationAnalyser) => {
    if (annotation.saved) return; // Już zapisano
    
    if (!analyser || !annotation.time_from || !annotation.time_to) {
      setError("Brak wymaganych danych do zapisania fragmentu wideo.");
      return;
    }

    try {
      // Aktualizuj status 'saved' adnotacji
      const updatedAnnotation = await updateAnnotation(annotation.id, {
        saved: true
      });

      // Utwórz przycięte wideo
      let croppedVideoCreated = false;
      try {
        const videoUrl = analyser?.video_url || '';
        if (!videoUrl) {
          throw new Error("Video URL is empty");
        }
        
        const baseUrl = videoUrl.includes('.') 
          ? videoUrl.split('.').slice(0, -1).join('.') 
          : videoUrl;
        
        await createCroppedVideo({
          anno_id: annotation.id,
          video_url: `${baseUrl}_clip_${annotation.id}.mp4`, // Przykładowy URL
          crop_id: 1 // Przykładowe ID przycięcia
        });
        
        croppedVideoCreated = true;
        console.log("Utworzono przycięte wideo dla adnotacji:", annotation.id);
      } catch (cropError) {
        console.error("Błąd podczas tworzenia przyciętego wideo:", cropError);
        // Nie przerywamy całego procesu, jeśli ta część się nie powiedzie
      }

      // Aktualizuj lokalny stan adnotacji
      setAnnotations(annotations.map(anno => 
        anno.id === annotation.id ? {...anno, saved: true} : anno
      ));
      
      setError(null);
      
      // Informuj użytkownika o częściowym sukcesie, jeśli przycięcie się nie powiodło
      if (!croppedVideoCreated) {
        console.warn("Annotation marked as saved, but video clip creation failed");
      }
    } catch (err) {
      console.error("Błąd podczas zapisywania fragmentu wideo:", err);
      setError("Nie udało się zapisać fragmentu wideo. Spróbuj ponownie później.");
    }
  };
  
  // Powrót do listy analizatorów
  const goBack = () => {
    router.push("/analyser");
  };

  // Przeskocz do czasu adnotacji
  const jumpToAnnotation = (annotation: AnnotationAnalyser) => {
    const video = videoRef.current;
    if (!video) {
      console.error("Video element not found");
      return;
    }

    console.log("Jump to annotation:", annotation.title, "time:", annotation.time_from);
    
    try {
      if (!annotation.time_from) {
        console.error("Annotation has no time_from value");
        return;
      }
      
      // Konwertuj string time (HH:MM:SS) na sekundy
      const timeParts = annotation.time_from.split(':');
      
      // Validate time format
      if (timeParts.length !== 3) {
        console.error("Invalid time format:", annotation.time_from);
        return;
      }
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = parseInt(timeParts[2], 10);
      
      // Check for NaN values
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.error("Invalid time values in:", annotation.time_from);
        return;
      }
      
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      console.log("Converted time:", totalSeconds, "seconds");
      
      // Ensure we don't seek beyond the video duration
      if (video.duration && totalSeconds > video.duration) {
        console.warn("Seeking time exceeds video duration, clamping to duration");
        video.currentTime = video.duration;
      } else {
        video.currentTime = totalSeconds;
      }
      
      console.log("Set current time to:", video.currentTime);
      
      if (!isPlaying) {
        console.log("Video not playing, starting playback");
        togglePlay();
      }
    } catch (error) {
      console.error("Error jumping to annotation:", error);
    }
  };

  // Funkcja goBack już zdefiniowana wyżej

  if (isLoading) {
    return (
      <div className="p-6 bg-background">
        <div className="text-center py-10">
          <p>Loading analyzer data...</p>
        </div>
      </div>
    );
  }

  if (error && !analyser) {
    return (
      <div className="p-6 bg-background">
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={goBack}
          >
            Back to Analyzers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ContentLayout title={`Podlgąd ćwiczenia: ${analyser?.name}`}>
    <div className="p-6 bg-background">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold"></h1>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3">
          {/* Odtwarzacz wideo */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {!analyser?.video_url && (
              <div className="w-full aspect-video flex items-center justify-center bg-gray-800">
                <p className="text-white">No video available</p>
              </div>
            )}
            
            {analyser?.video_url && videoError && (
              <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-800 p-4">
                <p className="text-white mb-4">Unable to load video. The video format may be unsupported or the URL may be invalid.</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(analyser.video_url, '_blank')}
                  >
                    Open Video in New Tab
                  </Button>
                  <Button 
                    onClick={() => setVideoError(false)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            
            {analyser?.video_url && !videoError && (
              <video
                ref={videoRef}
                className="w-full aspect-video"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  console.log("Video loaded metadata:", e.currentTarget.duration);
                  if (e.currentTarget.duration && !isNaN(e.currentTarget.duration) && e.currentTarget.duration > 0) {
                    setDuration(e.currentTarget.duration);
                  }
                }}
                onDurationChange={(e) => {
                  console.log("Video duration changed:", e.currentTarget.duration);
                  if (e.currentTarget.duration && !isNaN(e.currentTarget.duration) && e.currentTarget.duration > 0) {
                    setDuration(e.currentTarget.duration);
                  }
                }}
                onTimeUpdate={(e) => {
                  if (!isNaN(e.currentTarget.currentTime)) {
                    setCurrentTime(e.currentTarget.currentTime);
                  }
                }}
                controls={false}
                preload="auto"
                onError={(e) => {
                  const videoElement = e.currentTarget;
                  const errorCode = videoElement.error ? videoElement.error.code : 'unknown';
                  const errorMessage = videoElement.error ? videoElement.error.message : 'unknown error';
                  console.error(`Video error event triggered: Code ${errorCode}, Message: ${errorMessage}`);
                  setVideoError(true);
                }}
                playsInline
                crossOrigin="anonymous"
                src={analyser.video_url}
              >
                <p className="text-white text-center p-4">
                  Your browser doesn't support HTML5 video. Here is a 
                  <a href={analyser.video_url} className="text-blue-400 underline ml-1">
                    link to the video
                  </a> instead.
                </p>
              </video>
            )}

            {/* Kontrolki wideo */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Pasek postępu */}
              <div
                ref={progressBarRef}
                className="relative h-2 bg-gray-600 rounded-full mb-4 cursor-pointer"
                onClick={handleProgressBarClick}
              >
                <div
                  className="absolute h-full bg-red-500 rounded-full"
                  style={{ 
                    width: `${duration > 0 && !isNaN(currentTime) && !isNaN(duration) ? 
                      Math.min(100, (currentTime / duration) * 100) : 0}%` 
                  }}
                />
                
                {/* Wskaźnik zakresu */}
                {isRangeStarted && rangeStartTime !== null && duration > 0 && (
                  <div
                    className="absolute h-full bg-green-500 opacity-40"
                    style={{ 
                      left: `${Math.min(100, (rangeStartTime / duration) * 100)}%`,
                      width: `${Math.min(100, ((currentTime - rangeStartTime) / duration) * 100)}%` 
                    }}
                  />
                )}

                {/* Znaczniki adnotacji */}
                {annotations.map((annotation) => {
                  // Konwersja czasu z formatu time (HH:MM:SS) do sekund
                  const timeFromParts = annotation.time_from.split(':');
                  const timeFromHours = parseInt(timeFromParts[0], 10);
                  const timeFromMinutes = parseInt(timeFromParts[1], 10);
                  const timeFromSeconds = parseInt(timeFromParts[2], 10);
                  const timeFromSec = timeFromHours * 3600 + timeFromMinutes * 60 + timeFromSeconds;
                  
                  // Pozycja znacznika na pasku
                  const position = duration > 0 ? (timeFromSec / duration) * 100 : 0;
                  
                  // Zakres (jeśli time_to istnieje)
                  let rangeWidth = 0;
                  if (annotation.time_to) {
                    const timeToParts = annotation.time_to.split(':');
                    const timeToHours = parseInt(timeToParts[0], 10);
                    const timeToMinutes = parseInt(timeToParts[1], 10);
                    const timeToSeconds = parseInt(timeToParts[2], 10);
                    const timeToSec = timeToHours * 3600 + timeToMinutes * 60 + timeToSeconds;
                    rangeWidth = duration > 0 ? ((timeToSec - timeFromSec) / duration) * 100 : 0;
                  }
                  
                  return (
                    <div key={annotation.id}>
                      {/* Marker czasu */}
                      <div
                        className="absolute top-0 w-1 h-4 -mt-1 cursor-pointer transform -translate-x-1/2"
                        style={{
                          left: `${position}%`,
                          backgroundColor: annotation.color,
                        }}
                        title={annotation.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToAnnotation(annotation);
                        }}
                      />
                      
                      {/* Zakres (jeśli istnieje) */}
                      {annotation.time_to && rangeWidth > 0 && (
                        <div
                          className="absolute top-0 h-2 opacity-40 cursor-pointer"
                          style={{
                            left: `${position}%`,
                            width: `${rangeWidth}%`,
                            backgroundColor: annotation.color,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            jumpToAnnotation(annotation);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Kontrolki */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => skip(-5)}>
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => skip(5)}>
                    <SkipForward className="h-5 w-5" />
                  </Button>

                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>

                  <div className="w-24">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formularz adnotacji */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Add Action Annotation</h3>
            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Action title"
                    value={newAnnotation.title}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, title: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    type="color"
                    value={newAnnotation.color}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                </div>
              </div>
              
              <Textarea
                placeholder="Describe the action..."
                value={newAnnotation.description || ""}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, description: e.target.value })}
              />
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="range-mode"
                    checked={isRangeMode}
                    onCheckedChange={(checked) => {
                      setIsRangeMode(checked);
                      // Resetuj stan zakresu przy zmianie trybu
                      if (!checked) {
                        setIsRangeStarted(false);
                        setRangeStartTime(null);
                      }
                    }}
                  />
                  <Label htmlFor="range-mode">Range Mode</Label>
                </div>
                
                {isRangeMode && (
                  <div className="text-sm text-gray-500">
                    {isRangeStarted 
                      ? `Range started at ${formatTime(rangeStartTime || 0)}. Current time will be set as end time.` 
                      : "Current time will be set as start time. End time will be set when you add the annotation."}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={addAnnotation} 
                  className={`flex-1 ${isRangeStarted ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {isRangeMode && !isRangeStarted 
                    ? "Start Range at Current Time" 
                    : isRangeStarted 
                      ? "End Range and Add Annotation" 
                      : "Add Annotation at Current Time"}
                </Button>
                
                {isRangeStarted && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setIsRangeStarted(false);
                      setRangeStartTime(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-1/3 mt-6 lg:mt-0">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Annotations</h3>
            
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            
            {annotations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No annotations yet. Add your first annotation.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {annotations.map((annotation) => (
                  <div 
                    key={annotation.id} 
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedAnnotation(expandedAnnotation === annotation.id ? null : annotation.id)}
                      style={{ borderLeft: `4px solid ${annotation.color}` }}
                    >
                      <div>
                        <h4 className="font-medium">{annotation.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>
                            {annotation.time_from}
                          </span>
                          {annotation.time_to && (
                            <>
                              <span>-</span>
                              <span>
                                {annotation.time_to}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            jumpToAnnotation(annotation);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        {expandedAnnotation === annotation.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    
                    {expandedAnnotation === annotation.id && (
                      <div className="p-3 border-t">
                        {annotation.description && (
                          <p className="text-sm text-gray-700 mb-3">{annotation.description}</p>
                        )}
                        
                        <div className="flex justify-between">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500" 
                            onClick={() => deleteAnnotationHandler(annotation.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={annotation.saved}
                            onClick={() => saveVideoClip(annotation)}
                            className="flex items-center gap-1"
                          >
                            {annotation.saved ? (
                              <>
                                <Save className="h-4 w-4" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Scissors className="h-4 w-4" />
                                Save Clip
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ContentLayout>
  );
}