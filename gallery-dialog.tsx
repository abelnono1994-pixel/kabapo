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
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useShop } from '@/hooks/use-shop-admin';
import type { GalleryImage } from './page';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

type GalleryDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  image: GalleryImage | null;
};

export function GalleryDialog({ isOpen, setIsOpen, image }: GalleryDialogProps) {
  const [description, setDescription] = useState('');
  const [imageHint, setImageHint] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New state for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { firestore, firebaseApp } = useFirebase();
  const { shop } = useShop();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        if (image) {
            setPreviewUrl(image.imageUrl); // set preview
            setDescription(image.description);
            setImageHint(image.imageHint || '');
        } else {
            // Reset form for new image
            setPreviewUrl(null);
            setSelectedFile(null);
            setDescription('');
            setImageHint('');
        }
    }
  }, [image, isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!firestore || !shop || !firebaseApp) return;
    if (!description || (!previewUrl && !selectedFile)) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: "L'image et la description sont obligatoires."
        });
        return;
    }
    setIsSaving(true);

    try {
      let finalImageUrl = image?.imageUrl || '';

      if (selectedFile) {
        const storage = getStorage(firebaseApp);
        const imagePath = `shops/${shop.id}/gallery/${Date.now()}_${selectedFile.name}`;
        const imageReference = storageRef(storage, imagePath);
        await uploadBytes(imageReference, selectedFile);
        finalImageUrl = await getDownloadURL(imageReference);
      }

      if (!finalImageUrl) {
          throw new Error("Image URL is missing");
      }

      if (image) {
        // Update existing
        const imageRef = doc(firestore, 'shops', shop.id, 'gallery', image.id);
        const imageData = { imageUrl: finalImageUrl, description, imageHint };
        setDocumentNonBlocking(imageRef, imageData, { merge: true });
        toast({ title: 'Image mise à jour !' });
      } else {
        // Create new
        const collectionRef = collection(firestore, 'shops', shop.id, 'gallery');
        const imageData = { 
            shopId: shop.id,
            imageUrl: finalImageUrl, 
            description, 
            imageHint, 
            createdAt: serverTimestamp()
        };
        addDocumentNonBlocking(collectionRef, imageData);
        toast({ title: 'Image ajoutée !' });
      }
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de sauvegarder l'image.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{image ? "Modifier l'image" : 'Ajouter une image'}</DialogTitle>
          <DialogDescription>
            Remplissez les détails de l'image pour l'ajouter à votre galerie.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Image</Label>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            
            <div className="relative aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted">
                {previewUrl ? (
                    <Image 
                        src={previewUrl} 
                        alt="Aperçu" 
                        fill
                        className="object-contain rounded"
                    />
                ) : (
                   <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mx-auto" />
                        <p className="text-sm mt-2">Aucune image sélectionnée</p>
                    </div>
                )}
            </div>
             <Button type="button" variant="outline" className="w-full mt-2" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                <Upload className="mr-2 h-4 w-4" />
                {previewUrl ? 'Changer l\'image' : 'Choisir une image'}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mariage à Douala" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageHint">Indice IA (optionnel)</Label>
            <Input id="imageHint" value={imageHint} onChange={(e) => setImageHint(e.target.value)} placeholder="Ex: wedding couple" />
          </div>
        </div>
        <DialogFooter>
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
