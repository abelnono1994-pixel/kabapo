'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Mail, AlertCircle, ArrowLeft, PartyPopper, Briefcase, Sparkles, ListChecks, Calendar, Clock, MapPin, Hourglass, Loader2, CheckCircle, Phone } from 'lucide-react';
import type { BookingData } from '@/components/booking/BookingFlow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr, enUS, de } from 'date-fns/locale';
import { useFirestore, useUser } from '@/firebase/provider';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { allCountries } from '@/lib/locations';
import { useTranslation } from '@/hooks/use-translation';

type ConfirmationStepProps = {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onBack: () => void;
  onBookingComplete: () => void;
  clearBookingProgress: () => void;
};

// A small component for a summary item
const SummaryItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start justify-between py-3">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-semibold text-right capitalize">{value}</span>
    </div>
);

const generateBookingSummaryText = (bookingData: BookingData, fullPhone: string): string => {
  const summaryLines = [
    `Bonjour,`,
    `Je souhaite confirmer ma demande de réservation pour un événement Kabapo.`,
    `Voici le proforma de ma demande :`,
    ``,
    `--- DÉTAILS DE L'ÉVÉNEMENT ---`,
    `Type d'événement : ${bookingData.eventType}`,
    `Service(s) demandé(s) : ${bookingData.services.join(', ')}`,
    bookingData.requestDetails ? `Détails "Autre" : ${bookingData.requestDetails}` : null,
    `Date : ${bookingData.date ? format(bookingData.date, 'EEEE d MMMM yyyy', { locale: fr }) : 'Non précisée'}`,
    `Heure de début : ${bookingData.time || 'Non précisée'}`,
    `Pays : ${bookingData.country || 'Non précisé'}`,
    `Ville : ${bookingData.city || 'Non précisée'}`,
    `Durée estimée : ${bookingData.duration || 'Non précisée'}`,
    ``,
    `--- MES COORDONNÉES ---`,
    bookingData.email ? `Email : ${bookingData.email}` : null,
    `Téléphone : ${fullPhone}`,
    ``,
    `Merci de me recontacter pour finaliser le devis.`,
  ].filter(Boolean);
  return summaryLines.join('\n');
};


