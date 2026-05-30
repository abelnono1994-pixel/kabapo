'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookingTrigger } from '@/components/booking/BookingTrigger';
import { useTranslation } from '@/hooks/use-translation';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { useUserProfile } from '@/firebase/provider';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from 'lucide-react';

type UserProfile = {
  role: 'client' | 'shop_admin' | 'admin' | 'superadmin';
  shopId?: string;
};

type HeroSectionProps = {
    heroImage: ImagePlaceholder | undefined;
}

export function HeroSection({ heroImage }: HeroSectionProps) {
    const { t } = useTranslation();
    const { userProfile, isProfileLoading } = useUserProfile();
    const ctaButtonClass = "bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 rounded-full font-bold shadow-lg transition-transform transform hover:scale-105";

    const CtaButton = () => {
        return (
            <BookingTrigger>
                <Button
                    size="lg"
                    className={ctaButtonClass}
                >
                    {t('hero.cta')}
                </Button>
            </BookingTrigger>
        );
    }
    
    const VendorCta = () => {
        if (isProfileLoading) {
            return <Skeleton className="h-12 w-48 rounded-full" />;
        }

        if (userProfile?.role === 'shop_admin') {
            return (
                 <Button asChild variant="outline" size="lg" className="rounded-full shadow-lg border-2 bg-background/50 hover:bg-background/80 text-base py-6">
                    <Link href="/dashboard">
                        <Store className="mr-2 h-5 w-5" />
                        {t('hero.my_store_cta')}
                    </Link>
                </Button>
            )
        }
        
        return (
             <Button asChild variant="outline" size="lg" className="rounded-full shadow-lg border-2 bg-background/50 hover:bg-background/80 text-base py-6">
                <Link href="/creer-boutique">
                    <Store className="mr-2 h-5 w-5" />
                    {t('hero.partner_cta')}
                </Link>
            </Button>
        );
    }


    return (
        <section className="relative w-full h-[calc(100vh-4rem)] flex items-center justify-center">
            {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={heroImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            <div className="relative container px-4 md:px-6 z-10">
                <div className="flex flex-col items-center text-center">
                    <Card className="bg-background/80 backdrop-blur-sm max-w-3xl">
                        <CardContent className="p-8 md:p-12">
                            <h1 className="text-4xl font-headline font-bold tracking-tighter text-primary sm:text-5xl lg:text-6xl/none">
                                {t('hero.title')}
                            </h1>
                            <p className="mt-4 max-w-xl mx-auto text-foreground/80 md:text-xl">
                                {t('hero.subtitle')}
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <CtaButton />
                                <VendorCta />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}