'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Briefcase, Cake, Calendar, Clock, Flower2, Heart, ListChecks, Mail, MessageSquare, Phone, Sparkles, User as UserIcon } from 'lucide-react';
import type { Booking } from './columns';

const DetailItem = ({ icon, label, value, isCapitalized = true }: { icon: React.ReactNode, label: string, value: string | undefined | null, isCapitalized?: boolean }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="text-muted-foreground pt-1">{icon}</div>
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`font-medium ${isCapitalized ? 'capitalize' : ''}`}>{value}</p>
            </div>
        </div>
    )
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
        case 'confirmed': return 'default';
        case 'cancelled': return 'destructive';
        case 'pending': return 'secondary';
        default: return 'outline';
    }
}

const getEventIcon = (eventType: string) => {
    switch(eventType) {
        case 'mariage': return <Heart className="h-5 w-5"/>;
        case 'anniversaire': return <Cake className="h-5 w-5"/>;
        case 'deuil': return <Flower2 className="h-5 w-5"/>;
        case 'bapteme': return <Sparkles className="h-5 w-5"/>;
        case 'entreprise': return <Briefcase className="h-5 w-5"/>;
        default: return <Sparkles className="h-5 w-5"/>;
    }
}


export function BookingDetailsDialog({ booking, isOpen, onOpenChange }: { booking: Booking, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!booking) return null;

    const formattedDate = booking.date ? format(new Date(booking.date.seconds * 1000), 'd MMMM yyyy', { locale: fr }) : 'Non précisée';
    const formattedCreationDate = booking.createdAt ? format(new Date(booking.createdAt.seconds * 1000), 'd MMMM yyyy, HH:mm', { locale: fr }) : 'N/A';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-headline">
                        {getEventIcon(booking.eventType)}
                        <span className="capitalize">Détails de la Réservation</span>
                    </DialogTitle>
                    <DialogDescription>
                        ID: {booking.id}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                         <p className="font-semibold text-lg capitalize">{booking.eventType}</p>
                         <Badge variant={getStatusVariant(booking.status)} className="capitalize text-sm">{booking.status}</Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                       <DetailItem icon={<Calendar className="h-5 w-5" />} label="Date de l'événement" value={formattedDate} />
                       <DetailItem icon={<Clock className="h-5 w-5" />} label="Date de la demande" value={formattedCreationDate} />
                    </div>

                    <div className="space-y-4 rounded-md border p-4">
                        <h4 className="font-medium flex items-center gap-2"><ListChecks /> Services</h4>
                        <p className="capitalize text-muted-foreground">{booking.services?.join(', ') || 'Aucun service spécifié'}</p>
                        {booking.requestDetails && (
                             <DetailItem icon={<MessageSquare className="h-5 w-5" />} label="Détails supplémentaires" value={booking.requestDetails} isCapitalized={false}/>
                        )}
                    </div>
                    
                     <div className="space-y-4 rounded-md border p-4">
                        <h4 className="font-medium flex items-center gap-2"><UserIcon /> Client</h4>
                        <DetailItem icon={<Mail className="h-5 w-5" />} label="Email" value={booking.contactInfo?.email} isCapitalized={false} />
                        <DetailItem icon={<Phone className="h-5 w-5" />} label="Téléphone" value={booking.contactInfo?.phone} isCapitalized={false} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
