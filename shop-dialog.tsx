'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Shop } from './columns';

type ShopDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  shop: Shop | null;
  onSave: (data: Partial<Shop>) => void;
};

const subscriptionPlans: Shop['subscriptionPlan'][] = ["basic", "premium", "pro", "none"];
const statuses: Shop['status'][] = ["active", "suspended", "pending_setup"];

export function ShopDialog({ isOpen, setIsOpen, shop, onSave }: ShopDialogProps) {
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [plan, setPlan] = useState<Shop['subscriptionPlan']>('none');
  const [status, setStatus] = useState<Shop['status']>('pending_setup');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (shop) {
      setName(shop.name);
      setOwnerId(shop.ownerId);
      setPlan(shop.subscriptionPlan);
      setStatus(shop.status);
    } else {
      // Reset form for new shop
      setName('');
      setOwnerId('');
      setPlan('none');
      setStatus('pending_setup');
    }
  }, [shop, isOpen]);

  const handleSubmit = async () => {
    if (!name || !ownerId) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: "Le nom de la boutique et l'ID du propriétaire sont obligatoires."
        });
        return;
    }
    setIsSaving(true);
    
    const shopData: Partial<Shop> = { name, ownerId, subscriptionPlan: plan, status };

    try {
        onSave(shopData);
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erreur',
            description: "Impossible de sauvegarder la boutique.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shop ? 'Modifier la boutique' : 'Créer une boutique'}</DialogTitle>
          <DialogDescription>
            Remplissez les détails de la boutique ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la boutique</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Les Merveilles de Sophie" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerId">ID du Propriétaire (User ID)</Label>
            <Input id="ownerId" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder="UID de l'utilisateur Firebase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Abonnement</Label>
            <Select onValueChange={(v) => setPlan(v as Shop['subscriptionPlan'])} value={plan}>
                <SelectTrigger id="plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {subscriptionPlans.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
             <Select onValueChange={(v) => setStatus(v as Shop['status'])} value={status}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
            </Select>
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