export function ConfirmationStep({ bookingData, updateBookingData, onBack, onBookingComplete, clearBookingProgress }: ConfirmationStepProps) {
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState(bookingData.email);
  const [phone, setPhone] = useState(bookingData.phone);
  const [consent, setConsent] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [consentError, setConsentError] = useState<string | undefined>();
  const [submittingMethod, setSubmittingMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const dateLocale = useMemo(() => {
    if (locale === 'en') return enUS;
    if (locale === 'de') return de;
    return fr;
  }, [locale]);

  const selectedCountryData = useMemo(() => 
    allCountries.find(c => c.name === bookingData.country), 
    [bookingData.country]
  );
  const phonePrefix = selectedCountryData?.phoneCode || '';
  const fullPhone = `${phonePrefix} ${phone}`.trim();

  const isEmailFormatValid = useMemo(() => (email ? /^\S+@\S+\.\S+$/.test(email) : true), [email]);
  const isPhoneFormatValid = useMemo(() => (phone ? /^[0-9\s-()]{6,}$/.test(phone.replace(/\D/g, '')) : false), [phone]);

  useEffect(() => {
    if (email && !isEmailFormatValid) setEmailError(t('common.error'));
    else setEmailError(undefined);
  }, [email, isEmailFormatValid, t]);

  useEffect(() => {
    if (!phone) setPhoneError(t('booking.details_step.phone_label'));
    else if (!isPhoneFormatValid) setPhoneError(t('common.error'));
    else setPhoneError(undefined);
  }, [phone, isPhoneFormatValid, t]);

  useEffect(() => {
    if (consent) setConsentError(undefined);
  }, [consent]);
  
  const handleConfirm = async (method: 'whatsapp' | 'email') => {
    if (!consent) {
        setConsentError(t('booking.details_step.error_missing_fields'));
        return;
    }
    
    if (!firestore || !bookingData.shopId) {
        toast({ variant: 'destructive', title: t('common.error'), description: '...' });
        return;
    }
    setSubmittingMethod(method);

    const bookingPayload = {
      ...bookingData,
      phone: fullPhone,
      userId: user?.uid || null,
      status: 'pending',
      createdAt: serverTimestamp(),
      contactInfo: {
        email: email,
        phone: fullPhone
      }
    };
    
    try {
      addDocumentNonBlocking(collection(firestore, 'shops', bookingData.shopId, 'bookings'), bookingPayload);
      
      clearBookingProgress();
      setIsSubmitted(true);

      const summaryText = generateBookingSummaryText(bookingData, fullPhone);
      const businessWhatsapp = "237699264201";
      const businessEmail = "contact@kabapo.com";

      if (method === 'whatsapp') {
        const whatsappUrl = `https://wa.me/${businessWhatsapp}?text=${encodeURIComponent(summaryText)}`;
        window.open(whatsappUrl, '_blank');
      } else {
        const subject = `Demande de réservation Kabapo : ${bookingData.eventType}`;
        const mailtoUrl = `mailto:${businessEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText)}`;
        window.location.href = mailtoUrl;
      }

    } catch (error) {
      console.error("Error saving booking:", error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: '...'
      })
      setSubmittingMethod(null);
    }
  };
  
  const getEventIcon = () => {
    switch (bookingData.eventType) {
      case 'mariage':
        return <PartyPopper className="h-5 w-5 text-primary" />;
      case 'entreprise':
        return <Briefcase className="h-5 w-5 text-primary" />;
      default:
        return <Sparkles className="h-5 w-5 text-primary" />;
    }
  };

  const selectedDateDisplay = bookingData.date
    ? format(bookingData.date, 'EEEE d MMMM yyyy', { locale: dateLocale })
    : t('common.other');
    
  if (isSubmitted) {
      return (
          <div className="flex flex-col items-center justify-center text-center p-8 min-h-[50vh]">
            <PartyPopper className="h-16 w-16 text-accent mb-4 animate-in fade-in zoom-in" />
            <h2 className="text-2xl font-bold font-headline">{t('booking.confirmation.success_title')}</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
                {t('booking.confirmation.success_desc')}
            </p>
            <Button onClick={onBookingComplete} className="mt-6">{t('common.close')}</Button>
          </div>
      )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold font-headline">{t('booking.confirmation.title')}</h2>
        <p className="text-muted-foreground mt-2 text-lg">{t('booking.confirmation.subtitle')}</p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="space-y-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl font-headline">{t('booking.details_step.contact_info')}</CardTitle>
                    <CardDescription>{t('booking.confirmation.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className={cn("font-semibold", phoneError && "text-destructive")}>{t('booking.details_step.phone_label')} <span className="text-destructive">*</span></Label>
                            <div className="flex items-center">
                                {phonePrefix && (
                                    <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground font-semibold">
                                        {phonePrefix}
                                    </span>
                                )}
                                <Input
                                  id="phone"
                                  type="tel"
                                  placeholder="6 XX XX XX XX"
                                  value={phone}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setPhone(newValue);
                                    updateBookingData({ phone: newValue });
                                  }}
                                  className={cn(
                                    phonePrefix && "rounded-l-none",
                                    phoneError && 'border-destructive focus-visible:ring-destructive'
                                  )}
                                />
                            </div>
                            {phoneError && <p className="text-sm text-destructive flex items-center gap-1 pt-1"><AlertCircle className="h-4 w-4" />{phoneError}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className={cn("font-semibold", emailError && "text-destructive")}>{t('booking.details_step.email_label')}</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setEmail(newValue);
                                updateBookingData({ email: newValue });
                              }}
                              className={cn(emailError && 'border-destructive focus-visible:ring-destructive')}
                            />
                            {emailError && <p className="text-sm text-destructive flex items-center gap-1 pt-1"><AlertCircle className="h-4 w-4" />{emailError}</p>}
                        </div>
                    </div>
                    <div className="items-top flex space-x-3 pt-2">
                        <Checkbox id="terms1" checked={consent} onCheckedChange={(checked) => setConsent(checked as boolean)} className={cn('mt-0.5', consentError && 'border-destructive')}/>
                        <div className="grid gap-1.5 leading-none">
                            <label
                            htmlFor="terms1"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                            {t('booking.confirmation.consent_label')}
                            </label>
                            <p className="text-sm text-muted-foreground">
                            {t('booking.confirmation.consent_desc')}
                            </p>
                            {consentError && <p className="text-sm text-destructive flex items-center gap-1 pt-1"><AlertCircle className="h-4 w-4" />{consentError}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card className="border-primary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-headline text-primary">{t('booking.confirmation.proforma_title')}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border pt-4">
                <SummaryItem icon={getEventIcon()} label={t('booking.step_labels.0')} value={bookingData.eventType} />
                <SummaryItem icon={<ListChecks className="h-5 w-5 text-primary" />} label={t('booking.step_labels.1')} value={bookingData.services.join(', ') || '...'} />
                {bookingData.requestDetails && (
                    <SummaryItem icon={<MessageSquare className="h-5 w-5 text-primary" />} label={t('common.other')} value={<p className="text-sm font-normal normal-case whitespace-pre-wrap">{bookingData.requestDetails}</p>} />
                )}
                <SummaryItem icon={<Calendar className="h-5 w-5 text-primary" />} label={t('booking.details_step.date_label')} value={selectedDateDisplay} />
                <SummaryItem icon={<Clock className="h-5 w-5 text-primary" />} label={t('booking.details_step.time_label')} value={bookingData.time || '...'} />
                <SummaryItem icon={<MapPin className="h-5 w-5 text-primary" />} label={t('booking.details_step.where')} value={`${bookingData.city || '...'}, ${bookingData.country || '...'}`} />
                <SummaryItem icon={<Hourglass className="h-5 w-5 text-primary" />} label={t('booking.details_step.duration_label')} value={bookingData.duration || '...'} />
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6 bg-secondary/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <Button size="lg" disabled={!isPhoneFormatValid || !consent || !!submittingMethod} onClick={() => handleConfirm('whatsapp')} className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 shadow-lg">
                      {submittingMethod === 'whatsapp' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      <MessageSquare className="mr-2 h-6 w-6" />
                      {t('booking.confirmation.whatsapp_btn')}
                    </Button>
                    <Button size="lg" disabled={!email || !isEmailFormatValid || !isPhoneFormatValid || !consent || !!submittingMethod} onClick={() => handleConfirm('email')} className="font-bold h-14 shadow-lg">
                      {submittingMethod === 'email' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      <Mail className="mr-2 h-6 w-6" />
                      {t('booking.confirmation.email_btn')}
                    </Button>
                </div>
            </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 mt-8 border-t">
          <Button variant="outline" size="lg" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
          </Button>
          <Button asChild variant="link" className="text-muted-foreground">
              <Link href="/">{t('booking.confirmation.exit')}</Link>
          </Button>
      </div>
    </div>
  );
}