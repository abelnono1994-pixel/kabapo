'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useUserProfile } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Store, Info, MapPin, ListChecks, Phone, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allCountries, cameroonCities, allCities } from '@/lib/locations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { icons } from 'lucide-react';

const shopSchema = z.object({
  name: z.string().min(3, { message: 'Le nom doit contenir au moins 3 caractères.' }),
  services: z.array(z.string()).min(1, { message: 'Veuillez sélectionner au moins un service.' }),
  country: z.string({ required_error: 'Veuillez sélectionner un pays.' }),
  city: z.string().min(2, { message: 'Veuillez préciser la ville.' }),
  phone: z.string().optional(),
});

type UserProfileData = {
  phone?: string | null;
  country?: string;
  city?: string;
  role?: string;
};

type Service = {
  id: string;
  name: string;
  icon: keyof typeof icons;
}

const defaultServices: Service[] = [
    { id: 'photographe', name: 'Photographe', icon: 'Camera' },
    { id: 'vidéaste', name: 'Vidéaste', icon: 'Video' },
    { id: 'drone', name: 'Drone', icon: 'Navigation' },
    { id: 'traiteur', name: 'Traiteur', icon: 'UtensilsCrossed' },
    { id: 'boissons', name: 'Boissons', icon: 'Martini' },
    { id: 'gâteau', name: 'Gâteau', icon: 'Cake' },
    { id: 'sonorisation', name: 'Sonorisation', icon: 'Music' },
    { id: 'décoration', name: 'Décoration', icon: 'PartyPopper' },
    { id: 'autre', name: 'Autre', icon: 'Plus' },
];

