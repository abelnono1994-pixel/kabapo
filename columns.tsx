'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Mail, MessageSquare, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Booking } from '@/app/admin/(admin_panel)/bookings/columns';

const StatusSelector = ({ booking }: { booking: Booking }) => {
    const firestore = useFirestore();
    const statuses: Booking['status'][] = ['pending', 'confirmed', 'cancelled'];

    const handleStatusChange = (status: string) => {
        if (!firestore) return;
        const bookingRef = doc(firestore, 'shops', booking.shopId, 'bookings', booking.id);
        updateDocumentNonBlocking(bookingRef, { status });
    }

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={booking.status} onValueChange={handleStatusChange}>
                        {statuses.map(status => (
                            <DropdownMenuRadioItem key={status} value={status} className="capitalize">
                                {status}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    )
}

export const columns = (onViewDetails: (booking: Booking) => void): ColumnDef<Booking>[] => [
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
      if (status === 'confirmed') variant = 'default';
      if (status === 'cancelled') variant = 'destructive';

      return <Badge variant={variant} className="capitalize">{status || 'N/A'}</Badge>;
    },
  },
  {
    accessorKey: 'contactInfo.email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Client
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const email = row.original.contactInfo?.email;
      return <div className="lowercase">{email || 'Non renseigné'}</div>
    }
  },
  {
    accessorKey: 'eventType',
    header: 'Événement',
    cell: ({ row }) => {
        return <div className="capitalize">{row.getValue("eventType")}</div>
    }
  },
  {
    accessorKey: 'services',
    header: 'Services',
    cell: ({ row }) => {
      const services = row.getValue('services') as string[] | undefined;
      return <div className="capitalize truncate max-w-xs">{Array.isArray(services) && services.length > 0 ? services.join(', ') : 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.getValue('date') as { seconds: number, nanoseconds: number } | undefined;
      const formattedDate = date ? format(new Date(date.seconds * 1000), 'd MMMM yyyy', { locale: fr }) : 'N/A';
      return <div>{formattedDate}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const booking = row.original;
      const hasEmail = !!booking.contactInfo?.email;
      const hasPhone = !!booking.contactInfo?.phone;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(booking.id)}
            >
              Copier l'ID de la réservation
            </DropdownMenuItem>
             <StatusSelector booking={booking} />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewDetails(booking)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir les détails
            </DropdownMenuItem>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!hasEmail && !hasPhone}>Contacter le client</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                         {hasEmail && (
                            <DropdownMenuItem onClick={() => {
                                if (booking.contactInfo?.email) {
                                    window.location.href = `mailto:${booking.contactInfo.email}`;
                                }
                            }}>
                                <Mail className="mr-2 h-4 w-4" />
                                <span>Par Email</span>
                            </DropdownMenuItem>
                        )}
                        {hasPhone && (
                            <DropdownMenuItem onClick={() => {
                                if (booking.contactInfo?.phone) {
                                    const whatsappNumber = booking.contactInfo.phone.replace(/\D/g, '');
                                    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
                                }
                            }}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>Par WhatsApp</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
