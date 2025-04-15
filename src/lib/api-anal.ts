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

export const getCroppedVideos = async (annotationId: number): Promise<CroppedVideo[]> => {
  const response = await axios.get(`${API_URL}/analysers/annotations/${annotationId}/cropped-videos`);
  return response.data;
};