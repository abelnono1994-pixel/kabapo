'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase/provider';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { EventType } from './event-types-columns';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2, Upload, ImageIcon, Video } from 'lucide-react';
import { icons } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/Icon';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alert, AlertDescription } from '@/components/ui/alert';

type EventTypeDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  eventType: EventType | null;
};

const iconNames = Object.keys(icons) as (keyof typeof icons)[];

export function EventTypeDialog({ isOpen, setIsOpen, eventType }: EventTypeDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<keyof typeof icons>('Sparkles');
  const [isSaving, setIsSaving] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [videoDurationError, setVideoDurationError] = useState<string | null>(null);

  const { firestore, firebaseApp } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
     if (isOpen) {
        if (eventType) {
          setName(eventType.name);
          setIcon(eventType.icon);
          setPreviewUrl(eventType.imageUrl || null);
          setSelectedFile(null);
          setVideoPreviewUrl(eventType.videoUrl || null);
          setSelectedVideoFile(null);
          setVideoDurationError(null);
        } else {
          setName('');
          setIcon('Sparkles');
          setPreviewUrl(null);
          setSelectedFile(null);
          setVideoPreviewUrl(null);
          setSelectedVideoFile(null);
          setVideoDurationError(null);
        }
    }
  }, [eventType, isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setVideoDurationError(null);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > 5.5) {
                setVideoDurationError('La vidéo dépasse 5 secondes.');
            }
        };
        video.src = URL.createObjectURL(file);
        setSelectedVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!firestore || !firebaseApp) return;
    if (!name) {
        toast({ variant: 'destructive', title: 'Champs requis', description: "Le nom est obligatoire." });
        return;
    }
    if (videoDurationError) return;

    setIsSaving(true);

    try {
      let finalImageUrl = eventType?.imageUrl || '';
      let finalVideoUrl = eventType?.videoUrl || '';

      const shopId = eventType?.shopId || 'default';

      if (selectedFile) {
        const storage = getStorage(firebaseApp);
        const imagePath = `shops/${shopId}/eventTypes/${Date.now()}_${selectedFile.name}`;
        const imageReference = storageRef(storage, imagePath);
        await uploadBytes(imageReference, selectedFile);
        finalImageUrl = await getDownloadURL(imageReference);
      }

      if (selectedVideoFile) {
        const storage = getStorage(firebaseApp);
        const videoPath = `shops/${shopId}/eventTypes_video/${Date.now()}_${selectedVideoFile.name}`;
        const videoReference = storageRef(storage, videoPath);
        await uploadBytes(videoReference, selectedVideoFile);
        finalVideoUrl = await getDownloadURL(videoReference);
      }

      const eventTypeData = { name, icon, imageUrl: finalImageUrl, videoUrl: finalVideoUrl, shopId };

      if (eventType) {
        const eventTypeRef = doc(firestore, 'shops', eventType.shopId, 'eventTypes', eventType.id);
        setDocumentNonBlocking(eventTypeRef, eventTypeData, { merge: true });
        toast({ title: 'Type d\'événement mis à jour !' });
      } else {
        const colRef = collection(firestore, 'shops', 'default', 'eventTypes');
        addDocumentNonBlocking(colRef, eventTypeData);
        toast({ title: 'Nouveau type d\'événement créé !' });
      }

      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder le type d\'événement.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{eventType ? 'Modifier le type' : 'Ajouter un type d\'événement'}</DialogTitle>
          <DialogDescription>
            Configurez les éléments visuels et publicitaires pour ce type d'événement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nom de l'événement</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="icon">Icône Lucide</Label>
                <Select onValueChange={(value) => setIcon(value as keyof typeof icons)} value={icon}>
                    <SelectTrigger id="icon">
                        <SelectValue placeholder="Choisir une icône">
                            <div className="flex items-center gap-2">
                               <Icon name={icon} className="h-4 w-4" /> 
                               <span>{icon}</span>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {iconNames.slice(0, 100).map(iconName => (
                            <SelectItem key={iconName} value={iconName}>
                                <div className="flex items-center gap-2">
                                    <Icon name={iconName} className="h-4 w-4" />
                                    <span>{iconName}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
            <Label>Photo de couverture</Label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
             <div className="relative aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                {previewUrl ? (
                    <Image src={previewUrl} alt="Aperçu" fill className="object-cover" />
                ) : (
                   <div className="text-center text-muted-foreground p-4">
                        <ImageIcon className="h-8 w-8 mx-auto" />
                        <p className="text-xs mt-2">Aucune photo</p>
                    </div>
                )}
            </div>
             <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                <Upload className="mr-2 h-4 w-4" />
                {previewUrl ? 'Modifier' : 'Ajouter une photo'}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Courte vidéo (Publicité)</Label>
            <input type="file" ref={videoFileInputRef} onChange={handleVideoFileChange} className="hidden" accept="video/mp4,video/webm" />
             <div className="relative aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                {videoPreviewUrl ? (
                    <video src={videoPreviewUrl} muted autoPlay loop playsInline className="object-cover w-full h-full" />
                ) : (
                   <div className="text-center text-muted-foreground p-4">
                        <Video className="h-8 w-8 mx-auto" />
                        <p className="text-xs mt-2">Aucune vidéo</p>
                    </div>
                )}
            </div>
             <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={() => videoFileInputRef.current?.click()} disabled={isSaving}>
                <Upload className="mr-2 h-4 w-4" />
                {videoPreviewUrl ? 'Modifier' : 'Ajouter une vidéo'}
            </Button>
            {videoDurationError && <p className="text-xs text-destructive">{videoDurationError}</p>}
          </div>
         </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {eventType ? 'Sauvegarder les modifications' : 'Créer le type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
