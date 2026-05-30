'use client';

import { useMemo } from 'react';
import { SelectableCard } from './SelectableCard';
import { Button } from '@/components/ui/button';
import type { BookingData } from './BookingFlow';
import type { icons } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/Icon';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

type Service = {
  id: string;
  shopId: string;
  name: string;
  icon: keyof typeof icons;
}

type ServiceStepProps = {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
};

const defaultServices: Service[] = [
    { id: 'photographe', shopId: 'default', name: 'Photographe', icon: 'Camera' },
    { id: 'vidéaste', shopId: 'default', name: 'Vidéaste', icon: 'Video' },
    { id: 'drone', shopId: 'default', name: 'Drone', icon: 'Navigation' },
    { id: 'traiteur', shopId: 'default', name: 'Traiteur', icon: 'UtensilsCrossed' },
    { id: 'boissons', shopId: 'default', name: 'Boissons', icon: 'Martini' },
    { id: 'gâteau', shopId: 'default', name: 'Gâteau', icon: 'Cake' },
    { id: 'sonorisation', shopId: 'default', name: 'Sonorisation', icon: 'Music' },
    { id: 'décoration', shopId: 'default', name: 'Décoration', icon: 'PartyPopper' },
    { id: 'autre', shopId: 'default', name: 'Autre', icon: 'Plus' },
];

const ServiceSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({length: 8}).map((_, i) => (
      <Card key={i}>
        <CardContent className="flex flex-col items-center justify-center p-6 gap-3 text-center h-full">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export function ServiceStep({
  bookingData,
  updateBookingData,
  onNext,
  onBack,
}: ServiceStepProps) {
  const firestore = useFirestore();
  const servicesQuery = useMemoFirebase(() => firestore && query(collectionGroup(firestore, 'services'), orderBy('name', 'asc')), [firestore]);
  const { data: services, isLoading } = useCollection<Service>(servicesQuery);

  const displayServices = useMemo(() => {
    const firestoreServices = services || [];
    const combinedServices = [...firestoreServices];
    const names = new Set(firestoreServices.map(s => s.name.toLowerCase()));

    defaultServices.forEach(defaultService => {
        if (!names.has(defaultService.name.toLowerCase())) {
            combinedServices.push(defaultService);
        }
    });

    return combinedServices;
  }, [services]);

  const handleSelectService = (service: Service) => {
    const serviceName = service.name.toLowerCase();
    const isSelected = bookingData.services.includes(serviceName);
    
    let newServices: string[];
    let newShopId: string | null = bookingData.shopId;

    if (isSelected) {
      newServices = bookingData.services.filter((s) => s !== serviceName);
      if (newServices.length === 0) {
        newShopId = null;
      }
    } else {
      if (!newShopId) {
        newShopId = service.shopId;
      }
      newServices = [...bookingData.services, serviceName];
    }
    
    updateBookingData({ services: newServices, shopId: newShopId });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          De quels services avez-vous besoin ?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Vous pouvez en sélectionner plusieurs.
        </p>
      </div>
      {isLoading ? (
        <ServiceSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayServices.map((service) => {
            const isSelected = bookingData.services.includes(service.name.toLowerCase());
            const isLocked = bookingData.shopId !== null && bookingData.shopId !== service.shopId;
            return (
              <SelectableCard
                key={service.id}
                isSelected={isSelected}
                onSelect={() => handleSelectService(service)}
                className={cn(isLocked && "opacity-50 cursor-not-allowed")}
              >
                <Card className="h-full group-hover:-translate-y-1 transition-transform duration-300">
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3 text-center h-full">
                        <div className="p-4 bg-accent/10 rounded-full">
                            <Icon name={service.icon as keyof typeof icons} className="h-10 w-10 text-accent" />
                        </div>
                        <span className="font-semibold text-lg text-foreground">{service.name}</span>
                    </CardContent>
                </Card>
              </SelectableCard>
            )
          })}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Précédent
        </Button>
        <Button onClick={onNext} disabled={bookingData.services.length === 0}>Suivant</Button>
      </div>
    </div>
  );
}
