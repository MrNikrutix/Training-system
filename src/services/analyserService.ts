import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Typy danych
export interface Analyser {
  id: number;
  name: string;
  video_url: string;
  annotations?: AnnotationAnalyser[];
}

export interface AnnotationAnalyser {
  id: number;
  analyser_id: number;
  time_from: string;
  time_to: string | null;
  title: string;
  description: string | null;
  color: string;
  saved: boolean;
  cropped_videos?: CroppedVideo[];
}

export interface CroppedVideo {
  id: number;
  anno_id: number;
  video_url: string;
  crop_id: number;
}

export interface Exercise {
  id: number;
  name: string;
  instructions: string | null;
  enrichment: string | null;
  videoUrl: string | null;
  tags?: { id: number; name: string }[];
}

export interface ExerciseCreate {
  name: string;
  instructions: string;
  enrichment: string;
  videoUrl: string;
  tag_ids: number[];
}

export interface AnalyserCreate {
  name: string;
  video_url: string;
}

export interface AnnotationCreate {
  analyser_id: number;
  time_from: string;
  time_to: string | null;
  title: string;
  description: string | null;
  color: string;
  saved: boolean;
}

export interface CroppedVideoCreate {
  anno_id: number;
  video_url: string;
  crop_id: number;
}

// Funkcje API dla analizatorów
export const getAnalysers = async (): Promise<Analyser[]> => {
  const response = await axios.get(`${API_URL}/analysers/`);
  return response.data;
};

export const getAnalyser = async (id: number): Promise<Analyser> => {
  const response = await axios.get(`${API_URL}/analysers/${id}`);
  return response.data;
};

export const createAnalyser = async (analyser: AnalyserCreate): Promise<Analyser> => {
  const response = await axios.post(`${API_URL}/analysers/`, analyser);
  return response.data;
};

export const updateAnalyser = async (id: number, analyser: AnalyserCreate): Promise<Analyser> => {
  const response = await axios.put(`${API_URL}/analysers/${id}`, analyser);
  return response.data;
};

export const deleteAnalyser = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/analysers/${id}`);
};

// Funkcje API dla adnotacji
export const getAnnotations = async (analyserId: number): Promise<AnnotationAnalyser[]> => {
  const response = await axios.get(`${API_URL}/analysers/${analyserId}/annotations`);
  return response.data;
};

export const createAnnotation = async (annotation: AnnotationCreate): Promise<AnnotationAnalyser> => {
  const response = await axios.post(
    `${API_URL}/analysers/${annotation.analyser_id}/annotations`, 
    annotation
  );
  return response.data;
};

export const updateAnnotation = async (id: number, annotation: Partial<AnnotationCreate>): Promise<AnnotationAnalyser> => {
  const response = await axios.put(`${API_URL}/analysers/annotations/${id}`, annotation);
  return response.data;
};

export const deleteAnnotation = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/analysers/annotations/${id}`);
};

// Funkcje API dla przyciętych wideo
export const createCroppedVideo = async (croppedVideo: CroppedVideoCreate): Promise<CroppedVideo> => {
  const response = await axios.post(
    `${API_URL}/analysers/annotations/${croppedVideo.anno_id}/cropped-videos`, 
    croppedVideo
  );
  return response.data;
};

// Funkcja do wycinania fragmentu wideo na serwerze
export const cropVideo = async (annotationId: number, exerciseName?: string): Promise<CroppedVideo> => {
  // Najpierw sprawdź, czy FFmpeg jest zainstalowany
  try {
    const ffmpegCheck = await checkFFmpeg();
    console.log("FFmpeg check result:", ffmpegCheck);
    
    if (ffmpegCheck.status !== 'ok') {
      throw new Error(`FFmpeg nie jest dostępny: ${ffmpegCheck.message}`);
    }
  } catch (error) {
    console.error("Błąd podczas sprawdzania FFmpeg:", error);
    // Kontynuuj mimo błędu sprawdzania, API może mieć własną logikę obsługi
  }
  
  // Pobierz informacje o adnotacji, aby użyć jej tytułu jako nazwy ćwiczenia
  const annotation = await axios.get(`${API_URL}/analysers/annotations/${annotationId}`);
  const annotationData = annotation.data;
  
  // Utwórz ćwiczenie przed wycięciem wideo
  const exerciseData: ExerciseCreate = {
    name: exerciseName || annotationData.title || `Ćwiczenie z adnotacji ${annotationId}`,
    instructions: annotationData.description || '',
    enrichment: '',
    videoUrl: '', // Zostanie zaktualizowane po wycięciu wideo
    tag_ids: []
  };
  
  console.log("Tworzenie ćwiczenia:", exerciseData);
  const exercise = await createExercise(exerciseData);
  console.log("Utworzono ćwiczenie:", exercise);
  
  // Teraz wytnij wideo i powiąż je z utworzonym ćwiczeniem
  const response = await axios.post(
    `${API_URL}/analysers/annotations/${annotationId}/crop-video`,
    { exercise_id: exercise.id } // Przekaż ID utworzonego ćwiczenia
  );
  
  // Zaktualizuj ćwiczenie z URL wideo
  if (response.data && response.data.video_url) {
    await axios.put(`${API_URL}/exercises/${exercise.id}`, {
      ...exerciseData,
      videoUrl: response.data.video_url
    });
  }
  
  return response.data;
};

// Funkcja do sprawdzania, czy FFmpeg jest zainstalowany
export const checkFFmpeg = async (): Promise<{status: string, message: string}> => {
  const response = await axios.get(`${API_URL}/analysers/check-ffmpeg`);
  return response.data;
};

// Funkcja do sprawdzania, czy plik istnieje
export const checkFile = async (filePath: string): Promise<{
  status: string, 
  message: string, 
  path?: string, 
  size?: number, 
  modified?: number,
  checked_paths?: string[]
}> => {
  const response = await axios.get(`${API_URL}/analysers/check-file`, {
    params: { file_path: filePath }
  });
  return response.data;
};

export const getCroppedVideos = async (annotationId: number): Promise<CroppedVideo[]> => {
  const response = await axios.get(`${API_URL}/analysers/annotations/${annotationId}/cropped-videos`);
  return response.data;
};

// Funkcja do przesyłania plików wideo
export const uploadVideoFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.url;
};

// Funkcje API dla ćwiczeń
export const createExercise = async (exercise: ExerciseCreate): Promise<Exercise> => {
  const response = await axios.post(`${API_URL}/exercises`, exercise);
  return response.data;
};