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
import { Textarea } from '@/components/ui/textarea';
import { useFirebase } from '@/firebase/provider';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Service } from './columns';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2, Upload, ImageIcon, Video } from 'lucide-react';
import { icons } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/Icon';
import { useShop } from '@/hooks/use-shop-admin';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';


type ServiceDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  service: Service | null;
};

const iconNames = Object.keys(icons) as (keyof typeof icons)[];

export function ServiceDialog({ isOpen, setIsOpen, service }: ServiceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<keyof typeof icons>('Package');
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [videoDurationError, setVideoDurationError] = useState<string | null>(null);


  const { firestore, firebaseApp } = useFirebase();
  const { shop } = useShop();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        if (service) {
            setName(service.name);
            setDescription(service.description);
            setIcon(service.icon);
            setPreviewUrl(service.imageUrl || null);
            setSelectedFile(null);
            setVideoPreviewUrl(service.videoUrl || null);
            setSelectedVideoFile(null);
            setVideoDurationError(null);
        } else {
            setName('');
            setDescription('');
            setIcon('Package');
            setPreviewUrl(null);
            setSelectedFile(null);
            setVideoPreviewUrl(null);
            setSelectedVideoFile(null);
            setVideoDurationError(null);
        }
    }
  }, [service, isOpen]);
  
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
                setVideoDurationError('La vidéo dépasse 5 secondes. Veuillez en choisir une plus courte.');
            }
        };
        video.src = URL.createObjectURL(file);
        setSelectedVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!firestore || !shop || !firebaseApp) return;
    if (!name || !description) {
        toast({ variant: 'destructive', title: 'Champs requis', description: "Le nom et la description sont obligatoires." });
        return;
    }
    
    if (videoDurationError) return;

    setIsSaving(true);

    try {
      let finalImageUrl = service?.imageUrl || '';
      let finalVideoUrl = service?.videoUrl || '';

      if (selectedFile) {
        const storage = getStorage(firebaseApp);
        const imagePath = `shops/${shop.id}/services/${Date.now()}_${selectedFile.name}`;
        const imageReference = storageRef(storage, imagePath);
        await uploadBytes(imageReference, selectedFile);
        finalImageUrl = await getDownloadURL(imageReference);
      }
      
      if (selectedVideoFile) {
        const storage = getStorage(firebaseApp);
        const videoPath = `shops/${shop.id}/services_video/${Date.now()}_${selectedVideoFile.name}`;
        const videoReference = storageRef(storage, videoPath);
        await uploadBytes(videoReference, selectedVideoFile);
        finalVideoUrl = await getDownloadURL(videoReference);
      }

      const serviceData = { 
          shopId: shop.id,
          name, 
          description, 
          icon, 
          rating: service?.rating || 0,
          imageUrl: finalImageUrl, 
          videoUrl: finalVideoUrl,
      };

      if (service) {
        const serviceRef = doc(firestore, 'shops', shop.id, 'services', service.id);
        setDocumentNonBlocking(serviceRef, serviceData, { merge: true });
        toast({ title: 'Service mis à jour !' });
      } else {
        const collectionRef = collection(firestore, 'shops', shop.id, 'services');
        addDocumentNonBlocking(collectionRef, serviceData);
        toast({ title: 'Service ajouté !', description: `${name} est maintenant disponible.` });
      }
      setIsOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder le service.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>{service ? 'Modifier le service' : 'Ajouter un service'}</DialogTitle>
          <DialogDescription>
            Remplissez les détails du service ci-dessous. Les modifications sont immédiates.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="icon">Icône</Label>
            <Select onValueChange={(value) => setIcon(value as keyof typeof icons)} value={icon}>
                <SelectTrigger id="icon">
                    <SelectValue>
                        <div className="flex items-center gap-2">
                           <Icon name={icon} className="h-4 w-4" /> 
                           <span>{icon}</span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {iconNames.slice(0, 50).map(iconName => (
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <Label>Image (optionnel)</Label>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 <div className="relative aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Aperçu" fill className="object-cover" />
                    ) : (
                       <div className="text-center text-muted-foreground p-4">
                            <ImageIcon className="h-8 w-8 mx-auto" />
                            <p className="text-xs mt-2">Aucune image</p>
                        </div>
                    )}
                </div>
                 <Button type="button" variant="outline" className="w-full mt-2" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                    <Upload className="mr-2 h-4 w-4" />
                    {previewUrl ? 'Changer' : 'Téléverser'}
                </Button>
              </div>

               <div className="space-y-2">
                <Label>Vidéo 5s (optionnel)</Label>
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
                 <Button type="button" variant="outline" className="w-full mt-2" onClick={() => videoFileInputRef.current?.click()} disabled={isSaving}>
                    <Upload className="mr-2 h-4 w-4" />
                    {videoPreviewUrl ? 'Changer' : 'Téléverser'}
                </Button>
                 {videoDurationError && (
                    <Alert variant="destructive" className="mt-2 py-2">
                        <AlertDescription className="text-xs">{videoDurationError}</AlertDescription>
                    </Alert>
                )}
              </div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}