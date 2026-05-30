'use client';

import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collectionGroup, query } from 'firebase/firestore';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { Review } from '@/types/review';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';


const StarRating = ({ rating, className }: { rating: number, className?: string }) => {
  const roundedRating = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-5 w-5",
            i < roundedRating
              ? "text-primary fill-primary"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
};

const ReviewSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length: 3}).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-6">
                        <Skeleton className="h-5 w-24 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-4/5" />
                    </CardContent>
                    <CardFooter className="bg-secondary/30 p-4 flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-3 w-16" />
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

const formatDisplayNameForPrivacy = (name: string | null | undefined): string => {
    if (!name) return 'Anonyme';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
        const firstName = parts.slice(0, -1).join(' ');
        const lastNameInitial = parts[parts.length - 1].charAt(0);
        return `${firstName} ${lastNameInitial}.`;
    }
    return name;
};


export function PublishedReviews() {
  const firestore = useFirestore();
  const { t } = useTranslation();

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'reviews'));
  }, [firestore]);

  const { data: allReviews, isLoading, error } = useCollection<Review>(reviewsQuery);
  
  const approvedReviews = useMemo(() => {
    if (!allReviews) return null;
    return allReviews.filter(review => review.status === 'approved');
  }, [allReviews]);
  
  if (isLoading && !approvedReviews) {
      return <ReviewSkeleton />;
  }
  
  if (error) {
    return (
        <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error')}</AlertTitle>
            <AlertDescription>
                {t('home.load_reviews_error')}
            </AlertDescription>
        </Alert>
    )
  }

  if (!approvedReviews || approvedReviews.length === 0) {
      return <p className="text-center text-muted-foreground italic">{t('home.no_reviews')}</p>
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: approvedReviews.length > 1,
      }}
      className="w-full max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto"
    >
      <CarouselContent>
        {approvedReviews.map((review) => {
          const publicName = formatDisplayNameForPrivacy(review.displayName);
          return (
            <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1 h-full">
                <Card className="flex flex-col h-full justify-between shadow-md hover:shadow-primary/10 transition-shadow">
                  <CardContent className="p-6 flex-grow">
                    <StarRating rating={review.rating} className="mb-4" />
                    <p className="text-foreground/80 italic">"{review.comment}"</p>
                  </CardContent>
                  <CardFooter className="bg-secondary/30 p-4 flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{publicName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    <div>
                      <p className="font-semibold">{publicName}</p>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
