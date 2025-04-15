// app/analysers/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Video, Trash2, ExternalLink } from "lucide-react"
import { Analyser, getAnalysers, createAnalyser, deleteAnalyser, uploadVideoFile } from "@/services/analyserService"

export default function AnalysersList() {
  const router = useRouter();
  const [analysers, setAnalysers] = useState<Analyser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAnalyser, setNewAnalyser] = useState({
    name: "",
    video_url: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Pobranie listy analizatorów przy pierwszym renderowaniu
  useEffect(() => {
    fetchAnalysers();
  }, []);

  // Funkcja pobierająca analizatory z API
  const fetchAnalysers = async () => {
    setIsLoading(true);
    try {
      const data = await getAnalysers();
      setAnalysers(data);
      setError(null);
    } catch (err) {
      console.error("Błąd podczas pobierania analizatorów:", err);
      setError("Nie udało się pobrać listy analizatorów. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  // Utworzenie nowego analizatora
  const handleCreateAnalyser = async () => {
    if (!newAnalyser.name) {
      setError("Nazwa wideo jest wymagana");
      return;
    }

    if (!videoFile && !newAnalyser.video_url) {
      setError("Musisz dodać plik wideo lub podać URL");
      return;
    }

    try {
      if (videoFile) {
        try {
          // Wyświetlamy informację o przesyłaniu
          setError("Przesyłanie pliku...");
          
          // Przesyłamy plik na serwer i otrzymujemy URL
          const videoUrl = await uploadVideoFile(videoFile);
          
          // Usuwamy komunikat o przesyłaniu
          setError(null);
          
          console.log("Plik został przesłany, otrzymany URL:", videoUrl);
          
          // Tworzymy analizator z otrzymanym URL
          await createAnalyser({
            name: newAnalyser.name,
            video_url: videoUrl
          });
        } catch (uploadError) {
          console.error("Błąd podczas przesyłania pliku:", uploadError);
          
          // Wyświetlamy szczegółowy komunikat o błędzie
          setError(`Nie udało się przesłać pliku: ${uploadError.message || "Nieznany błąd"}. Spróbuj ponownie lub użyj URL.`);
          return;
        }
      } else {
        // Sprawdź, czy URL wideo jest poprawny
        if (!newAnalyser.video_url.match(/^(http|https):\/\//)) {
          setError("Podaj poprawny URL wideo (musi zaczynać się od http:// lub https://)");
          return;
        }
        
        await createAnalyser(newAnalyser);
      }
      
      setNewAnalyser({
        name: "",
        video_url: "",
      });
      setVideoFile(null);
      setIsDialogOpen(false);
      fetchAnalysers(); // Odświeżenie listy
    } catch (err) {
      console.error("Błąd podczas tworzenia analizatora:", err);
      setError("Nie udało się utworzyć analizatora. Spróbuj ponownie później.");
    }
  };

  // Usunięcie analizatora
  const handleDeleteAnalyser = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć ten analizator?")) {
      return;
    }

    try {
      await deleteAnalyser(id);
      fetchAnalysers(); // Odświeżenie listy
    } catch (err) {
      console.error("Błąd podczas usuwania analizatora:", err);
      setError("Nie udało się usunąć analizatora. Spróbuj ponownie później.");
    }
  };

  // Przejście do strony analizy wideo
  const navigateToAnalyser = (id: number) => {
    router.push(`/analyser/${id}`);
  };

  return (
    <ContentLayout title="Lista wideo">
    <div className="p-6 bg-background">
      <div className="flex justify-between items-center mb-6">   
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Video for Analysis</DialogTitle>
              <DialogDescription>
                Enter the details of the video you want to analyze.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter video name"
                  value={newAnalyser.name}
                  onChange={(e) => setNewAnalyser({...newAnalyser, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  placeholder="Enter video URL"
                  value={newAnalyser.video_url}
                  onChange={(e) => setNewAnalyser({...newAnalyser, video_url: e.target.value})}
                  disabled={!!videoFile}
                />
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    type="button"
                    onClick={() => {
                      // Przykładowy URL do publicznego wideo
                      setNewAnalyser({
                        ...newAnalyser, 
                        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                      });
                      setVideoFile(null);
                    }}
                    className="text-xs text-gray-500"
                  >
                    Use sample video
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Or Upload Video File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setVideoFile(files[0]);
                        // Clear URL if file is selected
                        setNewAnalyser({...newAnalyser, video_url: ""});
                      }
                    }}
                  />
                  {videoFile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setVideoFile(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {videoFile && (
                  <p className="text-sm text-gray-500">Selected: {videoFile.name}</p>
                )}
              </div>
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAnalyser}>Add Video</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <p>Loading videos...</p>
        </div>
      ) : error && analysers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={fetchAnalysers}
          >
            Try Again
          </Button>
        </div>
      ) : analysers.length === 0 ? (
        <div className="text-center py-16 bg-gray-100 rounded-lg">
          <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Videos Yet</h3>
          <p className="text-gray-500 mb-4">Add your first video to start analyzing.</p>
          <Button onClick={() => setIsDialogOpen(true)}>Add New Video</Button>
        </div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysers.map((analyser) => (
            <Card key={analyser.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                {analyser.video_url ? (
                  <>
                    <div className="w-full h-full bg-gray-700">
                      {/* Zamiast próbować ładować wideo, pokazujemy tylko ikonę */}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-12 w-12 text-white opacity-70" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              <CardHeader>
                <CardTitle>{analyser.name}</CardTitle>
                <CardDescription className="truncate">
                  {analyser.video_url}
                </CardDescription>
              </CardHeader>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="ghost" 
                  className="text-red-500" 
                  onClick={() => handleDeleteAnalyser(analyser.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                
                <Button onClick={() => navigateToAnalyser(analyser.id)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
    </ContentLayout>
  )
}