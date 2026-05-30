'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { allCountries, allCities, cameroonCities } from '@/lib/locations';
import { durations } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  PartyPopper,
  Briefcase,
  CheckCircle,
  MessageSquare,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { format, parse, isValid, isPast, startOfToday } from 'date-fns';
import { fr, enUS, de } from 'date-fns/locale';
import type { BookingData } from './BookingFlow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';

const timeSlots = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
});

type DetailsStepProps = {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onConfirm: () => void;
  onBack: () => void;
};

export function DetailsStep({
  bookingData,
  updateBookingData,
  onConfirm,
  onBack,
}: DetailsStepProps) {
  const { t, locale } = useTranslation();
  
  // Mapping locale to date-fns locale
  const dateLocale = useMemo(() => {
    if (locale === 'en') return enUS;
    if (locale === 'de') return de;
    return fr;
  }, [locale]);

  const [errors, setErrors] = useState<{
    date?: string;
    time?: string;
    country?: string;
    city?: string;
    email?: string;
    phone?: string;
    requestDetails?: string;
  }>({});
  
  const [timeInput, setTimeInput] = useState(bookingData.time);
  const [timeInputError, setTimeInputError] = useState<string | undefined>();
  const [dateInput, setDateInput] = useState<string>(
    bookingData.date ? format(bookingData.date, 'dd/MM/yyyy') : ''
  );
  const [dateError, setDateError] = useState<string | undefined>();
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);

  // Labels for the dynamic error message
  const fieldLabels: Record<string, string> = {
    date: t('booking.details_step.date_label'),
    time: t('booking.details_step.time_label'),
    country: t('booking.details_step.country_label'),
    city: t('booking.details_step.city_label'),
    phone: t('booking.details_step.phone_label'),
    requestDetails: t('common.other'),
  };

  const shouldShowOtherDetails =
    bookingData.eventType === 'autre' ||
    bookingData.services.includes('autre');

  useEffect(() => {
    if (bookingData.country) {
      const country = allCountries.find(c => c.name === bookingData.country);
      if (country) {
        if (country.code === 'CM') {
          setAvailableCities(cameroonCities.map(c => c.name));
        } else {
          const capital = allCities.find(c => c.countryCode === country.code);
          setAvailableCities(capital ? [capital.name] : []);
        }
      }
    } else {
      setAvailableCities([]);
    }
  }, [bookingData.country]);

  useEffect(() => {
    const cityIsPredefined =
      availableCities.length > 0 && availableCities.includes(bookingData.city);
    if (bookingData.city && !cityIsPredefined) {
      setShowCustomCityInput(true);
    }
  }, [availableCities, bookingData.city]);

  const handleCountrySelect = (countryName: string) => {
    updateBookingData({ country: countryName, city: '' });
    setShowCustomCityInput(false);
    if (errors.country) setErrors(prev => ({ ...prev, country: undefined }));
    if (errors.city) setErrors(prev => ({ ...prev, city: undefined }));
  };

  const handleCitySelect = (value: string) => {
    if (value === 'Autre') {
      setShowCustomCityInput(true);
      updateBookingData({ city: '' });
    } else {
      setShowCustomCityInput(false);
      updateBookingData({ city: value });
      if (errors.city) {
        setErrors(prev => ({ ...prev, city: undefined }));
      }
    }
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeInput(newTime);
    if (newTime && !/^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/.test(newTime)) {
      setTimeInputError('Format invalide (HH:MM)');
    } else {
      setTimeInputError(undefined);
      updateBookingData({ time: newTime });
      if (errors.time) setErrors(prev => ({ ...prev, time: undefined }));
    }
  };

  const handleTimeSlotSelect = (time: string) => {
    setTimeInput(time);
    updateBookingData({ time });
    setTimeInputError(undefined);
    if (errors.time) {
      setErrors(prev => ({ ...prev, time: undefined }));
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const lowercasedValue = rawValue.trim().toLowerCase();

    // Flexible handling for "today" in multiple languages
    const todayKeywords = ["aujourd'hui", "today", "heute"];
    const matchesToday = todayKeywords.some(kw => kw.startsWith(lowercasedValue));

    if (matchesToday) {
      setDateInput(rawValue);
      if (todayKeywords.includes(lowercasedValue)) {
        const today = startOfToday();
        updateBookingData({ date: today });
        setDateError(undefined);
        if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
      } else {
        updateBookingData({ date: undefined });
        setDateError(undefined);
      }
      return;
    }

    const digits = rawValue.replace(/\D/g, '');
    let formattedValue = digits;
    if (digits.length > 2) {
      formattedValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      formattedValue = `${digits.slice(0, 2)}/${digits.slice(
        2,
        4
      )}/${digits.slice(4, 8)}`;
    }

    setDateInput(formattedValue);

    if (formattedValue.length === 10) {
      const parsedDate = parse(formattedValue, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        if (
          isPast(parsedDate) &&
          format(parsedDate, 'yyyy-MM-dd') !== format(startOfToday(), 'yyyy-MM-dd')
        ) {
          setDateError(t('booking.details_step.date_past_error') || 'Error');
          updateBookingData({ date: undefined });
        } else {
          setDateError(undefined);
          updateBookingData({ date: parsedDate });
          if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
        }
      } else {
        setDateError(t('common.error'));
        updateBookingData({ date: undefined });
      }
    } else {
      updateBookingData({ date: undefined });
      setDateError(undefined);
    }
  };

  const handleConfirm = () => {
    const newErrors: typeof errors = {};
    if (!bookingData.date) newErrors.date = t('booking.details_step.date_label');
    if (!bookingData.time) newErrors.time = t('booking.details_step.time_label');
    if (!bookingData.country)
      newErrors.country = t('booking.details_step.country_label');
    if (!bookingData.city.trim()) newErrors.city = t('booking.details_step.city_label');
    
    if (!bookingData.phone)
      newErrors.phone = t('booking.details_step.phone_label');
    else if (!/^[0-9\s-()]{6,}$/.test(bookingData.phone.replace(/\D/g, '')))
      newErrors.phone = t('common.error');
    
    if (bookingData.email && !/^\S+@\S+\.\S+$/.test(bookingData.email))
      newErrors.email = t('common.error');

    if (shouldShowOtherDetails && !bookingData.requestDetails?.trim()) {
      newErrors.requestDetails = t('common.other');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onConfirm();
  };

  const missingFieldList = Object.keys(errors)
    .filter(key => fieldLabels[key] && !bookingData[key as keyof BookingData])
    .map(key => fieldLabels[key]);

  const selectedDateDisplay = bookingData.date
    ? format(bookingData.date, 'EEEE d MMMM yyyy', { locale: dateLocale })
    : (dateInput || t('common.other'));

  const getEventIcon = () => {
    switch (bookingData.eventType) {
      case 'mariage':
        return <PartyPopper className="h-6 w-6 text-primary" />;
      case 'entreprise':
        return <Briefcase className="h-6 w-6 text-primary" />;
      default:
        return <Sparkles className="h-6 w-6 text-primary" />;
    }
  };

  const selectedCountryData = useMemo(() => 
    allCountries.find(c => c.name === bookingData.country), 
    [bookingData.country]
  );
  const phonePrefix = selectedCountryData?.phoneCode || '';

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          {t('booking.details_step.title')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {t('booking.details_step.subtitle')}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
          <Card className="overflow-hidden shadow-lg border-primary/20">
            <CardHeader className="flex-row items-center gap-4 space-y-0 bg-primary/5">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">{t('booking.details_step.when')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <Label
                  htmlFor="date"
                  className="text-lg font-medium flex items-center gap-2"
                >
                  <CalendarIcon className="h-5 w-5" /> {t('booking.details_step.date_label')}
                </Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="text"
                    placeholder={t('booking.details_step.date_placeholder')}
                    value={dateInput}
                    onChange={handleDateInputChange}
                    className={cn(
                      'pr-8',
                      errors.date &&
                        'border-destructive focus-visible:ring-destructive',
                      bookingData.date &&
                        !dateError &&
                        'border-green-500 focus-visible:ring-green-500'
                    )}
                  />
                  {bookingData.date && !dateError && (
                    <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                {(dateError || errors.date) && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {dateError || errors.date}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label
                  htmlFor="time"
                  className="text-lg font-medium flex items-center gap-2"
                >
                  <Clock className="h-5 w-5" /> {t('booking.details_step.time_label')}
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={timeInput}
                  onChange={handleTimeInputChange}
                  className={cn(errors.time && 'border-destructive focus-visible:ring-destructive')}
                />
                {(timeInputError || errors.time) && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {timeInputError || errors.time}
                  </p>
                )}

                <ScrollArea className="h-48 border rounded-md mt-4">
                  <div className="grid grid-cols-3 gap-2 p-2">
                    {timeSlots.map(time => (
                      <Button
                        key={time}
                        variant={
                          bookingData.time === time ? 'default' : 'outline'
                        }
                        className={cn(
                            "w-full text-xs h-9",
                            bookingData.time === time ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                        )}
                        onClick={() => handleTimeSlotSelect(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {shouldShowOtherDetails && (
            <Card className={cn("shadow-md animate-in fade-in duration-300", errors.requestDetails && "border-destructive/50")}>
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-headline">
                  {t('booking.details_step.specify_request') || 'Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label
                  htmlFor="request-details"
                  className={cn(
                    'font-medium mb-2 block',
                    errors.requestDetails && 'text-destructive'
                  )}
                >
                  {t('common.other')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="request-details"
                  placeholder="..."
                  value={bookingData.requestDetails || ''}
                  onChange={e =>
                    updateBookingData({ requestDetails: e.target.value })
                  }
                  className={cn(
                    'min-h-[100px]',
                    errors.requestDetails &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {errors.requestDetails && (
                  <p className="text-sm text-destructive flex items-center gap-1 pt-2 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {errors.requestDetails}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className={cn("shadow-md", errors.country && "border-destructive/50")}>
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-headline">{t('booking.details_step.where')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="country"
                    className={cn("font-medium", errors.country && 'text-destructive')}
                  >
                    {t('booking.details_step.country_label')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={handleCountrySelect}
                    value={bookingData.country}
                  >
                    <SelectTrigger
                      id="country"
                      className={cn(errors.country && 'border-destructive focus:ring-destructive')}
                    >
                      <SelectValue placeholder={t('common.select_country')} />
                    </SelectTrigger>
                    <SelectContent>
                      {allCountries.map(c => (
                        <SelectItem key={c.code} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && (
                    <p className="text-sm text-destructive mt-2 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.country}
                    </p>
                  )}
                </div>
                {bookingData.country && (
                  <div className="animate-in fade-in duration-300">
                    <Label
                      htmlFor="city"
                      className={cn("font-medium", errors.city && 'text-destructive')}
                    >
                      {t('booking.details_step.city_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={handleCitySelect}
                      value={showCustomCityInput ? 'Autre' : bookingData.city || ''}
                    >
                      <SelectTrigger
                        id="city"
                        className={cn(errors.city && 'border-destructive focus:ring-destructive')}
                      >
                        <SelectValue placeholder={t('common.select_city')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                        <SelectItem value="Autre">{t('common.other_city')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomCityInput && (
                      <Input
                        id="custom-city"
                        placeholder={t('common.specify_city')}
                        value={bookingData.city}
                        onChange={e =>
                          updateBookingData({ city: e.target.value })
                        }
                        className={cn("mt-2", errors.city && "border-destructive")}
                      />
                    )}
                    {errors.city && (
                      <p className="text-sm text-destructive mt-2 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.city}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {getEventIcon()}
                </div>
                <CardTitle className="text-xl font-headline">{t('booking.details_step.duration_label')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {durations.map(duration => (
                  <Button
                    key={duration}
                    variant={
                      bookingData.duration === duration ? 'default' : 'outline'
                    }
                    className={cn(
                        "transition-all",
                        bookingData.duration === duration ? "bg-primary scale-105" : "hover:bg-primary/5"
                    )}
                    onClick={() => updateBookingData({ duration: duration })}
                  >
                    {duration}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
          
           <Card className={cn("shadow-md", errors.phone && "border-destructive/50")}>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
               <div className="p-3 bg-primary/10 rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
              <CardTitle className="font-headline text-xl">
                {t('booking.details_step.contact_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className={cn("font-medium", errors.phone && 'text-destructive')}
                >
                  {t('booking.details_step.phone_label')} <span className="text-destructive">*</span>
                </Label>
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
                        value={bookingData.phone}
                        onChange={e => {
                            updateBookingData({ phone: e.target.value });
                            if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                        }}
                        className={cn(
                            phonePrefix && "rounded-l-none",
                            errors.phone && 'border-destructive focus-visible:ring-destructive'
                        )}
                    />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive flex items-center gap-1 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground italic">{t('booking.details_step.phone_hint')}</p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={cn("font-medium", errors.email && 'text-destructive')}
                >
                  {t('booking.details_step.email_label')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={bookingData.email}
                  onChange={e => {
                    updateBookingData({ email: e.target.value });
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={cn(
                    errors.email &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cn("shadow-2xl border-primary bg-primary/[0.02] transform transition-all duration-500", Object.keys(errors).length > 0 && "opacity-60 scale-[0.98]")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                  <div className="space-y-1">
                      <CardTitle className="font-headline text-2xl text-primary">{t('booking.details_step.summary_title')}</CardTitle>
                      <CardDescription>{t('booking.details_step.summary_subtitle')}</CardDescription>
                  </div>
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </CardHeader>
            <Separator className="bg-primary/10" />
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border border-primary/5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('booking.step_labels.0')}</span>
                    <div className="flex items-center gap-2">
                        {getEventIcon()}
                        <span className="font-bold capitalize">{bookingData.eventType || '...'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border border-primary/5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('booking.step_labels.1')}</span>
                    <span className="font-bold text-sm line-clamp-1">{bookingData.services.join(', ') || '...'}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border border-primary/5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('booking.details_step.when')}</span>
                    <div className="flex flex-col">
                         <span className="font-bold text-sm capitalize">{selectedDateDisplay}</span>
                         <span className="text-xs text-primary font-medium">{bookingData.time || timeInput || '...'}</span>
                    </div>
                  </div>
                   <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border border-primary/5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('booking.details_step.where')}</span>
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="font-bold text-sm capitalize">
                          {bookingData.city || '...'} - {bookingData.country || '...'}
                        </span>
                    </div>
                  </div>
              </div>

              {(bookingData.phone || bookingData.email) && (
                  <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10 animate-in slide-in-from-bottom-2">
                      <p className="text-xs font-semibold text-primary mb-1">{t('booking.details_step.reminder_contact')}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {bookingData.phone && (
                            <span className="text-sm font-bold flex items-center gap-1">
                                <ChevronRight className="h-3 w-3" /> {phonePrefix} {bookingData.phone}
                            </span>
                          )}
                          {bookingData.email && <span className="text-sm font-medium text-muted-foreground italic">{bookingData.email}</span>}
                      </div>
                  </div>
              )}
            </CardContent>
          </Card>

          {(Object.keys(errors).length > 0) && (
            <Alert variant="destructive" className="animate-in slide-in-from-bottom-4 duration-300 border-2 shadow-lg bg-destructive/5">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-bold text-lg">{t('booking.details_step.action_required')}</AlertTitle>
              <AlertDescription className="text-base font-medium">
                {t('booking.details_step.error_missing_fields')} 
                {missingFieldList.length > 0 && (
                    <span className="block mt-1 font-bold italic">
                        ({missingFieldList.join(', ')})
                    </span>
                )}
              </AlertDescription>
            </Alert>
          )}
      </div>

      <div className="mt-12 flex justify-between gap-4">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1 sm:flex-none">
          {t('common.back')}
        </Button>
        <Button
          onClick={handleConfirm}
          size="lg"
          className={cn(
              "flex-1 sm:flex-none bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg font-bold transition-all",
              Object.keys(errors).length > 0 && "opacity-80"
          )}
        >
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
}