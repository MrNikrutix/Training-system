import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface CropVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (exerciseName: string) => void;
  defaultName: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

export function CropVideoModal({
  isOpen,
  onClose,
  onConfirm,
  defaultName,
  status,
  message
}: CropVideoModalProps) {
  const [exerciseName, setExerciseName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exerciseName.trim()) {
      onConfirm(exerciseName);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && status !== 'loading' && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {status === 'idle' && "Zapisz fragment wideo jako ćwiczenie"}
            {status === 'loading' && "Przetwarzanie..."}
            {status === 'success' && "Sukces!"}
            {status === 'error' && "Wystąpił błąd"}
          </DialogTitle>
          <DialogDescription>
            {status === 'idle' && "Podaj nazwę ćwiczenia, które zostanie utworzone z tego fragmentu wideo."}
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exercise-name" className="text-right">
                  Nazwa
                </Label>
                <Input
                  id="exercise-name"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={!exerciseName.trim()}>
                Zapisz
              </Button>
            </DialogFooter>
          </form>
        )}

        {status === 'loading' && (
          <div className="py-6 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center">{message || "Trwa przetwarzanie fragmentu wideo..."}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
            <p className="text-center">{message || "Fragment wideo został pomyślnie zapisany."}</p>
            <Button onClick={onClose} className="mt-4">
              Zamknij
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-center">{message || "Wystąpił błąd podczas przetwarzania fragmentu wideo."}</p>
            <Button onClick={onClose} className="mt-4">
              Zamknij
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}