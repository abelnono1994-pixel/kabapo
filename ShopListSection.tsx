'use client';

import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Store, Star } from 'lucide-react';
import type { Shop } from '@/app/admin/(admin_panel)/shops/columns';
import { useTranslation } from '@/hooks/use-translation';

function ShopCard({ shop }: { shop: Shop }) {
    const { t } = useTranslation();
    const getStatusVariant = (status: Shop['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'active': return 'default';
            case 'suspended': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <Card className="flex flex-col overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="relative h-48 w-full">
                <Image
                    src={shop.imageUrl || `https://picsum.photos/seed/${shop.id}/600/400`}
                    alt={shop.name}
                    fill
                    className="object-cover"
                    data-ai-hint="shop storefront"
                />
            </div>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline">{shop.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-semibold">{(shop.averageRating || 0).toFixed(1)}</span>
                        <span className="text-xs">({shop.reviewCount || 0})</span>
                    </div>
                </div>
                <div className="flex gap-2 pt-1">
                    <Badge variant={getStatusVariant(shop.status)} className="capitalize">{shop.status.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className="capitalize">{shop.subscriptionPlan}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 <p className="text-muted-foreground text-sm line-clamp-2">{t('home.shop_card_desc')} {shop.name} {t('home.shop_card_suffix')}</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/shops/${shop.id}`}>
                        {t('home.visit_shop')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}


function ShopListSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                        <Skeleton className="h-7 w-3/4" />
                        <div className="flex gap-2 pt-1">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </CardHeader>
                     <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export function ShopListSection() {
    const { t } = useTranslation();
    const firestore = useFirestore();
    const shopsQuery = useMemoFirebase(
        () => firestore ? query(
            collection(firestore, 'shops'), 
            where('status', '==', 'active'), 
            orderBy('averageRating', 'desc'), 
            orderBy('name', 'asc')
        ) : null,
        [firestore]
    );
    const { data: shops, isLoading } = useCollection<Shop>(shopsQuery);

    return (
        <section id="services" className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">{t('home.shops_title')}</h2>
                    <p className="mt-3 max-w-2xl text-muted-foreground md:text-xl">
                        {t('home.shops_subtitle')}
                    </p>
                </div>
                {isLoading ? (
                    <ShopListSkeleton />
                ) : (
                    shops && shops.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shops.map((shop) => (
                                <ShopCard key={shop.id} shop={shop} />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center p-8 border-dashed border-2 max-w-md mx-auto">
                            <Store className="mx-auto h-12 w-12 text-muted-foreground" />
                            <CardHeader>
                                <CardTitle className="mt-4">{t('home.no_shops')}</CardTitle>
                                <CardDescription className="mt-2">{t('home.no_shops_desc')}</CardDescription>
                            </CardHeader>
                        </Card>
                    )
                )}
            </div>
        </section>
    )
}
