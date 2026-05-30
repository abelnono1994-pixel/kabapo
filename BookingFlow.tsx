'use client';

import { useState } from 'react';
import { ProgressBar } from '@/components/booking/ProgressBar';
import { EventTypeStep } from '@/components/booking/EventTypeStep';
import { ServiceStep } from '@/components/booking/ServiceStep';
import { DetailsStep } from '@/components/booking/DetailsStep';
import { ConfirmationStep } from '@/components/booking/ConfirmationStep';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useBookingProgress } from '@/hooks/use-booking-progress';
import { useTranslation } from '@/hooks/use-translation';

export type BookingData = {
  eventType: string;
  shopId: string | null;
  services: string[];
  country: string;
  city: string;
  date: Date | undefined;
  time: string;
  duration: string;
  email: string;
  phone: string;
  requestDetails?: string;
};

const initialBookingData: BookingData = {
  eventType: '',
  shopId: null,
  services: [],
  country: '',
  city: '',
  date: undefined,
  time: '',
  duration: '',
  email: '',
  phone: '',
  requestDetails: '',
};

const TOTAL_STEPS = 3;

type BookingFlowProps = {
    initialServiceId?: string;
    closeModal: () => void;
}

export function BookingFlow({ initialServiceId, closeModal }: BookingFlowProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const { bookingData, updateBookingData, clearBookingProgress } = useBookingProgress({
    ...initialBookingData,
    services: initialServiceId ? [initialServiceId] : []
  });
  const [isConfirmed, setIsConfirmed] = useState(false);

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      setIsConfirmed(true);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handleEventTypeSelect = (newEventType: string) => {
    if (bookingData.eventType && bookingData.eventType !== newEventType) {
        updateBookingData({ eventType: newEventType, services: [], shopId: null });
    } else {
        updateBookingData({ eventType: newEventType });
    }
    nextStep();
  };

  const handleBackFromConfirmation = () => {
    setIsConfirmed(false);
  };
  
  const handleBookingComplete = () => {
    closeModal();
    toast({
      title: t('booking.confirmation.success_title'),
      description: t('booking.confirmation.success_desc'),
    })
  }

  if (isConfirmed) {
    return (
      <ConfirmationStep
        bookingData={bookingData}
        updateBookingData={updateBookingData}
        onBack={handleBackFromConfirmation}
        onBookingComplete={handleBookingComplete}
        clearBookingProgress={clearBookingProgress}
      />
    );
  }

  return (
    <>
      <DialogHeader className="p-6 pb-4 border-b">
        <DialogTitle className="text-center text-3xl font-bold font-headline tracking-tight">{t('booking.title')}</DialogTitle>
        <DialogDescription className="text-center">
            {t('booking.description')}
        </DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
            <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
            <div className="mt-8">
            {step === 1 && (
                <EventTypeStep
                onSelect={handleEventTypeSelect}
                />
            )}
            {step === 2 && (
                <ServiceStep
                bookingData={bookingData}
                updateBookingData={updateBookingData}
                onNext={nextStep}
                onBack={prevStep}
                />
            )}
            {step === 3 && (
                <DetailsStep
                bookingData={bookingData}
                updateBookingData={updateBookingData}
                onConfirm={nextStep}
                onBack={prevStep}
                />
            )}
            </div>
        </div>
      </div>
    </>
  );
}