export default function CreateShopPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const { userProfile, isProfileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isProfileLoading && userProfile?.role === 'shop_admin') {
            toast({
                title: 'Vous avez déjà une boutique',
                description: 'Redirection vers votre tableau de bord.',
            });
            router.replace('/dashboard');
        }
    }, [userProfile, isProfileLoading, router, toast]);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userDocData } = useDoc<UserProfileData>(userDocRef);

    const form = useForm<z.infer<typeof shopSchema>>({
        resolver: zodResolver(shopSchema),
        defaultValues: {
            name: '',
            services: [],
            country: '',
            city: '',
            phone: '',
        },
    });
    
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [showCustomCityInput, setShowCustomCityInput] = useState(false);
    const [phonePrefix, setPhonePrefix] = useState('');
    const selectedCountry = form.watch('country');

    useEffect(() => {
        if (userDocData) {
            const initialCountry = userDocData.country || '';
            const countryData = allCountries.find(c => c.name === initialCountry);
            let initialPhone = userDocData.phone || '';

            if (countryData && initialPhone.startsWith(countryData.phoneCode)) {
                initialPhone = initialPhone.substring(countryData.phoneCode.length).trim();
            }

            form.reset({
                name: '',
                services: [],
                country: initialCountry,
                city: userDocData.city || '',
                phone: initialPhone,
            });
        }
    }, [userDocData, form]);

     useEffect(() => {
        if (selectedCountry) {
            const countryData = allCountries.find(c => c.name === selectedCountry);
            if (countryData) {
                setPhonePrefix(countryData.phoneCode);

                if (countryData.code === 'CM') {
                    setAvailableCities(cameroonCities.map(c => c.name));
                } else {
                    const capital = allCities.find(c => c.countryCode === countryData.code);
                    setAvailableCities(capital ? [capital.name] : []);
                }
            }
             form.setValue('city', '');
             setShowCustomCityInput(false);
        } else {
            setAvailableCities([]);
            setPhonePrefix('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCountry]);

    const onSubmit = async (values: z.infer<typeof shopSchema>) => {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Utilisateur non authentifié.'
            });
            return;
        }

        setIsSubmitting(true);
        
        const finalPhoneNumber = phonePrefix && values.phone ? `${phonePrefix}${values.phone.trim()}` : (values.phone || null);

        try {
            const batch = writeBatch(firestore);

            const newShopRef = doc(collection(firestore, 'shops'));
            const newShopData = {
                id: newShopRef.id,
                name: values.name.trim(),
                ownerId: user.uid,
                services: values.services,
                country: values.country,
                city: values.city,
                phone: finalPhoneNumber,
                status: 'pending_setup',
                subscriptionPlan: 'none',
                createdAt: serverTimestamp(),
                imageUrl: '',
                averageRating: 0,
                reviewCount: 0,
            };
            batch.set(newShopRef, newShopData);

            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, {
                role: 'shop_admin',
                shopId: newShopRef.id
            });

            const adminRef = doc(firestore, 'shops', newShopRef.id, 'admins', user.uid);
            batch.set(adminRef, {
                userId: user.uid,
                addedAt: serverTimestamp()
            });

            await batch.commit();
            
            toast({
                title: 'Boutique créée !',
                description: 'Vous allez être redirigé vers votre nouveau tableau de bord.'
            });

            router.push('/dashboard');

        } catch (error: any) {
            console.error("Error creating shop: ", error);
            toast({
                variant: 'destructive',
                title: 'Erreur inattendue',
                description: error.message || 'Une erreur est survenue lors de la création de votre boutique.'
            });
            setIsSubmitting(false);
        }
    };
    
    if (isProfileLoading || (!isProfileLoading && userProfile?.role === 'shop_admin')) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        )
    }


    return (
        <div className="container mx-auto py-12">
            <div className="max-w-4xl mx-auto">
                 <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <Store className="mx-auto h-12 w-12 text-primary mb-4" />
                        <CardTitle className="text-3xl font-bold font-headline">Proposez vos services</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground pt-2">
                            Créez votre boutique sur Kabapo et commencez à recevoir des demandes de clients.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 font-headline"><Info className="h-5 w-5" /> Informations Générales</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nom de votre boutique</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: Les Merveilles de Sophie" {...field} />
                                                    </FormControl>
                                                    <FormDescription>Le nom public qui sera visible par les clients.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                     <CardHeader>
                                        <CardTitle className="flex items-center gap-2 font-headline"><ListChecks className="h-5 w-5" /> Services Proposés</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="services"
                                            render={() => (
                                                <FormItem>
                                                    <div className="mb-4">
                                                        <FormLabel className="text-base">Quels services proposez-vous ?</FormLabel>
                                                        <FormDescription>Sélectionnez tous les services applicables.</FormDescription>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                        {defaultServices.map((item) => (
                                                            <FormField
                                                                key={item.id}
                                                                control={form.control}
                                                                name="services"
                                                                render={({ field }) => (
                                                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(item.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...(field.value || []), item.id])
                                                                                        : field.onChange(field.value?.filter((value) => value !== item.id));
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal capitalize">{item.name}</FormLabel>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                               <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 font-headline"><MapPin className="h-5 w-5" /> Localisation & Contact</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Pays</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue placeholder="Choisir un pays" /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {allCountries.map(c => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Ville</FormLabel>
                                                        {(availableCities.length > 0 && !showCustomCityInput) ? (
                                                            <Select onValueChange={(value) => {
                                                                if (value === '__autre__') {
                                                                    setShowCustomCityInput(true);
                                                                    field.onChange('');
                                                                } else {
                                                                    field.onChange(value);
                                                                }
                                                            }} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue placeholder="Choisir une ville" /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {availableCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                                    <SelectItem value="__autre__">Autre (préciser)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <FormControl>
                                                                 <Input placeholder="Précisez votre ville" {...field} />
                                                            </FormControl>
                                                        )}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                         <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Numéro de téléphone de la boutique</FormLabel>
                                                    <div className="flex items-center">
                                                        {phonePrefix && (
                                                            <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-secondary px-3 text-sm text-muted-foreground">
                                                                {phonePrefix}
                                                            </span>
                                                        )}
                                                        <FormControl>
                                                            <Input 
                                                                type="tel" 
                                                                placeholder="6 XX XX XX XX" 
                                                                {...field}
                                                                className={cn(phonePrefix && "rounded-l-none")}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormDescription>Ce numéro pourra être affiché sur la page de votre boutique.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                               </Card>
                                
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Conditions</AlertTitle>
                                    <AlertDescription>
                                       En créant une boutique, vous acceptez nos <Button variant="link" className="p-0 h-auto"><a href="/legal" target="_blank">Conditions Générales d'Utilisation</a></Button> en tant que prestataire.
                                    </AlertDescription>
                                </Alert>

                                <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        "Créer ma boutique"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
