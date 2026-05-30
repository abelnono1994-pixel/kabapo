'use client';

import { useMemo } from 'react';
import { SelectableCard } from './SelectableCard';
import type { icons } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/Icon';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

type EventType = {
  id: string;
  name: string;
  icon: keyof typeof icons;
}

type EventTypeStepProps = {
  onSelect: (eventType: string) => void;
};

const defaultEventTypes: EventType[] = [
    { id: 'mariage', name: 'Mariage', icon: 'Heart' },
    { id: 'anniversaire', name: 'Anniversaire', icon: 'Cake' },
    { id: 'bapteme', name: 'Baptême', icon: 'Sparkles' },
    { id: 'entreprise', name: 'Entreprise', icon: 'Briefcase' },
    { id: 'deuil', name: 'Deuil', icon: 'Flower2' },
    { id: 'autre', name: 'Autre', icon: 'Plus' },
];


const EventTypeSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({length: 4}).map((_, i) => (
      <Card key={i}>
        <CardContent className="flex flex-col items-center justify-center p-6 gap-3 text-center h-full">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export function EventTypeStep({ onSelect }: EventTypeStepProps) {
  const firestore = useFirestore();
  const eventTypesQuery = useMemoFirebase(() => firestore && query(collectionGroup(firestore, 'eventTypes'), orderBy('name', 'asc')), [firestore]);
  const { data: eventTypes, isLoading } = useCollection<EventType>(eventTypesQuery);

  const displayTypes = useMemo(() => {
    const firestoreTypes = eventTypes || [];
    const combinedTypes = [...firestoreTypes];
    const names = new Set(firestoreTypes.map(t => t.name.toLowerCase()));

    defaultEventTypes.forEach(defaultType => {
      if (!names.has(defaultType.name.toLowerCase())) {
        combinedTypes.push(defaultType);
      }
    });

    return combinedTypes;
  }, [eventTypes]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          Quel type d'événement organisez-vous ?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Choisissez une catégorie pour commencer.
        </p>
      </div>
      {isLoading ? (
        <EventTypeSkeleton />
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayTypes?.map((type) => (
              <SelectableCard
                key={type.id}
                isSelected={false}
                onSelect={() => onSelect(type.name.toLowerCase())}
              >
                <Card className="h-full group-hover:-translate-y-1 transition-transform duration-300">
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3 text-center h-full">
                        <div className="p-4 bg-accent/10 rounded-full">
                            <Icon name={type.icon as keyof typeof icons} className="h-10 w-10 text-accent" />
                        </div>
                        <span className="font-semibold text-lg text-foreground capitalize">{type.name}</span>
                    </CardContent>
                </Card>
              </SelectableCard>
            ))}
          </div>
      )}
    </div>
  );
}
