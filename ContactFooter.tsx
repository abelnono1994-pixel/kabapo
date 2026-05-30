'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { companyContacts } from '@/lib/company-contacts';
import Icon from './Icon';
import type { icons } from 'lucide-react';
import { CurrentYear } from './CurrentYear';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

/**
 * ContactFooter - Un pied de page intelligent qui sépare radicalement l'accueil du support.
 * Le kit de contact (Services, Support, Équipe) n'apparaît QUE si l'utilisateur en exprime l'intention.
 */
export function ContactFooter() {
    const { t } = useTranslation();
    const [showFullFooter, setShowFullFooter] = useState(false);

    useEffect(() => {
        const handleHashChange = () => {
            setShowFullFooter(window.location.hash === '#contact');
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('popstate', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener('popstate', handleHashChange);
        };
    }, []);

    const managementContacts = companyContacts.filter(c => c.type === 'management');
    const serviceContacts = companyContacts.filter(c => c.type === 'service');
    const emergencyComplaints = companyContacts.find(c => c.id === 'emergency_complaints');

    return (
        <footer id="contact" className={cn(
            "bg-secondary/50 text-secondary-foreground border-t transition-all duration-700 ease-in-out",
            showFullFooter ? "py-12 md:py-20 bg-background" : "py-16 md:py-24"
        )}>
            <div className="container px-4">
                {/* VUE ACCUEIL : Message de marque exclusif (uniquement si NON en mode contact) */}
                {!showFullFooter ? (
                    <div className="flex flex-col items-center text-center max-w-3xl mx-auto animate-fade-in space-y-6">
                        <h3 className="text-4xl font-bold font-headline text-primary">Kabapo</h3>
                        <p className="text-xl leading-relaxed italic text-foreground font-medium">
                            {t('footer.about_desc')}
                        </p>
                    </div>
                ) : (
                    /* VUE CONTACT : Informations stratégiques détaillées (Séparation nette) */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        
                        {/* 1. Organisation de l'entreprise (Notre Équipe / Propriétaires) */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-headline border-b pb-2 border-primary/20">{t('footer.team_title')}</h3>
                            <div className="space-y-4">
                                {managementContacts.map(contact => (
                                    <ContactPerson key={contact.id} contact={contact} />
                                ))}
                            </div>
                        </div>

                        {/* 2. Nos Services (Points de contact spécialisés) */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-headline border-b pb-2 border-primary/20">{t('footer.services_title')}</h3>
                            <ul className="space-y-4 text-sm">
                               {serviceContacts.map(contact => (
                                   <li key={contact.id} className="flex items-center gap-3 group">
                                       <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Icon name={contact.icon as keyof typeof icons} className="h-5 w-5" />
                                       </div>
                                       <div className="flex-1">
                                           <p className="font-semibold">{t(contact.name)}</p>
                                           <p className="text-xs text-primary uppercase font-bold tracking-tighter mb-1">{t(contact.role)}</p>
                                           <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-primary transition-colors">{contact.email}</a>
                                       </div>
                                   </li>
                               ))}
                            </ul>
                        </div>

                         {/* 3. Support & Légal (Point de contact unique & professionnel) */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-headline border-b pb-2 border-primary/20">{t('footer.support_title')}</h3>
                             <ul className="space-y-4 text-sm">
                                {emergencyComplaints && (
                                    <li className="flex flex-col items-start bg-primary/5 p-4 rounded-md border border-primary/10 shadow-sm">
                                        <p className="font-bold text-primary mb-2">{t(emergencyComplaints.name)}</p>
                                        <div className="space-y-1">
                                            <a href={`mailto:${emergencyComplaints.email}`} className="block text-muted-foreground hover:text-primary transition-colors font-medium">{emergencyComplaints.email}</a>
                                            <p className="text-muted-foreground font-semibold tracking-wide">{emergencyComplaints.phone}</p>
                                        </div>
                                    </li>
                                )}
                                <li className="pt-2">
                                    <Button variant="link" asChild className="p-0 h-auto font-bold">
                                        <Link href="/legal">{t('footer.legal_link')}</Link>
                                    </Button>
                                </li>
                             </ul>
                        </div>

                        {/* 4. Restons Connectés (Réseaux Sociaux Localisés) */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-headline border-b pb-2 border-primary/20">{t('footer.social_title')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">{t('footer.social_desc')}</p>
                            <div className="flex gap-3">
                                <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm" asChild>
                                    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                        <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Facebook_f_logo_%282019%29.svg/1024px-Facebook_f_logo_%282019%29.svg.png" alt="Facebook logo" width={20} height={20} />
                                    </a>
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full hover:bg-red-600 hover:text-white transition-all shadow-sm" asChild>
                                    <a href="mailto:contact@kabapo.com" aria-label="Email">
                                        <Image src="https://static.vecteezy.com/system/resources/previews/022/484/516/original/google-mail-gmail-icon-logo-symbol-free-png.png" alt="Gmail logo" width={24} height={24} />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <Separator className="my-10" />

                <div className="text-center text-sm text-muted-foreground">
                    <p>&copy; <CurrentYear /> Kabapo. {t('footer.all_rights_reserved')}</p>
                </div>
            </div>
        </footer>
    );
}

const ContactPerson = ({ contact }: { contact: any }) => {
    const { t } = useTranslation();
    const image = PlaceHolderImages.find(p => p.id === contact.avatarId);
    return (
        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-primary/5 transition-colors">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 flex items-center justify-center bg-muted">
                {image ? (
                    <Image 
                        src={image.imageUrl}
                        alt={contact.name}
                        fill
                        className="object-cover"
                        data-ai-hint={image.imageHint}
                    />
                ) : (
                    <Icon name="User" className="h-6 w-6 text-muted-foreground" />
                )}
            </div>
            <div className="flex flex-col">
                <p className="font-bold text-sm text-foreground">{contact.name}</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{t(contact.role)}</p>
            </div>
        </div>
    );
};
